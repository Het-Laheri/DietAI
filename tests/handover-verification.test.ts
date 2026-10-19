import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  CLINICAL_BIOMARKER_DEFINITIONS,
  validateLabBiomarkers,
  evaluateLabBiomarkers,
  type BiomarkerKey,
} from '../src/services/db.js';
import { isPatientSubscribed } from '../src/services/subscription.js';
import {
  __setSecurityTestHooks,
  isDataSubscribedOrVip,
  assertSubscribedOrVip,
  HttpError,
} from '../api/_lib/security.js';
import changePasswordHandler, {
  validatePasswordChangeInput,
  __resetChangePasswordRateLimitForTests,
} from '../api/auth/change-password.js';
import scanFoodHandler from '../api/ai/scan-food.js';
import {
  LEAD_DIETICIAN_UID,
  LEAD_DIETICIAN_EMAIL,
  VIP_DEMO_EMAIL,
  BASIC_DEMO_EMAIL,
  CONFIRMED_NUTRISNAP_TEST_UIDS,
  CONFIRMED_AUTH_ONLY_TEST_UIDS,
  ORPHANED_TEST_PATIENT_IDS,
  buildVipSyntheticData,
  buildBasicSyntheticData,
} from '../scripts/handover-accounts-and-seed.js';

function createMockRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: any = undefined;
  let ended = false;

  const res = {
    setHeader(k: string, v: string) {
      headers[k.toLowerCase()] = v;
      return res;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: any) {
      jsonBody = payload;
      ended = true;
      return res;
    },
    end() {
      ended = true;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return jsonBody;
    },
    get ended() {
      return ended;
    },
    get headers() {
      return headers;
    },
  };
  return res;
}

beforeEach(() => {
  __resetChangePasswordRateLimitForTests();
  __setSecurityTestHooks({});
});

afterEach(() => {
  __setSecurityTestHooks({});
});

// ─── OBJECTIVE 5: 13 CLINICAL BIOMARKERS AUDIT & VALIDATION ──────────────────

test('OBJ-5: CLINICAL_BIOMARKER_DEFINITIONS defines all 13 authoritative biomarkers', () => {
  assert.equal(CLINICAL_BIOMARKER_DEFINITIONS.length, 13);

  const expectedKeys: BiomarkerKey[] = [
    'hba1c',
    'haemoglobin',
    'cholesterol',
    'triglycerides',
    'hdl',
    'ldl',
    'sgpt',
    'sgot',
    'sodium',
    'potassium',
    'creatinine',
    'bun',
    'uricAcid',
  ];

  const actualKeys = CLINICAL_BIOMARKER_DEFINITIONS.map((d) => d.key);
  assert.deepEqual(actualKeys, expectedKeys);

  for (const def of CLINICAL_BIOMARKER_DEFINITIONS) {
    assert.ok(def.name.length > 0, `${def.key} must have a name`);
    assert.ok(def.unit.length > 0, `${def.key} must have a unit`);
    assert.ok(def.normalRange.length > 0, `${def.key} must have a reference range`);
    assert.ok(def.min > 0 && def.max > def.min, `${def.key} must have valid physiological bounds`);
  }
});

test('OBJ-5: validateLabBiomarkers validates all 13 biomarkers and never confuses missing with 0', () => {
  const fullRaw: Record<string, string> = {
    hba1c: '5.8',
    haemoglobin: '14.2',
    cholesterol: '185',
    triglycerides: '132',
    hdl: '48',
    ldl: '110',
    sgpt: '29',
    sgot: '25',
    sodium: '140',
    potassium: '4.3',
    creatinine: '0.91',
    bun: '14',
    uricAcid: '5.5',
  };

  const fullResult = validateLabBiomarkers(fullRaw, [], { testDate: '2026-10-15' });
  assert.equal(fullResult.valid, true);
  assert.equal(fullResult.measuredCount, 13);
  assert.equal(fullResult.unavailableCount, 0);
  assert.equal(fullResult.sanitized.hba1c, 5.8);
  assert.equal(fullResult.sanitized.uricAcid, 5.5);
  assert.equal(fullResult.sanitized.unavailableBiomarkers, undefined);

  // Partial entry: empty strings must NOT be coerced to 0; they must be recorded in unavailableBiomarkers
  const partialResult = validateLabBiomarkers(
    { hba1c: '6.1', haemoglobin: '13.4', cholesterol: '' },
    ['bun', 'uricAcid']
  );
  assert.equal(partialResult.valid, true);
  assert.equal(partialResult.measuredCount, 2);
  assert.equal(partialResult.unavailableCount, 11);
  assert.equal(partialResult.sanitized.hba1c, 6.1);
  assert.equal(partialResult.sanitized.haemoglobin, 13.4);
  assert.equal(partialResult.sanitized.cholesterol, undefined);
  assert.ok(partialResult.sanitized.unavailableBiomarkers?.includes('cholesterol'));
  assert.ok(partialResult.sanitized.unavailableBiomarkers?.includes('bun'));

  // Invalid values: negative, NaN, and out-of-range values must be rejected
  const invalidResult = validateLabBiomarkers({
    hba1c: '-5.0',
    haemoglobin: 'not-a-number',
    cholesterol: '9999',
    sodium: '0',
  });
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.hba1c);
  assert.ok(invalidResult.errors.haemoglobin);
  assert.ok(invalidResult.errors.cholesterol);
  assert.ok(invalidResult.errors.sodium);
});

