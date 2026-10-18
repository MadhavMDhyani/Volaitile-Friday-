import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { extractToken } from '../middleware/auth.middleware.js';
import { getBuiltInResponse } from '../service/ai.service.js';
import { addUsersToProject } from '../service/project.service.js';
import projectModel from '../models/project.model.js';
import userModel from '../models/user.models.js';
import redisService from '../service/redis.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'volatile_friday_jwt_secure_secret_key_production_grade_32_chars_ok';

describe('API Unit & Security Tests (Database-independent)', () => {
    it('GET /health/ping returns 200 with pong payload', async () => {
        const res = await request(app).get('/health/ping');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('pong', true);
        expect(res.body).toHaveProperty('time');
    });

    it('Protected routes return 401 Unauthorized without token', async () => {
        const protectedRequests = [
            request(app).get('/projects/all'),
            request(app).get('/users/profile'),
            request(app).post('/projects/create').send({ name: 'test-project' }),
            request(app).post('/ai/chat').send({ message: 'Hello AI' }),
            request(app).get('/tools/project-stats/65f1a2b3c4d5e6f7a8b9c0d1'),
        ];

        const responses = await Promise.all(protectedRequests);
        for (const res of responses) {
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Unauthorized');
        }
    });

    it('POST /users/register with bad payload returns 400 validation error', async () => {
        const res = await request(app)
            .post('/users/register')
            .send({ email: 'not-an-email', password: '123' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('Request to an unknown route returns JSON 404', async () => {
        const res = await request(app).get('/api/unknown/route/does/not/exist');
        expect(res.status).toBe(404);
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.body).toEqual({ error: 'Not found' });
    });

    it('CORS rejects unauthorized origins with HTTP 403', async () => {
        const res = await request(app)
            .get('/health/ping')
            .set('Origin', 'http://unauthorized-malicious-domain.com');

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toMatch(/not allowed by CORS/i);
    });

    it('extractToken helper prefers Bearer header over cookie and handles fallbacks', () => {
        expect(
            extractToken({
                headers: { authorization: 'Bearer token-from-header' },
                cookies: { token: 'token-from-cookie' },
            })
        ).toBe('token-from-header');

        expect(
            extractToken({
                cookies: { token: 'token-from-cookie' },
            })
        ).toBe('token-from-cookie');

        expect(extractToken({ headers: { authorization: 'Basic xyz' } })).toBe(null);
        expect(extractToken({})).toBe(null);
        expect(extractToken(null)).toBe(null);
    });

    it('getBuiltInResponse uses word boundaries so substring words do not trigger unrelated responses', () => {
        const latestResponse = getBuiltInResponse('Check the latest commit');
        expect(latestResponse).not.toContain('Testing Recommendations');

        const authorResponse = getBuiltInResponse('Who is the author of this module?');
        expect(authorResponse).not.toContain('Authentication Best Practices');

        const testResponse = getBuiltInResponse('How to run test suite?');
        expect(testResponse).toContain('Testing Recommendations');

        const authResponse = getBuiltInResponse('Configure auth and jwt');
        expect(authResponse).toContain('Authentication Best Practices');
    });

    it('addUsersToProject dedupes input users before countDocuments check', async () => {
        const projectId = '65f1a2b3c4d5e6f7a8b9c0aa';
        const ownerId = '65f1a2b3c4d5e6f7a8b9c0d1';
        const memberId = '65f1a2b3c4d5e6f7a8b9c0d2';

        vi.spyOn(projectModel, 'findOne').mockResolvedValue({
            _id: projectId,
            users: [ownerId],
        });

        const countSpy = vi.spyOn(userModel, 'countDocuments').mockResolvedValue(1);

        vi.spyOn(projectModel, 'findOneAndUpdate').mockReturnValue({
            populate: () => ({
                populate: () => Promise.resolve({
                    _id: projectId,
                    users: [{ _id: ownerId }, { _id: memberId }],
                }),
            }),
        });

        // Pass duplicate user IDs
        const result = await addUsersToProject({
            projectId,
            users: [memberId, memberId],
            userId: ownerId,
        });

        expect(result).toBeDefined();
        // countDocuments should have been queried with deduped array of 1 item
        expect(countSpy).toHaveBeenCalledWith({ _id: { $in: [memberId] } });
    });

    it('AI code generation and review validate language and framework fields', async () => {
        vi.spyOn(redisService, 'get').mockResolvedValue(null);

        const testUser = { _id: '65f1a2b3c4d5e6f7a8b9c0d1', email: 'user@test.com' };
        const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

        // Invalid language containing illegal shell characters
        const resInvalidChar = await request(app)
            .post('/ai/generate-code')
            .set('Authorization', `Bearer ${token}`)
            .send({
                prompt: 'Write a helper',
                language: 'javascript; rm -rf /',
            });

        expect(resInvalidChar.status).toBe(400);
        expect(resInvalidChar.body.errors.some((e) => e.path === 'language')).toBe(true);

        // Language exceeding 30 characters
        const resTooLong = await request(app)
            .post('/ai/review')
            .set('Authorization', `Bearer ${token}`)
            .send({
                code: 'console.log(1)',
                framework: 'a'.repeat(35),
            });

        expect(resTooLong.status).toBe(400);
        expect(resTooLong.body.errors.some((e) => e.path === 'framework')).toBe(true);
    });
});
