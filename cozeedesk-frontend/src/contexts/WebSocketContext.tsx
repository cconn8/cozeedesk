'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface ExtractionNotification {
  type: 'extraction_started' | 'extraction_completed' | 'extraction_failed';
  caseId: string;
  jobId: string;
  message: string;
  error?: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: ExtractionNotification[];
  clearNotifications: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<ExtractionNotification[]>([]);
  const { isAuthenticated, user, tenant } = useAuth();

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    // Only create socket if authenticated with user and tenant
    if (!isAuthenticated || !user || !tenant) {
      return;
    }

    // Create socket connection
    const newSocket = io('http://localhost:3005', {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      // Join tenant room for tenant-scoped notifications
      newSocket.emit('join_tenant', tenant.id);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Extraction notification handlers
    newSocket.on('extraction_started', (data: { caseId: string; jobId: string }) => {
      const notification: ExtractionNotification = {
        type: 'extraction_started',
        caseId: data.caseId,
        jobId: data.jobId,
        message: 'Document processing started...',
      };
      setNotifications(prev => [...prev, notification]);
    });

    newSocket.on('extraction_completed', (data: { caseId: string; jobId: string }) => {
      const notification: ExtractionNotification = {
        type: 'extraction_completed',
        caseId: data.caseId,
        jobId: data.jobId,
        message: 'Document extraction completed successfully',
      };
      setNotifications(prev => [...prev, notification]);
    });

    newSocket.on('extraction_failed', (data: { caseId: string; jobId: string; error: string }) => {
      const notification: ExtractionNotification = {
        type: 'extraction_failed',
        caseId: data.caseId,
        jobId: data.jobId,
        message: 'Document extraction failed',
        error: data.error,
      };
      setNotifications(prev => [...prev, notification]);
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      if (tenant?.id) {
        newSocket.emit('leave_tenant', tenant.id);
      }
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, user, tenant]);

  const value = {
    socket,
    isConnected,
    notifications,
    clearNotifications,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};