test('OBJ-5: evaluateLabBiomarkers never fabricates DEFAULT_SAMPLE_LABS values when patient labs are missing', () => {
  const emptyEvaluation = evaluateLabBiomarkers(undefined, 'Female');
  assert.equal(emptyEvaluation.length, 0, 'Undefined labs must not fabricate 13 sample biomarkers');

  const partialEvaluation = evaluateLabBiomarkers({ hba1c: 6.2, haemoglobin: 13.0 }, 'Female');
  assert.equal(partialEvaluation.length, 2, 'Partial labs must only evaluate measured biomarkers');
  assert.deepEqual(
    partialEvaluation.map((i) => i.key),
    ['hba1c', 'haemoglobin']
  );
});

// ─── OBJECTIVE 2: CHANGE PASSWORD VALIDATION & API ENFORCEMENT ───────────────

test('OBJ-2: validatePasswordChangeInput enforces password policy and rejects invalid inputs', () => {
  assert.equal(validatePasswordChangeInput({}).valid, false);
  assert.match(
    validatePasswordChangeInput({
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      confirmPassword: 'DifferentPassword123',
    }).error || '',
    /do not match/i
  );
  assert.match(
    validatePasswordChangeInput({
      currentPassword: 'SamePassword123',
      newPassword: 'SamePassword123',
      confirmPassword: 'SamePassword123',
    }).error || '',
    /different from your current password/i
  );
  assert.match(
    validatePasswordChangeInput({
      currentPassword: 'OldPassword123',
      newPassword: 'Short1',
      confirmPassword: 'Short1',
    }).error || '',
    /between 8 and 128/i
  );
  assert.match(
    validatePasswordChangeInput({
      currentPassword: 'OldPassword123',
      newPassword: 'alllowercase123',
      confirmPassword: 'alllowercase123',
    }).error || '',
    /uppercase/i
  );
  assert.equal(
    validatePasswordChangeInput({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewStrongPassword2026!',
      confirmPassword: 'NewStrongPassword2026!',
    }).valid,
    true
  );
});

test('OBJ-2: /api/auth/change-password verifies current password, updates & revokes tokens, and rate-limits', async () => {
  let updatedUid = '';
  let updatedPw = '';
  let recordedAt = '';

  __setSecurityTestHooks({
    verifyIdToken: async (token) => {
      if (token === 'valid-token') return { uid: 'user-123', email: 'patient@example.com' };
      throw new HttpError(401, 'Invalid token');
    },
    getRole: async () => 'patient',
    verifyCurrentPassword: async (_email, currentPw) => currentPw === 'CorrectCurrent123!',
    updatePasswordAndRevoke: async (uid, newPw) => {
      updatedUid = uid;
      updatedPw = newPw;
    },
    recordPasswordUpdate: async (_uid, iso) => {
      recordedAt = iso;
    },
  });

  // 1. Reject wrong current password with 401
  const wrongPwRes = createMockRes();
  await changePasswordHandler(
    {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: {
        currentPassword: 'WrongCurrentPassword1!',
        newPassword: 'NewValidPassword2026!',
        confirmPassword: 'NewValidPassword2026!',
      },
    },
    wrongPwRes
  );
  assert.equal(wrongPwRes.statusCode, 401);
  assert.match(wrongPwRes.body?.error || '', /Current password is incorrect/i);

  // 2. Accept valid password change and revoke refresh tokens
  const okRes = createMockRes();
  await changePasswordHandler(
    {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: {
        currentPassword: 'CorrectCurrent123!',
        newPassword: 'NewValidPassword2026!',
        confirmPassword: 'NewValidPassword2026!',
      },
    },
    okRes
  );
  assert.equal(okRes.statusCode, 200);
  assert.equal(okRes.body?.success, true);
  assert.equal(okRes.body?.sessionsRevoked, true);
  assert.equal(updatedUid, 'user-123');
  assert.equal(updatedPw, 'NewValidPassword2026!');
  assert.ok(recordedAt.length > 0);
  assert.ok(!JSON.stringify(okRes.body).includes('NewValidPassword2026!'), 'Response must never echo password');

  // 3. Rate limit on 6th attempt in 15-minute window (2 already used above -> 3 more allowed, 6th returns 429)
  for (let i = 0; i < 3; i++) {
    const r = createMockRes();
    await changePasswordHandler(
      {
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: {
          currentPassword: 'WrongPassword1!',
          newPassword: 'NewValidPassword2026!',
          confirmPassword: 'NewValidPassword2026!',
        },
      },
      r
    );
    assert.equal(r.statusCode, 401);
  }

  const rateLimitedRes = createMockRes();
  await changePasswordHandler(
    {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: {
        currentPassword: 'CorrectCurrent123!',
        newPassword: 'NewValidPassword2026!',
        confirmPassword: 'NewValidPassword2026!',
      },
    },
    rateLimitedRes
  );
  assert.equal(rateLimitedRes.statusCode, 429);
});

