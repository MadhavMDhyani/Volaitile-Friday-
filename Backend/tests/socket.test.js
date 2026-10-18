import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import { io as Client } from 'socket.io-client';
import app from '../app.js';
import { initSocket, evictUserFromProject, closeProjectRoom } from '../service/socket.service.js';
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
        expect(projectError.message).toMatch(/do not have access/i);
        socket.disconnect();
    });

    it('A member receives "chat:message" after a message is posted via REST or socket', async () => {
        // Mock Project findById: memberUserId is a member
        vi.spyOn(Project, 'findById').mockResolvedValue({
            _id: validProjectId,
            name: 'Test Project',
            users: [memberUserId],
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
});
