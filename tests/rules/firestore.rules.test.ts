// Firestore security rules tests (SEC-001, SEC-005, PAY-002). Run with: npm run test:rules
// Requires the Firestore emulator (started by `firebase emulators:exec`).
import { test, describe, before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where,
} from 'firebase/firestore';

let env: RulesTestEnvironment;
const A = 'patientA';
const B = 'patientB';
const D = 'dietician1';

before(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085').split(':');
  env = await initializeTestEnvironment({
    projectId: 'demo-nutrisnap',
    firestore: { host, port: Number(port), rules: fs.readFileSync(path.resolve(import.meta.dirname, '../../firestore.rules'), 'utf8') },
  });
});

after(async () => { await env?.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', A), { uid: A, role: 'patient', name: 'A', email: 'a@example.test' });
    await setDoc(doc(db, 'users', B), { uid: B, role: 'patient', name: 'B', email: 'b@example.test' });
    await setDoc(doc(db, 'users', D), { uid: D, role: 'dietician', name: 'D', email: 'd@example.test' });
    await setDoc(doc(db, 'patient_profiles', A), { id: A, name: 'A', currentWeightKg: 70, dieticianId: 'default_dietician' });
    await setDoc(doc(db, 'patient_profiles', B), { id: B, name: 'B', currentWeightKg: 80, dieticianId: 'default_dietician' });
    await setDoc(doc(db, 'food_logs', 'logA'), { patientId: A, food: 'rice' });
    await setDoc(doc(db, 'food_logs', 'logB'), { patientId: B, food: 'dal' });
    await setDoc(doc(db, 'progress_records', 'prB'), { patientId: B, weight: 79 });
    await setDoc(doc(db, 'meal_plans', 'planA'), { patientId: A, status: 'published', targets: {} });
    await setDoc(doc(db, 'patient_week_plans', 'wpB'), { patientId: B, status: 'published' });
    await setDoc(doc(db, 'queries', 'qA'), { patientId: A, question: 'qa', status: 'pending' });
    await setDoc(doc(db, 'queries', 'qB'), { patientId: B, question: 'qb', status: 'pending' });
    await setDoc(doc(db, 'ai_coach_messages', 'cA'), { patientId: A, question: 'x', aiDraft: 'y', approvedAnswer: '', status: 'pending' });
    await setDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'), { recipes: [{ name: 'r' }], count: 1 });
    await setDoc(doc(db, 'dietician_notes', 'noteB'), { patientId: B, note: 'private to B' });
    await setDoc(doc(db, 'dietician_notes', 'notifA'), { isNotification: true, recipientRole: 'patient', recipientId: A, patientId: A, read: false });
    await setDoc(doc(db, 'notifications', 'nB'), { recipientRole: 'patient', recipientId: B, patientId: B, read: false });
    await setDoc(doc(db, 'payments', 'pay1'), { uid: A });
  });
});

