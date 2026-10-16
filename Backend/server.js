import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import redisService from './service/redis.service.js';

const port = process.env.PORT || 3000;

const server = http.createServer(app);

// Keep alive timeout set for reverse proxies / ALBs
server.keepAliveTimeout = 65000;

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
    process.exit(1);
});

let isShuttingDown = false;

const gracefulShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    // Force exit after 10 seconds if closing hangs
    const forceExitTimer = setTimeout(() => {
        console.error('Graceful shutdown timed out. Forcing process exit.');
        process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    server.close(async () => {
        console.log('HTTP server closed.');
        try {
            await mongoose.connection.close(false);
            console.log('MongoDB connection closed.');
        } catch (dbErr) {
            console.error('Error closing MongoDB connection:', dbErr);
        }

        try {
            await redisService.quit();
            console.log('Redis client closed.');
        } catch (cacheErr) {
            console.error('Error closing Redis connection:', cacheErr);
        }

        console.log('Graceful shutdown complete.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});