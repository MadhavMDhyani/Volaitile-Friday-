import { createContext, useEffect, useState } from 'react';
import axiosInstance, { setAuthToken } from '../config/axios';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setLoading(true);
      setAuthToken(token);
      axiosInstance
        .get('/users/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          setUser(null);
          setToken(null);
          setAuthToken(null);
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setAuthToken(null);
      setUser(null);
      setLoading(false);
    }
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

export default UserContext;
