import projectModel from '../models/project.model';
import projectService from '../service/project.service';
import userModel from '../models/user.models';
import { validationResult } from 'express-validator';


export const createProjectController = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
}

const { name } = req.body;
const loggedInUser = await userMode;


}