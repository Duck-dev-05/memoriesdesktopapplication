import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  date: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
};

type NotificationContextType = {
  notifications: InAppNotification[];
  unreadCount: number;
  addNotification: (title: string, body: string, type?: InAppNotification['type']) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('in_app_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: any) => ({ ...n, date: new Date(n.date) })));
      } catch (e) {}
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('in_app_notifications', JSON.stringify(notifications.slice(0, 50))); // Keep last 50
  }, [notifications]);

  const addNotification = useCallback((title: string, body: string, type: InAppNotification['type'] = 'info') => {
    const newNotif: InAppNotification = {
      id: Math.random().toString(36).substring(2, 11),
      title,
      body,
      date: new Date(),
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
