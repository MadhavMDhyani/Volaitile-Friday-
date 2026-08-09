import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('userId is required');
    }

    if (!isValidObjectId(userId)) {
        throw new Error('Invalid userId');
    }

    const projects = await projectModel.find({ users: userId });
    return projects;
};

export const addUsersToProject = async ({ projectId, users, userId }) => {
    if (!projectId) {
        throw new Error('projectId is required');
    }

    if (!isValidObjectId(projectId)) {
        throw new Error('Invalid projectId');
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
        throw new Error('users are required');
    }

    if (users.some((u) => !isValidObjectId(u))) {
        throw new Error('Invalid userId(s) in users array');
    }

    if (!userId) {
        throw new Error('userId is required');
    }

    if (!isValidObjectId(userId)) {
        throw new Error('Invalid userId');
    }

    const project = await projectModel.findOne({ _id: projectId, users: userId });

    if (!project) {
        throw new Error('User does not belong to this project');
    }

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        { $addToSet: { users: { $each: users } } },
        { new: true }
    );

    return updatedProject;
};

export const getProjectId = async ({ projectId}) => {
    if  (!projectId) {
        throw new Error("projectId is required")

    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    
    }

    const project = await projectModel.findOne({
    _id: projectId
    
}).populate('users')

return project;
}




    




