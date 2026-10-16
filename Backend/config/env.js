import dotenv from 'dotenv';
dotenv.config();

export const validateEnv = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!process.env.MONGODB_URI) {
        console.error('Fatal Error: MONGODB_URI environment variable is required.');
        process.exit(1);
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        console.error('Fatal Error: JWT_SECRET environment variable is missing or shorter than 32 characters.');
        process.exit(1);
    }

    if (isProduction && !process.env.CLIENT_URL) {
        console.error('Fatal Error: CLIENT_URL environment variable is required in production.');
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}

export const getAllowedOrigins = () => {
    const raw = process.env.CLIENT_URL;
    if (!raw) {
        return ['http://localhost:5173'];
    }
    return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
};

export default {
    validateEnv,
    getAllowedOrigins,
};
