import axios from 'axios';

const instance = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
});

export function setAuthToken(token) {
    if (token) {
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete instance.defaults.headers.common['Authorization'];
    }
}

export default instance;