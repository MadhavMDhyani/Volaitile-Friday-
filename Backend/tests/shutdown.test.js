import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { io as Client } from 'socket.io-client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, '../server.js');
const JWT_SECRET = process.env.JWT_SECRET || 'volatile_friday_jwt_secure_secret_key_production_grade_32_chars_ok';

describe('Graceful Shutdown Test', () => {
    it('connects a socket.io-client, sends SIGTERM and exits with code 0 in under 3 seconds', async () => {
        const token = jwt.sign(
            { _id: '65f1a2b3c4d5e6f7a8b9c0d1', email: 'shutdown-tester@example.com' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const child = spawn(process.execPath, [serverPath], {
            env: { ...process.env, PORT: '0', NODE_ENV: 'test' },
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        });

        const exitPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                try {
                    child.kill('SIGKILL');
                } catch {}
                reject(new Error('Graceful shutdown test timed out after 10000ms'));
            }, 10000);

            child.stdout.on('data', (d) => {
                const text = d.toString();
                const match = text.match(/Server is running on port (\d+)/);
                if (match) {
                    const port = match[1];
                    const socket = Client(`http://127.0.0.1:${port}`, {
                        transports: ['websocket'],
                        auth: { token },
                    });

                    socket.on('connect', () => {
                        const startTime = Date.now();

                        child.on('exit', (code, signal) => {
                            clearTimeout(timeout);
                            const duration = Date.now() - startTime;
                            resolve({ code, signal, duration });
                        });

                        if (child.send) {
                            child.send('SIGTERM');
                        } else {
                            child.kill('SIGTERM');
                        }
                    });

                    socket.on('connect_error', (err) => {
                        clearTimeout(timeout);
                        try {
                            child.kill('SIGKILL');
                        } catch {}
                        reject(err);
                    });
                }
            });

            child.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });

        const result = await exitPromise;
        expect(result.code).toBe(0);
        expect(result.duration).toBeLessThan(3000);
    }, 15000);
});