const as = (uid: string) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe('unauthenticated visitors (SEC-001)', () => {
  test('cannot read or list anything', async () => {
    const db = anon();
    for (const [c, id] of [['users', A], ['patient_profiles', A], ['food_logs', 'logA'], ['queries', 'qA'], ['dietician_notes', 'clinical_knowledge_base'], ['notifications', 'nB'], ['payments', 'pay1']]) {
      await assertFails(getDoc(doc(db, c, id)));
      await assertFails(getDocs(collection(db, c)));
    }
  });
  test('cannot write anything', async () => {
    const db = anon();
    await assertFails(setDoc(doc(db, 'users', 'x'), { role: 'patient' }));
    await assertFails(addDoc(collection(db, 'queries'), { patientId: A, question: 'spam', status: 'pending' }));
    await assertFails(setDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'), { recipes: [] }));
  });
});

describe('users and roles (SEC-005)', () => {
  test('patient reads own user doc but not another patient\'s', async () => {
    await assertSucceeds(getDoc(doc(as(A), 'users', A)));
    await assertFails(getDoc(doc(as(A), 'users', B)));
    await assertFails(getDocs(collection(as(A), 'users')));
  });
  test('patient cannot make themselves a dietician or grant themselves access', async () => {
    await assertFails(updateDoc(doc(as(A), 'users', A), { role: 'dietician' }));
    await assertFails(updateDoc(doc(as(A), 'users', A), { isVip: true }));
    await assertFails(updateDoc(doc(as(A), 'users', A), { isTestPatient: true }));
    await assertFails(updateDoc(doc(as(A), 'users', A), { subscription: { status: 'active', expiresAt: '2099-01-01' } }));
    await assertSucceeds(updateDoc(doc(as(A), 'users', A), { name: 'New name' }));
  });
  test('self-registration only as a plain patient', async () => {
    const n = 'newUser';
    await assertFails(setDoc(doc(as(n), 'users', n), { uid: n, role: 'dietician', name: 'x' }));
    await assertFails(setDoc(doc(as(n), 'users', n), { uid: n, role: 'patient', name: 'x', isVip: true }));
    await assertFails(setDoc(doc(as(n), 'users', 'someoneElse'), { uid: 'someoneElse', role: 'patient', name: 'x' }));
    await assertSucceeds(setDoc(doc(as(n), 'users', n), { uid: n, role: 'patient', name: 'x', email: 'n@example.test' }));
  });
  test('dietician can onboard patients and grant complimentary access, but not change roles or subscriptions', async () => {
    await assertSucceeds(setDoc(doc(as(D), 'users', 'p2'), { uid: 'p2', role: 'patient', name: 'P2' }));
    await assertFails(setDoc(doc(as(D), 'users', 'd2'), { uid: 'd2', role: 'dietician', name: 'D2' }));
    await assertSucceeds(updateDoc(doc(as(D), 'users', A), { isVip: true }));
    await assertFails(updateDoc(doc(as(D), 'users', A), { role: 'dietician' }));
    await assertFails(updateDoc(doc(as(D), 'users', A), { subscription: { status: 'active' } }));
  });
});

describe('patient profiles (SEC-001)', () => {
  test('patient reads/updates own profile only', async () => {
    await assertSucceeds(getDoc(doc(as(A), 'patient_profiles', A)));
    await assertFails(getDoc(doc(as(A), 'patient_profiles', B)));
    await assertFails(getDocs(collection(as(A), 'patient_profiles')));
    await assertSucceeds(setDoc(doc(as(A), 'patient_profiles', A), { currentWeightKg: 69 }, { merge: true }));
    await assertFails(setDoc(doc(as(A), 'patient_profiles', B), { currentWeightKg: 1 }, { merge: true }));
    await assertFails(updateDoc(doc(as(A), 'patient_profiles', A), { subscription: { status: 'active' } }));
    await assertFails(updateDoc(doc(as(A), 'patient_profiles', A), { dieticianId: 'other' }));
  });
  test('registration creates own profile without privileged fields', async () => {
    const n = 'newUser';
    await assertSucceeds(setDoc(doc(as(n), 'patient_profiles', n), { id: n, name: 'n', dieticianId: 'default_dietician', status: 'active' }));
    await assertFails(setDoc(doc(as(n), 'patient_profiles', 'n2'), { id: 'n2', name: 'n' }));
    await assertFails(setDoc(doc(as('n3'), 'patient_profiles', 'n3'), { id: 'n3', isVip: true }));
  });
  test('dietician lists and edits all profiles', async () => {
    await assertSucceeds(getDocs(collection(as(D), 'patient_profiles')));
    await assertSucceeds(updateDoc(doc(as(D), 'patient_profiles', B), { needsAttention: true }));
  });
});

describe('patient-owned records: food logs, progress, monthly parameters', () => {
  test('own-scoped queries work; unscoped and cross-patient access fails', async () => {
    await assertSucceeds(getDocs(query(collection(as(A), 'food_logs'), where('patientId', '==', A))));
    await assertFails(getDocs(collection(as(A), 'food_logs')));
    await assertFails(getDocs(query(collection(as(A), 'food_logs'), where('patientId', '==', B))));
    await assertFails(getDoc(doc(as(A), 'food_logs', 'logB')));
    await assertFails(getDoc(doc(as(A), 'progress_records', 'prB')));
  });
  test('create only for self; cannot move a record to another patient', async () => {
    await assertSucceeds(addDoc(collection(as(A), 'food_logs'), { patientId: A, food: 'apple' }));
    await assertFails(addDoc(collection(as(A), 'food_logs'), { patientId: B, food: 'apple' }));
    await assertFails(updateDoc(doc(as(A), 'food_logs', 'logA'), { patientId: B }));
    await assertFails(deleteDoc(doc(as(A), 'food_logs', 'logB')));
    await assertSucceeds(deleteDoc(doc(as(A), 'food_logs', 'logA')));
    await assertSucceeds(addDoc(collection(as(A), 'monthly_parameters'), { patientId: A, waist: 80 }));
    await assertSucceeds(addDoc(collection(as(A), 'progress_records'), { patientId: A, weight: 69 }));
  });
  test('daily checklist doc (fixed id): read when missing, write own', async () => {
    const id = `checklist_${A}_2026-10-16`;
    await assertSucceeds(getDoc(doc(as(A), 'food_logs', id)));
    await assertSucceeds(setDoc(doc(as(A), 'food_logs', id), { patientId: A, date: '2026-10-16', items: [], type: 'checklist' }));
    await assertSucceeds(setDoc(doc(as(A), 'food_logs', id), { patientId: A, date: '2026-10-16', items: [{ x: 1 }], type: 'checklist' }));
    await assertFails(setDoc(doc(as(B), 'food_logs', id), { patientId: B, date: '2026-10-16', items: [] }));
  });
});

describe('plans: dietician-authored', () => {
  test('patient reads own plan and may only mark it read', async () => {
    await assertSucceeds(getDoc(doc(as(A), 'meal_plans', 'planA')));
    await assertSucceeds(getDocs(query(collection(as(A), 'meal_plans'), where('patientId', '==', A))));
    await assertSucceeds(updateDoc(doc(as(A), 'meal_plans', 'planA'), { patientRead: true }));
    await assertFails(updateDoc(doc(as(A), 'meal_plans', 'planA'), { targets: { calories: 9999 } }));
    await assertFails(addDoc(collection(as(A), 'meal_plans'), { patientId: A, status: 'published' }));
    await assertFails(getDoc(doc(as(A), 'patient_week_plans', 'wpB')));
    await assertSucceeds(addDoc(collection(as(D), 'patient_week_plans'), { patientId: A, status: 'published' }));
  });
});

describe('consultation queries and AI coach messages', () => {
  test('patient creates a pending query for self only and cannot answer it', async () => {
    await assertSucceeds(addDoc(collection(as(A), 'queries'), { patientId: A, question: 'q', status: 'pending' }));
    await assertFails(addDoc(collection(as(A), 'queries'), { patientId: B, question: 'q', status: 'pending' }));
    await assertFails(addDoc(collection(as(A), 'queries'), { patientId: A, question: 'q', status: 'answered', reply: 'fake' }));
    await assertFails(updateDoc(doc(as(A), 'queries', 'qA'), { reply: 'fake answer', status: 'answered' }));
    await assertSucceeds(updateDoc(doc(as(A), 'queries', 'qA'), { patientRead: true }));
    await assertFails(getDoc(doc(as(A), 'queries', 'qB')));
    await assertSucceeds(updateDoc(doc(as(D), 'queries', 'qB'), { reply: 'answer', status: 'answered' }));
  });
  test('patient cannot fake an approved coach answer', async () => {
    await assertSucceeds(addDoc(collection(as(A), 'ai_coach_messages'), { patientId: A, question: 'q', aiDraft: 'd', approvedAnswer: '', status: 'pending' }));
    await assertFails(addDoc(collection(as(A), 'ai_coach_messages'), { patientId: A, question: 'q', aiDraft: 'd', approvedAnswer: 'eat only fruit', status: 'approved' }));
    await assertFails(updateDoc(doc(as(A), 'ai_coach_messages', 'cA'), { status: 'approved', approvedAnswer: 'x' }));
    await assertSucceeds(updateDoc(doc(as(D), 'ai_coach_messages', 'cA'), { status: 'approved', approvedAnswer: 'ok' }));
  });
});

describe('dietician_notes and notifications', () => {
  test('knowledge base: everyone signed in reads, only dietician writes', async () => {
    await assertSucceeds(getDoc(doc(as(A), 'dietician_notes', 'clinical_knowledge_base')));
    await assertFails(setDoc(doc(as(A), 'dietician_notes', 'clinical_knowledge_base'), { recipes: [] }));
    await assertSucceeds(setDoc(doc(as(D), 'dietician_notes', 'clinical_knowledge_base'), { recipes: [], count: 0 }));
  });
  test('patient sees own notes/notifications only', async () => {
    await assertSucceeds(getDocs(query(collection(as(A), 'dietician_notes'), where('patientId', '==', A))));
    await assertFails(getDocs(collection(as(A), 'dietician_notes')));
    await assertFails(getDoc(doc(as(A), 'dietician_notes', 'noteB')));
    await assertFails(getDoc(doc(as(A), 'notifications', 'nB')));
  });
  test('patient notifications: to dietician or self only; may mark read or dismiss own', async () => {
    await assertSucceeds(setDoc(doc(as(A), 'dietician_notes', 'n1'), { isNotification: true, recipientRole: 'dietician', patientId: A, type: 'QUERY_SUBMITTED', read: false }));
    await assertSucceeds(setDoc(doc(as(A), 'notifications', 'n1'), { recipientRole: 'dietician', patientId: A, read: false }));
    await assertFails(setDoc(doc(as(A), 'dietician_notes', 'n2'), { isNotification: true, recipientRole: 'patient', recipientId: B, patientId: A }));
    await assertFails(setDoc(doc(as(A), 'notifications', 'n2'), { recipientRole: 'patient', recipientId: B, patientId: B }));
    await assertFails(setDoc(doc(as(A), 'dietician_notes', 'n3'), { note: 'not a notification', patientId: A }));
    await assertSucceeds(updateDoc(doc(as(A), 'dietician_notes', 'notifA'), { read: true }));
    await assertFails(updateDoc(doc(as(A), 'dietician_notes', 'notifA'), { message: 'changed' }));
    await assertFails(deleteDoc(doc(as(A), 'notifications', 'nB')));
    await assertSucceeds(deleteDoc(doc(as(A), 'dietician_notes', 'notifA')));
  });
  test('the app\'s patient notification queries are allowed', async () => {
    for (const c of ['queries', 'meal_plans', 'dietician_notes']) {
      await assertSucceeds(getDocs(query(collection(as(A), c), where('patientId', '==', A))));
    }
  });
  test('dietician reads all', async () => {
    for (const c of ['queries', 'meal_plans', 'dietician_notes', 'notifications', 'food_logs', 'ai_coach_messages']) {
      await assertSucceeds(getDocs(collection(as(D), c)));
    }
  });
});

describe('server-only and unknown collections', () => {
  test('payments and push subscriptions are closed even to dieticians', async () => {
    await assertFails(getDoc(doc(as(D), 'payments', 'pay1')));
    await assertFails(setDoc(doc(as(A), 'payments', 'pay2'), { uid: A }));
    await assertFails(setDoc(doc(as(D), 'push_subscriptions', 's'), { x: 1 }));
  });
  test('unknown collections are denied', async () => {
    await assertFails(setDoc(doc(as(D), 'anything', 'x'), { a: 1 }));
    await assertFails(getDocs(collection(as(D), 'anything')));
  });
});
