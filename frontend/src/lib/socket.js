import { io } from 'socket.io-client';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const socket = io(apiBaseUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling'],
  auth: (cb) => {
    const token = localStorage.getItem('token');
    cb({ token });
  },
});

export default socket;
export { useProjectSocket } from '../hooks/useProjectSocket';
