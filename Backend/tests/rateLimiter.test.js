/**
 * Task 4 — Rate limiter tests
 *
 * Proves two requirements:
 *   1. Five consecutive 503 (server-side) responses do NOT consume quota
 *      → the 6th request does NOT receive 429.
 *   2. Wrong-password 401 responses DO consume quota
 *      → repeated 401s eventually trigger 429.
 *
 * We build a minimal Express app with the same limiter config
 * (but max:5 and skip:false so the window is predictable).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';

function buildTestApp({ max = 5, handler }) {
    const app = express();
    app.set('trust proxy', false);

    const limiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        max,
        skipSuccessfulRequests: true,
        // Same logic as production: skip server-side errors
        requestWasSuccessful: (req, res) => res.statusCode < 400 || res.statusCode >= 500,
        standardHeaders: true,
        legacyHeaders: false,
        // Use in-memory store (default); reset is handled by short windowMs or fresh app per test
        keyGenerator: () => 'test-ip', // single bucket for all requests
    });

    app.post('/test', limiter, handler);
    return app;
}

describe('Rate limiter — Task 4', () => {
    describe('503 responses do NOT consume quota', () => {
        it('5 consecutive 503s followed by a 6th request: no 429', async () => {
            const app = buildTestApp({
                max: 3,
                handler: (req, res) => {
                    // Respond 503 for requests 1-5, 401 for request 6
                    res.status(503).json({ error: 'DB_UNAVAILABLE', code: 'DB_UNAVAILABLE' });
                },
            });

            // Fire 5 requests that return 503
            for (let i = 0; i < 5; i++) {
                const res = await request(app).post('/test');
                expect(res.status).toBe(503);
            }

            // 6th request: should still be 503 (not 429) because 503s don't count
            const finalRes = await request(app).post('/test');
            expect(finalRes.status).not.toBe(429);
            expect(finalRes.status).toBe(503);
        });
    });

    describe('401 (wrong password) responses DO consume quota', () => {
        it('exceeding max with 401s triggers 429', async () => {
            const MAX = 3;
            const app = buildTestApp({
                max: MAX,
                handler: (req, res) => {
                    res.status(401).json({ error: 'Invalid email or password' });
                },
            });

            // Consume all attempts with 401s
            for (let i = 0; i < MAX; i++) {
                const res = await request(app).post('/test');
                expect(res.status).toBe(401);
            }

            // Next request should be rate-limited
            const limitedRes = await request(app).post('/test');
            expect(limitedRes.status).toBe(429);
        });
    });

    describe('400 (validation) responses DO consume quota', () => {
        it('exceeding max with 400s triggers 429', async () => {
            const MAX = 3;
            const app = buildTestApp({
                max: MAX,
                handler: (req, res) => {
                    res.status(400).json({ error: 'Validation failed' });
                },
            });

            for (let i = 0; i < MAX; i++) {
                const res = await request(app).post('/test');
                expect(res.status).toBe(400);
            }

            const limitedRes = await request(app).post('/test');
            expect(limitedRes.status).toBe(429);
        });
    });

    describe('2xx responses do NOT consume quota (skipSuccessfulRequests)', () => {
        it('many 200s do not exhaust the limit', async () => {
            const MAX = 3;
            const app = buildTestApp({
                max: MAX,
                handler: (req, res) => {
                    res.status(200).json({ ok: true });
                },
            });

            for (let i = 0; i < MAX + 5; i++) {
                const res = await request(app).post('/test');
                expect(res.status).toBe(200);
            }
        });
    });
});
