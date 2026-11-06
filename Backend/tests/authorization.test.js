/**
 * Authorization / IDOR Fix Tests — Phase 2
 *
 * Covers findings: F-02, F-03, F-06, F-10
 * Database-independent: all Mongoose model calls are mocked with vi.spyOn.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Project from '../models/project.model.js';
import userModel from '../models/user.models.js';
import redisService from '../service/redis.service.js';

const JWT_SECRET =
    process.env.JWT_SECRET || 'volatile_friday_jwt_secure_secret_key_production_grade_32_chars_ok';

// ── Shared fixtures ───────────────────────────────────────────────────────────
const ownerId    = '65f1a2b3c4d5e6f7a8b9c001';
const memberId   = '65f1a2b3c4d5e6f7a8b9c002';
const outsiderId = '65f1a2b3c4d5e6f7a8b9c003';
const projectId  = '65f1a2b3c4d5e6f7a8b9c0aa';

const ownerToken    = jwt.sign({ _id: ownerId,    email: 'owner@test.com'    }, JWT_SECRET, { expiresIn: '1h' });
const memberToken   = jwt.sign({ _id: memberId,   email: 'member@test.com'   }, JWT_SECRET, { expiresIn: '1h' });
const outsiderToken = jwt.sign({ _id: outsiderId, email: 'outsider@test.com' }, JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => {
    vi.restoreAllMocks();
    // Default: all tokens are valid (not blacklisted in Redis)
    vi.spyOn(redisService, 'get').mockResolvedValue(null);
});

// ─────────────────────────────────────────────────────────────────────────────
// F-02 — GET /projects/get-project/:projectId
//   requireProjectMember must return 404 (not 403) for both "project not found"
//   and "caller is not a member", so resource existence is never leaked.
// ─────────────────────────────────────────────────────────────────────────────
describe('F-02 — GET /projects/get-project/:projectId returns 404 not 403 for non-members', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).get(`/projects/get-project/${projectId}`);
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('returns 400 for a malformed (non-ObjectId) projectId', async () => {
        const res = await request(app)
            .get('/projects/get-project/not-a-valid-objectid')
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.status).toBe(400);
    });

    it('returns 404 (not 403) when project does not exist', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue(null);

        const res = await request(app)
            .get(`/projects/get-project/${projectId}`)
            .set('Authorization', `Bearer ${outsiderToken}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not found');
        expect(res.status).not.toBe(403);
    });

    it('returns 404 (not 403) when caller is authenticated but NOT a project member', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: projectId,
            name: 'secret-project',
            owner: ownerId,
            users: [ownerId], // outsiderId is NOT listed — project exists but caller is not a member
        });

        const res = await request(app)
            .get(`/projects/get-project/${projectId}`)
            .set('Authorization', `Bearer ${outsiderToken}`);

        // Must be 404 so the caller cannot distinguish "project doesn't exist"
        // from "project exists but I'm not allowed in" (IDOR oracle prevention).
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not found');
        expect(res.status).not.toBe(403);
    });

    it('returns 200 with populated project data for a legitimate project member', async () => {
        const populatedProject = {
            _id: projectId,
            name: 'my-project',
            owner: { _id: ownerId, email: 'owner@test.com' },
            users: [
                { _id: ownerId,  email: 'owner@test.com'  },
                { _id: memberId, email: 'member@test.com' },
            ],
        };

        // findById is used by verifyProjectMember (plain) and then populate()
        // is called on the returned document by requireProjectMember.
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: projectId,
            name: 'my-project',
            owner: ownerId,
            users: [ownerId, memberId], // memberId IS a member
            populate: vi.fn().mockResolvedValue(populatedProject),
        });

        const res = await request(app)
            .get(`/projects/get-project/${projectId}`)
            .set('Authorization', `Bearer ${memberToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('project');
        expect(res.body.project._id).toBe(projectId);
        expect(res.body.project).toHaveProperty('owner');
        expect(res.body.project).toHaveProperty('users');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// F-03 — PUT /projects/add-user is now owner-only
//   Members who are not the owner must receive 404 (not 403).
// ─────────────────────────────────────────────────────────────────────────────
describe('F-03 — PUT /projects/add-user is owner-only; non-owners receive 404', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app)
            .put('/projects/add-user')
            .send({ projectId, users: [outsiderId] });
        expect(res.status).toBe(401);
    });

    it('returns 404 when caller is NOT a project member', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: projectId,
            owner: ownerId,
            users: [ownerId], // outsiderId not in project
        });

        const res = await request(app)
            .put('/projects/add-user')
            .set('Authorization', `Bearer ${outsiderToken}`)
            .send({ projectId, users: [outsiderId] });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not found');
    });

    it('returns 404 when caller is a project member but NOT the owner', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: projectId,
            owner: ownerId,          // ownerId is the owner
            users: [ownerId, memberId], // memberId IS a member but not the owner
        });

        const res = await request(app)
            .put('/projects/add-user')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ projectId, users: [outsiderId] });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not found');
        expect(res.status).not.toBe(403);
    });

    it('returns 200 when the project owner adds a new member', async () => {
        // 1. requireProjectOwner calls Project.findById
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: projectId,
            owner: ownerId,
            users: [ownerId],
        });

        // 2. addUserToProject controller looks up the caller from DB
        vi.spyOn(userModel, 'findOne').mockResolvedValue({
            _id: ownerId,
            email: 'owner@test.com',
        });

        // 3. addUsersToProject service checks membership via findOne
        vi.spyOn(Project, 'findOne').mockResolvedValue({
            _id: projectId,
            users: [ownerId],
        });

        // 4. Service checks the new users exist
        vi.spyOn(userModel, 'countDocuments').mockResolvedValue(1);

        // 5. Service writes the update (double-populate chain pattern)
        vi.spyOn(Project, 'findOneAndUpdate').mockReturnValue({
            populate: vi.fn().mockReturnValue({
                populate: vi.fn().mockResolvedValue({
                    _id: projectId,
                    name: 'my-project',
                    owner: { _id: ownerId,    email: 'owner@test.com'    },
                    users: [
                        { _id: ownerId,    email: 'owner@test.com'    },
                        { _id: outsiderId, email: 'outsider@test.com' },
                    ],
                }),
            }),
        });

        const res = await request(app)
            .put('/projects/add-user')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ projectId, users: [outsiderId] });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('project');
        expect(res.body.project._id).toBe(projectId);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// F-06 — GET /users/search validations and field restriction
//   q must be ≥ 3 chars; results capped at 10; only _id and email returned.
// ─────────────────────────────────────────────────────────────────────────────
describe('F-06 — GET /users/search input validation and response field restriction', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).get('/users/search?q=alice');
        expect(res.status).toBe(401);
    });

    it('returns 400 when q query param is missing', async () => {
        const res = await request(app)
            .get('/users/search')
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when q is shorter than 3 characters', async () => {
        const res = await request(app)
            .get('/users/search?q=ab')
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/at least 3 characters/i);
    });

    it('returns 400 for a 1-character query', async () => {
        const res = await request(app)
            .get('/users/search?q=x')
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.status).toBe(400);
    });

    it('returns 200 with only _id and email fields (no password or sensitive data)', async () => {
        vi.spyOn(userModel, 'find').mockReturnValue({
            select: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                    { _id: ownerId, email: 'owner@test.com' },
                ]),
            }),
        });

        const res = await request(app)
            .get('/users/search?q=own')
            .set('Authorization', `Bearer ${memberToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('users');
        expect(Array.isArray(res.body.users)).toBe(true);

        // Each returned user must have only _id and email
        for (const user of res.body.users) {
            expect(user).toHaveProperty('_id');
            expect(user).toHaveProperty('email');
            expect(user).not.toHaveProperty('password');
            expect(Object.keys(user)).toHaveLength(2);
        }
    });

    it('caps search results at 10 entries', async () => {
        // Simulate DB returning 10 entries (the query has .limit(10))
        const tenUsers = Array.from({ length: 10 }, (_, i) => ({
            _id: `65f1a2b3c4d5e6f7a8b9c${String(i + 10).padStart(3, '0')}`,
            email: `user${i}@test.com`,
        }));

        vi.spyOn(userModel, 'find').mockReturnValue({
            select: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(tenUsers),
            }),
        });

        const res = await request(app)
            .get('/users/search?q=user')
            .set('Authorization', `Bearer ${memberToken}`);

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBeLessThanOrEqual(10);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// F-10 — PUT /users/change-password requires authentication and is rate-limited
// ─────────────────────────────────────────────────────────────────────────────
describe('F-10 — PUT /users/change-password requires auth', () => {
    it('returns 401 without a token', async () => {
        const res = await request(app)
            .put('/users/change-password')
            .send({ currentPassword: 'oldpass', newPassword: 'newpass123' });
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('returns 400 when body is missing (authenticated request)', async () => {
        // Controller validates fields before hitting the DB
        const res = await request(app)
            .put('/users/change-password')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/current password and new password are required/i);
    });

    it('returns 400 when new password is too short (authenticated request)', async () => {
        const res = await request(app)
            .put('/users/change-password')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ currentPassword: 'oldpass123', newPassword: 'short' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/between 8 and 72 characters/i);
    });
});

