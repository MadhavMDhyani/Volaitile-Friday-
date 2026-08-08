import jwt from 'jsonwebtoken';
import redisService from '../../service/redis.service.js';

export const authUser = async (req, res, next) => {
    try {
        const token = (req.cookies && req.cookies.token) || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

      if (!token) {
            return res.status(401).send({ error: 'please authenticate' });
        }

        const isBlacklisted = await redisService.get(token);    

        if (isBlacklisted) {

            res.cookie && res.cookie('token', '');

            return res.status(401).send({ error: 'Token has been logged out' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.log(error);


        res.status(401).send({ error: 'Unauthorized User' });
    }
}
