import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import toolRoutes from './routes/tool.routes.js';
import healthRoutes from './routes/health.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

connect();

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    })
);
app.use(morgan('dev'));
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
    res.status(status).json({
        error: err.message || 'Internal server error',
    });
});

export default app;