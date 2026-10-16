import { validationResult } from 'express-validator';
import * as fileService from '../service/file.service.js';
import projectModel from '../models/project.model.js';
import userModel from '../models/user.models.js';

// Verify that the logged in user is a member of the project
const checkProjectAccess = async (projectId, userObj) => {
    const loggedInUser = await userModel.findOne(
        userObj?._id ? { _id: userObj._id } : { email: userObj?.email }
    );
    if (!loggedInUser) return null;

    const project = await projectModel.findById(projectId);
    if (!project) return null;

    const isMember = project.users.some(
        (u) => u.toString() === loggedInUser._id.toString()
    );
    if (!isMember) return null;

    return { project, user: loggedInUser };
};

export const getProjectFiles = async (req, res) => {
    const { projectId } = req.params;
    try {
        const access = await checkProjectAccess(projectId, req.user);
        if (!access) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        const files = await fileService.getFilesByProjectId(projectId);
        return res.status(200).json({ files });
    } catch (err) {
        console.error('getProjectFiles error:', err);
        return res.status(500).json({ error: err.message || 'Failed to retrieve files' });
    }
};

export const createProjectFile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { name, path, content, language } = req.body;

    try {
        const access = await checkProjectAccess(projectId, req.user);
        if (!access) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        const file = await fileService.createFile({
            projectId,
            name,
            path,
            content,
            language,
            userId: access.user._id,
        });

        return res.status(201).json({ file });
    } catch (err) {
        console.error('createProjectFile error:', err);
        return res.status(400).json({ error: err.message || 'Failed to create file' });
    }
};

export const getFileDetails = async (req, res) => {
    const { projectId, fileId } = req.params;
    try {
        const access = await checkProjectAccess(projectId, req.user);
        if (!access) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        const file = await fileService.getFileById({ fileId, projectId });
        return res.status(200).json({ file });
    } catch (err) {
        console.error('getFileDetails error:', err);
        return res.status(404).json({ error: err.message || 'File not found' });
    }
};

export const updateProjectFile = async (req, res) => {
    const { projectId, fileId } = req.params;
    const { content, name } = req.body;

    try {
        const access = await checkProjectAccess(projectId, req.user);
        if (!access) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        const updated = await fileService.updateFile({
            fileId,
            projectId,
            content,
            name,
            userId: access.user._id,
        });

        return res.status(200).json({ file: updated });
    } catch (err) {
        console.error('updateProjectFile error:', err);
        return res.status(400).json({ error: err.message || 'Failed to update file' });
    }
};

export const deleteProjectFile = async (req, res) => {
    const { projectId, fileId } = req.params;

    try {
        const access = await checkProjectAccess(projectId, req.user);
        if (!access) {
            return res.status(403).json({ error: 'You do not have access to this project' });
        }

        await fileService.deleteFile({ fileId, projectId });
        return res.status(200).json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('deleteProjectFile error:', err);
        return res.status(400).json({ error: err.message || 'Failed to delete file' });
    }
};
