import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';
import File from '../models/file.model.js';
import Message from '../models/message.model.js';
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
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const loggedInUser = await userModel.findOne(
            req.user?._id ? { _id: req.user._id } : { email: req.user?.email }
        );

        if (!loggedInUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const cleanName = name.trim().toLowerCase();

        // Check for existing project with same name by this owner
        const existing = await projectModel.findOne({
            owner: loggedInUser._id,
            name: cleanName,
        });
        if (existing) {
            return res.status(409).json({ error: 'You already have a project with this name' });
        }

        let project;
        try {
            project = await projectModel.create({
                name: cleanName,
                owner: loggedInUser._id,
                users: [loggedInUser._id],
            });
        } catch (createErr) {
            if (createErr.code === 11000) {
                return res.status(409).json({ error: 'You already have a project with this name' });
            }
            throw createErr;
        }

        try {
            await seedDefaultFiles(project._id, loggedInUser._id);
        } catch (seedErr) {
            console.warn('Could not seed default files for project:', seedErr.message);
        }

        const populatedProject = await projectModel.findById(project._id)
            .populate('owner', 'email _id')
            .populate('users', 'email _id');

        return res.status(201).json({
            project: populatedProject,
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
        })
            .populate('owner', 'email _id')
            .populate('users', 'email _id');

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
        const status = err.status || 400;
        return res.status(status).json({ error: err.message });
    }
};

export const getProjectById = async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    try {
        const project = await projectModel.findById(projectId)
            .populate('owner', 'email _id')
            .populate('users', 'email _id');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const currentUserId = req.user?._id ? req.user._id.toString() : null;
        const isMember = project.users.some((u) => {
            const memberId = u?._id ? u._id.toString() : u.toString();
            return memberId === currentUserId;
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

    try {
        await projectModel.findByIdAndDelete(projectId);
        await File.deleteMany({ projectId });
        await Message.deleteMany({ projectId });

        return res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('deleteProject error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export const removeMemberFromProject = async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const project = await projectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const callerId = req.user._id.toString();
        const targetUserId = userId.toString();
        const ownerId = project.owner?._id ? project.owner._id.toString() : project.owner?.toString();

        const isTargetMember = project.users.some(
            (u) => (u?._id ? u._id.toString() : u.toString()) === targetUserId
        );
        if (!isTargetMember) {
            return res.status(404).json({ error: 'User is not a member of this project' });
        }

        if (callerId === ownerId) {
            // Owner is removing a member
            if (targetUserId === ownerId) {
                return res.status(400).json({
                    error: 'Project owner cannot leave the project. Please delete the project instead.',
                });
            }
        } else {
            // Non-owner member is trying to act
            if (callerId !== targetUserId) {
                return res.status(403).json({ error: 'Only the project owner can remove other members' });
            }
            if (callerId === ownerId) {
                return res.status(400).json({
                    error: 'Project owner cannot leave the project. Please delete the project instead.',
                });
            }
        }

        project.users = project.users.filter(
            (u) => (u?._id ? u._id.toString() : u.toString()) !== targetUserId
        );
        await project.save();

        const updatedProject = await projectModel.findById(projectId)
            .populate('owner', 'email _id')
            .populate('users', 'email _id');

        return res.status(200).json({
            message: 'Member removed successfully',
            project: updatedProject,
        });
    } catch (err) {
        console.error('removeMemberFromProject error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};
