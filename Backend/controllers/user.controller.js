import mongoose from 'mongoose';
import userModel from '../models/user.models.js';
import * as userService from '../service/user.service.js';
import { validationResult } from 'express-validator';
import redisService from '../service/redis.service.js';
import jwt from 'jsonwebtoken';
import { extractToken } from '../middleware/auth.middleware.js';

export const createUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0]?.msg || 'Validation failed';
        return res.status(400).json({ error: firstError, errors: errors.array() });
    }

    try {
        const rawEmail = (req.body.email || '').trim().toLowerCase();
        const user = await userService.createUser({ ...req.body, email: rawEmail });
        const token = user.generateJWT();

        const userObj = user.toObject ? user.toObject() : { ...user._doc };
        delete userObj.password;

        if (res.cookie) {
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });
        }

        return res.status(201).json({ user: userObj, token });
    } catch (error) {
        if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
            return res.status(409).json({ error: 'Email is already registered', requestId: req.requestId });
        }
        const isDbError =
            error.name === 'MongoServerSelectionError' ||
            error.name === 'MongoNetworkError' ||
            (error.message && error.message.includes('buffering timed out'));
        if (isDbError) {
            console.error(`[${req.requestId}] Registration DB error:`, error.message);
            res.set('Retry-After', '5');
            return res.status(503).json({
                error: 'Service is starting, please retry',
                code: 'DB_UNAVAILABLE',
                requestId: req.requestId,
            });
        }
        console.error(`[${req.requestId}] Registration error:`, error.message);
        return res.status(500).json({ error: 'Something went wrong', requestId: req.requestId });
    }
};

export const loginController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0]?.msg || 'Validation failed';
        return res.status(400).json({ error: firstError, errors: errors.array() });
    }

    try {
        const rawEmail = (req.body.email || '').trim();
        const password = req.body.password || '';
        const cleanEmail = rawEmail.toLowerCase();

        if (!cleanEmail || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 1. Try exact lowercase match
        let user = await userModel.findOne({ email: cleanEmail }).select('+password');

        // 2. Fallback to case-insensitive regex if stored differently
        if (!user) {
            const escaped = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            user = await userModel.findOne({ email: { $regex: new RegExp(`^${escaped}$`, 'i') } }).select('+password');
        }

        // 3. Fallback for Gmail addresses (with or without dots)
        if (!user && cleanEmail.includes('@gmail.com')) {
            const [localPart, domain] = cleanEmail.split('@');
            const noDots = localPart.replace(/\./g, '') + '@' + domain;
            user = await userModel.findOne({ email: noDots }).select('+password');
        }

        if (!user || !user.password) {
            return res.status(401).json({
                error: 'Invalid email or password',
            });
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid email or password',
            });
        }

        const token = user.generateJWT();

        const userObj = user.toObject ? user.toObject() : { ...user._doc };
        delete userObj.password;

        if (res.cookie) {
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });
        }

        return res.status(200).json({ user: userObj, token });
    } catch (err) {
        const isDbError =
            err.name === 'MongoServerSelectionError' ||
            err.name === 'MongoNetworkError' ||
            (err.message && err.message.includes('buffering timed out'));
        if (isDbError) {
            console.error(`[${req.requestId}] Login DB error:`, err.message);
            res.set('Retry-After', '5');
            return res.status(503).json({
                error: 'Service is starting, please retry',
                code: 'DB_UNAVAILABLE',
                requestId: req.requestId,
            });
        }
        console.error(`[${req.requestId}] Login error:`, err.message);
        return res.status(500).json({ error: 'Something went wrong', requestId: req.requestId });
    }
};

export const profileController = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        let user = null;

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            user = await userModel.findById(userId).select('_id email');
        }

        if (!user && req.user?.email) {
            user = await userModel.findOne({ email: req.user.email }).select('_id email');
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
            },
        });
    } catch (err) {
        console.error('Profile error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const logoutController = async (req, res) => {
    try {
        const token = extractToken(req);

        if (token) {
            const decoded = jwt.decode(token);
            let secondsLeft = 86400; // default 24h fallback
            if (decoded && decoded.exp) {
                const nowSec = Math.floor(Date.now() / 1000);
                secondsLeft = Math.max(1, decoded.exp - nowSec);
            }
            try {
                await redisService.set(token, 'logout', 'EX', secondsLeft);
            } catch (redisErr) {
                console.warn('Redis error while blacklisting token:', redisErr.message);
                if (process.env.NODE_ENV === 'production') {
                    return res.status(503).json({ error: 'Auth service unavailable' });
                }
            }
        }

        if (res.cookie) {
            res.cookie('token', '', { maxAge: 0 });
        }

        return res.status(200).json({ message: 'Logged out' });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const searchUsersController = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.trim().length < 3) {
            return res.status(400).json({ error: 'Search query must be at least 3 characters' });
        }

        const safeQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('^' + safeQuery, 'i');

        const users = await userModel.find({
            email: regex,
            _id: { $ne: req.user._id },
        })
            .select('_id email')
            .limit(10);

        return res.status(200).json({
            users: users.map((u) => ({ _id: u._id, email: u.email })),
        });
    } catch (err) {
        console.error('Search users error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const changePasswordController = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 72) {
            return res.status(400).json({ error: 'New password must be between 8 and 72 characters' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'New password must be different from the old password' });
        }

        const user = await userModel.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await user.isValidPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        user.password = await userModel.hashPassword(newPassword);
        await user.save();

        // Blacklist old token
        const oldToken = extractToken(req);
        if (oldToken) {
            const decoded = jwt.decode(oldToken);
            let secondsLeft = 86400;
            if (decoded && decoded.exp) {
                const nowSec = Math.floor(Date.now() / 1000);
                secondsLeft = Math.max(1, decoded.exp - nowSec);
            }
            try {
                await redisService.set(oldToken, 'password_changed', 'EX', secondsLeft);
            } catch (redisErr) {
                console.warn('Redis error while blacklisting old token:', redisErr.message);
            }
        }

        const newToken = user.generateJWT();

        return res.status(200).json({ token: newToken });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};
