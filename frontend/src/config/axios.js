import axios from 'axios';

const instance = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
})


export default axiosinstance;