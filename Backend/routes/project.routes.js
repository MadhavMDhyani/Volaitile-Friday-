import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as projectController from '../controllers/project.controller.js';
import * as messageController from '../controllers/message.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
import { requireProjectMember, requireProjectOwner } from '../middleware/projectAccess.js';
import fileRoutes from './file.routes.js';

const router = Router();

const messageLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 per minute per user
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    message: { error: 'Too many messages sent. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post(
    '/create',
    authMiddleware.authUser,
    [
        body('name').isString().trim().notEmpty().withMessage('Project name is required'),
    ],
    projectController.createProject
);

router.get(
    '/all',
    authMiddleware.authUser,
    projectController.getAllProject
);

router.put(
    '/add-user',
    authMiddleware.authUser,
    [
        body('projectId').isString().withMessage('projectId must be a string'),
        body('users').isArray().withMessage('Users must be an array of string IDs').bail()
            .custom((users) => users.every((user) => typeof user === 'string')).withMessage('Each user must be a string'),
    ],
    projectController.addUserToProject
);

router.get(
    '/get-project/:projectId',
    authMiddleware.authUser,
    requireProjectMember,
    projectController.getProjectById
);

// Delete project (owner only, deletes files and messages)
router.delete(
    '/:projectId',
    authMiddleware.authUser,
    requireProjectOwner,
    projectController.deleteProject
);

// Remove member or leave project
router.delete(
    '/:projectId/members/:userId',
    authMiddleware.authUser,
    requireProjectMember,
    projectController.removeMemberFromProject
);

// Message routes
router.get(
    '/:projectId/messages',
    authMiddleware.authUser,
    requireProjectMember,
    messageController.getMessages
);

router.post(
    '/:projectId/messages',
    authMiddleware.authUser,
    requireProjectMember,
    messageLimiter,
    messageController.createMessage
);

// Mount file management routes on /projects/:projectId/files
router.use('/', fileRoutes);

export default router;