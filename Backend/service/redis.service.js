import Redis from 'ioredis';
import EventEmitter from 'events';

class HybridCacheService extends EventEmitter {
    constructor() {
        super();
        // Prevent unhandled error event crashes in Node.js
        this.on('error', () => {});

        this.memoryStore = new Map();
        this.isRedisConnected = false;
        this.hasLoggedOutage = false;

        const redisHost = process.env.REDIS_HOST || '127.0.0.1';
        const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
        const redisPassword = process.env.REDIS_PASSWORD || undefined;

        this.client = new Redis({
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            lazyConnect: true,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            connectTimeout: 2000,
            retryStrategy: (times) => {
                if (times > 2) {
                    // Periodically test Redis connectivity in the background every 30s
                    return 30000;
                }
                return Math.min(times * 1000, 3000);
            },
        });

        this.client.on('connect', () => {
            this.isRedisConnected = true;
            this.hasLoggedOutage = false;
            console.log('Connected to Redis server');
            this.emit('connect');
        });

        this.client.on('ready', () => {
            this.isRedisConnected = true;
            this.emit('ready');
        });

        this.client.on('error', (err) => {
            this.isRedisConnected = false;
            if (!this.hasLoggedOutage) {
                console.warn('[Cache] Redis unavailable (operating seamlessly with in-memory TTL cache):', err.message);
                this.hasLoggedOutage = true;
            }
        });

        this.client.on('close', () => {
            this.isRedisConnected = false;
            this.emit('close');
        });

        // Attempt initial connection in background safely
        this.client.connect().catch((err) => {
            this.isRedisConnected = false;
            if (!this.hasLoggedOutage) {
                console.warn('[Cache] Redis offline at startup. Utilizing resilient in-memory TTL cache.');
                this.hasLoggedOutage = true;
            }
        });
    }

    async get(key) {
        if (this.isRedisConnected) {
            try {
                return await this.client.get(key);
            } catch (err) {
                this.isRedisConnected = false;
            }
        }

        const item = this.memoryStore.get(key);
        if (!item) return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.memoryStore.delete(key);
            return null;
        }
        return item.value;
    }

    async set(key, value, ...args) {
        let ttlSeconds = null;
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === 'string' && args[i].toUpperCase() === 'EX' && args[i + 1]) {
                ttlSeconds = parseInt(args[i + 1], 10);
                break;
            }
        }

        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        this.memoryStore.set(key, { value, expiresAt });

        if (this.isRedisConnected) {
            try {
                return await this.client.set(key, value, ...args);
            } catch (err) {
                this.isRedisConnected = false;
            }
        }

        return 'OK';
    }

    async del(key) {
        this.memoryStore.delete(key);
        if (this.isRedisConnected) {
            try {
                return await this.client.del(key);
            } catch (err) {
                this.isRedisConnected = false;
            }
        }
        return 1;
    }

    get status() {
        return this.isRedisConnected ? 'connected' : 'in-memory-fallback';
    }
}

const redisService = new HybridCacheService();
export default redisService;
