// Security regression tests for the Vercel API functions.
// Runs fully offline: Firebase token verification, Firestore and Razorpay are faked.
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { installFakes, call, type FakeFirestore } from './helpers.js';
import { __setRazorpayRequestForTests } from '../api/_lib/razorpay.js';
import { SERVER_PLANS } from '../api/_lib/plans.js';
import { SUBSCRIPTION_PLANS } from '../src/services/subscription.js';

import poll from '../api/queries/poll.js';
import submit from '../api/queries/submit.js';
import reply from '../api/queries/reply.js';
import kbClear from '../api/knowledge/clear.js';
import kbList from '../api/knowledge/list.js';
import kbImport from '../api/knowledge/import.js';
import aiChat from '../api/ai/chat.js';
import aiMealPlan from '../api/ai/meal-plan.js';
import aiScan from '../api/ai/scan-food.js';
import createOrder from '../api/payment/create-order.js';
import verifyPayment from '../api/payment/verify-payment.js';

const RZP_SECRET = 'test_secret_for_unit_tests_only';
process.env.RAZORPAY_KEY_ID = 'rzp_test_unit';
process.env.RAZORPAY_KEY_SECRET = RZP_SECRET;
delete process.env.GEMINI_API_KEY; // AI handlers must never be reached in these tests

let db: FakeFirestore;
beforeEach(() => {
  db = installFakes();
  __setRazorpayRequestForTests(null);
});

const ALL_HANDLERS: Array<[string, any, string]> = [
  ['queries/poll', poll, 'GET'],
  ['queries/submit', submit, 'POST'],
  ['queries/reply', reply, 'POST'],
  ['knowledge/clear', kbClear, 'DELETE'],
  ['knowledge/list', kbList, 'GET'],
  ['knowledge/import', kbImport, 'POST'],
  ['ai/chat', aiChat, 'POST'],
  ['ai/meal-plan', aiMealPlan, 'POST'],
  ['ai/scan-food', aiScan, 'POST'],
  ['payment/create-order', createOrder, 'POST'],
  ['payment/verify-payment', verifyPayment, 'POST'],
];

describe('every API route requires a valid session (SEC-004, SEC-007)', () => {
  for (const [name, handler, method] of ALL_HANDLERS) {
    test(`${name}: no token -> 401`, async () => {
      const r = await call(handler, { method, body: {} });
      assert.equal(r.statusCode, 401);
    });
    test(`${name}: forged token -> 401`, async () => {
      const r = await call(handler, { method, token: 'forged', body: {} });
      assert.equal(r.statusCode, 401);
    });
    test(`${name}: account without role -> 403`, async () => {
      const r = await call(handler, { method, token: 'token-norole', body: {} });
      assert.equal(r.statusCode, 403);
    });
  }
});

describe('CORS is restricted (SEC-008)', () => {
  test('preflight from a foreign origin is refused and gets no ACAO header', async () => {
    const r = await call(poll, { method: 'OPTIONS', origin: 'https://evil.example' });
    assert.equal(r.statusCode, 403);
    assert.equal(r.headers['access-control-allow-origin'], undefined);
  });
  test('preflight from the app origin is allowed', async () => {
    const r = await call(poll, { method: 'OPTIONS', origin: 'https://www.nutrisnap.co.in' });
    assert.equal(r.statusCode, 204);
    assert.equal(r.headers['access-control-allow-origin'], 'https://www.nutrisnap.co.in');
  });
  test('responses never use a wildcard origin', async () => {
    const r = await call(poll, { token: 'token-dietician', origin: 'https://evil.example' });
    assert.notEqual(r.headers['access-control-allow-origin'], '*');
    assert.equal(r.headers['access-control-allow-origin'], undefined);
  });
});

describe('queries/poll only returns the caller\'s data (SEC-007)', () => {
  beforeEach(() => {
    db.seed('queries', 'qa', { patientId: 'patientA', question: 'A question' });
    db.seed('queries', 'qb', { patientId: 'patientB', question: 'B question' });
    db.seed('notifications', 'na', { patientId: 'patientA', recipientId: 'patientA' });
    db.seed('notifications', 'nb', { patientId: 'patientB', recipientId: 'patientB' });
    db.seed('dietician_notes', 'clinical_knowledge_base', { recipes: [] });
    db.seed('dietician_notes', 'noteB', { patientId: 'patientB', isNotification: true });
  });
  test('patient A sees only patient A records', async () => {
    const r = await call(poll, { token: 'token-patient-a' });
    assert.equal(r.statusCode, 200);
    const ids = (arr: any[]) => arr.map(x => x.patientId);
    assert.deepEqual(ids(r.body.queries), ['patientA']);
    assert.deepEqual(ids(r.body.notifications), ['patientA']);
    assert.deepEqual(r.body.notes, []);
  });
  test('dietician sees all patients', async () => {
    const r = await call(poll, { token: 'token-dietician' });
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.queries.length, 2);
    assert.equal(r.body.notifications.length, 2);
  });
  test('POST is rejected', async () => {
    const r = await call(poll, { method: 'POST', token: 'token-dietician' });
    assert.equal(r.statusCode, 405);
  });
});

