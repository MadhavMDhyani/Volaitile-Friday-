/**
 * Friday AI Model Registry & Allowlist
 * Defines supported Gemini models, speeds, generation configurations,
 * task settings, and auto-selection logic.
 * Model IDs must come from this registry only.
 */

export const AI_MODELS = [
    {
        id: 'gemini-2.5-flash-lite',
        label: 'Gemini 2.5 Flash Lite',
        speed: 'fast',
        maxOutputTokens: 2048,
        temperature: 0.7,
        supportsStreaming: true,
    },
    {
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        speed: 'balanced',
        maxOutputTokens: 2048,
        temperature: 0.7,
        supportsStreaming: true,
    },
    {
        id: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        speed: 'deep',
        maxOutputTokens: 4096,
        temperature: 0.5,
        supportsStreaming: true,
    },
];

/**
 * Returns the resolved default model ID.
 * Reads GEMINI_MODEL from environment variables, falling back to the first registry entry.
 */
export const getDefaultModelId = () => {
    const envModel = process.env.GEMINI_MODEL?.trim();
    if (envModel && AI_MODELS.some((m) => m.id === envModel)) {
        return envModel;
    }
    return AI_MODELS[0].id;
};

export const DEFAULT_MODEL = getDefaultModelId();

/**
 * Returns allowed model IDs array.
 */
export const getAllowedModelIds = () => AI_MODELS.map((m) => m.id);

/**
 * Checks if a model ID is allowed by the registry.
 */
export const isAllowedModel = (modelId) => {
    if (!modelId || typeof modelId !== 'string') return false;
    return AI_MODELS.some((m) => m.id === modelId.trim());
};

/**
 * Finds a model entry by its ID.
 */
export const getModelById = (modelId) => {
    if (!modelId || typeof modelId !== 'string') return null;
    return AI_MODELS.find((m) => m.id === modelId.trim()) || null;
};

/**
 * Returns the fast model (for short chat auto-selection).
 */
export const getFastModel = () => {
    return AI_MODELS.find((m) => m.speed === 'fast') || AI_MODELS[0];
};

/**
 * Returns the deep model (for code generation and code review auto-selection).
 */
export const getDeepModel = () => {
    return AI_MODELS.find((m) => m.speed === 'deep') || AI_MODELS[AI_MODELS.length - 1];
};

/**
 * Given a model ID, returns the next model in the registry for fallback retry.
 */
export const getNextModel = (currentModelId) => {
    const currentIndex = AI_MODELS.findIndex((m) => m.id === currentModelId);
    if (currentIndex === -1) {
        return AI_MODELS[0];
    }
    const nextIndex = (currentIndex + 1) % AI_MODELS.length;
    return AI_MODELS[nextIndex];
};

/**
 * Resolves a model ID based on client request and task type:
 * - If model === 'auto':
 *     - 'chat': fast model
 *     - 'generate-code' | 'review': deep model
 * - If model is allowed in registry: use it
 * - If model is unknown or missing: fall back to DEFAULT_MODEL (or current env default)
 */
export const resolveModel = (requestedModel, task = 'chat') => {
    const normalized = typeof requestedModel === 'string' ? requestedModel.trim() : null;

    if (normalized === 'auto') {
        if (task === 'chat') {
            return getFastModel().id;
        }
        if (task === 'generate-code' || task === 'review') {
            return getDeepModel().id;
        }
        return getDefaultModelId();
    }

    if (normalized && isAllowedModel(normalized)) {
        return normalized;
    }

    return getDefaultModelId();
};

/**
 * Task-specific configurations and system instructions.
 */
export const TASK_CONFIGS = {
    chat: {
        task: 'chat',
        temperature: 0.7,
        maxOutputTokens: 2048,
        getSystemInstruction: (projectName) =>
            `You are Friday, an elite AI full-stack developer assistant built into the "Volaitile Friday" platform.\n` +
            `You assist developers with Node.js, Express, React, MongoDB, Redis, Docker, system architecture, and security.\n` +
            `Provide concise, markdown-formatted answers with clear code snippets when appropriate.\n` +
            `The current project is "${projectName || 'Volaitile Friday'}".`,
    },
    'generate-code': {
        task: 'generate-code',
        temperature: 0.2,
        maxOutputTokens: 4096,
        getSystemInstruction: ({ language = 'javascript', framework = 'express' } = {}) =>
            `You are an expert ${language} developer and senior software engineer.\n` +
            `Output clean, working, modern, production-grade code with brief inline comments.\n` +
            `Target framework: ${framework}.\n` +
            `Return well-formatted code blocks without unnecessary chatter.`,
    },
    review: {
        task: 'review',
        temperature: 0.05,
        maxOutputTokens: 4096,
        getSystemInstruction: ({ language = 'javascript' } = {}) =>
            `You are a senior security and performance code reviewer.\n` +
            `Analyze the given ${language} code thoroughly for bugs, security vulnerabilities (OWASP top 10), memory leaks, and performance bottlenecks.\n` +
            `Provide structured output with clear sections:\n` +
            `1. Summary\n` +
            `2. Vulnerabilities & Issues (Severity: High, Medium, Low)\n` +
            `3. Recommendations & Fixed Code Snippet`,
    },
};

export default {
    AI_MODELS,
    DEFAULT_MODEL,
    getDefaultModelId,
    getAllowedModelIds,
    isAllowedModel,
    getModelById,
    getFastModel,
    getDeepModel,
    getNextModel,
    resolveModel,
    TASK_CONFIGS,
};
