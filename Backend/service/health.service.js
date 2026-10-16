import mongoose from 'mongoose';
import redisService from './redis.service.js';

export const getSystemHealth = () => {
    const memoryUsage = process.memoryUsage();
    const mongoState = mongoose.connection.readyState;
    const mongoStateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };

    return {
        status: mongoState === 1 ? 'healthy' : 'degraded',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: {
                provider: 'MongoDB',
                status: mongoStateMap[mongoState] || 'unknown',
                databaseName: mongoose.connection.name || 'volatile-friday',
            },
            cache: {
                provider: 'Redis / Hybrid In-Memory',
                status: redisService.status,
            },
        },
        system: {
            nodeVersion: process.version,
            platform: process.platform,
            memory: {
                rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
                heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
                heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
            },
        },
    };
};
