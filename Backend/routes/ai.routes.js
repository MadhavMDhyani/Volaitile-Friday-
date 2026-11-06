import { Router } from 'express';
import { body } from 'express-validator';
import * as aiController from '../controllers/ai.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
import { requireProjectMember } from '../middleware/projectAccess.js';
import { isAllowedModel, getDefaultModelId } from '../config/aiModels.js';
import { MAX_MESSAGE_LENGTH } from '../service/message.service.js';
import { aiRateLimitMiddleware } from '../service/aiRateLimiter.js';

const router = Router();

// Apply authUser to all AI routes
router.use(authMiddleware.authUser);

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

const languageValidation = body('language')
    .optional({ values: 'falsy' })
    .isString().withMessage('Language must be a string')
    .trim()
    .isLength({ max: 30 }).withMessage('Language must not exceed 30 characters')
    .matches(/^[\w+#.\- ]+$/).withMessage('Language contains invalid characters');

const frameworkValidation = body('framework')
    .optional({ values: 'falsy' })
    .isString().withMessage('Framework must be a string')
    .trim()
    .isLength({ max: 30 }).withMessage('Framework must not exceed 30 characters')
    .matches(/^[\w+#.\- ]+$/).withMessage('Framework contains invalid characters');

router.get('/models', aiController.handleGetAiModels);

router.post(
    '/chat',
    requireProjectMember,
    aiRateLimitMiddleware,
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
    aiRateLimitMiddleware,
    [
        body('prompt')
            .isString().withMessage('Prompt must be a string')
            .trim()
            .isLength({ min: 1, max: 20000 }).withMessage('Prompt must be between 1 and 20000 characters'),
        modelValidation,
        languageValidation,
        frameworkValidation,
    ],
    aiController.handleGenerateCode
);

router.post(
    '/review',
    aiRateLimitMiddleware,
    [
        body('code')
            .isString().withMessage('Code must be a string')
            .isLength({ min: 1, max: 20000 }).withMessage('Code must be between 1 and 20000 characters'),
        modelValidation,
        languageValidation,
        frameworkValidation,
    ],
    aiController.handleReviewCode
);

export default router;
