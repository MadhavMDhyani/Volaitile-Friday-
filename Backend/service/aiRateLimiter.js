/**
 * Shared In-Memory Per-User AI Rate Limiter
 *
 * Enforces dual-window limits per user across REST and Socket.IO:
 *  - 10 requests per minute
 *  - 100 requests per day (24 hours)
 */

const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_MINUTE = 10;
const MAX_PER_DAY = 100;

export const aiUserRateLimits = new Map();

/**
 * Checks and consumes AI quota for the given userId.
 * Returns { allowed: true } if within quota, or { allowed: false, reason, error }.
 */
export const checkAndConsumeAiLimit = (userId) => {
    if (!userId) return { allowed: true };
    const key = userId.toString();
    const now = Date.now();

    let timestamps = aiUserRateLimits.get(key) || [];
    // Keep only timestamps within 24 hours
    timestamps = timestamps.filter((t) => now - t < ONE_DAY_MS);

    // Check minute window
    const minuteCount = timestamps.filter((t) => now - t < ONE_MINUTE_MS).length;
    if (minuteCount >= MAX_PER_MINUTE) {
        aiUserRateLimits.set(key, timestamps);
        return {
            allowed: false,
            reason: 'minute',
            error: 'AI rate limit exceeded. You can make at most 10 requests per minute.',
        };
    }

    // Check 24-hour window
    if (timestamps.length >= MAX_PER_DAY) {
        aiUserRateLimits.set(key, timestamps);
        return {
            allowed: false,
            reason: 'day',
            error: 'AI daily rate limit exceeded. You can make at most 100 requests per day.',
        };
    }

    timestamps.push(now);
    aiUserRateLimits.set(key, timestamps);
    return { allowed: true };
};

/**
 * Express middleware for REST AI endpoints (/ai/chat, /ai/generate-code, /ai/review).
 */
export const aiRateLimitMiddleware = (req, res, next) => {
    const userId = (req.user?._id || req.user?.id || req.user?.userId)?.toString() || req.ip;
    const check = checkAndConsumeAiLimit(userId);
    if (!check.allowed) {
        return res.status(429).json({ error: check.error || 'AI rate limit exceeded' });
    }
    return next();
};

/**
 * Clear rate limit state (useful in tests).
 */
export const resetAiRateLimits = () => {
    aiUserRateLimits.clear();
};

// Periodic pruning of timestamps older than 24h
const aiPruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [userId, timestamps] of aiUserRateLimits.entries()) {
        const valid = timestamps.filter((t) => now - t < ONE_DAY_MS);
        if (valid.length === 0) {
            aiUserRateLimits.delete(userId);
        } else {
            aiUserRateLimits.set(userId, valid);
        }
    }
}, 60 * 1000);

if (typeof aiPruneTimer.unref === 'function') {
    aiPruneTimer.unref();
}

export default {
    checkAndConsumeAiLimit,
    aiRateLimitMiddleware,
    resetAiRateLimits,
    aiUserRateLimits,
};
