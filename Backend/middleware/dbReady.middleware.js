import mongoose from 'mongoose';

/**
 * DB readiness guard middleware.
 * Mounted BEFORE API routers and rate limiters (but AFTER /health routes).
 * Returns 503 immediately when Mongoose is not yet connected.
 */
export function dbReady(req, res, next) {
    if (mongoose.connection.readyState === 1) {
        return next();
    }
    res.set('Retry-After', '5');
    return res.status(503).json({
        error: 'Service is starting, please retry',
        code: 'DB_UNAVAILABLE',
    });
}
