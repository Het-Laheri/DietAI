// NutriSnap Mobile & System Push Notification Service
// Provides browser permission management, Service Worker registration,
// device vibration, audio chime, in-app toast alerts, and native pop-up notification dispatching.

import { authFetch } from './apiAuth';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface MobileNotificationPayload {
  id: string;
  title: string;
  message: string;
  link?: string;
  tag?: string;
  type?: string;
  createdAt?: any;
  diagnostics?: Record<string, any>;
}

type ToastCallback = (payload: MobileNotificationPayload) => void;

class MobileNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private audioContext: AudioContext | null = null;
  private seenNotificationIds = new Set<string>();
  private toastListeners = new Set<ToastCallback>();
  private syncChannel: BroadcastChannel | null = null;
  private lastRole: 'dietician' | 'patient' | null = null;
  private lastUserId?: string;

  constructor() {
    this.initServiceWorker();
    this.loadSeenNotifications();
    this.initSyncChannel();
  }

  private initSyncChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.syncChannel = new BroadcastChannel('nutrisnap_notification_bus');
        this.syncChannel.onmessage = (event) => {
          if (event.data?.type === 'MARK_SEEN' && event.data.id) {
            this.seenNotificationIds.add(event.data.id);
          } else if (event.data?.type === 'PUSH_DELIVERED' && event.data.id) {
            // Service Worker already displayed this Web Push notification; mark seen to prevent duplicate alert
            this.seenNotificationIds.add(event.data.id);
            try {
              const list = Array.from(this.seenNotificationIds).slice(-500);
              localStorage.setItem('nutrisnap_seen_notifications', JSON.stringify(list));
              if (event.data.diagnostics) {
                const rawDiag = localStorage.getItem('nutrisnap_push_diagnostics');
                const diagList = rawDiag ? JSON.parse(rawDiag) : [];
                diagList.unshift({
                  id: event.data.id,
                  title: event.data.title,
                  ...event.data.diagnostics,
                });
                localStorage.setItem(
                  'nutrisnap_push_diagnostics',
                  JSON.stringify(diagList.slice(0, 30))
                );
              }
            } catch {
              // ignore storage errors
            }
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel note:', e);
      }
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED' && this.lastRole) {
          this.subscribeToPushNotifications(this.lastRole, this.lastUserId);
        }
      });
    }
  }

  private loadSeenNotifications() {
    try {
      const stored = localStorage.getItem('nutrisnap_seen_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Keep up to 500 most recent IDs
          parsed.slice(-500).forEach(id => this.seenNotificationIds.add(id));
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  public markSeen(id: string) {
    if (!id) return;
    this.seenNotificationIds.add(id);
    try {
      const list = Array.from(this.seenNotificationIds).slice(-500);
      localStorage.setItem('nutrisnap_seen_notifications', JSON.stringify(list));
      if (this.syncChannel) {
        this.syncChannel.postMessage({ type: 'MARK_SEEN', id });
      }
    } catch {
      // ignore storage errors
    }
  }

  public isSeen(id: string): boolean {
    if (!id) return false;
    return this.seenNotificationIds.has(id);
  }

  /**
   * Subscribe an in-app component to toast notifications
   */
  public subscribeToToast(callback: ToastCallback): () => void {
    this.toastListeners.add(callback);
    return () => {
      this.toastListeners.delete(callback);
    };
  }

  /**
   * Register the Service Worker in public/sw.js
   */
  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      this.swRegistration = registration;
      return registration;
    } catch (err) {
      console.warn('Service Worker registration note:', err);
      return null;
    }
  }

  /**
   * Check whether system notifications are supported in this browser
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current notification permission
   */
  public getPermission(): NotificationPermissionState {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationPermissionState;
  }

  /**
   * Request notification permission from user
   */
  public async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await this.initServiceWorker();
        this.playNotificationChime();
        this.vibrateDevice();
      }

      return permission as NotificationPermissionState;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  /**
   * Play a pleasant hospital/clinic chime using Web Audio API (no external mp3 asset needed)
   */
  public playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'suspended') {
        this.audioContext = new AudioCtx();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Note 1: High crisp chime (E6 ~ 1318.51Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.51, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: Harmonic resolution (B6 ~ 1975.53Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1975.53, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {
      // Audio playback might be restricted if no user interaction yet
    }
  }

  /**
   * Trigger physical haptic vibration on phone (supported on Android Chrome/Firefox)
   */
  public vibrateDevice() {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 250]);
      }
    } catch {
      // Ignore vibration error on unsupported hardware
    }
  }

  /**
   * Universal alert entry point: plays audio, vibrates, triggers in-app toast,
   * and fires native system / SW notification popup.
   */
  public async alertNewNotification(payload: MobileNotificationPayload): Promise<boolean> {
    if (!payload.id) return false;

    // Deduplication check
    if (this.isSeen(payload.id)) {
      return false;
    }
    this.markSeen(payload.id);

    // 1. Sensory alerts: Chime & Vibration
    this.playNotificationChime();
    this.vibrateDevice();

    // 2. Dispatch to In-App Toast listeners (always works, even if system notifications are blocked)
    this.toastListeners.forEach(listener => {
      try {
        listener(payload);
      } catch (e) {
        console.warn('Toast listener err:', e);
      }
    });

    // 3. Dispatch Native System / Service Worker Notification
    if (this.isSupported() && Notification.permission === 'granted') {
      await this.dispatchNativePopup(payload);
    }

    return true;
  }

  /**
   * Internal helper to dispatch system OS notification popup
   */
  private async dispatchNativePopup(payload: MobileNotificationPayload): Promise<boolean> {
    const notifTitle = payload.title || 'NutriSnap Health Alert';
    const notifOptions: NotificationOptions & { renotify?: boolean } = {
      body: payload.message,
      icon: '/pwa-192x192.png',
      badge: '/favicon-48x48.png',
      tag: payload.tag || payload.id || `notif_${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: {
        url: payload.link || '/',
        id: payload.id
      }
    };

    // 1. Service Worker registration showNotification
    try {
      if (!this.swRegistration && 'serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.ready;
      }

      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(notifTitle, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Service Worker showNotification fallback:', swErr);
    }

    // 2. Direct Window Notification fallback
    try {
      const notif = new Notification(notifTitle, notifOptions);
      notif.onclick = () => {
        window.focus();
        if (payload.link) {
          window.location.href = payload.link;
        }
        notif.close();
      };
      return true;
    } catch (windowErr) {
      console.warn('Direct Notification constructor fallback:', windowErr);
      return false;
    }
  }

  /**
   * Compatibility wrapper for existing showMobilePopup callers
   */
  public async showMobilePopup(payload: {
    id?: string;
    title: string;
    message: string;
    link?: string;
    tag?: string;
  }): Promise<boolean> {
    if (!payload.id) {
      payload.id = `popup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    }
    return this.alertNewNotification(payload as MobileNotificationPayload);
  }

  /**
   * Subscribe browser / device to real Web Push notifications via Service Worker PushManager
   * so OS push notifications arrive even when app / browser tab is completely closed.
   */
  public async subscribeToPushNotifications(role: 'dietician' | 'patient', userId?: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    this.lastRole = role;
    this.lastUserId = userId;

    try {
      // 1. Ensure Service Worker is registered
      await this.initServiceWorker();
      const readyReg = await navigator.serviceWorker.ready;

      // 2. Fetch active VAPID Public Key from backend (no stale hardcoded key fallback)
      let vapidPublicKey = '';
      try {
        const res = await fetch('/api/notifications/vapid-key');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.publicKey === 'string') {
            vapidPublicKey = data.publicKey.trim();
          }
        }
      } catch {}

      if (!vapidPublicKey) {
        vapidPublicKey = String((import.meta as any).env?.VITE_VAPID_PUBLIC_KEY || '').trim();
      }
      if (!vapidPublicKey) {
        console.warn('[WebPush] No server VAPID public key available.');
        return false;
      }

      const appServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // 3. Check existing subscription; if it was signed with a stale VAPID key, unsubscribe and re-subscribe
      let subscription = await readyReg.pushManager.getSubscription();
      if (subscription && subscription.options?.applicationServerKey) {
        const existingKey = new Uint8Array(subscription.options.applicationServerKey);
        if (!uint8ArraysEqual(existingKey, appServerKey)) {
          try {
            await subscription.unsubscribe();
          } catch {}
          subscription = null;
        }
      }

      if (!subscription) {
        subscription = await readyReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      }

      // 4. Send authenticated subscription to server (also provisions daily meal reminders for patients)
      if (subscription) {
        const subJson = subscription.toJSON();
        const res = await authFetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subJson,
            role,
            userId,
            timezoneOffsetMinutes: new Date().getTimezoneOffset(),
          }),
        });
        if (!res.ok) {
          console.warn('[WebPush] /api/notifications/subscribe returned HTTP', res.status);
          return false;
        }
        console.log('[WebPush] Device subscribed to Push API:', role, userId || 'self');
        return true;
      }
    } catch (err) {
      console.warn('Push subscription note:', err);
    }
    return false;
  }

  /**
   * Authorized test-push helper: dispatches an immediate Web Push (`delaySeconds = 0`)
   * or schedules a due reminder (`delaySeconds > 0`) so tab-closed background delivery can be verified.
   */
  public async sendTestPush(options?: {
    delaySeconds?: number;
    title?: string;
    message?: string;
    link?: string;
  }): Promise<any> {
    const res = await authFetch('/api/notifications/test-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        delaySeconds: options?.delaySeconds ?? 0,
        title: options?.title,
        message: options?.message,
        link: options?.link,
      }),
    });
    return res.json();
  }

  /**
   * Triggers the backend reminder processor (`/api/notifications/process-reminders`) on demand.
   */
  public async triggerDueRemindersCheck(): Promise<any> {
    const res = await authFetch('/api/notifications/process-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  }
}

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const mobileNotificationService = new MobileNotificationService();
