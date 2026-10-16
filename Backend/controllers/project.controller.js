import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';
import * as projectService from '../service/project.service.js';
import { seedDefaultFiles } from '../service/file.service.js';
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

        const loggedInUser = await userModel.findOne(
            req.user?._id ? { _id: req.user._id } : { email: req.user?.email }
        );

        if (!loggedInUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const project = await projectModel.create({
            name: name.trim().toLowerCase(),
            users: [loggedInUser._id],
        });

        try {
            await seedDefaultFiles(project._id, loggedInUser._id);
        } catch (seedErr) {
            console.warn('Could not seed default files for project:', seedErr.message);
        }

        return res.status(201).json({
            project,
        });

    } catch (error) {
        console.error('createProject error:', error);
        return res.status(400).json({ error: error.message });
    }
};

export const createProjectController = createProject;

export const getAllProject = async (req, res) => {
    try {
        const loggedInUser = await userModel.findOne(
            req.user?._id ? { _id: req.user._id } : { email: req.user?.email }
        );

        if (!loggedInUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const allProjects = await projectModel.find({
            users: loggedInUser._id,
        }).populate('users', 'email _id');

        return res.status(200).json({
            projects: allProjects,
        });
    } catch (err) {
        console.error('getAllProject error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, users } = req.body;

        const loggedInUser = await userModel.findOne(
            req.user?._id ? { _id: req.user._id } : { email: req.user?.email }
        );

        if (!loggedInUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id,
        });

        return res.status(200).json({
            project,
        });
    } catch (err) {
        console.error('addUserToProject error:', err);
        return res.status(400).json({ error: err.message });
    }
};

export const getProjectById = async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    try {
        const loggedInUser = await userModel.findOne(
            req.user?._id ? { _id: req.user._id } : { email: req.user?.email }
        );

        if (!loggedInUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const project = await projectModel.findById(projectId).populate('users', 'email _id');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const isMember = project.users.some((u) => {
            const memberId = u?._id ? u._id.toString() : u.toString();
            return memberId === loggedInUser._id.toString();
        });

        if (!isMember) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        return res.status(200).json({
            project,
        });
    } catch (err) {
        console.error('getProjectById error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const deleteProject = async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    try {
        const loggedInUser = await userModel.findOne(
            req.user?._id ? { _id: req.user._id } : { email: req.user?.email }
        );

        if (!loggedInUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const project = await projectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const isMember = project.users.some((u) => u.toString() === loggedInUser._id.toString());
        if (!isMember) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        await projectModel.findByIdAndDelete(projectId);
        try {
            const File = (await import('../models/file.model.js')).default;
            await File.deleteMany({ projectId });
        } catch (_) {}

        return res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('deleteProject error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

