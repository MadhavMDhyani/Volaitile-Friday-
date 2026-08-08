import {Router} from 'express';
import * as userController from '../../controllers/user/user.controller.js';
import { body } from 'express-validator';
impport 

const router = Router();

router.post('/register', [
    body('email').isEmail().withMessage('Email must be valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], userController.createUserController);

router.post('/login', 
    body('email').isEmail().withMessage('Email must be valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    userController.loginUserController);

    router.get('/profile', authMiddleware.authUser, userController.profileController);
    router.get('/logout', authMiddleware.authUser, userController.logoutController);

export default router;

