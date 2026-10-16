import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        path: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            default: '',
        },
        language: {
            type: String,
            default: 'javascript',
            lowercase: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

fileSchema.index({ projectId: 1, path: 1 }, { unique: true });

const File = mongoose.models.File || mongoose.model('File', fileSchema);

export default File;
