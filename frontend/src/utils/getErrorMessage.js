/**
 * Converts any Axios or network error into a human-readable string.
 * Handles { error }, { errors: string }, { errors: [{ msg }] }, plain strings,
 * and no-response / server unreachable scenarios.
 *
 * @param {any} error
 * @param {string} [fallbackMessage='An unexpected error occurred. Please try again.']
 * @returns {string}
 */
export const getErrorMessage = (
  error,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
) => {
  if (!error) return fallbackMessage;

  // No response received from server (server down / network loss)
  if (error.isAxiosError && !error.response) {
    return 'Unable to reach the server. Please check your connection or verify the backend is running.';
  }

  const data = error.response?.data;

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
      return 'Unable to reach the server. Please check your connection or verify the backend is running.';
    }
    return error.message;
  }

  return fallbackMessage;
};

export default getErrorMessage;
