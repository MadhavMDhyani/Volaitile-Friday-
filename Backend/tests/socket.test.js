import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import { io as Client } from 'socket.io-client';
import app from '../app.js';
import { initSocket, evictUserFromProject, closeProjectRoom } from '../service/socket.service.js';
import { saveAndBroadcastMessage, isAiTrigger, MAX_MESSAGE_LENGTH } from '../service/message.service.js';
import { resetAiRateLimits } from '../service/aiRateLimiter.js';
import * as aiService from '../service/ai.service.js';
import redisService from '../service/redis.service.js';
import Project from '../models/project.model.js';
import Message from '../models/message.model.js';
import request from 'supertest';

const JWT_SECRET = process.env.JWT_SECRET || 'volatile_friday_jwt_secure_secret_key_production_grade_32_chars_ok';

describe('Socket.IO Real-Time Chat & Security Unit Tests (DB-independent)', () => {
    let server;
    let ioServer;
    let serverAddress;
    let port;

    const memberUserId = '65f1a2b3c4d5e6f7a8b9c0d1';
    const nonMemberUserId = '65f1a2b3c4d5e6f7a8b9c0d2';
    const validProjectId = '65f1a2b3c4d5e6f7a8b9c0aa';

    const memberToken = jwt.sign(
        { _id: memberUserId, email: 'member@test.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    const nonMemberToken = jwt.sign(
        { _id: nonMemberUserId, email: 'nonmember@test.com' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    beforeAll(async () => {
        server = http.createServer(app);
        ioServer = initSocket(server);

        await new Promise((resolve) => {
            server.listen(0, '127.0.0.1', () => {
                const addr = server.address();
                port = addr.port;
                serverAddress = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    });

    afterAll(async () => {
        if (ioServer) {
            await new Promise((resolve) => ioServer.close(resolve));
        }
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        resetAiRateLimits();
        // Default: Redis blacklist check returns null (not blacklisted)
        vi.spyOn(redisService, 'get').mockResolvedValue(null);
    });

    it('Socket auth rejects missing token', async () => {
        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: {},
        });

        const error = await new Promise((resolve) => {
            socket.on('connect_error', (err) => {
                resolve(err);
            });
        });

        expect(error).toBeDefined();
        expect(error.message).toMatch(/Unauthorized/);
        socket.disconnect();
    });

    it('Socket auth rejects invalid tokens', async () => {
        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: 'invalid.jwt.token' },
        });

        const error = await new Promise((resolve) => {
            socket.on('connect_error', (err) => {
                resolve(err);
            });
        });

        expect(error).toBeDefined();
        expect(error.message).toMatch(/Unauthorized/);
        socket.disconnect();
    });

    it('Socket auth rejects blacklisted tokens', async () => {
        vi.spyOn(redisService, 'get').mockResolvedValue('true');

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        const error = await new Promise((resolve) => {
            socket.on('connect_error', (err) => {
                resolve(err);
            });
        });

        expect(error).toBeDefined();
        expect(error.message).toMatch(/Unauthorized/);
        socket.disconnect();
    });

    it('A non-member cannot join a project room', async () => {
        // Mock Project findById: only memberUserId is in users list
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            users: [memberUserId],
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: nonMemberToken },
        });

        await new Promise((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', reject);
        });

        const projectError = await new Promise((resolve) => {
            socket.on('project:error', (data) => {
                resolve(data);
            });
            socket.emit('project:join', { projectId: validProjectId });
        });

        expect(projectError).toBeDefined();
        expect(projectError.message).toBe('Project not found');
        socket.disconnect();
    });

    it('A member receives "chat:message" after a message is posted via REST or socket', async () => {
        // Mock Project findById used by requireProjectMember (via verifyProjectMember).
        // Must include a populate() stub because requireProjectMember calls
        // result.project.populate([...]) after a successful membership check.
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            owner: null,
            users: [memberUserId],
            populate: vi.fn().mockResolvedValue({
                _id: validProjectId,
                name: 'Test Project',
                owner: null,
                users: [{ _id: memberUserId, email: 'member@test.com' }],
            }),
        });

        const mockMessage = {
            _id: '65f1a2b3c4d5e6f7a8b9c0f9',
            projectId: validProjectId,
            sender: { _id: memberUserId, email: 'member@test.com' },
            text: 'Hello real-time chat!',
            isAi: false,
            createdAt: new Date().toISOString(),
        };

        vi.spyOn(Message, 'create').mockResolvedValue(mockMessage);
        vi.spyOn(Message, 'findById').mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockMessage),
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', reject);
        });

        // Join project room
        const joinAck = await new Promise((resolve) => {
            socket.on('project:joined', resolve);
            socket.emit('project:join', { projectId: validProjectId });
        });
        expect(joinAck).toHaveProperty('projectId', validProjectId);

        // Send a message via REST endpoint and expect socket to receive "chat:message"
        const messagePromise = new Promise((resolve) => {
            socket.on('chat:message', (incoming) => {
                resolve(incoming);
            });
        });

        const restRes = await request(app)
            .post(`/projects/${validProjectId}/messages`)
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ text: 'Hello real-time chat!' });

        expect(restRes.status).toBe(201);
        expect(restRes.body).toHaveProperty('message');

        const receivedMessage = await messagePromise;
        expect(receivedMessage).toBeDefined();
        expect(receivedMessage.text).toBe('Hello real-time chat!');
        expect(receivedMessage.sender.email).toBe('member@test.com');

        socket.disconnect();
    });

    it('Member can send message via socket "chat:send" with ack callback', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            users: [memberUserId],
        });

        const mockMessage = {
            _id: '65f1a2b3c4d5e6f7a8b9c0fa',
            projectId: validProjectId,
            sender: { _id: memberUserId, email: 'member@test.com' },
            text: 'Message sent via socket event!',
            isAi: false,
            createdAt: new Date().toISOString(),
        };

        vi.spyOn(Message, 'create').mockResolvedValue(mockMessage);
        vi.spyOn(Message, 'findById').mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockMessage),
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', reject);
        });

        socket.emit('project:join', { projectId: validProjectId });

        const ack = await new Promise((resolve) => {
            socket.emit(
                'chat:send',
                { projectId: validProjectId, content: 'Message sent via socket event!', tempId: 'temp-123' },
                (res) => resolve(res)
            );
        });

        expect(ack).toBeDefined();
        expect(ack.ok).toBe(true);
        expect(ack.tempId).toBe('temp-123');
        expect(ack.message.text).toBe('Message sent via socket event!');

        socket.disconnect();
    });

    it('project:join is idempotent and project:leave does nothing when not joined', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            users: [memberUserId],
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));

        // First join
        const join1 = await new Promise((resolve) => {
            socket.emit('project:join', { projectId: validProjectId });
            socket.on('project:joined', resolve);
        });
        expect(join1).toEqual({ projectId: validProjectId });

        // Second join should be idempotent and not cause error
        const join2 = await new Promise((resolve) => {
            socket.emit('project:join', { projectId: validProjectId });
            socket.on('project:joined', resolve);
        });
        expect(join2).toEqual({ projectId: validProjectId });

        // Leave an unjoined project should do nothing and not error
        socket.emit('project:leave', { projectId: '65f1a2b3c4d5e6f7a8b9c099' });

        socket.disconnect();
    });

    it('evictUserFromProject and closeProjectRoom are safe when called and when io is null', async () => {
        // Safe when io exists
        await expect(evictUserFromProject(validProjectId, memberUserId)).resolves.not.toThrow();
        await expect(closeProjectRoom(validProjectId)).resolves.not.toThrow();
        await expect(evictUserFromProject(null, null)).resolves.not.toThrow();
        await expect(closeProjectRoom(null)).resolves.not.toThrow();
    });

    it('evictUserFromProject emits project:removed to the evicted user socket', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            users: [memberUserId],
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));
        socket.emit('project:join', { projectId: validProjectId });
        await new Promise((resolve) => socket.on('project:joined', resolve));

        const removedPromise = new Promise((resolve) => {
            socket.on('project:removed', resolve);
        });

        await evictUserFromProject(validProjectId, memberUserId);

        const removedPayload = await removedPromise;
        expect(removedPayload).toEqual({ projectId: validProjectId });

        socket.disconnect();
    });

    it('closeProjectRoom emits project:deleted to room sockets', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            users: [memberUserId],
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));
        socket.emit('project:join', { projectId: validProjectId });
        await new Promise((resolve) => socket.on('project:joined', resolve));

        const deletedPromise = new Promise((resolve) => {
            socket.on('project:deleted', resolve);
        });

        await closeProjectRoom(validProjectId);

        const deletedPayload = await deletedPromise;
        expect(deletedPayload).toEqual({ projectId: validProjectId });

        socket.disconnect();
    });

    it('socket disconnects automatically when JWT exp expires', async () => {
        const shortLivedToken = jwt.sign(
            { _id: memberUserId, email: 'expiring@test.com' },
            JWT_SECRET,
            { expiresIn: '1s' }
        );

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: shortLivedToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));

        const disconnectReason = await new Promise((resolve) => {
            socket.on('disconnect', (reason) => resolve(reason));
        });

        expect(disconnectReason).toBeDefined();
    });

    it('isAiTrigger correctly identifies @friday and slash commands, rejecting non-command paths', () => {
        expect(isAiTrigger('@friday help me')).toBe(true);
        expect(isAiTrigger('Can @Friday check this?')).toBe(true);
        expect(isAiTrigger('/help')).toBe(true);
        expect(isAiTrigger('/docker build -t app .')).toBe(true);
        expect(isAiTrigger('/auth')).toBe(true);
        expect(isAiTrigger('/db migrate')).toBe(true);
        expect(isAiTrigger('/test run')).toBe(true);
        expect(isAiTrigger('/git status')).toBe(true);

        expect(isAiTrigger('/etc/hosts')).toBe(false);
        expect(isAiTrigger('/usr/bin/env')).toBe(false);
        expect(isAiTrigger('check /db/schema.sql')).toBe(false);
        expect(isAiTrigger('hello world')).toBe(false);
        expect(isAiTrigger('')).toBe(false);
        expect(isAiTrigger(null)).toBe(false);
    });

    it('saveAndBroadcastMessage truncates AI messages exceeding 4000 characters with ellipsis without throwing', async () => {
        const longText = 'A'.repeat(5000);
        let createdDoc = null;
        vi.spyOn(Message, 'create').mockImplementation(async (payload) => {
            createdDoc = { _id: '65f1a2b3c4d5e6f7a8b9c0fc', ...payload };
            return createdDoc;
        });
        vi.spyOn(Message, 'findById').mockReturnValue({
            populate: vi.fn().mockImplementation(async () => createdDoc),
        });

        const result = await saveAndBroadcastMessage({
            projectId: validProjectId,
            text: longText,
            isAi: true,
            model: 'gemini-2.5-flash-lite',
        });

        expect(result).toBeDefined();
        expect(result.text.length).toBe(MAX_MESSAGE_LENGTH);
        expect(result.text.endsWith('…')).toBe(true);
        expect(result.isAi).toBe(true);
    });

    it('chat:send rejects message content exceeding MAX_MESSAGE_LENGTH', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            users: [memberUserId],
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));
        socket.emit('project:join', { projectId: validProjectId });

        const tooLongText = 'x'.repeat(MAX_MESSAGE_LENGTH + 1);

        const ack = await new Promise((resolve) => {
            socket.emit(
                'chat:send',
                { projectId: validProjectId, content: tooLongText, tempId: 'temp-overflow' },
                (res) => resolve(res)
            );
        });

        expect(ack).toBeDefined();
        expect(ack.ok).toBe(false);
        expect(ack.error).toMatch(/between 1 and 4000 characters/i);

        socket.disconnect();
    });

    it('project:join returns "Project not found" for a non-existent project', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue(null);

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));

        const projectError = await new Promise((resolve) => {
            socket.on('project:error', resolve);
            socket.emit('project:join', { projectId: validProjectId });
        });

        expect(projectError.message).toBe('Project not found');
        socket.disconnect();
    });

    it('chat:send returns generic "Project not found" for non-members and missing projects', async () => {
        // 1. Non-existent project
        vi.spyOn(Project, 'findById').mockResolvedValue(null);

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));

        const ack1 = await new Promise((resolve) => {
            socket.emit('chat:send', { projectId: validProjectId, content: 'test message' }, resolve);
        });
        expect(ack1.ok).toBe(false);
        expect(ack1.error).toBe('Project not found');

        // 2. Project exists but user is not a member
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            users: [memberUserId], // nonMemberUserId not in users list
        });

        const nonMemberSocket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: nonMemberToken },
        });

        await new Promise((resolve) => nonMemberSocket.on('connect', resolve));

        const ack2 = await new Promise((resolve) => {
            nonMemberSocket.emit('chat:send', { projectId: validProjectId, content: 'test message' }, resolve);
        });
        expect(ack2.ok).toBe(false);
        expect(ack2.error).toBe('Project not found');

        socket.disconnect();
        nonMemberSocket.disconnect();
    });

    it('ai:chat returns generic "Project not found" for non-members and missing projects', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue(null);

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));

        const ack1 = await new Promise((resolve) => {
            socket.emit('ai:chat', { projectId: validProjectId, message: 'hello ai' }, resolve);
        });
        expect(ack1.ok).toBe(false);
        expect(ack1.error).toBe('Project not found');

        // Project exists, but caller is not member
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            users: [memberUserId],
        });

        const nonMemberSocket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: nonMemberToken },
        });

        await new Promise((resolve) => nonMemberSocket.on('connect', resolve));

        const ack2 = await new Promise((resolve) => {
            nonMemberSocket.emit('ai:chat', { projectId: validProjectId, message: 'hello ai' }, resolve);
        });
        expect(ack2.ok).toBe(false);
        expect(ack2.error).toBe('Project not found');

        socket.disconnect();
        nonMemberSocket.disconnect();
    });

    it('ai:chat rejects messages exceeding 4000 characters', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            users: [memberUserId],
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));

        const tooLong = 'A'.repeat(4001);
        const ack = await new Promise((resolve) => {
            socket.emit('ai:chat', { projectId: validProjectId, message: tooLong }, resolve);
        });

        expect(ack.ok).toBe(false);
        expect(ack.error).toMatch(/between 1 and 4000 characters/i);

        socket.disconnect();
    });

    it('ai:chat rate limiter enforces 10 requests per minute', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            users: [memberUserId],
        });
        vi.spyOn(aiService, 'generateAiChat').mockResolvedValue({
            reply: 'AI reply',
            model: 'gemini-3.5-flash-lite',
            source: 'online',
            requestedModel: 'gemini-3.5-flash-lite',
            latencyMs: 10,
        });
        vi.spyOn(Message, 'create').mockImplementation(async (payload) => ({
            _id: '65f1a2b3c4d5e6f7a8b9c0aa',
            ...payload,
        }));
        vi.spyOn(Message, 'findById').mockReturnValue({
            populate: vi.fn().mockResolvedValue({ _id: '65f1a2b3c4d5e6f7a8b9c0aa', text: 'AI reply' }),
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));

        // Consume 10 requests
        for (let i = 0; i < 10; i++) {
            const res = await new Promise((resolve) => {
                socket.emit('ai:chat', { projectId: validProjectId, message: `hi ${i}` }, resolve);
            });
            expect(res.ok).toBe(true);
        }

        // 11th request should be rate limited
        const rateLimitedRes = await new Promise((resolve) => {
            socket.emit('ai:chat', { projectId: validProjectId, message: '11th request' }, resolve);
        });

        expect(rateLimitedRes.ok).toBe(false);
        expect(rateLimitedRes.error).toBe('AI rate limit exceeded');

        socket.disconnect();
    });

    it('chat:send saves and broadcasts message but skips AI reply when rate limit is exceeded', async () => {
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            users: [memberUserId],
        });

        const generateAiChatSpy = vi.spyOn(aiService, 'generateAiChat').mockResolvedValue({
            reply: 'AI reply',
            model: 'gemini-3.5-flash-lite',
            source: 'online',
            requestedModel: 'gemini-3.5-flash-lite',
            latencyMs: 10,
        });

        const mockUserMessage = {
            _id: '65f1a2b3c4d5e6f7a8b9c0d9',
            projectId: validProjectId,
            sender: { _id: memberUserId, email: 'member@test.com' },
            text: '@friday explain this',
            createdAt: new Date(),
        };

        vi.spyOn(Message, 'create').mockImplementation(async (payload) => ({
            _id: '65f1a2b3c4d5e6f7a8b9c0d9',
            ...payload,
        }));
        vi.spyOn(Message, 'findById').mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockUserMessage),
        });

        const socket = Client(serverAddress, {
            autoConnect: true,
            transports: ['websocket'],
            auth: { token: memberToken },
        });

        await new Promise((resolve) => socket.on('connect', resolve));

        // Simulate user having consumed all 10 AI quota slots
        for (let i = 0; i < 10; i++) {
            const { checkAndConsumeAiLimit } = await import('../service/aiRateLimiter.js');
            checkAndConsumeAiLimit(memberUserId);
        }

        // Now send @friday message via chat:send
        const ack = await new Promise((resolve) => {
            socket.emit(
                'chat:send',
                { projectId: validProjectId, content: '@friday explain this', tempId: 'temp-ai' },
                resolve
            );
        });

        // The user message must still succeed!
        expect(ack.ok).toBe(true);
        expect(ack.message.text).toBe('@friday explain this');

        // But generateAiChat must NOT have been called because AI quota was exceeded
        expect(generateAiChatSpy).not.toHaveBeenCalled();

        socket.disconnect();
    });
});

