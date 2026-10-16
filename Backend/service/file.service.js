import mongoose from 'mongoose';
import File from '../models/file.model.js';

const MAX_CONTENT_BYTES = 200 * 1024; // 200 KB

const validateName = (name) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        const err = new Error('File name is required');
        err.status = 400;
        throw err;
    }
    if (name.length > 100) {
        const err = new Error('File name cannot exceed 100 characters');
        err.status = 400;
        throw err;
    }
};

const validatePath = (path) => {
    if (typeof path !== 'string' || path.trim().length === 0) {
        const err = new Error('Path is required');
        err.status = 400;
        throw err;
    }
    if (path.length > 200) {
        const err = new Error('Path cannot exceed 200 characters');
        err.status = 400;
        throw err;
    }
    if (path.includes('..')) {
        const err = new Error("Path cannot contain '..'");
        err.status = 400;
        throw err;
    }
    if (path.startsWith('/')) {
        const err = new Error('Path cannot have a leading slash');
        err.status = 400;
        throw err;
    }
    if (path.includes('\\')) {
        const err = new Error('Path cannot contain backslashes');
        err.status = 400;
        throw err;
    }
};

const validateContent = (content) => {
    if (content !== undefined && content !== null) {
        if (typeof content !== 'string') {
            const err = new Error('Content must be a string');
            err.status = 400;
            throw err;
        }
        const bytes = Buffer.byteLength(content, 'utf8');
        if (bytes > MAX_CONTENT_BYTES) {
            const err = new Error('File content exceeds maximum limit of 200 KB');
            err.status = 413;
            throw err;
        }
    }
};

const computeRenamedPath = (oldPath, newName) => {
    const lastSlash = oldPath.lastIndexOf('/');
    if (lastSlash === -1) {
        return newName;
    }
    const folder = oldPath.substring(0, lastSlash);
    return `${folder}/${newName}`;
};

export const getFilesByProjectId = async (projectId) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        const err = new Error('Invalid project ID');
        err.status = 400;
        throw err;
    }

    // An empty project stays empty - no auto-seeding
    const files = await File.find({ projectId }).sort({ path: 1, name: 1 });
    return files;
};

export const createFile = async ({ projectId, name, path, content, language, userId }) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        const err = new Error('Invalid project ID');
        err.status = 400;
        throw err;
    }

    validateName(name);
    const cleanName = name.trim();
    const cleanPath = (path || cleanName).trim();
    validatePath(cleanPath);
    validateContent(content);

    // Max 100 files per project
    const fileCount = await File.countDocuments({ projectId });
    if (fileCount >= 100) {
        const err = new Error('Project file limit reached (maximum 100 files)');
        err.status = 400;
        throw err;
    }

    const existing = await File.findOne({ projectId, path: cleanPath });
    if (existing) {
        const err = new Error(`File at path "${cleanPath}" already exists`);
        err.status = 409;
        throw err;
    }

    try {
        const file = await File.create({
            projectId,
            name: cleanName,
            path: cleanPath,
            content: content || '',
            language: language || detectLanguage(cleanName),
            updatedBy: userId,
        });

        return file;
    } catch (err) {
        if (err.code === 11000) {
            const conflictErr = new Error(`File at path "${cleanPath}" already exists`);
            conflictErr.status = 409;
            throw conflictErr;
        }
        throw err;
    }
};

export const getFileById = async ({ fileId, projectId }) => {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        const err = new Error('Invalid file ID');
        err.status = 400;
        throw err;
    }

    const query = { _id: fileId };
    if (projectId) query.projectId = projectId;

    const file = await File.findOne(query);
    if (!file) {
        const err = new Error('File not found');
        err.status = 404;
        throw err;
    }
    return file;
};

export const updateFile = async ({ fileId, projectId, content, name, userId }) => {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        const err = new Error('Invalid file ID');
        err.status = 400;
        throw err;
    }

    const query = { _id: fileId };
    if (projectId) query.projectId = projectId;

    const file = await File.findOne(query);
    if (!file) {
        const err = new Error('File not found');
        err.status = 404;
        throw err;
    }

    if (content !== undefined) {
        validateContent(content);
        file.content = content;
    }

    if (name !== undefined) {
        validateName(name);
        const cleanName = name.trim();
        const newPath = computeRenamedPath(file.path, cleanName);
        validatePath(newPath);

        if (newPath !== file.path) {
            const conflict = await File.findOne({
                projectId: file.projectId,
                path: newPath,
                _id: { $ne: file._id },
            });
            if (conflict) {
                const err = new Error(`File at path "${newPath}" already exists`);
                err.status = 409;
                throw err;
            }
            file.path = newPath;
            file.name = cleanName;
            file.language = detectLanguage(cleanName);
        }
    }

    if (userId) {
        file.updatedBy = userId;
    }

    try {
        await file.save();
        return file;
    } catch (err) {
        if (err.code === 11000) {
            const conflictErr = new Error(`File at path "${file.path}" already exists`);
            conflictErr.status = 409;
            throw conflictErr;
        }
        throw err;
    }
};

export const deleteFile = async ({ fileId, projectId }) => {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        const err = new Error('Invalid file ID');
        err.status = 400;
        throw err;
    }

    const deleted = await File.findOneAndDelete({
        _id: fileId,
        ...(projectId ? { projectId } : {}),
    });

    if (!deleted) {
        const err = new Error('File not found');
        err.status = 404;
        throw err;
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
