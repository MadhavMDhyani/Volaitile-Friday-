import { Router } from 'express';
import { getSystemHealth } from '../service/health.service.js';

const router = Router();

router.get('/', (req, res) => {
    const health = getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});

router.get('/ping', (req, res) => {
    res.status(200).json({ pong: true, time: Date.now() });
});

export default router;
