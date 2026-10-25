import mongoose from 'mongoose';

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
});

/**
 * Connect to MongoDB with exponential backoff.
 * Fail-fast only for missing MONGODB_URI (misconfiguration).
 * For transient network errors: retry 1s → 2s → 4s … capped at 30s.
 */
async function connectWithRetry(attempt = 1) {
    const mongoUri = process.env.MONGODB_URI;
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            maxPoolSize: 10,
        });
        console.log(`Connected to MongoDB (attempt ${attempt})`);
    } catch (err) {
        console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
        console.log(`Retrying in ${delay / 1000}s…`);
        setTimeout(() => connectWithRetry(attempt + 1), delay);
    }
}

function connect() {
    if (process.env.NODE_ENV === 'test') {
        return;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('Fatal Error: MONGODB_URI is not set in environment.');
        process.exit(1);
    }

    connectWithRetry(1);
}

export default connect;