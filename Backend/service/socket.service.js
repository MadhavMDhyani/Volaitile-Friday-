import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getAllowedOrigins } from '../config/env.js';
import redisService from './redis.service.js';
import { verifyProjectMember } from '../middleware/projectAccess.js';
import { saveAndBroadcastMessage } from './message.service.js';

let io = null;

// Track active connections: Map<projectId, Map<userId, connectionCount>>
const projectPresence = new Map();

// Track typing timeouts: Map<`${projectId}:${userId}`, { timeoutId, lastBroadcastTime }>
const typingTimeouts = new Map();

// Per-user sliding window message rate limiter: Map<userId, Array<timestamp>>
const userRateLimits = new Map();

const isRateLimited = (userId, limit = 30, windowMs = 60 * 1000) => {
    const now = Date.now();
    let timestamps = userRateLimits.get(userId) || [];
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= limit) {
        userRateLimits.set(userId, timestamps);
        return true;
    }

    timestamps.push(now);
    userRateLimits.set(userId, timestamps);
    return false;
};

const addUserToPresence = (projectId, userId) => {
    if (!projectPresence.has(projectId)) {
        projectPresence.set(projectId, new Map());
    }
    const userMap = projectPresence.get(projectId);
    const count = userMap.get(userId) || 0;
    userMap.set(userId, count + 1);
};

const removeUserFromPresence = (projectId, userId) => {
    const userMap = projectPresence.get(projectId);
    if (!userMap) return;
    const count = userMap.get(userId) || 0;
    if (count <= 1) {
        userMap.delete(userId);
    } else {
        userMap.set(userId, count - 1);
    }
    if (userMap.size === 0) {
        projectPresence.delete(projectId);
    }
};

const broadcastPresence = (projectId) => {
    if (!io) return;
    const userMap = projectPresence.get(projectId);
    const onlineUserIds = userMap ? Array.from(userMap.keys()) : [];
    io.to(`project:${projectId}`).emit('presence:update', {
        projectId,
        onlineUserIds,
    });
};

const clearTypingTimeout = (projectId, userId, broadcastClear = false) => {
    const key = `${projectId}:${userId}`;
    const entry = typingTimeouts.get(key);
    if (entry) {
        if (entry.timeoutId) clearTimeout(entry.timeoutId);
        typingTimeouts.delete(key);
        if (broadcastClear && io) {
            io.to(`project:${projectId}`).emit('chat:typing', {
                projectId,
                userId,
                email: '',
                isTyping: false,
            });
        }
    }
};

