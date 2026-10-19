import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { installFakes, call } from './helpers.js';
import {
  generateVapidKeys,
  createVapidAuthHeader,
  encryptWebPushPayload,
  decryptWebPushPayload,
  toBase64Url,
  fromBase64Url,
  __setWebPushTestHooks,
  __resetWebPushMemoryForTests,
  __getMemorySubscriptionsForTests,
} from '../api/_lib/webPush.js';
import vapidKeyHandler from '../api/notifications/vapid-key.js';
import subscribeHandler from '../api/notifications/subscribe.js';
import remindersHandler from '../api/notifications/reminders.js';
import processRemindersHandler from '../api/notifications/process-reminders.js';
import testPushHandler from '../api/notifications/test-push.js';

function createFakeBrowserSubscription(endpoint = 'https://fcm.googleapis.com/fcm/send/fake-sub-1') {
  const uaEcdh = crypto.createECDH('prime256v1');
  uaEcdh.generateKeys();
  const uaPublic = uaEcdh.getPublicKey();
  const uaPrivate = uaEcdh.getPrivateKey();
  const authSecret = crypto.randomBytes(16);

  return {
    subscription: {
      endpoint,
      expirationTime: null,
      keys: {
        p256dh: toBase64Url(uaPublic),
        auth: toBase64Url(authSecret),
      },
    },
    uaPublic,
    uaPrivate,
    authSecret,
  };
}

test('RFC 8292 VAPID key generation and ES256 JWT signature verification', () => {
  installFakes();
  __resetWebPushMemoryForTests();

  const vapid = generateVapidKeys('mailto:support@nutrisnap.co.in');
  const pubBytes = fromBase64Url(vapid.publicKey);
  const privBytes = fromBase64Url(vapid.privateKey);

  assert.equal(pubBytes.length, 65);
  assert.equal(pubBytes[0], 0x04);
  assert.equal(privBytes.length, 32);

  const { authorization, cryptoKey, jwt } = createVapidAuthHeader(
    'https://fcm.googleapis.com/fcm/send/device-123',
    vapid
  );

  assert.equal(authorization.startsWith('vapid t='), true);
  assert.equal(cryptoKey, `p256ecdsa=${vapid.publicKey}`);

  const [headerB64, payloadB64, sigB64] = jwt.split('.');
  const payload = JSON.parse(fromBase64Url(payloadB64).toString('utf8'));
  assert.equal(payload.aud, 'https://fcm.googleapis.com');
  assert.equal(payload.sub, 'mailto:support@nutrisnap.co.in');

  // Verify ES256 signature using public key
  const publicKeyObj = crypto.createPublicKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: toBase64Url(pubBytes.subarray(1, 33)),
      y: toBase64Url(pubBytes.subarray(33, 65)),
    },
    format: 'jwk',
  });

  const verified = crypto.verify(
    'sha256',
    Buffer.from(`${headerB64}.${payloadB64}`, 'ascii'),
    { key: publicKeyObj, dsaEncoding: 'ieee-p1363' },
    fromBase64Url(sigB64)
  );
  assert.equal(verified, true);
});

test('RFC 8291 aes128gcm Web Push payload encryption and decryption round-trip', () => {
  installFakes();
  __resetWebPushMemoryForTests();

  const { subscription, uaPrivate, uaPublic, authSecret } = createFakeBrowserSubscription();
  const originalPayload = JSON.stringify({
    id: 'rem_test_roundtrip',
    title: 'Lunch Reminder',
    body: 'Time to log your lunch meal in NutriSnap.',
    url: '/patient/meals',
    diagnostics: {
      createdAt: '2026-10-19T12:00:00.000Z',
      scheduledFor: '2026-10-19T13:00:00.000Z',
    },
  });

  const encrypted = encryptWebPushPayload(originalPayload, subscription.keys);
  assert.equal(encrypted.body.length > 86, true);

  const decryptedText = decryptWebPushPayload(
    encrypted.body,
    uaPrivate,
    uaPublic,
    authSecret
  );
  assert.deepEqual(JSON.parse(decryptedText), JSON.parse(originalPayload));
});

