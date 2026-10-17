import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import redisService from '../service/redis.service.js';
import Project from '../models/project.model.js';
import Message from '../models/message.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'volatile_friday_jwt_secure_secret_key_production_grade_32_chars_ok';

describe('Dashboard Activity API Unit Tests (DB-independent)', () => {
    const testUserId = '65f1a2b3c4d5e6f7a8b9c0d1';
    const validToken = jwt.sign(
        { _id: testUserId, email: 'dev@test.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(redisService, 'get').mockResolvedValue(null);
    });

    it('GET /dashboard/activity returns 401 Unauthorized without token', async () => {
        const res = await request(app).get('/dashboard/activity');
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('GET /dashboard/activity returns empty array if user has no projects', async () => {
        vi.spyOn(Project, 'find').mockReturnValue({
            select: vi.fn().mockResolvedValue([]),
        });

        const res = await request(app)
            .get('/dashboard/activity')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('activity');
        expect(Array.isArray(res.body.activity)).toBe(true);
        expect(res.body.activity.length).toBe(0);
    });

    it('GET /dashboard/activity returns recent messages with project name and sender', async () => {
        const mockProjectId = '65f1a2b3c4d5e6f7a8b9c0aa';
        const mockProjects = [{ _id: mockProjectId, name: 'Web App' }];

        vi.spyOn(Project, 'find').mockReturnValue({
            select: vi.fn().mockResolvedValue(mockProjects),
        });

        const mockMessages = [
            {
                _id: '65f1a2b3c4d5e6f7a8b9c011',
                text: 'Hey team, reviewed the PR',
                isAi: false,
                createdAt: new Date().toISOString(),
                sender: { _id: testUserId, email: 'dev@test.com' },
                projectId: { _id: mockProjectId, name: 'Web App' },
            },
        ];

        // Mock Message.find().sort().limit().populate().populate()
        const mockQuery = {
            sort: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            populate: vi.fn().mockImplementation(function () {
                return this;
            }),
            then: (resolve) => resolve(mockMessages),
        };
        // Ensure await resolves mockMessages
        mockQuery[Symbol.toStringTag] = 'Promise';
        vi.spyOn(Message, 'find').mockReturnValue(mockQuery);

        const res = await request(app)
            .get('/dashboard/activity')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('activity');
        expect(res.body.activity.length).toBe(1);
        expect(res.body.activity[0]).toMatchObject({
            text: 'Hey team, reviewed the PR',
            isAi: false,
            project: {
                _id: mockProjectId,
                name: 'Web App',
            },
            sender: {
                _id: testUserId,
                email: 'dev@test.com',
            },
        });
    });
});
