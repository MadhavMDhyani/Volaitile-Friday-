import { Router } from 'express';
import mongoose from 'mongoose';
import { getSystemHealth } from '../service/health.service.js';

const router = Router();

router.get('/', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        return res.status(isDbConnected ? 200 : 503).json({
            status: isDbConnected ? 'healthy' : 'degraded',
            db: isDbConnected ? 'connected' : 'disconnected',
        });
    }

    const health = getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(health);
});

router.get('/ping', (req, res) => {
    res.status(200).json({ pong: true, time: Date.now() });
});

router.get('/ready', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
        return res.status(200).json({ ready: true, db: 'connected' });
    }
    return res.status(503).json({ ready: false, db: 'disconnected' });
});

export default router;
