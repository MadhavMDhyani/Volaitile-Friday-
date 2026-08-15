import { createContext, useEffect, useState } from 'react';
import axiosInstance, { setAuthToken } from '../config/axios';

const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!token) {
      setAuthToken(null);
      return;
    }

    let active = true;

    const fetchUser = async () => {
      setAuthToken(token);

      try {
        setLoading(true);
        const res = await axiosInstance.get('/users/me');

        if (!active) return;
        setUser(res.data);
      } catch {
        if (!active) return;
        setUser(null);
        setToken(null);
        setAuthToken(null);
        localStorage.removeItem('token');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      active = false;
    };
  }, [token]);

  const login = (newToken, userData) => {
    if (!newToken) return;
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setAuthToken(newToken);
    if (userData) setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('token');
  };

  return (
    <UserContext.Provider value={{ user, setUser, token, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
