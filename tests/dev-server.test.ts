// The local Express server must not authenticate to Firebase on import and must protect every /api route.
process.env.NODE_ENV = 'test';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { installFakes } from './helpers.js';

let server: http.Server;
let base = '';

before(async () => {
  installFakes();
  const { default: app } = await import('../server.js');
  server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => new Promise<void>(resolve => server.close(() => resolve())));

const post = (p: string, body: any, token?: string) =>
  fetch(base + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

test('AI coach requires a session', async () => {
  const r = await post('/api/ai/coach', { patientId: 'patientB', question: 'Can I eat tofu?' });
  assert.equal(r.status, 401);
});

test('AI estimate-food requires a session', async () => {
  const r = await post('/api/ai/estimate-food', { foodItem: 'rice' });
  assert.equal(r.status, 401);
});

test('removed unauthenticated routes are gone (push spam, patient IDOR)', async () => {
  for (const p of ['/api/notifications/send-push', '/api/patient/profile/patientB', '/api/patient/food-logs/patientB']) {
    const r = await fetch(base + p, { method: p.includes('send-push') ? 'POST' : 'GET' });
    assert.equal(r.status, 404, p);
    assert.match(r.headers.get('content-type') || '', /json/);
  }
});

test('shared routes are mounted with the same protection as production', async () => {
  const r = await fetch(base + '/api/queries/poll');
  assert.equal(r.status, 401);
  const r2 = await fetch(base + '/api/queries/poll', { headers: { Authorization: 'Bearer token-patient-a' } });
  assert.equal(r2.status, 200);
});