test('GET /api/notifications/vapid-key returns valid 65-byte uncompressed P-256 key', async () => {
  installFakes();
  __resetWebPushMemoryForTests();

  const res = await call(vapidKeyHandler, { method: 'GET' });
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.publicKey, 'string');
  const decoded = fromBase64Url(res.body.publicKey);
  assert.equal(decoded.length, 65);
  assert.equal(decoded[0], 0x04);
});

test('POST /api/notifications/subscribe requires auth, registers subscription, and provisions daily meal reminders', async () => {
  installFakes();
  __resetWebPushMemoryForTests();

  const { subscription } = createFakeBrowserSubscription();

  const unauth = await call(subscribeHandler, {
    method: 'POST',
    body: { subscription },
  });
  assert.equal(unauth.statusCode, 401);

  const authed = await call(subscribeHandler, {
    method: 'POST',
    token: 'token-patient-a',
    body: { subscription, timezoneOffsetMinutes: -330 },
  });
  assert.equal(authed.statusCode, 200);
  assert.equal(authed.body.ok, true);
  assert.equal(authed.body.subscriptionId.startsWith('sub_'), true);
  assert.equal(authed.body.dailyRemindersScheduled, 4);

  // Listing reminders shows the 4 deduplicated daily meal reminders
  const listRes = await call(remindersHandler, {
    method: 'GET',
    token: 'token-patient-a',
  });
  assert.equal(listRes.statusCode, 200);
  assert.equal(listRes.body.reminders.length, 4);
});

test('Tab-closed background reminder lifecycle: schedules, processes via backend cron, delivers encrypted Web Push, and prevents duplicates', async () => {
  installFakes();
  __resetWebPushMemoryForTests();

  const { subscription, uaPrivate, uaPublic, authSecret } = createFakeBrowserSubscription(
    'https://fcm.googleapis.com/fcm/send/tab-closed-device'
  );

  const interceptedRequests: Array<{
    endpoint: string;
    headers: Record<string, string>;
    body: Buffer;
  }> = [];

  __setWebPushTestHooks({
    transport: async (endpoint, req) => {
      interceptedRequests.push({ endpoint, headers: req.headers, body: req.body });
      return { statusCode: 201, body: 'Created' };
    },
  });

  // 1. Patient registers Web Push subscription before closing browser tab
  const subRes = await call(subscribeHandler, {
    method: 'POST',
    token: 'token-patient-a',
    body: { subscription, timezoneOffsetMinutes: -330 },
  });
  assert.equal(subRes.statusCode, 200);

  // 2. Patient schedules a delayed test reminder (simulating tab closed immediately after)
  const scheduleRes = await call(testPushHandler, {
    method: 'POST',
    token: 'token-patient-a',
    body: {
      delaySeconds: 1,
      title: 'Tab-Closed Meal Reminder',
      message: 'Delivered by persistent backend scheduler while NutriSnap tab is closed.',
      link: '/patient/meals',
    },
  });
  assert.equal(scheduleRes.statusCode, 200);
  assert.equal(scheduleRes.body.mode, 'scheduled');
  const reminderId = scheduleRes.body.reminder.id;
  assert.equal(scheduleRes.body.reminder.status, 'pending');
  assert.equal(interceptedRequests.length, 0);

  // 3. Wait 1.15s for the scheduled reminder to become due while the tab remains closed
  await new Promise((r) => setTimeout(r, 1150));

  // 4. Backend Cron job triggers /api/notifications/process-reminders using CRON_SECRET
  process.env.CRON_SECRET = 'test_cron_secret_nutrisnap_2026';
  const cronRes = await call(processRemindersHandler, {
    method: 'POST',
    token: 'test_cron_secret_nutrisnap_2026',
  });
  assert.equal(cronRes.statusCode, 200);
  assert.equal(cronRes.body.ok, true);
  assert.equal(cronRes.body.authMode, 'cron_secret');
  assert.equal(cronRes.body.sentCount, 1);

  // 5. Verify the raw encrypted Web Push HTTP request was delivered to the browser push endpoint
  assert.equal(interceptedRequests.length, 1);
  const pushReq = interceptedRequests[0];
  assert.equal(pushReq.endpoint, 'https://fcm.googleapis.com/fcm/send/tab-closed-device');
  assert.equal(pushReq.headers['Content-Encoding'], 'aes128gcm');
  assert.equal(pushReq.headers.Authorization.startsWith('vapid t='), true);

  // 6. Decrypt payload as the browser Service Worker does and verify contents + diagnostic timestamps
  const decryptedJson = decryptWebPushPayload(
    pushReq.body,
    uaPrivate,
    uaPublic,
    authSecret
  );
  const receivedPayload = JSON.parse(decryptedJson);
  assert.equal(receivedPayload.id, reminderId);
  assert.equal(receivedPayload.title, 'Tab-Closed Meal Reminder');
  assert.equal(
    receivedPayload.body,
    'Delivered by persistent backend scheduler while NutriSnap tab is closed.'
  );
  assert.equal(receivedPayload.url, '/patient/meals');
  assert.equal(Boolean(receivedPayload.diagnostics.createdAt), true);
  assert.equal(Boolean(receivedPayload.diagnostics.scheduledFor), true);
  assert.equal(Boolean(receivedPayload.diagnostics.processingStartedAt), true);
  assert.equal(Boolean(receivedPayload.diagnostics.pushDispatchedAt), true);

  // 7. Re-running the cron job must NOT re-send the already-completed reminder (duplicate prevention)
  const secondCronRes = await call(processRemindersHandler, {
    method: 'POST',
    token: 'test_cron_secret_nutrisnap_2026',
  });
  assert.equal(secondCronRes.statusCode, 200);
  assert.equal(secondCronRes.body.processedCount, 0);
  assert.equal(interceptedRequests.length, 1);
});

