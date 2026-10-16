import projectModel from '../models/project.model.js';
import * as projectService from '../service/project.service.js';
import userModel from '../models/user.models.js';
import { validationResult } from 'express-validator';


export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const project = await projectModel.create({
            name: name.trim().toLowerCase(),
            users: [loggedInUser._id]
        });

        return res.status(201).json({
            project
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }
};

export const createProjectController = createProject;

export const getAllProject = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const allProjects = await projectModel.find({
            users: loggedInUser._id
        }).populate('users', 'email _id');

        return res.status(200).json({
            projects: allProjects
        });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, users } = req.body;

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id
        });

        return res.status(200).json({
            project
        });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

export const getProjectById = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await projectModel.findById(projectId).populate('users', 'email _id');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        return res.status(200).json({
            project
        });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};
    

