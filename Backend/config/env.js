import dotenv from 'dotenv';
dotenv.config();

export const validateEnv = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const errors = [];

    if (!process.env.MONGODB_URI) {
        errors.push('MONGODB_URI environment variable is required.');
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET environment variable is missing or shorter than 32 characters.');
    }

    if (isProduction && !process.env.CLIENT_URL) {
        errors.push('CLIENT_URL environment variable is required in production.');
    }

    if (errors.length > 0) {
        console.error('Fatal configuration errors:\n' + errors.map((e) => `  - ${e}`).join('\n'));
        process.exit(1);
    }

    if (isProduction && !process.env.TRUST_PROXY) {
        console.warn('Warning: TRUST_PROXY is not set in production. Defaulting to 1. Set TRUST_PROXY explicitly to avoid IP spoofing risks.');
    }
};

/**
 * Normalize a single CLIENT_URL entry to its origin (strips trailing slashes,
 * paths, query strings, and normalizes case).
 * Returns null and emits a warning if the entry is not a valid URL.
 */
export function normalizeOrigin(entry) {
    try {
        return new URL(entry.trim()).origin;
    } catch {
        console.warn(`Invalid CLIENT_URL entry skipped: "${entry.trim()}"`);
        return null;
    }
}

export const getAllowedOrigins = () => {
    const raw = process.env.CLIENT_URL;
    if (!raw) {
        return ['http://localhost:5173'];
    }

    const origins = raw
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean);

    if (origins.length === 0) {
        console.warn('No valid CLIENT_URL origins after normalization; defaulting to localhost.');
        return ['http://localhost:5173'];
    }

    console.log('Allowed CORS origins:', origins);
    return origins;
};

if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}

export default {
    validateEnv,
    getAllowedOrigins,
    normalizeOrigin,
};
