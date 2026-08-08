import React, { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance, { setAuthToken } from '../config/axios';

export const UserContext = createContext(null);3

export const UserProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(() => localStorage.getItem('token'));

	useEffect(() => {
		if (token) {
			setAuthToken(token);
			axiosInstance.get('/users/me')
				.then((res) => setUser(res.data))
				.catch(() => {
					setUser(null);
					setToken(null);
					setAuthToken(null);
					localStorage.removeItem('token');
				});
		} else {
			setAuthToken(null);
			setUser(null);
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
		<UserContext.Provider value={{ user,setUser }}>
			{children}
		</UserContext.Provider>
	);
};


export default UserContext;

