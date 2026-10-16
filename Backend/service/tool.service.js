import crypto from 'crypto';
import File from '../models/file.model.js';
import projectModel from '../models/project.model.js';

export const generateSecureSecret = ({ type = 'hex', length = 32 }) => {
    const validLength = Math.min(Math.max(parseInt(length, 10) || 32, 16), 128);

    if (type === 'base64') {
        return crypto.randomBytes(validLength).toString('base64');
    }
    if (type === 'uuid') {
        return crypto.randomUUID();
    }
    return crypto.randomBytes(Math.ceil(validLength / 2)).toString('hex').slice(0, validLength);
};

export const validateAndFormatJson = (jsonString) => {
    if (!jsonString || typeof jsonString !== 'string') {
        throw new Error('Payload must be a non-empty string');
    }

    try {
        const parsed = JSON.parse(jsonString);
        const formatted = JSON.stringify(parsed, null, 2);
        return {
            isValid: true,
            formatted,
            byteSize: Buffer.byteLength(jsonString, 'utf8'),
            keyCount: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1,
        };
    } catch (err) {
        return {
            isValid: false,
            error: err.message,
        };
    }
};

export const computeProjectStats = async (projectId) => {
    const project = await projectModel.findById(projectId).populate('users', 'email _id');
    if (!project) {
        throw new Error('Project not found');
    }

    const files = await File.find({ projectId });
    let totalLines = 0;
    let totalBytes = 0;
    const languageCounts = {};

    files.forEach((f) => {
        const lines = (f.content || '').split('\n').length;
        const bytes = Buffer.byteLength(f.content || '', 'utf8');
        totalLines += lines;
        totalBytes += bytes;
        const lang = f.language || 'other';
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    return {
        projectId: project._id,
        projectName: project.name,
        collaboratorsCount: project.users?.length || 0,
        filesCount: files.length,
        totalLines,
        totalBytes,
        languages: languageCounts,
        createdAt: project.createdAt || project._id.getTimestamp(),
    };
};