test('Transient push failure retries automatically and 410 Gone removes expired subscription', async () => {
  installFakes();
  __resetWebPushMemoryForTests();

  const activeDevice = createFakeBrowserSubscription(
    'https://fcm.googleapis.com/fcm/send/transient-retry-device'
  );
  const expiredDevice = createFakeBrowserSubscription(
    'https://fcm.googleapis.com/fcm/send/expired-410-device'
  );

  await call(subscribeHandler, {
    method: 'POST',
    token: 'token-patient-a',
    body: { subscription: activeDevice.subscription },
  });
  await call(subscribeHandler, {
    method: 'POST',
    token: 'token-patient-a',
    body: { subscription: expiredDevice.subscription },
  });

  assert.equal(__getMemorySubscriptionsForTests().length, 2);

  let activeAttempts = 0;
  __setWebPushTestHooks({
    transport: async (endpoint) => {
      if (endpoint.includes('expired-410-device')) {
        return { statusCode: 410, body: 'Gone - Unsubscribed' };
      }
      activeAttempts++;
      if (activeAttempts === 1) {
        return { statusCode: 503, body: 'Service Temporarily Unavailable' };
      }
      return { statusCode: 201, body: 'Created' };
    },
  });

  const pushRes = await call(testPushHandler, {
    method: 'POST',
    token: 'token-patient-a',
    body: {
      title: 'Retry & Expiry Test',
      message: 'Testing transient retry and 410 cleanup.',
    },
  });

  assert.equal(pushRes.statusCode, 200);
  assert.equal(pushRes.body.sentCount, 1);
  assert.equal(pushRes.body.expiredRemovedCount, 1);
  assert.equal(activeAttempts, 2); // 1st failed with 503, 2nd succeeded with 201

  // Expired 410 subscription was automatically removed from registry
  const remainingSubs = __getMemorySubscriptionsForTests();
  assert.equal(remainingSubs.length, 1);
  assert.equal(remainingSubs[0].endpoint.includes('transient-retry-device'), true);
});
