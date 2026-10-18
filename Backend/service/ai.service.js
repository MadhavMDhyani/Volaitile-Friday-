/**
 * Friday AI Assistant Service
 * Provides contextual AI responses, code generation, and code review.
 * Model-aware: resolves models per request, applies task-specific settings,
 * supports auto-selection, resilient retry fallback chain, and offline engine.
 */

import {
    getDefaultModelId,
    getNextModel,
    resolveModel,
    TASK_CONFIGS,
} from '../config/aiModels.js';

export const callGeminiApi = async ({
    apiKey,
    model,
    prompt,
    systemInstruction = '',
    temperature = 0.7,
    maxOutputTokens = 2048,
}) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const payload = {
        contents: [
            {
                role: 'user',
                parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}${prompt}` }],
            },
        ],
        generationConfig: {
            temperature,
            maxOutputTokens,
        },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!response.ok) {
            let errorDetails = '';
            try {
                const errData = await response.json();
                errorDetails = errData?.error?.message || '';
            } catch {
                // Ignore json parse error
            }

            if (response.status === 404 || /not found|model.*not.*found/i.test(errorDetails)) {
                console.warn(
                    `[AI Service] Warning: Gemini model "${model}" not found (HTTP ${response.status}). The model may be retired or unavailable.`
                );
            }

            throw new Error(`Gemini API returned status ${response.status}${errorDetails ? `: ${errorDetails}` : ''}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const text = parts
            .filter((part) => !part.thought && typeof part.text === 'string')
            .map((part) => part.text)
            .join('');

        if (!text) {
            throw new Error('No content returned from Gemini API');
        }
        return text;
    } finally {
        clearTimeout(timeoutId);
    }
};

export const getBuiltInResponse = (message, projectName = 'your project') => {
    const text = message.toLowerCase().trim();

    if (text.includes('docker') || text.includes('dockerfile')) {
        return `### Recommended Dockerfile for ${projectName}

\`\`\`dockerfile
# Multi-stage Dockerfile for optimized production build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --if-present

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app ./
EXPOSE 3000
USER node
CMD ["npm", "start"]
\`\`\`

**Tips:**
- Use \`.dockerignore\` to exclude \`node_modules\`, \`.git\`, and \`.env\`.
- Keep image size small with Alpine or Slim bases.`;
    }

    if (text.includes('auth') || text.includes('jwt') || text.includes('login') || text.includes('token')) {
        return `### Authentication Best Practices for ${projectName}

1. **Token Invalidation / Blacklisting:** When users log out, blacklist their JWT until expiration (supported via Redis/memory store).
2. **Short-lived Access Tokens:** Keep access tokens under 15-60 minutes, paired with secure refresh tokens or cookies.
3. **Password Security:** Use bcrypt with at least 10-12 salt rounds before persisting to MongoDB.
4. **Rate Limiting:** Protect \`/users/login\` and \`/users/register\` with strict window rate limits (already active in your routes).`;
    }

    if (text.includes('mongo') || text.includes('database') || text.includes('mongoose') || text.includes('schema')) {
        return `### Database Optimization & Schema Design

- **Indexes:** Ensure fields used in frequent queries (such as \`email\`, \`users\`, or foreign keys) have explicit unique or secondary indexes.
- **Population:** For populated references (e.g. \`.populate('users')\`), keep projected fields minimal (e.g., \`email _id\`) to reduce payload overhead.
- **Transactions:** Use Mongoose sessions for multi-document operations to prevent inconsistencies.`;
    }

    if (text.includes('test') || text.includes('jest') || text.includes('vitest')) {
        return `### Testing Recommendations for ${projectName}

\`\`\`javascript
// Example Supertest integration test for ${projectName}
import request from 'supertest';
import app from '../app.js';

describe('Project Endpoints', () => {
    it('should return health status', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('healthy');
    });
});
\`\`\`

Use \`supertest\` for integration tests and \`vitest\` for fast ESM runner support.`;
    }

    if (text.includes('git') || text.includes('branch') || text.includes('commit')) {
        return `### Recommended Git Workflow for ${projectName}

\`\`\`bash
# Create and switch to a feature branch
git checkout -b feat/your-feature-name

# Stage and make atomic commits
git add .
git commit -m "feat: implement your feature description"

# Keep updated with main
git fetch origin
git rebase origin/main
\`\`\``;
    }

    if (text.includes('help') || text.startsWith('/')) {
        return `### Friday Assistant Command Hub

Here are the tools and actions available in **${projectName}**:
- **/docker** – Generate production-ready container setups
- **/auth** – Review JWT security, token revocation & password hashing
- **/db** – Inspect database schema and query tuning
- **/test** – Review API test suites and mock setups
- **/git** – Branching strategies and clean commit guidelines
- Or ask any direct question about your code, debugging, or architecture!`;
    }

    return `Hello! I'm Friday, your AI engineering companion for **${projectName}**.

I reviewed your message: "${message}".

I can help you:
- Scaffold files, API endpoints, or database schemas
- Write and optimize Docker, Kubernetes, or deployment configs
- Debug server errors or inspect authorization middleware
- Review code snippets for security and performance

Let me know what you'd like to build or troubleshoot!`;
};

/**
 * Execute AI request with retry fallback chain:
 * 1. Primary resolved model
 * 2. Next model in registry on error
 * 3. Offline engine if all Gemini calls fail
 * Logs failure warnings without revealing the API key.
 */