describe('queries/submit and reply', () => {
  test('a patient cannot submit a query as another patient, or pre-answer it', async () => {
    const r = await call(submit, {
      method: 'POST', token: 'token-patient-a',
      body: { patientId: 'patientB', question: 'Hi', status: 'answered' },
    });
    assert.equal(r.statusCode, 200);
    const stored = db.read('queries', r.body.id)!;
    assert.equal(stored.patientId, 'patientA');
    assert.equal(stored.status, 'pending');
  });
  test('empty question is rejected', async () => {
    const r = await call(submit, { method: 'POST', token: 'token-patient-a', body: { question: '  ' } });
    assert.equal(r.statusCode, 400);
  });
  test('patients cannot reply to or delete queries', async () => {
    db.seed('queries', 'qb', { patientId: 'patientB', question: 'B' });
    const r1 = await call(reply, { method: 'POST', token: 'token-patient-a', body: { queryId: 'qb', reply: 'x' } });
    const r2 = await call(reply, { method: 'POST', token: 'token-patient-a', body: { queryId: 'qb', action: 'delete' } });
    assert.equal(r1.statusCode, 403);
    assert.equal(r2.statusCode, 403);
    assert.ok(db.read('queries', 'qb'));
  });
  test('dietician reply stores the answer and notifies the right patient', async () => {
    db.seed('queries', 'qb', { patientId: 'patientB', question: 'B' });
    const r = await call(reply, { method: 'POST', token: 'token-dietician', body: { queryId: 'qb', reply: 'Eat greens', status: 'answered' } });
    assert.equal(r.statusCode, 200);
    assert.equal(db.read('queries', 'qb')!.reply, 'Eat greens');
    const notifs = db.all('notifications');
    assert.equal(notifs.length, 1);
    assert.equal(notifs[0].recipientId, 'patientB');
  });
  test('invalid status is rejected', async () => {
    db.seed('queries', 'qb', { patientId: 'patientB', question: 'B' });
    const r = await call(reply, { method: 'POST', token: 'token-dietician', body: { queryId: 'qb', status: 'hacked' } });
    assert.equal(r.statusCode, 400);
  });
});

describe('knowledge base is dietician-only for writes (SEC-004)', () => {
  test('patient cannot clear the knowledge base', async () => {
    db.seed('dietician_notes', 'clinical_knowledge_base', { recipes: [{ name: 'x' }], count: 1 });
    const r = await call(kbClear, { method: 'DELETE', token: 'token-patient-a' });
    assert.equal(r.statusCode, 403);
    assert.equal(db.read('dietician_notes', 'clinical_knowledge_base')!.count, 1);
  });
  test('patient cannot import into the knowledge base', async () => {
    const r = await call(kbImport, { method: 'POST', token: 'token-patient-a', body: { base64File: 'eA==', fileName: 'a.csv' } });
    assert.equal(r.statusCode, 403);
  });
  test('dietician can clear', async () => {
    const r = await call(kbClear, { method: 'DELETE', token: 'token-dietician' });
    assert.equal(r.statusCode, 200);
    assert.equal(db.read('dietician_notes', 'clinical_knowledge_base')!.count, 0);
  });
  test('signed-in user can list (falls back to bundled recipes) (FUN-003)', async () => {
    const r = await call(kbList, { token: 'token-patient-a' });
    assert.equal(r.statusCode, 200);
    assert.ok(r.body.count > 0);
  });
});

describe('AI endpoints: role checks and no leaked internals', () => {
  test('patients cannot use the dietician chat or meal-plan generator', async () => {
    assert.equal((await call(aiChat, { method: 'POST', token: 'token-patient-a', body: { messages: 'hi' } })).statusCode, 403);
    assert.equal((await call(aiMealPlan, { method: 'POST', token: 'token-patient-a', body: {} })).statusCode, 403);
  });
  test('scan-food rejects invalid input before calling the AI', async () => {
    const r = await call(aiScan, { method: 'POST', token: 'token-patient-a', body: { image: 'not-an-image' } });
    assert.equal(r.statusCode, 400);
  });
  test('missing GEMINI_API_KEY: no key fallback is used; reply is flagged as canned and leaks nothing (TST-001)', async () => {
    const r = await call(aiChat, { method: 'POST', token: 'token-dietician', body: { messages: 'hello' } });
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.fallback, true);
    assert.equal(r.body.details, undefined);
    assert.doesNotMatch(JSON.stringify(r.body), /AIza|GEMINI_API_KEY|stack/);
  });
});

