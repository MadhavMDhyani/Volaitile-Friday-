import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

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
});
