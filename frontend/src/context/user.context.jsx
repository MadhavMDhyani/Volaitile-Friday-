import { useEffect, useState, useCallback } from 'react';
import axiosInstance, { setAuthToken } from '../config/axios';
import { UserContext } from './UserContext';

export { UserContext };

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('token');
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
        // Backend exposes /users/profile with authUser middleware
        const res = await axiosInstance.get('/users/profile');

        if (!active) return;
        const resolvedUser = res.data?.user || res.data;
        setUser(resolvedUser);
      } catch (err) {
        if (!active) return;
        // Only invalidate token if unauthorized (401/403)
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      active = false;
    };
  }, [token, logout]);

  const login = (newToken, userData) => {
    if (!newToken) return;
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setAuthToken(newToken);
    if (userData) setUser(userData);
  };

  return (
    <UserContext.Provider value={{ user, setUser, token, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
