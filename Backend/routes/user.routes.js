import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post(
    '/register',
    authLimiter,
    [
        body('email').isEmail().withMessage('Email must be valid email address').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    userController.createUserController
);

router.post(
    '/login',
    authLimiter,
    [
        body('email').isEmail().withMessage('Email must be valid email address').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    userController.loginController
);

router.get('/all', authMiddleware.authUser, userController.getAllUsersController);
router.get('/profile', authMiddleware.authUser, userController.profileController);
router.post('/logout', authMiddleware.authUser, userController.logoutController);

export default router;
