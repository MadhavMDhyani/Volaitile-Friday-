import { randomUUID } from 'crypto';

// Only accept an incoming x-request-id that is a safe short string
// (alphanumeric + hyphens, 1-36 chars) — prevents log injection.
const SAFE_ID_RE = /^[a-zA-Z0-9-]{1,36}$/;

/**
 * Request-ID middleware.
 * Attaches req.requestId (either echoed from incoming x-request-id header
 * if it passes the safety check, or a freshly generated UUID).
 * Sets the x-request-id response header on every response.
 */
export function requestId(req, res, next) {
    const incoming = req.headers['x-request-id'];
    req.requestId = (incoming && SAFE_ID_RE.test(incoming))
        ? incoming
        : randomUUID();

    res.set('x-request-id', req.requestId);
    next();
}
