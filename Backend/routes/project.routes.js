import {Router} from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post('/create',
    authMiddleware.authUser,
    projectController.createProject

)

router.get('/all',

authMiddleware.authUser,
projectController.getAllProject  


)

router.put('/add-user', 
    authMiddleware.authUser,
    body('projectId').isString().withMessage('projectId must be a string'),
    body('users').isArray().withMessage('Users must be an array of a string').bail()
    .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),
    projectController.addUserToProject
)


router.get('/get-project/:projectId',
    authMiddleware.authUser,
    projectController.getProjectById
)


export default router;