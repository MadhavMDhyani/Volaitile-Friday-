import { spawn } from 'child_process';
import jwt from 'jsonwebtoken';
import { io as Client } from 'socket.io-client';

const JWT_SECRET = process.env.JWT_SECRET || 'volatile_friday_jwt_secure_secret_key_production_grade_32_chars_ok';
const token = jwt.sign(
    { _id: '65f1a2b3c4d5e6f7a8b9c0d1', email: 'test@example.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
);

const child = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: '0', NODE_ENV: 'test' },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
});

let port = null;

child.stdout.on('data', (d) => {
    const text = d.toString();
    console.log('[child stdout]', text.trim());
    const match = text.match(/Server is running on port (\d+)/);
    if (match) {
        port = match[1];
        onServerReady(port);
    }
});

child.stderr.on('data', (d) => {
    console.error('[child stderr]', d.toString().trim());
});

function onServerReady(serverPort) {
    console.log('Connecting socket client to port', serverPort);
    const socket = Client(`http://127.0.0.1:${serverPort}`, {
        transports: ['websocket'],
        auth: { token },
    });

    socket.on('connect', () => {
        console.log('Socket client connected! Sending SIGTERM to child...');
        const startTime = Date.now();

        child.on('exit', (code, signal) => {
            const duration = Date.now() - startTime;
            console.log(`Child exited with code ${code}, signal ${signal} in ${duration}ms`);
            if (code === 0 && duration < 3000) {
                console.log('TEST PASSED!');
                process.exit(0);
            } else {
                console.error('TEST FAILED!');
                process.exit(1);
            }
        });

        // Send SIGTERM via IPC (cross-platform) or signal
        if (child.send) {
            child.send('SIGTERM');
        } else {
            child.kill('SIGTERM');
        }
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connect error:', err.message);
    });
}
