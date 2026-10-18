import jwt from 'jsonwebtoken';
import redisService from '../service/redis.service.js';

export const extractToken = (req) => {
    if (!req) return null;
    const authHeader = req.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        if (token) return token;
    }
    if (req.cookies?.token) {
        return req.cookies.token;
    }
    return null;
};

export const authUser = async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Wrap Redis blacklist check in its own try/catch
        let isBlacklisted = null;
        try {
            isBlacklisted = await redisService.get(token);
        } catch (redisError) {
            if (process.env.NODE_ENV === 'production') {
                return res.status(503).json({ error: 'Auth service unavailable' });
            }
            console.warn('Redis unreachable during blacklist check, continuing in development:', redisError.message);
        }

        if (isBlacklisted) {
            if (res.cookie) {
                res.cookie('token', '', { maxAge: 0 });
            }
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Session expired' });
            }
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } catch (error) {
        console.error('Unexpected auth middleware error:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
};
