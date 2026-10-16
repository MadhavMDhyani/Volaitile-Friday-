import { Router } from 'express';
import { body } from 'express-validator';
import * as aiController from '../controllers/ai.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post(
    '/chat',
    authMiddleware.authUser,
    [
        body('message').isString().trim().notEmpty().withMessage('Message is required'),
    ],
    aiController.handleAiChat
);

router.post(
    '/generate-code',
    authMiddleware.authUser,
    [
        body('prompt').isString().trim().notEmpty().withMessage('Prompt is required'),
    ],
    aiController.handleGenerateCode
);

router.post(
    '/review',
    authMiddleware.authUser,
    [
        body('code').isString().notEmpty().withMessage('Code is required'),
    ],
    aiController.handleReviewCode
);

export default router;
