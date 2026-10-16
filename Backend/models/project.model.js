import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            lowercase: true,
            required: true,
            trim: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    { timestamps: true }
);

projectSchema.index({ users: 1 });
projectSchema.index({ owner: 1, name: 1 }, { unique: true });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;