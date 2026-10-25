/**
 * Task 5 tests — CORS origin normalization and 403 rejection
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { normalizeOrigin } from '../config/env.js';

describe('CORS origin normalization — Task 5', () => {
    describe('normalizeOrigin()', () => {
        it('strips trailing slash', () => {
            expect(normalizeOrigin('http://localhost:5173/')).toBe('http://localhost:5173');
        });

        it('strips path from URL', () => {
            expect(normalizeOrigin('https://example.com/some/path')).toBe('https://example.com');
        });

        it('strips trailing slash AND path', () => {
            expect(normalizeOrigin('https://example.com/foo/')).toBe('https://example.com');
        });

        it('strips query string', () => {
            expect(normalizeOrigin('https://example.com?foo=bar')).toBe('https://example.com');
        });

        it('preserves port', () => {
            expect(normalizeOrigin('http://localhost:3000/')).toBe('http://localhost:3000');
        });

        it('returns null for invalid URLs and warns', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const result = normalizeOrigin('not-a-url');
            expect(result).toBeNull();
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('handles https with port', () => {
            expect(normalizeOrigin('https://myapp.vercel.app')).toBe('https://myapp.vercel.app');
        });
    });

    describe('CORS rejection via app', () => {
        it('rejects unauthorized origin with 403', async () => {
            const res = await request(app)
                .get('/health/ping')
                .set('Origin', 'https://evil-attacker.com');

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toMatch(/not allowed by CORS/i);
        });

        it('allows no-origin requests (same-origin / non-browser)', async () => {
            const res = await request(app).get('/health/ping');
            expect(res.status).toBe(200);
        });
    });
});
