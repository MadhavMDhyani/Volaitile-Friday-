import projectModel from '../models/project.model.js';
import * as projectService from '../service/project.service.js';
import userModel from '../models/user.models.js';
import { validationResult } from 'express-validator';


export const createProjectController = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
}

try {

const { name } = req.body;
const loggedInUser = await userModel.findOne({ 
    email: req.user.email
})
const project = await projectService.addUsersToProject({
 projectId,
 users,
 userId:loggedInUser._id
})

return res.status(200).json({
    projects,
})

} catch (error) {
    console.error(error);
    res.status(400).json({error: error.message});
}
}

export const getAllProject = async (req, res) => {   
}

export const addUserToProject = async (req,res)=>{
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

try {

   const {projectId,users}=req.body

   const loggedInUser = await userModel.findOne({
    email: req.user.email

   })


   const project = await projectservice.addUsersToProject({
    projectId,
    users,
    userId: loggedInUser._id

   })

   return res.status(200).json({
    project,
   })



} catch (err) {
 console.log(err);
 res.status(400).json({ error: err.message });
}

}
