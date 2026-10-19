// Service Worker for NutriSnap Clinical Mobile Notifications
// Handles push events, system notification display, and notification interaction

const CACHE_NAME = 'nutrisnap-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for message from main app thread to display notification directly via SW
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'NutriSnap Notification', {
        icon: '/pwa-192x192.png',
        badge: '/favicon-48x48.png',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        tag: options?.tag || `nutrisnap-${Date.now()}`,
        renotify: true,
        ...options
      })
    );
  }
});

// Bounded in-memory deduplication set inside the Service Worker scope
const deliveredPushTags = new Set();

// Handle incoming Web Push notifications independently of page lifecycle
self.addEventListener('push', (event) => {
  const swReceivedAt = new Date().toISOString();
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : 'You have a new NutriSnap clinical update.' };
  }

  const notificationId = data.id || data.tag || `push-${Date.now()}`;
  const tag = data.tag || notificationId;

  // Duplicate prevention inside Service Worker
  if (deliveredPushTags.has(notificationId)) {
    return;
  }
  deliveredPushTags.add(notificationId);
  if (deliveredPushTags.size > 300) {
    const oldest = deliveredPushTags.values().next().value;
    if (oldest) deliveredPushTags.delete(oldest);
  }

  const dispatchedMs =
    data.diagnostics && data.diagnostics.pushDispatchedAt
      ? new Date(data.diagnostics.pushDispatchedAt).getTime()
      : NaN;
  const endToEndLatencyMs = Number.isFinite(dispatchedMs)
    ? Math.max(0, new Date(swReceivedAt).getTime() - dispatchedMs)
    : undefined;

  const diagnostics = {
    ...(data.diagnostics || {}),
    swReceivedAt,
    ...(endToEndLatencyMs !== undefined ? { endToEndLatencyMs } : {}),
  };

  // Notify any open tabs via BroadcastChannel so they mark this ID as already alerted
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bus = new BroadcastChannel('nutrisnap_notification_bus');
      bus.postMessage({
        type: 'PUSH_DELIVERED',
        id: notificationId,
        tag,
        title: data.title || 'NutriSnap Alert',
        swReceivedAt,
        diagnostics,
      });
      bus.close();
    }
  } catch (e) {
    // Ignore BroadcastChannel errors
  }

  const title = data.title || 'NutriSnap Alert';
  const options = {
    body: data.body || data.message || 'You have a new clinical notification.',
    icon: '/pwa-192x192.png',
    badge: '/favicon-48x48.png',
    tag,
    data: {
      url: data.url || data.link || '/',
      ...data,
      diagnostics,
    },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    renotify: true,
    actions: [
      { action: 'open', title: 'Open NutriSnap' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle browser-initiated push subscription rotation/expiry
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
      }
    })
  );
});

// Handle user clicking on the notification popup on their mobile device or desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a NutriSnap tab is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
