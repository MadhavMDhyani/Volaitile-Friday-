import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.get(
    '/activity',
    authMiddleware.authUser,
    dashboardController.getRecentActivity
);

export default router;
