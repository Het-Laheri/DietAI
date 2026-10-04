// NutriSnap Mobile & System Push Notification Service
// Provides browser permission management, Service Worker registration,
// device vibration, audio chime, and native pop-up notification dispatching.

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

class MobileNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private audioContext: AudioContext | null = null;
  private seenNotificationIds = new Set<string>();

  constructor() {
    this.initServiceWorker();
    this.loadSeenNotifications();
  }

  private loadSeenNotifications() {
    try {
      const stored = localStorage.getItem('nutrisnap_seen_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Keep up to 200 most recent IDs
          parsed.slice(-200).forEach(id => this.seenNotificationIds.add(id));
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  private markSeen(id: string) {
    this.seenNotificationIds.add(id);
    try {
      const list = Array.from(this.seenNotificationIds).slice(-200);
      localStorage.setItem('nutrisnap_seen_notifications', JSON.stringify(list));
    } catch {
      // ignore storage errors
    }
  }

  public isSeen(id: string): boolean {
    return this.seenNotificationIds.has(id);
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
      // On mobile Safari & Chrome, requestPermission returns a promise
      const permission = await Notification.requestPermission();
      
      // If granted, ensure SW is active
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
      gain1.gain.setValueAtTime(0.2, now);
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
      gain2.gain.setValueAtTime(0.25, now + 0.12);
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
   * Show a real native mobile / desktop notification popup
   */
  public async showMobilePopup(payload: {
    id?: string;
    title: string;
    message: string;
    link?: string;
    tag?: string;
  }): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    // Check deduplication
    if (payload.id) {
      if (this.isSeen(payload.id)) return false;
      this.markSeen(payload.id);
    }

    // Play chime and vibrate device
    this.playNotificationChime();
    this.vibrateDevice();

    const notifTitle = payload.title || 'NutriSnap Health Alert';
    const notifOptions: NotificationOptions = {
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

    // 1. Prefer Service Worker registration showNotification (required for mobile background popups)
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
      console.warn('Direct Notification constructor failed:', windowErr);
      return false;
    }
  }
}

export const mobileNotificationService = new MobileNotificationService();