const executeAiWithFallback = async ({
    task,
    requestedModel,
    prompt,
    systemInstruction,
    generationConfig,
    getOfflineFallback,
}) => {
    const startTime = performance.now();
    const apiKey = process.env.GEMINI_API_KEY;
    const resolvedRequestedModel = requestedModel || getDefaultModelId();
    const primaryModelId = resolveModel(resolvedRequestedModel, task);

    if (apiKey) {
        // Try primary model
        try {
            const text = await callGeminiApi({
                apiKey,
                model: primaryModelId,
                prompt,
                systemInstruction,
                temperature: generationConfig.temperature,
                maxOutputTokens: generationConfig.maxOutputTokens,
            });
            const latencyMs = Math.round(performance.now() - startTime);
            return {
                text,
                source: 'gemini',
                model: primaryModelId,
                requestedModel: resolvedRequestedModel,
                latencyMs,
            };
        } catch (primaryErr) {
            const safeMsg = String(primaryErr.message || primaryErr).replace(apiKey, '[REDACTED]');
            console.warn(
                `[AI Service] Primary model "${primaryModelId}" failed (${safeMsg}). Retrying with next model in registry...`
            );

            // Retry once with next model in registry
            const nextModel = getNextModel(primaryModelId);
            try {
                const text = await callGeminiApi({
                    apiKey,
                    model: nextModel.id,
                    prompt,
                    systemInstruction,
                    temperature: generationConfig.temperature,
                    maxOutputTokens: generationConfig.maxOutputTokens,
                });
                const latencyMs = Math.round(performance.now() - startTime);
                return {
                    text,
                    source: 'gemini',
                    model: nextModel.id,
                    requestedModel: resolvedRequestedModel,
                    latencyMs,
                };
            } catch (secondaryErr) {
                const safeSecondaryMsg = String(secondaryErr.message || secondaryErr).replace(apiKey, '[REDACTED]');
                console.warn(
                    `[AI Service] Fallback model "${nextModel.id}" failed (${safeSecondaryMsg}). Falling back to offline engine.`
                );
            }
        }
    }

    // Offline fallback
    const fallbackText = getOfflineFallback();
    const latencyMs = Math.round(performance.now() - startTime);
    return {
        text: fallbackText,
        source: 'offline',
        model: 'offline',
        requestedModel: resolvedRequestedModel,
        latencyMs,
    };
};

export const generateAiChat = async ({ message, projectName, context, model }) => {
    const taskConfig = TASK_CONFIGS.chat;
    const systemInstruction = taskConfig.getSystemInstruction(projectName);
    const prompt = context
        ? `Project Context: ${JSON.stringify(context)}\n\nUser Question: ${message}`
        : message;

    const result = await executeAiWithFallback({
        task: 'chat',
        requestedModel: model,
        prompt,
        systemInstruction,
        generationConfig: {
            temperature: taskConfig.temperature,
            maxOutputTokens: taskConfig.maxOutputTokens,
        },
        getOfflineFallback: () => getBuiltInResponse(message, projectName),
    });

    return {
        reply: result.text,
        source: result.source,
        model: result.model,
        requestedModel: result.requestedModel,
        latencyMs: result.latencyMs,
    };
};

export const generateCodeSnippet = async ({ prompt, language = 'javascript', framework = 'express', model }) => {
    const taskConfig = TASK_CONFIGS['generate-code'];
    const systemInstruction = taskConfig.getSystemInstruction({ language, framework });

    const result = await executeAiWithFallback({
        task: 'generate-code',
        requestedModel: model,
        prompt,
        systemInstruction,
        generationConfig: {
            temperature: taskConfig.temperature,
            maxOutputTokens: taskConfig.maxOutputTokens,
        },
        getOfflineFallback: () => `// Auto-generated ${language} template (${framework})
// Prompt: ${prompt}

export const handler = async (req, res) => {
    try {
        // Implementation for: ${prompt}
        res.status(200).json({ success: true, message: 'Operation executed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
`,
    });

    return {
        code: result.text,
        source: result.source,
        model: result.model,
        requestedModel: result.requestedModel,
        latencyMs: result.latencyMs,
    };
};

export const reviewCodeSnippet = async ({ code, language = 'javascript', model }) => {
    const taskConfig = TASK_CONFIGS.review;
    const systemInstruction = taskConfig.getSystemInstruction({ language });

    const result = await executeAiWithFallback({
        task: 'review',
        requestedModel: model,
        prompt: code,
        systemInstruction,
        generationConfig: {
            temperature: taskConfig.temperature,
            maxOutputTokens: taskConfig.maxOutputTokens,
        },
        getOfflineFallback: () => {
            const issues = [];
            if (code.includes('eval(')) issues.push('High Severity: Detected eval() which is vulnerable to remote code execution.');
            if (code.includes('password') && !code.includes('hash')) issues.push('Warning: Plaintext password handling detected.');
            if (code.includes('var ')) issues.push('Style: Use const or let instead of legacy var.');

            return `### Code Review Report (${language})

${issues.length === 0 ? 'No critical vulnerabilities found in preliminary static analysis.' : '**Identified Opportunities:**\n' + issues.map((i) => `- ${i}`).join('\n')}

**Recommendations:**
- Ensure all asynchronous database or network calls are wrapped in \`try/catch\` blocks.
- Sanitize and validate all incoming inputs using \`express-validator\` or zod.
- Keep dependencies updated and monitor CVEs.`;
        },
    });

    return {
        review: result.text,
        source: result.source,
        model: result.model,
        requestedModel: result.requestedModel,
        latencyMs: result.latencyMs,
    };
};

export default {
    generateAiChat,
    generateCodeSnippet,
    reviewCodeSnippet,
    callGeminiApi,
    getBuiltInResponse,
};
