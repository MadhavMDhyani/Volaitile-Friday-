import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Project from '../models/project.model.js';
import userModel from '../models/user.models.js';
import redisService from '../service/redis.service.js';
import * as fileService from '../service/file.service.js';
import * as aiService from '../service/ai.service.js';
import { resetAiRateLimits, checkAndConsumeAiLimit } from '../service/aiRateLimiter.js';

const JWT_SECRET = process.env.JWT_SECRET || 'volatile_friday_jwt_secure_secret_key_production_grade_32_chars_ok';

describe('Backend Security Batch 1 Tests', () => {
    const memberId = '65f1a2b3c4d5e6f7a8b9c001';
    const otherId  = '65f1a2b3c4d5e6f7a8b9c002';
    const projectId = '65f1a2b3c4d5e6f7a8b9c0aa';
    const fileId = '65f1a2b3c4d5e6f7a8b9c0bb';

    const memberToken = jwt.sign(
        { _id: memberId, email: 'member@test.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    beforeEach(() => {
        vi.restoreAllMocks();
        resetAiRateLimits();
        vi.spyOn(redisService, 'get').mockResolvedValue(null);
    });

    describe('Task 1: Cookie Auth Removal', () => {
        it('POST /users/login returns { user, token } without setting token cookie', async () => {
            const mockUser = {
                _id: memberId,
                email: 'member@test.com',
                password: 'hashedpassword',
                generateJWT: () => memberToken,
                isValidPassword: async () => true,
                toObject: () => ({ _id: memberId, email: 'member@test.com' }),
            };

            vi.spyOn(userModel, 'findOne').mockReturnValue({
                select: vi.fn().mockResolvedValue(mockUser),
            });

            const res = await request(app)
                .post('/users/login')
                .send({ email: 'member@test.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token', memberToken);
            expect(res.body).toHaveProperty('user');
            expect(res.headers['set-cookie']).toBeUndefined();
        });

        it('POST /users/logout returns success without clearing cookie', async () => {
            vi.spyOn(redisService, 'set').mockResolvedValue('OK');

            const res = await request(app)
                .post('/users/logout')
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'Logged out' });
            expect(res.headers['set-cookie']).toBeUndefined();
        });

        it('extractToken rejects cookies when Bearer header is missing', async () => {
            // Making an authenticated request providing token ONLY in Cookie header
            const res = await request(app)
                .get('/users/profile')
                .set('Cookie', [`token=${memberToken}`]);

            // Must reject as 401 Unauthorized because cookie auth was removed
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Unauthorized');
        });
    });

    describe('Task 3: Body Size Limits', () => {
        it('a ~100KB file create succeeds under the 256kb file limit', async () => {
            vi.spyOn(Project, 'findById').mockResolvedValue({
                _id: projectId,
                users: [memberId],
                populate: vi.fn().mockResolvedValue({
                    _id: projectId,
                    users: [{ _id: memberId, email: 'member@test.com' }],
                }),
            });

            const hundredKbContent = 'x'.repeat(100 * 1024);
            vi.spyOn(fileService, 'createFile').mockResolvedValue({
                _id: fileId,
                name: 'large.js',
                content: hundredKbContent,
            });

            const res = await request(app)
                .post(`/projects/${projectId}/files`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({
                    name: 'large.js',
                    content: hundredKbContent,
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('file');
        });

        it('a ~100KB file update succeeds under the 256kb file limit', async () => {
            vi.spyOn(Project, 'findById').mockResolvedValue({
                _id: projectId,
                users: [memberId],
                populate: vi.fn().mockResolvedValue({
                    _id: projectId,
                    users: [{ _id: memberId, email: 'member@test.com' }],
                }),
            });

            const hundredKbContent = 'x'.repeat(100 * 1024);
            vi.spyOn(fileService, 'updateFile').mockResolvedValue({
                _id: fileId,
                content: hundredKbContent,
            });

            const res = await request(app)
                .put(`/projects/${projectId}/files/${fileId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({
                    content: hundredKbContent,
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('file');
        });

        it('a 300KB file body returns 413 Payload Too Large', async () => {
            const threeHundredKbContent = 'x'.repeat(300 * 1024);

            const res = await request(app)
                .post(`/projects/${projectId}/files`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({
                    name: 'toolarge.js',
                    content: threeHundredKbContent,
                });

            expect(res.status).toBe(413);
        });

        it('a 20,000-character AI review body is accepted under the 32kb limit', async () => {
            const twentyThousandCharBody = 'x'.repeat(20000);

            vi.spyOn(aiService, 'reviewCodeSnippet').mockResolvedValue({
                review: 'Code review result',
                model: 'gemini-3.5-flash-lite',
                source: 'online',
                requestedModel: 'gemini-3.5-flash-lite',
                latencyMs: 15,
            });

            const res = await request(app)
                .post('/ai/review')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({
                    code: twentyThousandCharBody,
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('review', 'Code review result');
        });

        it('standard routes enforce the global 10kb limit (returns 413 on >10kb)', async () => {
            const twelveKbString = 'x'.repeat(12 * 1024);

            const res = await request(app)
                .post('/users/login')
                .send({
                    email: 'test@test.com',
                    password: twelveKbString,
                });

            expect(res.status).toBe(413);
        });
    });

    describe('Task 4: Shared Per-User AI Rate Limiter', () => {
        it('allows 10 requests per minute and returns 429 on the 11th request across REST routes', async () => {
            vi.spyOn(aiService, 'generateCodeSnippet').mockResolvedValue({
                code: '// generated code',
                model: 'gemini-3.5-flash-lite',
                source: 'online',
                requestedModel: 'gemini-3.5-flash-lite',
                latencyMs: 10,
            });

            // Make 10 requests with memberToken (keyed by memberId)
            for (let i = 0; i < 10; i++) {
                const res = await request(app)
                    .post('/ai/generate-code')
                    .set('Authorization', `Bearer ${memberToken}`)
                    .send({ prompt: `generate feature ${i}` });
                expect(res.status).toBe(200);
            }

            // 11th request must return 429
            const blocked = await request(app)
                .post('/ai/generate-code')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ prompt: '11th prompt' });

            expect(blocked.status).toBe(429);
            expect(blocked.body).toHaveProperty('error');
            expect(blocked.body.error).toMatch(/AI rate limit exceeded/i);

            // A different user is NOT blocked
            const otherToken = jwt.sign(
                { _id: otherId, email: 'other@test.com' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const otherRes = await request(app)
                .post('/ai/generate-code')
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ prompt: 'other user prompt' });

            expect(otherRes.status).toBe(200);
        });

        it('enforces 100 requests per day limit', async () => {
            // Seed 100 historical timestamps from earlier today (10 minutes ago, outside 1-minute window)
            const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
            const hundredTimestamps = Array.from({ length: 100 }, () => tenMinutesAgo);
            const { aiUserRateLimits } = await import('../service/aiRateLimiter.js');
            aiUserRateLimits.set(otherId, hundredTimestamps);

            const otherToken = jwt.sign(
                { _id: otherId, email: 'other@test.com' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            const res = await request(app)
                .post('/ai/generate-code')
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ prompt: '101st prompt' });

            expect(res.status).toBe(429);
            expect(res.body.error).toMatch(/daily rate limit exceeded/i);
        });
    });
});
