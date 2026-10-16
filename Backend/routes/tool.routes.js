import { Router } from 'express';
import * as toolController from '../controllers/tool.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post('/generate-secret', authMiddleware.authUser, toolController.generateSecret);
router.post('/validate-json', authMiddleware.authUser, toolController.validateJson);
router.get('/project-stats/:projectId', authMiddleware.authUser, toolController.getProjectStats);

export default router;
