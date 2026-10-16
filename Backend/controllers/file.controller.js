import { validationResult } from 'express-validator';
import * as fileService from '../service/file.service.js';

export const getProjectFiles = async (req, res) => {
    const { projectId } = req.params;
    try {
        const files = await fileService.getFilesByProjectId(projectId);
        return res.status(200).json({ files });
    } catch (err) {
        console.error('getProjectFiles error:', err);
        const status = err.status || 500;
        return res.status(status).json({ error: err.message || 'Failed to retrieve files' });
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
        const file = await fileService.createFile({
            projectId,
            name,
            path,
            content,
            language,
            userId: req.currentUserId,
        });

        return res.status(201).json({ file });
    } catch (err) {
        console.error('createProjectFile error:', err);
        const status = err.status || 400;
        return res.status(status).json({ error: err.message || 'Failed to create file' });
    }
};

export const getFileDetails = async (req, res) => {
    const { projectId, fileId } = req.params;
    try {
        const file = await fileService.getFileById({ fileId, projectId });
        return res.status(200).json({ file });
    } catch (err) {
        console.error('getFileDetails error:', err);
        const status = err.status || 404;
        return res.status(status).json({ error: err.message || 'File not found' });
    }
};

export const updateProjectFile = async (req, res) => {
    const { projectId, fileId } = req.params;
    const { content, name } = req.body;

    try {
        const updated = await fileService.updateFile({
            fileId,
            projectId,
            content,
            name,
            userId: req.currentUserId,
        });

        return res.status(200).json({ file: updated });
    } catch (err) {
        console.error('updateProjectFile error:', err);
        const status = err.status || 400;
        return res.status(status).json({ error: err.message || 'Failed to update file' });
    }
};

export const deleteProjectFile = async (req, res) => {
    const { projectId, fileId } = req.params;

    try {
        await fileService.deleteFile({ fileId, projectId });
        return res.status(200).json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('deleteProjectFile error:', err);
        const status = err.status || 400;
        return res.status(status).json({ error: err.message || 'Failed to delete file' });
    }
};
