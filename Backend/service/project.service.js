import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const createProject = async ({ name, userId }) => {
    if (!name) {
        throw new Error('Name is required');
    }
    if (!userId) {
        throw new Error('User is required');
    }
    if (!isValidObjectId(userId)) {
        throw new Error('User ID must be a valid mongoose ObjectId');
    }

    let project;
    try {
        project = await projectModel.create({
            name,
            users: [userId],
        });
    } catch (err) {
        if (err?.code === 11000 || err?.codeName === 'DuplicateKey') {
            throw new Error('Project name already exists');
        }
        throw err;
    }

    return project;
};

export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('User is required');
    }

    if (!isValidObjectId(userId)) {
        throw new Error('User ID must be a valid mongoose ObjectId');
    }

    const allUserProjects = await projectModel.find({
        users: userId,
    });

    return allUserProjects;
};

export const addUsersToProject = async ({ projectId, users }) => {
    if (!projectId) {
        throw new Error('projectId is required');
    }

    if (!isValidObjectId(projectId)) {
        throw new Error('projectId must be a valid mongoose ObjectId');
    }

    if (!users || !Array.isArray(users)) {
        throw new Error('users are required');
    }

    for (const user of users) {
        if (!isValidObjectId(user)) {
            throw new Error('Each user ID must be a valid mongoose ObjectId');
        }
    }

    const updatedProject = await projectModel.findByIdAndUpdate(
        projectId,
        { $addToSet: { users: { $each: users } } },
        { new: true },
    );

    return updatedProject;
};

