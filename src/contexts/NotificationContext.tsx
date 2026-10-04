import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Notification } from '../services/db';
import { perpetualNotificationEngine } from '../services/perpetualNotificationEngine';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markRead: async () => {},
  markAllRead: async () => {},
  refresh: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !profile?.role) {
      setNotifications([]);
      return;
    }

    const role = profile.role as 'dietician' | 'patient';
    const userId = role === 'patient' ? (user as any).uid || (user as any).id : undefined;

    const unsubscribe = perpetualNotificationEngine.start(role, userId, (updatedNotifs) => {
      setNotifications(updatedNotifs);
    });

    return () => {
      unsubscribe();
    };
  }, [user, profile?.role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    await perpetualNotificationEngine.markRead(id);
  };

  const markAllRead = async () => {
    await perpetualNotificationEngine.markAllRead();
  };

  const refresh = async () => {
    await perpetualNotificationEngine.pollNow();
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
