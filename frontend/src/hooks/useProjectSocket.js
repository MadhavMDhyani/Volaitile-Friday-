import { useEffect, useState, useRef, useCallback } from 'react';
import socket from '../lib/socket';

/**
 * Custom React hook managing real-time project socket lifecycle.
 * Automatically connects, joins the project room, manages presence,
 * typing indicators, reconnect recovery, and clean unmounting.
 */
export const useProjectSocket = (projectId, options = {}) => {
  const { onMessage, onReconnect } = options;
  const [connected, setConnected] = useState(socket.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]); // Array of { userId, email }

  const onMessageRef = useRef(onMessage);
  const onReconnectRef = useRef(onReconnect);
  const subscribersRef = useRef(new Set());
  const typingTimeoutsRef = useRef(new Map());
  const hasConnectedOnceRef = useRef(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  // Subscribe to incoming messages
  const subscribeToMessages = useCallback((callback) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // Send message via WebSocket with acknowledgement callback
  const sendMessage = useCallback(
    (content, tempId) => {
      return new Promise((resolve) => {
        if (!socket.connected) {
          resolve({ ok: false, error: 'Socket is not connected', tempId });
          return;
        }

        socket.emit('chat:send', { projectId, content, tempId }, (response) => {
          resolve(response || { ok: false, error: 'No acknowledgement from server', tempId });
        });
      });
    },
    [projectId]
  );

  // Emit typing indicator
  const sendTyping = useCallback(
    (isTyping) => {
      if (!socket.connected || !projectId) return;
      socket.emit('chat:typing', { projectId, isTyping: Boolean(isTyping) });
    },
    [projectId]
  );

  useEffect(() => {
    if (!projectId) return;

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    const joinRoom = () => {
      socket.emit('project:join', { projectId });
    };

    const handleConnect = () => {
      setConnected(true);
      setIsReconnecting(false);
      joinRoom();

      if (hasConnectedOnceRef.current) {
        if (typeof onReconnectRef.current === 'function') {
          onReconnectRef.current();
        }
      } else {
        hasConnectedOnceRef.current = true;
      }
    };

    const handleDisconnect = (reason) => {
      setConnected(false);
      if (reason !== 'io client disconnect') {
        setIsReconnecting(true);
      }
    };

    const handleConnectError = () => {
      setConnected(false);
      setIsReconnecting(true);
    };

    const handlePresence = (data) => {
      if (data?.projectId === projectId) {
        setOnlineUserIds(data.onlineUserIds || []);
      }
    };

    const handleTyping = (data) => {
      if (data?.projectId !== projectId) return;
      const { userId, email, isTyping } = data;
      if (!userId) return;

      setTypingUsers((prev) => {
        if (isTyping) {
          const filtered = prev.filter((u) => u.userId !== userId);
          return [...filtered, { userId, email: email || 'Collaborator' }];
        }
        return prev.filter((u) => u.userId !== userId);
      });

      // Clear previous fallback timeout
      const prevTimer = typingTimeoutsRef.current.get(userId);
      if (prevTimer) clearTimeout(prevTimer);

      if (isTyping) {
        const timer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
          typingTimeoutsRef.current.delete(userId);
        }, 5000);
        typingTimeoutsRef.current.set(userId, timer);
      } else {
        typingTimeoutsRef.current.delete(userId);
      }
    };

    const handleChatMessage = (payload) => {
      const msg = payload?.message || payload;
      if (!msg) return;

      if (typeof onMessageRef.current === 'function') {
        onMessageRef.current(msg);
      }

      subscribersRef.current.forEach((sub) => {
        try {
          sub(msg);
        } catch (err) {
          console.error('Subscriber callback error:', err);
        }
      });
    };

    const typingTimeouts = typingTimeoutsRef.current;

    // If socket is already connected when hook mounts
    if (socket.connected) {
      joinRoom();
      hasConnectedOnceRef.current = true;
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('presence:update', handlePresence);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.emit('project:leave', { projectId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('presence:update', handlePresence);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:message', handleChatMessage);

      typingTimeouts.forEach((timer) => clearTimeout(timer));
      typingTimeouts.clear();
      setTypingUsers([]);
      setOnlineUserIds([]);
    };
  }, [projectId]);

  return {
    socket,
    connected,
    isReconnecting: !connected || isReconnecting,
    onlineUserIds,
    typingUsers,
    sendMessage,
    sendTyping,
    subscribeToMessages,
  };
};

export default useProjectSocket;
