import Message from '../models/message.model.js';
import { getIO } from './socket.service.js';

export const MAX_MESSAGE_LENGTH = 4000;
export const KNOWN_AI_COMMANDS = ['/help', '/docker', '/auth', '/db', '/test', '/git'];
export const AI_COMMAND_REGEX = /^(?:\/help|\/docker|\/auth|\/db|\/test|\/git)(?:\s|$)/i;

export const isAiTrigger = (text) => {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return /@friday/i.test(trimmed) || AI_COMMAND_REGEX.test(trimmed);
};

/**
 * Creates, populates, and broadcasts a project chat message.
 * Shared by both the REST controller (POST /projects/:projectId/messages, POST /ai/chat)
 * and the WebSocket handler ("chat:send", "ai:chat").
 */
export const saveAndBroadcastMessage = async ({
    projectId,
    senderId = null,
    text,
    isAi = false,
    model = null,
    source = null,
    requestedModel = null,
    latencyMs = null,
}) => {
    if (typeof text !== 'string') {
        const err = new Error('Message text must be a string');
        err.status = 400;
        throw err;
    }

    let trimmedText = text.trim();

    if (isAi && trimmedText.length > MAX_MESSAGE_LENGTH) {
        trimmedText = trimmedText.slice(0, MAX_MESSAGE_LENGTH - 1) + '…';
    }

    if (trimmedText.length < 1 || trimmedText.length > MAX_MESSAGE_LENGTH) {
        const err = new Error(`Message text must be between 1 and ${MAX_MESSAGE_LENGTH} characters`);
        err.status = 400;
        throw err;
    }

    const message = await Message.create({
        projectId,
        sender: isAi ? null : senderId,
        isAi,
        text: trimmedText,
        model,
        source,
        requestedModel,
        latencyMs,
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
