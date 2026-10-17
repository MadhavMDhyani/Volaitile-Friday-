import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import redisService from '../service/redis.service.js';
import * as aiService from '../service/ai.service.js';
import {
    AI_MODELS,
    DEFAULT_MODEL,
    getDefaultModelId,
    resolveModel,
    getNextModel,
    getFastModel,
    getDeepModel,
} from '../config/aiModels.js';

const JWT_SECRET = process.env.JWT_SECRET || 'volatile_friday_jwt_secure_secret_key_production_grade_32_chars_ok';

describe('Friday AI Model-Aware Intelligence Unit & Integration Tests', () => {
    const testUserId = '65f1a2b3c4d5e6f7a8b9c0d1';
    const validToken = jwt.sign(
        { _id: testUserId, email: 'developer@test.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    let originalApiKey;
    let originalModelEnv;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(redisService, 'get').mockResolvedValue(null);
        originalApiKey = process.env.GEMINI_API_KEY;
        originalModelEnv = process.env.GEMINI_MODEL;
    });

    afterEach(() => {
        if (originalApiKey !== undefined) {
            process.env.GEMINI_API_KEY = originalApiKey;
        } else {
            delete process.env.GEMINI_API_KEY;
        }

        if (originalModelEnv !== undefined) {
            process.env.GEMINI_MODEL = originalModelEnv;
        } else {
            delete process.env.GEMINI_MODEL;
        }
        vi.restoreAllMocks();
    });

    describe('Model Registry & Config', () => {
        it('exports a valid registry with required fields on every entry', () => {
            expect(Array.isArray(AI_MODELS)).toBe(true);
            expect(AI_MODELS.length).toBeGreaterThan(0);

            for (const model of AI_MODELS) {
                expect(model).toHaveProperty('id');
                expect(typeof model.id).toBe('string');
                expect(model).toHaveProperty('label');
                expect(['fast', 'balanced', 'deep']).toContain(model.speed);
                expect(typeof model.maxOutputTokens).toBe('number');
                expect(typeof model.temperature).toBe('number');
                expect(typeof model.supportsStreaming).toBe('boolean');
            }
        });

        it('DEFAULT_MODEL falls back to first entry if GEMINI_MODEL env var is absent or invalid', () => {
            delete process.env.GEMINI_MODEL;
            expect(getDefaultModelId()).toBe(AI_MODELS[0].id);

            process.env.GEMINI_MODEL = 'invalid-model-foo';
            expect(getDefaultModelId()).toBe(AI_MODELS[0].id);
        });

        it('DEFAULT_MODEL respects valid GEMINI_MODEL env var', () => {
            const secondModel = AI_MODELS[1]?.id;
            if (secondModel) {
                process.env.GEMINI_MODEL = secondModel;
                expect(getDefaultModelId()).toBe(secondModel);
            }
        });
    });

    describe('GET /ai/models', () => {
        it('returns 401 Unauthorized without auth token', async () => {
            const res = await request(app).get('/ai/models');
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Unauthorized');
        });

        it('returns allowlist of models with labels, speed, and default indicator when authenticated', async () => {
            const res = await request(app)
                .get('/ai/models')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('models');
            expect(Array.isArray(res.body.models)).toBe(true);
            expect(res.body.models.length).toBe(AI_MODELS.length);

            const defaultCount = res.body.models.filter((m) => m.isDefault).length;
            expect(defaultCount).toBe(1);

            const firstModel = res.body.models[0];
            expect(firstModel).toHaveProperty('id');
            expect(firstModel).toHaveProperty('label');
            expect(firstModel).toHaveProperty('speed');
            expect(firstModel).toHaveProperty('isDefault');
            expect(res.body).toHaveProperty('defaultModel');
        });
    });

    describe('Model Resolution & Auto-selection', () => {
        it('unknown model falls back to the default and never returns unallowed ID', () => {
            const unknownRequested = 'non-existent-gpt-99';
            const resolved = resolveModel(unknownRequested, 'chat');
            expect(resolved).toBe(getDefaultModelId());
            expect(resolved).not.toBe(unknownRequested);
        });

        it('"auto" picks fast model for chat and deep model for review and generate-code', () => {
            const fastModel = getFastModel().id;
            const deepModel = getDeepModel().id;

            const chatModel = resolveModel('auto', 'chat');
            const reviewModel = resolveModel('auto', 'review');
            const codeModel = resolveModel('auto', 'generate-code');

            expect(chatModel).toBe(fastModel);
            expect(reviewModel).toBe(deepModel);
            expect(codeModel).toBe(deepModel);
            expect(chatModel).not.toBe(reviewModel);
        });
    });

    describe('Gemini SDK Mocking & Fallback Chain', () => {
        it('uses default model when unknown model is requested and passes it to Gemini API', async () => {
            process.env.GEMINI_API_KEY = 'mock-test-key-12345';

            const fetchCalls = [];
            globalThis.fetch = vi.fn().mockImplementation(async (url) => {
                fetchCalls.push(url.toString());
                return {
                    ok: true,
                    json: async () => ({
                        candidates: [
                            {
                                content: {
                                    parts: [{ text: 'Mocked Gemini response for unknown model test' }],
                                },
                            },
                        ],
                    }),
                };
            });

            const result = await aiService.generateAiChat({
                message: 'How do I optimize Docker?',
                model: 'unsupported-model-xyz',
            });

            expect(result.source).toBe('gemini');
            expect(result.model).toBe(getDefaultModelId());
            expect(result.reply).toBe('Mocked Gemini response for unknown model test');
            expect(result.requestedModel).toBe('unsupported-model-xyz');
            expect(typeof result.latencyMs).toBe('number');

            // Verify Gemini URL fetched contains the allowlisted default model, NOT the raw unknown model
            expect(fetchCalls.length).toBe(1);
            expect(fetchCalls[0]).toContain(`/models/${getDefaultModelId()}:generateContent`);
            expect(fetchCalls[0]).not.toContain('unsupported-model-xyz');
        });

        it('"auto" picks fast model for chat vs deep model for review during Gemini calls', async () => {
            process.env.GEMINI_API_KEY = 'mock-test-key-12345';

            const fetchedUrls = [];
            globalThis.fetch = vi.fn().mockImplementation(async (url) => {
                fetchedUrls.push(url.toString());
                return {
                    ok: true,
                    json: async () => ({
                        candidates: [
                            {
                                content: {
                                    parts: [{ text: 'Generated output' }],
                                },
                            },
                        ],
                    }),
                };
            });

            const chatRes = await aiService.generateAiChat({
                message: 'Hello',
                model: 'auto',
            });
            const reviewRes = await aiService.reviewCodeSnippet({
                code: 'const x = 1;',
                model: 'auto',
            });

            const fastId = getFastModel().id;
            const deepId = getDeepModel().id;

            expect(chatRes.model).toBe(fastId);
            expect(reviewRes.model).toBe(deepId);
            expect(chatRes.requestedModel).toBe('auto');
            expect(reviewRes.requestedModel).toBe('auto');

            expect(fetchedUrls[0]).toContain(`/models/${fastId}:generateContent`);
            expect(fetchedUrls[1]).toContain(`/models/${deepId}:generateContent`);
        });

        it('a failing primary model retries with the next model, then falls through to offline engine with source: "offline"', async () => {
            process.env.GEMINI_API_KEY = 'mock-test-key-12345';

            const attemptedModels = [];
            globalThis.fetch = vi.fn().mockImplementation(async (url) => {
                const urlStr = url.toString();
                const match = urlStr.match(/\/models\/([^:]+):generateContent/);
                if (match) attemptedModels.push(match[1]);
                return {
                    ok: false,
                    status: 500,
                    json: async () => ({ error: 'Internal Gemini quota/server error' }),
                };
            });

            const result = await aiService.generateAiChat({
                message: 'How to configure MongoDB?',
                model: 'gemini-1.5-flash',
            });

            // Primary and secondary models were attempted in fallback chain
            expect(attemptedModels.length).toBe(2);
            expect(attemptedModels[0]).toBe('gemini-1.5-flash');
            const expectedNext = getNextModel('gemini-1.5-flash').id;
            expect(attemptedModels[1]).toBe(expectedNext);

            // Fell back to offline engine
            expect(result.source).toBe('offline');
            expect(result.model).toBe('offline');
            expect(result.reply).toContain('Database Optimization & Schema Design');
            expect(typeof result.latencyMs).toBe('number');
        });

        it('a failing primary model retries and succeeds if the secondary model in registry succeeds', async () => {
            process.env.GEMINI_API_KEY = 'mock-test-key-12345';

            let attempt = 0;
            globalThis.fetch = vi.fn().mockImplementation(async () => {
                attempt++;
                if (attempt === 1) {
                    return {
                        ok: false,
                        status: 429,
                        json: async () => ({ error: 'Quota exceeded for primary model' }),
                    };
                }
                return {
                    ok: true,
                    json: async () => ({
                        candidates: [
                            {
                                content: {
                                    parts: [{ text: 'Recovered via fallback secondary model!' }],
                                },
                            },
                        ],
                    }),
                };
            });

            const result = await aiService.generateAiChat({
                message: 'Help with Git',
                model: 'gemini-1.5-flash',
            });

            expect(result.source).toBe('gemini');
            const expectedSecondary = getNextModel('gemini-1.5-flash').id;
            expect(result.model).toBe(expectedSecondary);
            expect(result.reply).toBe('Recovered via fallback secondary model!');
        });
    });
});
