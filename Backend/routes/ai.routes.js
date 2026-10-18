import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import * as aiController from '../controllers/ai.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
import { requireProjectMember } from '../middleware/projectAccess.js';
import { isAllowedModel, getDefaultModelId } from '../config/aiModels.js';
import { MAX_MESSAGE_LENGTH } from '../service/message.service.js';

const router = Router();

// AI rate limiter: 20 requests per minute per user, keyed by req.user._id
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    message: { error: 'AI rate limit exceeded. Please wait a minute before making more requests.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply authUser and aiLimiter to all AI routes
router.use(authMiddleware.authUser, aiLimiter);

/**
 * Validates and sanitizes the optional model field against the allowlist.
 * If value is unknown or invalid, falls back to DEFAULT_MODEL.
 */
const modelValidation = body('model')
    .optional({ nullable: true, checkFalsy: false })
    .isString().withMessage('Model must be a string')
    .customSanitizer((val) => {
        if (!val || typeof val !== 'string') return getDefaultModelId();
        const trimmed = val.trim();
        if (trimmed === 'auto' || isAllowedModel(trimmed)) {
            return trimmed;
        }
        return getDefaultModelId();
    });

router.get('/models', aiController.handleGetAiModels);

router.post(
    '/chat',
    requireProjectMember,
    [
        body('message')
            .isString().withMessage('Message must be a string')
            .trim()
            .isLength({ min: 1, max: MAX_MESSAGE_LENGTH }).withMessage(`Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters`),
        modelValidation,
    ],
    aiController.handleAiChat
);

router.post(
    '/generate-code',
    [
        body('prompt')
            .isString().withMessage('Prompt must be a string')
            .trim()
            .isLength({ min: 1, max: 20000 }).withMessage('Prompt must be between 1 and 20000 characters'),
        modelValidation,
    ],
    aiController.handleGenerateCode
);

router.post(
    '/review',
    [
        body('code')
            .isString().withMessage('Code must be a string')
            .isLength({ min: 1, max: 20000 }).withMessage('Code must be between 1 and 20000 characters'),
        modelValidation,
    ],
    aiController.handleReviewCode
);

export default router;
