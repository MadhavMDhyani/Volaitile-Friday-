import mongoose from 'mongoose';
import File from '../models/file.model.js';
import projectModel from '../models/project.model.js';

export const getFilesByProjectId = async (projectId) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID');
    }

    let files = await File.find({ projectId }).sort({ path: 1, name: 1 });

    // If project has no files yet, auto-seed starter files
    if (files.length === 0) {
        files = await seedDefaultFiles(projectId);
    }

    return files;
};

export const createFile = async ({ projectId, name, path, content, language, userId }) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid project ID');
    }

    const cleanName = name.trim();
    const cleanPath = (path || cleanName).trim();

    const existing = await File.findOne({ projectId, path: cleanPath });
    if (existing) {
        throw new Error(`File at path "${cleanPath}" already exists`);
    }

    const file = await File.create({
        projectId,
        name: cleanName,
        path: cleanPath,
        content: content || '',
        language: language || detectLanguage(cleanName),
        updatedBy: userId,
    });

    return file;
};

export const getFileById = async ({ fileId, projectId }) => {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        throw new Error('Invalid file ID');
    }

    const query = { _id: fileId };
    if (projectId) query.projectId = projectId;

    const file = await File.findOne(query);
    if (!file) {
        throw new Error('File not found');
    }
    return file;
};

export const updateFile = async ({ fileId, projectId, content, name, userId }) => {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        throw new Error('Invalid file ID');
    }

    const updateData = { updatedBy: userId };
    if (typeof content === 'string') updateData.content = content;
    if (name) updateData.name = name.trim();

    const updated = await File.findOneAndUpdate(
        { _id: fileId, ...(projectId ? { projectId } : {}) },
        updateData,
        { new: true }
    );

    if (!updated) {
        throw new Error('File not found or update failed');
    }

    return updated;
};

export const deleteFile = async ({ fileId, projectId }) => {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        throw new Error('Invalid file ID');
    }

    const deleted = await File.findOneAndDelete({
        _id: fileId,
        ...(projectId ? { projectId } : {})
    });

    if (!deleted) {
        throw new Error('File not found');
    }

    return deleted;
};

export const seedDefaultFiles = async (projectId, userId = null) => {
    const defaultFiles = [
        {
            projectId,
            name: 'README.md',
            path: 'README.md',
            language: 'markdown',
            content: `# Volaitile Friday Project\n\nWelcome to your project workspace. You can edit code, chat with Friday AI, and collaborate with your team in real time.\n`,
            updatedBy: userId,
        },
        {
            projectId,
            name: 'index.js',
            path: 'src/index.js',
            language: 'javascript',
            content: `// Main Application Entry\nconsole.log('Volaitile Friday Workspace online.');\n\nexport function start() {\n  return 'System operational';\n}\n`,
            updatedBy: userId,
        },
        {
            projectId,
            name: 'package.json',
            path: 'package.json',
            language: 'json',
            content: `{\n  "name": "project-workspace",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "start": "node src/index.js"\n  }\n}\n`,
            updatedBy: userId,
        },
    ];

    try {
        const created = await File.insertMany(defaultFiles);
        return created;
    } catch (err) {
        // If already inserted or race condition
        return await File.find({ projectId });
    }
};

const detectLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        json: 'json',
        html: 'html',
        css: 'css',
        md: 'markdown',
        py: 'python',
        sh: 'bash',
        yml: 'yaml',
        yaml: 'yaml',
    };
    return map[ext] || 'plaintext';
};
