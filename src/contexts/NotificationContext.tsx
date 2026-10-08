import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Notification } from '../services/db';
import { perpetualNotificationEngine } from '../services/perpetualNotificationEngine';
import { mobileNotificationService } from '../services/mobileNotificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  clearRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markRead: async () => {},
  markAllRead: async () => {},
  dismiss: async () => {},
  clearRead: async () => {},
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

    // Auto-register device for Web Push notifications if permission is granted
    if (mobileNotificationService.getPermission() === 'granted') {
      mobileNotificationService.subscribeToPushNotifications(role, userId).catch(() => {});
    }

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

  const dismiss = async (id: string) => {
    await perpetualNotificationEngine.dismiss(id);
  };

  const clearRead = async () => {
    await perpetualNotificationEngine.clearRead();
  };

  const refresh = async () => {
    await perpetualNotificationEngine.pollNow();
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, dismiss, clearRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
