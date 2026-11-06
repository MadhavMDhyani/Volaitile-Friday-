import './config/env.js';
import { getAllowedOrigins } from './config/env.js';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoSanitize from '@exortek/express-mongo-sanitize';

import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import toolRoutes from './routes/tool.routes.js';
import healthRoutes from './routes/health.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

if (process.env.NODE_ENV !== 'test') {
    connect();
}

const app = express();

// Parse TRUST_PROXY: "true" → true, "false" → false, numeric string → number, else raw value
const _rawProxy = process.env.TRUST_PROXY;
const _trustProxy = _rawProxy === 'true' ? true
    : _rawProxy === 'false' ? false
    : _rawProxy !== undefined && !isNaN(Number(_rawProxy)) ? Number(_rawProxy)
    : 1; // default: single reverse proxy
app.set('trust proxy', _trustProxy);

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);

app.use(compression());

const allowedOrigins = getAllowedOrigins();

// In non-production, always allow the local dev server
if (process.env.NODE_ENV !== 'production' && !allowedOrigins.includes('http://localhost:5173')) {
    allowedOrigins.push('http://localhost:5173');
}

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                return callback(null, true);
            }
            const corsError = new Error(`Origin ${origin} not allowed by CORS`);
            corsError.status = 403;
            return callback(corsError);
        },
        credentials: true,
    })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Do not rate-limit Socket.IO handshake/polling requests
        return req.path.startsWith('/socket.io');
    },
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Strip MongoDB operators ($, .) from req.body, req.query, req.params to prevent injection
app.use(mongoSanitize());

// Service API Routes
app.use('/health', healthRoutes);
app.use('/projects', projectRoutes);
app.use('/users', userRoutes);
app.use('/ai', aiRoutes);
app.use('/tools', toolRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'Volaitile Friday Backend API is operational',
        version: '1.1.0',
        services: ['/health', '/users', '/projects', '/ai', '/tools', '/dashboard'],
    });
});

// 404 handler returning JSON
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Central error handler returning JSON
app.use((err, req, res, next) => {
    if (err.message && err.message.includes('not allowed by CORS')) {
        return res.status(403).json({ error: err.message });
    }
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