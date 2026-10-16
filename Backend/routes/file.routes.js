import { Router } from 'express';
import { body } from 'express-validator';
import * as fileController from '../controllers/file.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';
import { requireProjectMember } from '../middleware/projectAccess.js';

const router = Router({ mergeParams: true });

router.get(
    '/:projectId/files',
    authMiddleware.authUser,
    requireProjectMember,
    fileController.getProjectFiles
);

router.post(
    '/:projectId/files',
    authMiddleware.authUser,
    requireProjectMember,
    [
        body('name').isString().trim().notEmpty().withMessage('File name is required'),
    ],
    fileController.createProjectFile
);

router.get(
    '/:projectId/files/:fileId',
    authMiddleware.authUser,
    requireProjectMember,
    fileController.getFileDetails
);

router.put(
    '/:projectId/files/:fileId',
    authMiddleware.authUser,
    requireProjectMember,
    fileController.updateProjectFile
);

router.delete(
    '/:projectId/files/:fileId',
    authMiddleware.authUser,
    requireProjectMember,
    fileController.deleteProjectFile
);

export default router;
