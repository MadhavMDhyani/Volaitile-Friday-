import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        isAi: {
            type: Boolean,
            default: false,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000,
        },
    },
    { timestamps: true }
);

messageSchema.index({ projectId: 1, _id: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
