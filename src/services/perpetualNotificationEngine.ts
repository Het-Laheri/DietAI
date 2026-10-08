// Perpetual Notification Engine for NutriSnap
// Continuously monitors Firestore live snapshots, HTTP background polling,
// document visibility, focus, and network reconnection to guarantee perpetual notifications
// without requiring the user to reload the page.

import { 
  getNotifications, 
  subscribeToNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  dismissNotification,
  clearAllReadNotifications,
  Notification 
} from './db';
import { mobileNotificationService } from './mobileNotificationService';

type NotificationListener = (notifications: Notification[]) => void;

class PerpetualNotificationEngine {
  private role: 'dietician' | 'patient' | null = null;
  private userId: string | undefined = undefined;
  private listeners = new Set<NotificationListener>();
  private currentNotifications: Notification[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private pollIntervalId: any = null;
  private isRunning = false;
  private hasBootstrapped = false;
  private lastPollTime = 0;

  constructor() {
    this.setupWindowListeners();
  }

  private setupWindowListeners() {
    if (typeof window === 'undefined') return;

    // Trigger instant check when user returns to tab / unlocks phone
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pollNow();
      }
    });

    // Trigger instant check when window gains focus
    window.addEventListener('focus', () => {
      this.pollNow();
    });

    // Trigger instant check when internet reconnects
    window.addEventListener('online', () => {
      this.pollNow();
    });

    // Trigger check on local mutation events
    window.addEventListener('nutrisnap:notification_change', () => {
      this.pollNow();
    });

    window.addEventListener('nutrisnap:query_change', () => {
      this.pollNow();
    });
  }

  /**
   * Start or reconfigure the perpetual engine for a specific user
   */
  public start(role: 'dietician' | 'patient', userId?: string, listener?: NotificationListener): () => void {
    const roleChanged = this.role !== role || this.userId !== userId;
    this.role = role;
    this.userId = userId;

    if (listener) {
      this.listeners.add(listener);
      // Immediately emit cached items if available
      if (this.currentNotifications.length > 0) {
        listener(this.currentNotifications);
      }
    }

    if (!this.isRunning || roleChanged) {
      this.isRunning = true;
      this.initEngine();
    }

    return () => {
      if (listener) {
        this.listeners.delete(listener);
      }
      if (this.listeners.size === 0) {
        // Keep running in background to ensure alerts are never missed
      }
    };
  }

  private initEngine() {
    if (!this.role) return;

    // Clean up previous listeners
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }

    // 1. Establish Firestore real-time listener
    try {
      this.unsubscribeFirestore = subscribeToNotifications(
        this.role,
        this.userId,
        (notifs) => {
          this.handleIncomingNotifications(notifs);
        }
      );
    } catch (e) {
      console.warn('Firestore subscription err:', e);
    }

    // 2. Perpetual interval polling loop
    // Runs every 4 seconds when tab is active, every 12 seconds when backgrounded
    const runLoop = () => {
      if (!this.isRunning) return;
      this.pollNow();
    };

    this.pollIntervalId = setInterval(runLoop, 4500);

    // Initial immediate poll
    this.pollNow();
  }

  /**
   * Execute an immediate active poll against the backend / Firestore
   */
  public async pollNow() {
    if (!this.role) return;

    const now = Date.now();
    // Throttle to at most once per 1.5 seconds
    if (now - this.lastPollTime < 1500) return;
    this.lastPollTime = now;

    try {
      // 1. Fetch from Firestore / local synthesis
      const notifs = await getNotifications(this.role, this.userId);
      this.handleIncomingNotifications(notifs);

      // 2. Try HTTP poll endpoint for extra cross-device reliability
      try {
        const res = await fetch('/api/queries/poll', { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data?.queries || data?.notes) {
            // Signal local event to trigger fresh compute if any changes
            window.dispatchEvent(new CustomEvent('nutrisnap:query_change'));
          }
        }
      } catch {
        // Ignore network error on static deployment
      }
    } catch (err) {
      console.warn('Perpetual poll error:', err);
    }
  }

  /**
   * Process fresh list of notifications and trigger perpetual alerts
   */
  private handleIncomingNotifications(notifs: Notification[]) {
    this.currentNotifications = notifs;

    // Broadcast updated list to all subscribers
    this.listeners.forEach(listener => {
      try {
        listener(notifs);
      } catch (e) {
        console.warn('Listener error:', e);
      }
    });

    const unread = notifs.filter(n => !n.read);

    if (!this.hasBootstrapped) {
      // First boot: alert for any unseen unread notifications (up to 3 most recent to avoid chime flood)
      const unseenUnread = unread.filter(n => n.id && !mobileNotificationService.isSeen(n.id));
      unseenUnread.slice(0, 3).forEach(n => {
        this.triggerAlert(n);
      });
      // Mark older ones as seen so they don't repeatedly chime on subsequent polls
      unseenUnread.slice(3).forEach(n => {
        if (n.id) mobileNotificationService.markSeen(n.id);
      });
      this.hasBootstrapped = true;
    } else {
      // Perpetual mode: ANY new unread notification triggers immediately!
      for (const n of unread) {
        if (n.id && !mobileNotificationService.isSeen(n.id)) {
          this.triggerAlert(n);
        }
      }
    }
  }

  private triggerAlert(n: Notification) {
    if (!n.id) return;
    mobileNotificationService.alertNewNotification({
      id: n.id,
      title: n.title || (this.role === 'dietician' ? 'New Patient Consultation Query 💬' : 'Dietician Clinical Update 🩺'),
      message: n.message || 'You have a new update on NutriSnap.',
      link: n.link || (this.role === 'dietician' ? '/dietician/inbox' : '/patient'),
      tag: n.id,
      type: n.type,
      createdAt: n.createdAt
    });
  }

  private parseTimestamp(val: any): number {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (val?.seconds) return val.seconds * 1000;
    if (typeof val?.toDate === 'function') return val.toDate().getTime();
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }

  public async markRead(id: string) {
    await markNotificationRead(id);
    mobileNotificationService.markSeen(id);
    this.pollNow();
  }

  public async markAllRead() {
    if (!this.role) return;
    await markAllNotificationsRead(this.role, this.userId);
    this.currentNotifications.forEach(n => {
      if (n.id) mobileNotificationService.markSeen(n.id);
    });
    this.pollNow();
  }

  public async dismiss(id: string) {
    await dismissNotification(id);
    mobileNotificationService.markSeen(id);
    this.pollNow();
  }

  public async clearRead() {
    if (!this.role) return;
    await clearAllReadNotifications(this.role, this.userId);
    this.pollNow();
  }

  public getNotifications(): Notification[] {
    return this.currentNotifications;
  }

  public getUnreadCount(): number {
    return this.currentNotifications.filter(n => !n.read).length;
  }

  public stop() {
    this.isRunning = false;
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }
}

export const perpetualNotificationEngine = new PerpetualNotificationEngine();
