import mongoose from 'mongoose';
import Project from '../models/project.model.js';

/**
 * Middleware to ensure the authenticated user is a member of the project.
 * Validates :projectId (or req.body.projectId for routes like /ai/chat),
 * loads the project, verifies membership, and attaches req.project & req.currentUserId.
 */
export const requireProjectMember = async (req, res, next) => {
    try {
        const projectId = req.params.projectId ?? req.body?.projectId;

        // If on AI chat route and projectId is not provided, allow proceeding as general AI
        if (!projectId) {
            if (req.baseUrl === '/ai' || req.originalUrl?.includes('/ai/chat')) {
                return next();
            }
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const currentUserId = req.user?._id ? req.user._id.toString() : null;
        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const isMember = Array.isArray(project.users) && project.users.some((u) => {
            const memberId = u?._id ? u._id.toString() : u.toString();
            return memberId === currentUserId;
        });

        if (!isMember) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        req.project = project;
        req.currentUserId = currentUserId;
        return next();
    } catch (err) {
        console.error('requireProjectMember error:', err);
        return res.status(500).json({ error: 'Failed to verify project access' });
    }
};

/**
 * Middleware to ensure the authenticated user is the owner of the project.
 */
export const requireProjectOwner = async (req, res, next) => {
    try {
        const projectId = req.params.projectId ?? req.body?.projectId;

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const currentUserId = req.user?._id ? req.user._id.toString() : null;
        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const isMember = Array.isArray(project.users) && project.users.some((u) => {
            const memberId = u?._id ? u._id.toString() : u.toString();
            return memberId === currentUserId;
        });

        if (!isMember) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        const ownerId = project.owner?._id ? project.owner._id.toString() : project.owner?.toString();
        if (ownerId !== currentUserId) {
            return res.status(403).json({ error: 'Only the project owner can perform this action' });
        }

        req.project = project;
        req.currentUserId = currentUserId;
        return next();
    } catch (err) {
        console.error('requireProjectOwner error:', err);
        return res.status(500).json({ error: 'Failed to verify project ownership' });
    }
};

export default {
    requireProjectMember,
    requireProjectOwner,
};
