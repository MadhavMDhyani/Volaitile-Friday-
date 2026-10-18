import { useEffect, useState, useCallback } from 'react';
import axiosInstance, { setAuthToken, setUnauthorizedCallback } from '../config/axios';
import socket from '../lib/socket';
import { UserContext } from './UserContext';

export { UserContext };

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const [serverError, setServerError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post('/users/logout');
    } catch {
      // Ignore network or server failures during logout
    } finally {
      socket.disconnect();
      setToken(null);
      setUser(null);
      setLoading(false);
      setAuthToken(null);
      localStorage.removeItem('token');
      setServerError('');
    }
  }, []);

  // Register unauthorized response interceptor callback
  useEffect(() => {
    setUnauthorizedCallback(() => {
      socket.disconnect();
      setToken(null);
      setUser(null);
      setLoading(false);
      setAuthToken(null);
      localStorage.removeItem('token');
      setServerError('');
    });
  }, []);

  // Treat socket connect_error 'Unauthorized' / 'Session expired' as a logout
  useEffect(() => {
    const handleConnectError = (err) => {
      const message = err?.message || '';
      if (message.includes('Unauthorized') || message.includes('Session expired')) {
        logout();
      }
    };

    socket.on('connect_error', handleConnectError);
    return () => {
      socket.off('connect_error', handleConnectError);
    };
  }, [logout]);

  const retryProfileFetch = useCallback(() => {
    setLoading(true);
    setServerError('');
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!token) {
      setAuthToken(null);
      return;
    }

    let active = true;

    const fetchUser = async () => {
      setAuthToken(token);

      try {
        const res = await axiosInstance.get('/users/profile');
        if (!active) return;
        const resolvedUser = res.data?.user || res.data;
        setUser(resolvedUser);
        setServerError('');
      } catch (err) {
        if (!active) return;
        // Only invalidate token if unauthorized (401 / 403)
        if (err.response?.status === 401 || err.response?.status === 403) {
          setToken(null);
          setUser(null);
          setAuthToken(null);
          localStorage.removeItem('token');
          setServerError('');
        } else {
          // Network error or 5xx: keep the token, mark server unreachable
          setServerError(
            'Unable to reach the server. Please check your network connection or verify the backend is running.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      active = false;
    };
  }, [token, retryCount]);

  const login = (newToken, userData) => {
    if (!newToken) return;
    setServerError('');
    setLoading(false);
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setAuthToken(newToken);
    if (userData) setUser(userData);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        token,
        login,
        logout,
        loading,
        serverError,
        retryProfileFetch,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
