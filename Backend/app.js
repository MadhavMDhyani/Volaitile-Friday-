import './config/env.js';
import { getAllowedOrigins } from './config/env.js';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import toolRoutes from './routes/tool.routes.js';
import healthRoutes from './routes/health.routes.js';

if (process.env.NODE_ENV !== 'test') {
    connect();
}

const app = express();

app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);

app.use(compression());

const allowedOrigins = getAllowedOrigins();
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                return callback(null, true);
            }
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
    })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Service API Routes
app.use('/health', healthRoutes);
app.use('/projects', projectRoutes);
app.use('/users', userRoutes);
app.use('/ai', aiRoutes);
app.use('/tools', toolRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'Volaitile Friday Backend API is operational',
        version: '1.1.0',
        services: ['/health', '/users', '/projects', '/ai', '/tools'],
    });
});

// 404 handler returning JSON
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Central error handler returning JSON
app.use((err, req, res, next) => {
    console.error('Unhandled application error:', err);
    const status = err.status || err.statusCode || 500;
    if (status >= 500 && process.env.NODE_ENV === 'production') {
        return res.status(status).json({
            error: 'Internal server error',
        });
    }
    return res.status(status).json({
        error: err.message || 'Internal server error',
    });
});

export default app;