// ─── OBJECTIVES 3 & 4: DEMO ACCOUNTS, VIP ENTITLEMENT & SYNTHETIC HISTORY ────

test('OBJ-3 & OBJ-4: VIP and Basic synthetic demo builders produce complete, coherent, schema-valid records', () => {
  const vip = buildVipSyntheticData('vip-demo-uid');
  const basic = buildBasicSyntheticData('basic-demo-uid');

  // VIP Account checks
  assert.equal(vip.userDoc.email, VIP_DEMO_EMAIL);
  assert.equal(vip.userDoc.isVip, true);
  assert.equal(vip.userDoc.isSyntheticDemo, true);
  assert.equal(vip.userDoc.subscription.status, 'active');
  assert.equal(vip.profileDoc.labHistory?.length, 3, 'VIP demo must have 3 dated biomarker panels');

  const vipValidation = validateLabBiomarkers(vip.profileDoc.labBiomarkers as any);
  assert.equal(vipValidation.valid, true);
  assert.equal(vipValidation.measuredCount, 13, 'VIP demo must have all 13 biomarkers populated');
  assert.equal(vip.mealPlanDoc.days.length, 7, 'VIP demo must have a 7-day published meal plan');
  assert.ok(vip.foodLogs.length >= 6, 'VIP demo must have multi-day food logs');
  assert.ok(vip.progressRecords.length >= 5, 'VIP demo must have multi-week progress records');
  assert.equal(vip.monthlyParameters.length, 3, 'VIP demo must have 3 monthly parameter records');

  // Basic Account checks
  assert.equal(basic.userDoc.email, BASIC_DEMO_EMAIL);
  assert.equal(basic.userDoc.isVip, false);
  assert.equal(basic.userDoc.isTestPatient, false);
  assert.equal(basic.userDoc.subscription, null);
  assert.equal(basic.profileDoc.isVip, false);
  assert.equal(basic.profileDoc.subscription, null);

  // Client-side & server-side entitlement checks
  assert.equal(isPatientSubscribed(vip.userDoc as any), true);
  assert.equal(isDataSubscribedOrVip(vip.userDoc), true);
  assert.equal(isPatientSubscribed(basic.userDoc as any), false);
  assert.equal(isDataSubscribedOrVip(basic.userDoc), false);
});

test('OBJ-3: Basic Demo Client is rejected with 403 when calling /api/ai/scan-food directly', async () => {
  __setSecurityTestHooks({
    verifyIdToken: async (token) => {
      if (token === 'basic-token') return { uid: 'basic-demo-uid', email: BASIC_DEMO_EMAIL };
      if (token === 'vip-token') return { uid: 'vip-demo-uid', email: VIP_DEMO_EMAIL };
      throw new HttpError(401, 'Invalid token');
    },
    getRole: async () => 'patient',
    isUserSubscribedOrVip: async (uid) => uid === 'vip-demo-uid',
  });

  // Basic user must be blocked by assertSubscribedOrVip with 403
  const basicRes = createMockRes();
  await scanFoodHandler(
    {
      method: 'POST',
      headers: { authorization: 'Bearer basic-token' },
      body: { image: 'data:image/jpeg;base64,' + 'A'.repeat(128) },
    },
    basicRes
  );
  assert.equal(basicRes.statusCode, 403);
  assert.match(basicRes.body?.error || '', /Active VIP subscription required/i);

  // Direct assertSubscribedOrVip check for VIP vs Basic
  await assert.doesNotReject(() =>
    assertSubscribedOrVip({ uid: 'vip-demo-uid', role: 'patient', email: VIP_DEMO_EMAIL })
  );
  await assert.rejects(
    () => assertSubscribedOrVip({ uid: 'basic-demo-uid', role: 'patient', email: BASIC_DEMO_EMAIL }),
    (err: any) => err instanceof HttpError && err.status === 403
  );
});

// ─── OBJECTIVE 1: ACCOUNT CLEANUP SAFEGUARDS ─────────────────────────────────

test('OBJ-1: Lead Dietician account is strictly protected from test account cleanup lists', () => {
  const allTargets = [...CONFIRMED_NUTRISNAP_TEST_UIDS, ...CONFIRMED_AUTH_ONLY_TEST_UIDS];
  for (const target of allTargets) {
    assert.notEqual(target.uid, LEAD_DIETICIAN_UID, 'Lead Dietician UID must never be in cleanup list');
    assert.notEqual(
      target.email.toLowerCase(),
      LEAD_DIETICIAN_EMAIL.toLowerCase(),
      'Lead Dietician email must never be in cleanup list'
    );
  }
  assert.ok(!ORPHANED_TEST_PATIENT_IDS.includes(LEAD_DIETICIAN_UID));
  assert.ok(!ORPHANED_TEST_PATIENT_IDS.includes('clinical_knowledge_base'));
});
