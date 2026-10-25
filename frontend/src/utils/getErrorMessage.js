/**
 * Converts any Axios or network error into a human-readable string.
 * Handles { error }, { errors: string }, { errors: [{ msg }] }, plain strings,
 * and no-response / server unreachable scenarios.
 *
 * @param {any} error
 * @param {string} [fallbackMessage='An unexpected error occurred. Please try again.']
 * @param {object} [options]
 * @param {string}  [options.requestId]  x-request-id from the response header (for 500 refs)
 * @returns {string}
 */
export const getErrorMessage = (
  error,
  fallbackMessage = 'An unexpected error occurred. Please try again.',
  options = {}
) => {
  if (!error) return fallbackMessage;

  // Resolve requestId: prefer caller-supplied, then try to read from response header
  const requestId =
    options.requestId ||
    error.response?.headers?.['x-request-id'] ||
    null;

  // ── No response received from server ──────────────────────────────────────
  if (error.isAxiosError && !error.response) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      console.warn(
        '[getErrorMessage] No server response while online. ' +
        'Check CLIENT_URL on the backend and VITE_API_BASE_URL on Vercel.'
      );
    }
    return "Can't reach the server right now. Please try again.";
  }

  // ── HTTP status-specific handling ─────────────────────────────────────────
  const status = error.response?.status;
  const data = error.response?.data;

  // 401 — always show the generic credential message (never leak server text)
  if (status === 401) {
    return 'Invalid email or password.';
  }

  // 429 — Too Many Requests; honor Retry-After if present
  if (status === 429) {
    const retryAfter = error.response?.headers?.['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds) && seconds > 0) {
        const minutes = Math.ceil(seconds / 60);
        return `Too many attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
      }
    }
    // Fallback: read message from body
    if (typeof data?.error === 'string') return data.error;
    return 'Too many attempts. Please wait before trying again.';
  }

  // 503 — service unavailable / DB starting up
  if (status === 503) {
    return "Can't reach the server right now. Please try again.";
  }

  // 500 — internal server error; show ref if available
  if (status === 500) {
    const rid = requestId || (typeof data?.requestId === 'string' ? data.requestId : null);
    if (rid) {
      return `Something went wrong (ref: ${rid})`;
    }
    return 'Something went wrong. Please try again.';
  }

  // ── Generic data extraction (4xx other than 401/429) ─────────────────────
  if (data) {
    // 1. { error: '...' }
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
    if (typeof data.error === 'object' && data.error !== null) {
      if (typeof data.error.message === 'string') return data.error.message;
    }

    // 2. { errors: '...' }
    if (typeof data.errors === 'string' && data.errors.trim()) {
      return data.errors;
    }

    // 3. { errors: [{ msg: '...' }] } or string array
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return item.msg || item.message || JSON.stringify(item);
          }
          return String(item);
        })
        .filter(Boolean)
        .join(', ');
    }

    // 4. { message: '...' }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }

    // 5. Plain string response body
    if (typeof data === 'string' && data.trim()) {
      return data;
    }
  }

  // Generic axios message fallback
  if (typeof error.message === 'string' && error.message.trim()) {
    if (error.message === 'Network Error') {
      return "Can't reach the server right now. Please try again.";
    }
    return error.message;
  }

  return fallbackMessage;
};

export default getErrorMessage;
