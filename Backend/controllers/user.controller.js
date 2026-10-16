import userModel from '../models/user.models.js';
import * as userService from '../service/user.service.js';
import { validationResult } from 'express-validator';
import redisService from '../service/redis.service.js';
import jwt from 'jsonwebtoken';

export const createUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await userService.createUser(req.body);
        const token = await user.generateJWT();

        const userObj = user.toObject ? user.toObject() : { ...user._doc };
        delete userObj.password;
        
        return res.status(201).json({ user: userObj, token });
    } catch (error) {
        if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
            return res.status(409).json({ error: 'Email is already registered' });
        }
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const loginController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const token = await user.generateJWT();

        const userObj = user.toObject ? user.toObject() : { ...user._doc };
        delete userObj.password;

        return res.status(200).json({ user: userObj, token });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const profileController = async (req, res) => {
    try {
        const filter = req.user?._id ? { _id: req.user._id } : { email: req.user?.email };
        const user = await userModel.findOne(filter).select('_id email');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            user: {
                _id: user._id,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Profile error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const logoutController = async (req, res) => {
    try {
        const token = (req.cookies && req.cookies.token) || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

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

export const getAllUsersController = async (req, res) => {
    try {
        const filter = req.user?._id ? { _id: req.user._id } : { email: req.user?.email };
        const loggedUser = await userModel.findOne(filter);

        if (!loggedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const allUsers = await userService.getAllUsers({ userId: loggedUser._id });

        return res.status(200).json({
            users: allUsers,
        });
    } catch (err) {
        console.error('Get all users error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};
