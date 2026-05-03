import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  let isAuthenticated = false;
  try {
    isAuthenticated = useAuth().isAuthenticated;
  } catch {
    isAuthenticated = false;
  }
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    const newSocket = io({
      path: '/api/socket.io',
      auth: { token }
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('newPost', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/explore'] });
    });
    
    newSocket.on('newLike', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    });

    newSocket.on('newComment', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'], exact: false });
    });

    newSocket.on('newMessage', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    });
    
    newSocket.on('notificationCount', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts/explore'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'], exact: false });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
