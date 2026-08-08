import userModel from '../models/user.models.js';
import * as userService from '../../service/user.service.js';
import { validationResult } from 'express-validator';
import redisService from '../../service/redis.service.js';


export const createUserController = async (req, res) => {
}

    export const loginController = async (req, res) => {
   const errors = validationResult(req);

   if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
   }

   try{
     
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select('+password');

if (!user) {
    return res.status(401).json({
        errors: 'Invalid credentials'
    })

}

const isMatch = await user.isValidPassword(password);

if (!isMatch) {
    return res.status(401).json({
        errors: 'Invalid credentials'
    });

}
   const token = user.generateJWT();

   res.status(200).json({ user, token });

} catch (err) {
console.log(err);

    res.status(400).send(err.message);

    }

}

export const profileController = async (req, res) => {
}

export const logoutController = async (req, res) => {
    try{

     const token = req.cookies.token || req.headers.authorization.
     split(' ')[1];

     await redisService.set(token, 'logout', 'EX', 60 * 60 * 24);

     res.status(200).json({
         message: 'Logged out successfully' 
        });

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }

}



 console.log(req.user);

 res.status(200).json({
   user: req.user 
});
    