export const initSocket = (server) => {
    const allowedOrigins = getAllowedOrigins();

    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                    return callback(null, true);
                }
                return callback(new Error(`Origin ${origin} not allowed by CORS`));
            },
            credentials: true,
        },
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                (socket.handshake.headers?.authorization &&
                    socket.handshake.headers.authorization.split(' ')[1]);

            if (!token) {
                return next(new Error('Unauthorized'));
            }

            // Check Redis blacklist
            let isBlacklisted = null;
            try {
                isBlacklisted = await redisService.get(token);
            } catch (redisError) {
                if (process.env.NODE_ENV === 'production') {
                    return next(new Error('Auth service unavailable'));
                }
                console.warn('Redis unreachable during socket blacklist check, continuing in dev:', redisError.message);
            }

            if (isBlacklisted) {
                return next(new Error('Unauthorized'));
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = (decoded._id || decoded.id)?.toString();
                if (!userId) {
                    return next(new Error('Unauthorized'));
                }
                socket.user = {
                    id: userId,
                    email: decoded.email,
                };
                return next();
            } catch (jwtError) {
                if (jwtError.name === 'TokenExpiredError') {
                    return next(new Error('Session expired'));
                }
                return next(new Error('Unauthorized'));
            }
        } catch (error) {
            console.error('Socket authentication error:', error);
            return next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        socket.joinedProjects = new Set();

        // Join project room
        socket.on('project:join', async (data) => {
            try {
                const projectId = data?.projectId;
                if (!projectId) {
                    return socket.emit('project:error', { message: 'Invalid project ID' });
                }

                const check = await verifyProjectMember(projectId, socket.user.id);
                if (!check.ok) {
                    return socket.emit('project:error', { message: check.message || 'You do not have access to this project' });
                }

                const roomName = `project:${projectId}`;
                socket.join(roomName);
                socket.joinedProjects.add(projectId);

                addUserToPresence(projectId, socket.user.id);
                socket.emit('project:joined', { projectId });
                broadcastPresence(projectId);
            } catch (err) {
                console.error('project:join error:', err);
                socket.emit('project:error', { message: 'Failed to join project room' });
            }
        });

        // Leave project room
        socket.on('project:leave', async (data) => {
            try {
                const projectId = data?.projectId;
                if (!projectId) return;

                const roomName = `project:${projectId}`;
                socket.leave(roomName);
                socket.joinedProjects.delete(projectId);

                removeUserFromPresence(projectId, socket.user.id);
                broadcastPresence(projectId);
                clearTypingTimeout(projectId, socket.user.id, true);
            } catch (err) {
                console.error('project:leave error:', err);
            }
        });

        // Typing indicator
        socket.on('chat:typing', (data) => {
            try {
                const { projectId, isTyping } = data || {};
                if (!projectId || !socket.joinedProjects.has(projectId)) return;

                const key = `${projectId}:${socket.user.id}`;
                const now = Date.now();
                const existing = typingTimeouts.get(key);

                if (isTyping) {
                    // Throttle broadcast if sent within last 1 second
                    const shouldBroadcast = !existing || now - existing.lastBroadcastTime > 1000;
                    if (shouldBroadcast) {
                        socket.to(`project:${projectId}`).emit('chat:typing', {
                            projectId,
                            userId: socket.user.id,
                            email: socket.user.email,
                            isTyping: true,
                        });
                    }

                    if (existing?.timeoutId) {
                        clearTimeout(existing.timeoutId);
                    }

                    // Auto-clear typing indicator after 4 seconds
                    const timeoutId = setTimeout(() => {
                        typingTimeouts.delete(key);
                        if (io) {
                            io.to(`project:${projectId}`).emit('chat:typing', {
                                projectId,
                                userId: socket.user.id,
                                email: socket.user.email,
                                isTyping: false,
                            });
                        }
                    }, 4000);

                    typingTimeouts.set(key, {
                        timeoutId,
                        lastBroadcastTime: shouldBroadcast ? now : (existing?.lastBroadcastTime || now),
                    });
                } else {
                    // Explicitly stopped typing
                    clearTypingTimeout(projectId, socket.user.id);
                    socket.to(`project:${projectId}`).emit('chat:typing', {
                        projectId,
                        userId: socket.user.id,
                        email: socket.user.email,
                        isTyping: false,
                    });
                }
            } catch (err) {
                console.error('chat:typing error:', err);
            }
        });

        // Send message via WebSocket
        socket.on('chat:send', async (data, ack) => {
            const callback = typeof ack === 'function' ? ack : () => {};

            try {
                const { projectId, tempId } = data || {};
                const content = data?.content ?? data?.text;

                if (!projectId) {
                    return callback({ ok: false, error: 'Project ID is required' });
                }

                // Check rate limit per user
                if (isRateLimited(socket.user.id)) {
                    return callback({ ok: false, error: 'Too many messages sent. Please slow down.' });
                }

                // Verify text validity
                if (typeof content !== 'string') {
                    return callback({ ok: false, error: 'Message text must be a string' });
                }

                const trimmed = content.trim();
                if (trimmed.length < 1 || trimmed.length > 2000) {
                    return callback({ ok: false, error: 'Message text must be between 1 and 2000 characters' });
                }

                // Check project membership
                const check = await verifyProjectMember(projectId, socket.user.id);
                if (!check.ok) {
                    return callback({ ok: false, error: check.message || 'You do not have access to this project' });
                }

                // Use shared service to save and broadcast
                const populatedMessage = await saveAndBroadcastMessage({
                    projectId,
                    senderId: socket.user.id,
                    text: trimmed,
                });

                // Clear typing indicator for this user in this project
                clearTypingTimeout(projectId, socket.user.id, true);

                return callback({
                    ok: true,
                    message: populatedMessage,
                    tempId,
                });
            } catch (err) {
                console.error('chat:send error:', err);
                return callback({
                    ok: false,
                    error: err.message || 'Failed to send message',
                });
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            try {
                for (const projectId of socket.joinedProjects) {
                    removeUserFromPresence(projectId, socket.user.id);
                    broadcastPresence(projectId);
                    clearTypingTimeout(projectId, socket.user.id, true);
                }
                socket.joinedProjects.clear();
            } catch (err) {
                console.error('socket disconnect error:', err);
            }
        });
    });

    return io;
};

export const getIO = () => io;

export default {
    initSocket,
    getIO,
};