describe('payments: server sets the price and activates the subscription (new: PAY-001/PAY-002)', () => {
  const sign = (orderId: string, paymentId: string) =>
    crypto.createHmac('sha256', RZP_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

  test('server plan prices match the plans shown in the app', () => {
    for (const p of SUBSCRIPTION_PLANS) {
      assert.equal(SERVER_PLANS[p.id].priceInPaise, p.priceInPaise, p.id);
      assert.equal(SERVER_PLANS[p.id].durationDays, p.durationDays, p.id);
    }
  });

  test('create-order ignores a client-supplied amount and charges the plan price', async () => {
    let sent: any = null;
    __setRazorpayRequestForTests(async (_m, _p, body) => { sent = body; return { statusCode: 200, data: { id: 'order_1', amount: (body as any).amount, currency: 'INR' } }; });
    const r = await call(createOrder, { method: 'POST', token: 'token-patient-a', body: { planId: '3_months', amount: 100 } });
    assert.equal(r.statusCode, 200);
    assert.equal(sent.amount, 400000);
    assert.equal(sent.notes.uid, 'patientA');
  });
  test('create-order rejects unknown plans and dieticians', async () => {
    assert.equal((await call(createOrder, { method: 'POST', token: 'token-patient-a', body: { planId: 'free_forever' } })).statusCode, 400);
    assert.equal((await call(createOrder, { method: 'POST', token: 'token-dietician', body: { planId: '1_month' } })).statusCode, 403);
  });

  const order = (uid: string, amount = 150000, planId = '1_month') =>
    async () => ({ statusCode: 200, data: { id: 'order_1', amount, currency: 'INR', notes: { uid, planId } } });

  test('forged signature is rejected and nothing is written', async () => {
    __setRazorpayRequestForTests(order('patientA'));
    const r = await call(verifyPayment, { method: 'POST', token: 'token-patient-a', body: { razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'f'.repeat(64) } });
    assert.equal(r.statusCode, 400);
    assert.equal(db.read('users', 'patientA'), undefined);
  });
  test('someone else\'s paid order cannot be claimed', async () => {
    __setRazorpayRequestForTests(order('patientB'));
    const r = await call(verifyPayment, { method: 'POST', token: 'token-patient-a', body: { razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: sign('order_1', 'pay_1') } });
    assert.equal(r.statusCode, 403);
  });
  test('an underpaid order is rejected', async () => {
    __setRazorpayRequestForTests(order('patientA', 100));
    const r = await call(verifyPayment, { method: 'POST', token: 'token-patient-a', body: { razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: sign('order_1', 'pay_1') } });
    assert.equal(r.statusCode, 400);
  });
  test('a valid payment activates the subscription server-side, once', async () => {
    __setRazorpayRequestForTests(order('patientA'));
    const body = { razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: sign('order_1', 'pay_1') };
    const r1 = await call(verifyPayment, { method: 'POST', token: 'token-patient-a', body });
    assert.equal(r1.statusCode, 200);
    const sub = db.read('users', 'patientA')!.subscription;
    assert.equal(sub.status, 'active');
    assert.equal(sub.planId, '1_month');
    assert.equal(db.read('patient_profiles', 'patientA')!.subscription.paymentId, 'pay_1');
    // Replaying the same payment does not extend the subscription again.
    const r2 = await call(verifyPayment, { method: 'POST', token: 'token-patient-a', body });
    assert.equal(r2.statusCode, 200);
    assert.equal(db.read('users', 'patientA')!.subscription.expiresAt, sub.expiresAt);
    // And another account cannot reuse it.
    __setRazorpayRequestForTests(order('patientB'));
    const r3 = await call(verifyPayment, { method: 'POST', token: 'token-patient-b', body });
    assert.equal(r3.statusCode, 403);
  });
  test('error responses do not leak the expected signature', async () => {
    __setRazorpayRequestForTests(order('patientA'));
    const r = await call(verifyPayment, { method: 'POST', token: 'token-patient-a', body: { razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'bad' } });
    assert.doesNotMatch(JSON.stringify(r.body), new RegExp(sign('order_1', 'pay_1')));
  });
});
