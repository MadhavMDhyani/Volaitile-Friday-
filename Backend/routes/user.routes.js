import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 15 : 100,
    skipSuccessfulRequests: true,
    skip: () => process.env.NODE_ENV === 'test',
    message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    skipSuccessfulRequests: true,
    skip: () => process.env.NODE_ENV === 'test',
    message: { error: 'Too many registration attempts from this IP, please try again after 1 hour' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post(
    '/register',
    registerLimiter,
    [
        body('email').trim().isEmail().withMessage('Email must be valid email address').normalizeEmail({ gmail_remove_dots: false }),
        body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be between 8 and 72 characters long'),
    ],
    userController.createUserController
);

router.post(
    '/login',
    loginLimiter,
    [
        body('email').trim().isEmail().withMessage('Email must be valid email address').normalizeEmail({ gmail_remove_dots: false }),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    userController.loginController
);

router.get('/search', authMiddleware.authUser, userController.searchUsersController);
router.put('/change-password', authMiddleware.authUser, userController.changePasswordController);
router.get('/profile', authMiddleware.authUser, userController.profileController);
router.post('/logout', authMiddleware.authUser, userController.logoutController);

export default router;
