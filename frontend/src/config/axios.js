import axios from 'axios';

const isProduction = import.meta.env.PROD;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (isProduction && !apiBaseUrl) {
  throw new Error('App is not configured');
}

// Default per-attempt timeout (ms)
const DEFAULT_TIMEOUT = 15000;

const axiosInstance = axios.create({
  baseURL: apiBaseUrl || 'http://localhost:3000',
  timeout: DEFAULT_TIMEOUT,
});

let onUnauthorizedCallback = null;

export const setUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

// Dynamically attach the token on every request instead of once at module load
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 for any request except login and register,
// clear the token and notify via registered callback
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/users/login') || requestUrl.includes('/users/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];

      if (typeof onUnauthorizedCallback === 'function') {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

/**
 * Retry delays (ms): 2s, 4s, 8s, 12s, 12s
 */
const RETRY_DELAYS = [2000, 4000, 8000, 12000, 12000];

/**
 * Returns true if the error warrants a retry under retryOnWake semantics:
 *   - No response at all (network error / timeout)
 *   - HTTP 502, 503, or 504
 * Never retry 4xx.
 */
function isRetryableWakeError(error) {
  if (!error.response) return true; // network error or timeout
  const s = error.response.status;
  return s === 502 || s === 503 || s === 504;
}

/**
 * Sleep helper that can be interrupted by an AbortSignal.
 */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const tid = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(tid);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

/**
 * Make a request with opt-in wake-aware retry logic.
 *
 * Options (beyond standard axios config):
 *   retryOnWake {boolean}    Enable the retry loop (login, GET, /health/ping only).
 *   onRetry    {Function}    Called with (attemptNumber, totalAttempts, delayMs) before each retry.
 *   signal     {AbortSignal} Cancel all pending retries.
 */
export async function requestWithRetry(config, { retryOnWake = false, onRetry, signal } = {}) {
  const delays = retryOnWake ? RETRY_DELAYS : [];
  let lastError;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const startedAt = Date.now();
    try {
      const axiosConfig = { ...config };
      if (signal) axiosConfig.signal = signal;

      // Honor Retry-After from previous attempt
      if (lastError?.response?.headers?.['retry-after']) {
        const ra = parseInt(lastError.response.headers['retry-after'], 10);
        if (!isNaN(ra) && ra > 0) {
          await sleep(ra * 1000, signal);
        }
      }

      return await axiosInstance.request(axiosConfig);
    } catch (err) {
      lastError = err;

      // Never retry 4xx
      if (err.response && err.response.status < 500) {
        throw err;
      }

      // AbortError: propagate immediately
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        throw err;
      }

      // No more retries
      if (attempt >= delays.length || !retryOnWake) {
        throw err;
      }

      // Fast failure while online: typical of CORS/DNS misconfiguration, not cold start
      const elapsed = Date.now() - startedAt;
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!err.response && elapsed < 1000 && isOnline) {
        console.warn(
          '[axios] Request failed in under 1 second with no response while online. ' +
          'This may indicate a CORS misconfiguration. Check CLIENT_URL on the backend ' +
          'and VITE_API_BASE_URL on Vercel. Will retry once then stop.'
        );
        if (attempt >= 1) throw err; // at most one fast-retry
      }

      if (!isRetryableWakeError(err)) {
        throw err;
      }

      const delay = delays[attempt];
      if (typeof onRetry === 'function') {
        onRetry(attempt + 1, delays.length, delay);
      }

      await sleep(delay, signal);
    }
  }

  throw lastError;
}

export default axiosInstance;