import Message from '../models/message.model.js';
import { getIO } from './socket.service.js';

/**
 * Creates, populates, and broadcasts a project chat message.
 * Shared by both the REST controller (POST /projects/:projectId/messages)
 * and the WebSocket handler ("chat:send").
 */
export const saveAndBroadcastMessage = async ({ projectId, senderId, text }) => {
    if (typeof text !== 'string') {
        const err = new Error('Message text must be a string');
        err.status = 400;
        throw err;
    }

    const trimmedText = text.trim();
    if (trimmedText.length < 1 || trimmedText.length > 2000) {
        const err = new Error('Message text must be between 1 and 2000 characters');
        err.status = 400;
        throw err;
    }

    const message = await Message.create({
        projectId,
        sender: senderId,
        isAi: false,
        text: trimmedText,
    });

    const populated = await Message.findById(message._id).populate('sender', 'email _id');

    // Broadcast to room project:<projectId>
    try {
        const io = getIO();
        if (io) {
            io.to(`project:${projectId}`).emit('chat:message', populated);
        }
    } catch (broadcastErr) {
        console.warn('Socket broadcast warning:', broadcastErr?.message);
    }

    return populated;
};

export default {
    saveAndBroadcastMessage,
};
