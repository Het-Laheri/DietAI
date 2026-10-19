# NutriSnap — Final Production Handover, Account Cleanup & Onboarding Fix Report

**Application:** NutriSnap (`https://www.nutrisnap.co.in`)  
**Handover Date:** 2026-10-19  
**Firebase Project:** `careclarity-e67bb`  
**NutriSnap Firestore Database ID:** `ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf`  
**Status:** Production-Ready / Verified (`82/82` automated tests passing, `0` TypeScript errors)

---

## 1. Executive Summary

NutriSnap has been audited, hardened, cleaned up, and verified for production handover across all seven engineering objectives:

1. **Test Account & Orphaned Record Cleanup (Objective 1):** Audited all Firebase Authentication accounts and both Firestore databases (`(default)` and `ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf`). Created a full reversible snapshot prior to cleanup, preserved the Lead Dietician (`NutriSnap2003@gmail.com`, UID `Qw9mhpOd32TpKdEHWE1M4OOTUyw1`), preserved all genuine client accounts and the clinical recipe knowledge base (`dietician_notes/clinical_knowledge_base`), removed **26 confirmed obsolete test/dummy accounts** (`13` NutriSnap test accounts + `13` unreferenced Auth-only test accounts), and cleaned up orphaned test records.
2. **Authenticated Change Password Flow (Objective 2):** Implemented end-to-end authenticated password change on both the server ([`api/auth/change-password.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/auth/change-password.ts) and [`server.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/server.ts)) and client ([`src/components/ChangePasswordModal.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/components/ChangePasswordModal.tsx)), accessible from the Patient Sidebar ([`src/pages/PatientDashboard.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/PatientDashboard.tsx)), Patient Profile Modal ([`src/components/PatientProfileModal.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/components/PatientProfileModal.tsx)), and Dietician Workspace Sidebar ([`src/pages/DieticianDashboard.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/DieticianDashboard.tsx)).
3. **Dedicated Client Demo Accounts (Objective 3):** Provisioned exactly two dedicated client demonstration accounts via [`scripts/handover-accounts-and-seed.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/scripts/handover-accounts-and-seed.ts):
   - **Account A — VIP Demo Client:** `vip.demo@nutrisnap.co.in` (UID `LUXRdws06Jf52OLhtl59R6S7KQg1`, *"Aarav Sharma (VIP Demo)"*) with full server-enforced VIP entitlement (`isVip: true` and active 3-month subscription record).
   - **Account B — Basic Demo Client:** `basic.demo@nutrisnap.co.in` (UID `HHCkvJHxhIcvQm4qD6fLPMqYkBq2`, *"Meera Nair (Basic Demo)"*) with standard/basic entitlement (`isVip: false`, `subscription: null`), locked VIP UI paywalls, and server-side `403` enforcement on `/api/ai/scan-food`.
4. **Realistic, Varied VIP Synthetic Clinical History (Objective 4):** Populated Account A with deterministic synthetic records (`isSyntheticDemo: true`) spanning 8 weeks: all 13 clinical biomarkers across 3 dated lab panels (`2026-08-15`, `2026-09-15`, `2026-10-15`), a 7-day published clinical meal plan (`meal_plans` & `patient_week_plans`), 6 multi-day food diary logs (`food_logs`), 5 weekly `progress_records`, 3 `monthly_parameters` records, answered consultation `queries`, and clinical `dietician_notes`.
5. **13-Biomarker Onboarding & Profile Persistence Fix (Objective 5):** Defined the authoritative 13-biomarker schema (`CLINICAL_BIOMARKER_DEFINITIONS`) and validator ([`validateLabBiomarkers`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/services/db.ts#L369-L426)) in [`src/services/db.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/services/db.ts), updated onboarding Step 4 in [`src/pages/Login.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/Login.tsx) and profile editing in [`src/components/PatientProfileModal.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/components/PatientProfileModal.tsx) to capture all 13 biomarkers with per-biomarker and full-panel `"Skip / N/A"` support (`unavailableBiomarkers`), `sessionStorage` draft persistence across step navigation/page refresh, post-write Firestore read-back verification in [`registerPatient`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/services/db.ts), and eliminated silent merging of `DEFAULT_SAMPLE_LABS` into real patient records.
6. **Full Regression & Handover Test Suite (Objective 6):** Added [`tests/handover-verification.test.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/tests/handover-verification.test.ts) and verified `82/82` passing tests across 7 suites plus clean production builds (`npm run build`).

---

## 2. Environment and Architecture Overview

| Layer | Technology / Configuration |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, React Router 7, Lucide Icons, Recharts |
| **Backend / API** | Vercel Serverless Functions (`api/**/*.ts`) + Express local/production server ([`server.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/server.ts)) |
| **Authentication** | Firebase Authentication (Email/Password + Firebase Admin token verification & session revocation) |
| **Database** | Cloud Firestore named database `ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf` (isolated from `(default)`) |
| **Security Rules** | [`firestore.rules`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/firestore.rules) enforcing role-based access and protecting privileged fields (`role`, `isVip`, `isTestPatient`, `subscription`, `dieticianId`) |
| **Payments** | Razorpay server-side order creation ([`api/create-order.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/create-order.ts)) and HMAC signature verification ([`api/verify-payment.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/verify-payment.ts)) |
| **AI Services** | Google Gemini (`@google/genai`) server-side endpoints under `api/ai/*` protected by [`guard`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/_lib/security.ts#L176-L196) and [`assertSubscribedOrVip`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/_lib/security.ts#L222-L239) |

---

## 3. Account Cleanup Before-and-After Summary

| Metric | Before Cleanup | Removed | Created (Demo) | After Cleanup |
| :--- | :---: | :---: | :---: | :---: |
| **Firebase Auth Accounts (Total Project)** | 56 | -26 | +2 | **32** |
| **NutriSnap `users` Collection** | 28 | -13 | +2 | **17** |
| **NutriSnap `patient_profiles` Collection** | 26 | -12 | +2 | **16** |
| **Lead Dietician (`NutriSnap2003@gmail.com`)** | 1 (Active) | 0 | 0 | **1 (Active, Untouched)** |
| **Designated Handover Demo Accounts** | 0 | 0 | +2 | **2 (`vip.demo` & `basic.demo`)** |
| **Orphaned Test Query / Note Documents** | 3 | -3 | 0 | **0** |
| **Clinical Recipe Knowledge Base (`clinical_knowledge_base`)** | 1 (1,210 recipes) | 0 | 0 | **1 (Preserved Untouched)** |

---

## 4. Accounts Preserved vs Deleted vs Flagged for Manual Review

### 4.1 Lead Dietician Account (Preserved Untouched)
- **UID:** `Qw9mhpOd32TpKdEHWE1M4OOTUyw1` (`NutriSnap2003@gmail.com`, Role: `dietician`, Name: `Lead Dietician`).
- Identity, credentials, role, permissions, and associated clinical records were verified before and after cleanup and remained completely untouched.

### 4.2 Confirmed Obsolete Test Accounts Deleted (26 Total)
1. **13 NutriSnap Test/Dummy Accounts (Deleted from Auth + all NutriSnap Firestore collections):**
   - `6aOvo8r88bO44FVvr80mGaAGO9q1` (`admin@nutrisnap.demo` — obsolete `.demo` dietician)
   - `FT2OTI0loQMeJq3m6wlFaMLn4E42` (`patient@nutrisnap.demo` — obsolete `.demo` patient)
   - `yxY49cJmPcR814qYq9w2uxpsHsQ2` (`testpatient@nutrisnap.com` — legacy test patient)
   - `2QdCObsTbKefNFSkdEXu0qokwBh1` (`mealstest@nutrisnap.com` — automated meals test account)
   - `nc5gu1LvAldj12wH2tH8KIoxi732` (`sneha@demo.com` — seeded `@demo.com` dummy)
   - `7lkMt32aSNYL7KqfEBUEPze3V9g1` (`priya@demo.com` — seeded `@demo.com` dummy #1)
   - `0v89U4RV5nVqGS9HYgOEgMlOnou2` (`priya@demo.com` — seeded `@demo.com` dummy #2)
   - `6Lxb5YK8BCRvH6X1085837ujVTS2` (`amit@demo.com` — seeded `@demo.com` dummy #1)
   - `0yNoHBeacLeHBLSNOrGurMNuuhT2` (`amit@demo.com` — seeded `@demo.com` dummy #2)
   - `NWqkd8TcHkVv17qYJGJTdt0IxpB3` (`rahul@demo.com` — seeded `@demo.com` dummy #1)
   - `CKx8NIsnuuU28MJ2QWyj2O16ybc2` (`rahul@demo.com` — seeded `@demo.com` dummy #2)
   - `PRWMAiCXcySOvy2XORQQsXKGVwv1` (`lalalalal@lalalla.com` — keyboard-smash dummy)
   - `p5DGOHc9cegEer5BJnaVgCCaCtm2` (`lalala@lalala.com` — keyboard-smash dummy)
2. **13 Unreferenced Auth-Only Test Accounts (0 records in `(default)` and 0 records in NutriSnap DB):**
   - `00rRDgD5mOUoWoO1iPRLAs9gwE32` (`hi@hi.com`), `3om13CspSsPMkZQ0iRlYwaClUbS2` (`test@care4.com`), `7s584uhlUZOlPW0ITcRG8ra2ZkD2` (`testuser23@careclarity.com`), `A8IrgcGxibZpoASYSBGBtTquE4w1` (`testfix2026@test.com`), `AB2S7zV4RQU0tS8CinZ8DPUa9Hs1` (`testuser2026@test.com`), `Grp0M2RPiTZeKpJC4doSfnAuctu2` (`error_trigger@example.com`), `KrGbK84M4MVOXhL6X1ooKxy5kxj1` (`test.tese@test.com`), `g07lPteI4tero9j3ip0idg5bG4f2` (`test@care.com`), `mUWvfijC7Sdk6hTZVA7P2ZqdSbz1` (`test_final_debug@example.com`), `o2CpOwUAyyfv8magAqaxMnqAD083` (`testuser@example.com`), `tDiHqQw7Chd4qSd6cQkZHVeamb62` (`het@tester.com`), `ypPup4BOrDYXQ3dvrgaPpPOmVD32` (`verified_fix@example.com`), `z2nvkkTWPdhY5ggUdxATso85L3K3` (`test_debug_jetski_4@example.com`).

### 4.3 Preserved Accounts & Accounts Flagged for Manual Review (Objective 1 Req. 7)
- **Preserved Genuine Client Accounts:** All 14 personal-domain client accounts in NutriSnap (`users` / `patient_profiles`) and all 15 accounts belonging to the sibling CareClarity `(default)` database were preserved untouched.
- **Flagged for Owner Manual Review (Not Auto-Deleted per Safety Policy):**
  - Developer/owner personal email accounts in NutriSnap (`UID: 0uD...`, `UID: Jd4...`, `UID: d7A...`, `UID: u9m...` using personal `@gmail.com` / `@niharrika.com` addresses) were preserved untouched because they use real personal email domains. The owner may retain or archive them via the Dietician Caseload view as desired.
  - Three `@test.com` Auth accounts (`lXbrP8iCFpbi5zEtjO8HhYY7GVk1`, `atXXisYs9CcsL0XBeHAcMpEUd902`, `eY3f7oiZ7OSZrg5NtE0ETQMqAPb2`) have zero records in NutriSnap's database (`ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf`) but are referenced by `appointments` in the sibling `(default)` database; they were preserved to avoid cross-application side effects.

---

## 5. Change Password Implementation Details

- **Frontend UI ([`src/components/ChangePasswordModal.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/components/ChangePasswordModal.tsx)):**
  - Accessible from:
    1. Patient Dashboard Sidebar (`Change Password` button above `Sign Out` in [`src/pages/PatientDashboard.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/PatientDashboard.tsx))
    2. Patient Profile Modal (`Change Password` button in the header of [`src/components/PatientProfileModal.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/components/PatientProfileModal.tsx))
    3. Dietician Workspace Sidebar (`Change Password` button above `Sign Out` in [`src/pages/DieticianDashboard.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/DieticianDashboard.tsx))
  - Includes current password, new password, confirm new password, independent show/hide password toggles, real-time 5-level strength meter and requirement checklist (`8–128` chars, uppercase, lowercase, number, different from current, confirmation match), inline validation errors, loading/success/failure states, and graceful detection of external/social identity provider accounts (`providerData` check).
- **Flow & Security ([`api/auth/change-password.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/auth/change-password.ts)):**
  1. Verifies caller authentication token via [`guard(req, res, { methods: ['POST'] })`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/_lib/security.ts#L176-L196).
  2. Applies per-UID server-side rate limiting (`5` attempts per `15` minutes, returning HTTP `429`).
  3. Validates policy via [`validatePasswordChangeInput`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/auth/change-password.ts#L39-L73).
  4. Verifies the current password and updates the password using Firebase Authentication's scrypt hashing, calls `adminAuth.revokeRefreshTokens(caller.uid)` to invalidate other sessions/refresh tokens, and re-authenticates the active client session seamlessly.
  5. Writes only `{ passwordUpdatedAt: <ISO timestamp> }` to `users/{uid}`—never logging or storing plaintext passwords.

---

## 6. Demo Accounts Overview and Owner Management Guide

| Attribute | Account A — VIP Demo Client | Account B — Basic Demo Client |
| :--- | :--- | :--- |
| **Email** | `vip.demo@nutrisnap.co.in` | `basic.demo@nutrisnap.co.in` |
| **Display Name** | `Aarav Sharma (VIP Demo)` | `Meera Nair (Basic Demo)` |
| **Firebase Auth UID** | `LUXRdws06Jf52OLhtl59R6S7KQg1` | `HHCkvJHxhIcvQm4qD6fLPMqYkBq2` |
| **Entitlement Tier** | **VIP / Active Subscription** (`isVip: true`, `3_months` plan) | **Standard / Basic** (`isVip: false`, `subscription: null`) |
| **Assigned Dietician** | Lead Dietician (`Qw9mhpOd32TpKdEHWE1M4OOTUyw1`) | Lead Dietician (`Qw9mhpOd32TpKdEHWE1M4OOTUyw1`) |
| **Synthetic Marker** | `isDemoAccount: true`, `isSyntheticDemo: true`, `demoTier: 'vip'` | `isDemoAccount: true`, `isSyntheticDemo: true`, `demoTier: 'basic'` |
| **Credentials Location** | Stored locally in gitignored `SECRETS.txt` (never committed to Git) | Stored locally in gitignored `SECRETS.txt` (never committed to Git) |

### How the Owner Can Rotate Demo Passwords
1. **Via the Application UI:** Sign in as `vip.demo@nutrisnap.co.in` or `basic.demo@nutrisnap.co.in`, click **Change Password** in the sidebar, and set a new password.
2. **Via the Admin CLI Script:** Run:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="<path-to-service-account.json>"
   npx tsx scripts/handover-accounts-and-seed.ts --rotate-passwords
   ```
   You can also supply custom passwords via `$env:VIP_DEMO_PASSWORD` and `$env:BASIC_DEMO_PASSWORD` before running `--reseed-demo` or `--rotate-passwords`. The updated credentials are written to gitignored `SECRETS.txt`.

---

## 7. VIP Entitlement Verification Trace

VIP entitlement is enforced end-to-end across all 6 layers (never just a frontend badge):

1. **Database / Subscription Record:** Stored in both `users/{uid}` and `patient_profiles/{uid}` (`isVip: true` and `subscription: { status: 'active', planId: '3_months', startDate, endDate, expiresAt }`).
2. **Firestore Security Rules ([`firestore.rules`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/firestore.rules)):** Patients cannot self-modify `isVip`, `isTestPatient`, `subscription`, `role`, or `dieticianId` on either `users/{uid}` or `patient_profiles/{uid}`.
3. **Server-Side Entitlement Lookup ([`api/_lib/security.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/_lib/security.ts#L206-L239)):** [`isDataSubscribedOrVip`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/_lib/security.ts#L206-L216) and [`assertSubscribedOrVip`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/_lib/security.ts#L222-L239) query `users/{uid}` and `patient_profiles/{uid}` directly via the Firebase Admin SDK on the server.
4. **API Authorization ([`api/ai/scan-food.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/ai/scan-food.ts#L267)):** Calls `await assertSubscribedOrVip(caller)`. Calling `/api/ai/scan-food` with a Basic account token returns HTTP `403` (`"Active VIP subscription required for this feature"`), even if a user manipulates frontend state.
5. **Frontend Feature Gating ([`src/services/subscription.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/services/subscription.ts#L110-L127) & [`src/pages/PatientDashboard.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/PatientDashboard.tsx)):** [`isPatientSubscribed(profile)`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/services/subscription.ts#L110-L127) gates **Build My Plate** and **AI Food Scanner** behind [`SubscriptionPaywall`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/components/SubscriptionPaywall.tsx) for Basic accounts while unlocking them for VIP accounts.
6. **Persistence Across Logout, Login & Refresh:** [`AuthContext.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/contexts/AuthContext.tsx) reloads `users/{uid}` and `patient_profiles/{uid}` from Firestore on every auth state change and page refresh.

---

## 8. VIP Synthetic History Summary

Account A (`vip.demo@nutrisnap.co.in`) is populated with a coherent 8-week clinical journey (`2026-08-15` to `2026-10-15`), explicitly badged in the UI with `"Synthetic Demo Data (Not Genuine Lab Results)"`:

- **Clinical Profile:** 38-year-old male, 174 cm, Vegetarian + Eggetarian, Peanut allergy (strictly respected across all meals and logs), goal: *Metabolic Health & Glycemic Control*.
- **3 Dated 13-Biomarker Panels (`labHistory` & `labBiomarkers`):**
  - `2026-08-15` (Baseline): HbA1c `6.4%`, Haemoglobin `14.1 g/dL`, Total Cholesterol `218 mg/dL`, Triglycerides `186 mg/dL`, HDL `41 mg/dL`, LDL `140 mg/dL`, SGPT `48 U/L`, SGOT `38 U/L`, Sodium `142 mEq/L`, Potassium `4.1 mEq/L`, Creatinine `0.96 mg/dL`, BUN `16 mg/dL`, Uric Acid `6.8 mg/dL`.
  - `2026-09-15` (Week 4): HbA1c `6.1%`, Haemoglobin `14.3 g/dL`, Total Cholesterol `198 mg/dL`, Triglycerides `162 mg/dL`, HDL `44 mg/dL`, LDL `122 mg/dL`, SGPT `39 U/L`, SGOT `33 U/L`, Sodium `140 mEq/L`, Potassium `4.3 mEq/L`, Creatinine `0.92 mg/dL`, BUN `14.5 mg/dL`, Uric Acid `6.2 mg/dL`.
  - `2026-10-15` (Week 8 — Current): HbA1c `5.8%`, Haemoglobin `14.5 g/dL`, Total Cholesterol `182 mg/dL`, Triglycerides `138 mg/dL`, HDL `48 mg/dL`, LDL `106 mg/dL`, SGPT `31 U/L`, SGOT `28 U/L`, Sodium `139 mEq/L`, Potassium `4.4 mEq/L`, Creatinine `0.89 mg/dL`, BUN `13.5 mg/dL`, Uric Acid `5.6 mg/dL`.
- **Published 7-Day Meal Plan & Weekly Schedule:** `1,750 kcal/day` (`105g` protein, `185g` carbs, `58g` fat) in `meal_plans` and `patient_week_plans`.
- **Multi-Day Food Diary (`food_logs`):** 6 detailed meals across Breakfast, Lunch, Snacks, and Dinner with item-level macro breakdowns and clinical insights.
- **Longitudinal Progress (`progress_records` & `monthly_parameters`):** 5 bi-weekly progress logs and 3 monthly parameter snapshots showing steady weight loss (`82.4 kg -> 78.6 kg`), waist reduction (`94 cm -> 89 cm`), and blood pressure improvement (`128/84 -> 118/76 mmHg`).

---

## 9. 13-Biomarker Onboarding Audit and Fix Details

### Root Cause Identified
1. Onboarding Step 4 in [`src/pages/Login.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/Login.tsx) previously lacked inputs for the 13 clinical biomarkers, and [`registerPatient`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/services/db.ts) did not persist `labBiomarkers` or `labHistory`.
2. [`evaluateLabBiomarkers`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/services/db.ts#L462-L738) and dietician views previously merged `DEFAULT_SAMPLE_LABS` into real patients' profiles whenever a biomarker was undefined, fabricating demo lab values for real patients.
3. [`updatePatientProfile`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/services/db.ts) previously sent the full profile object (including privileged fields) to Firestore, which could be rejected by `firestore.rules` when a patient edited their own biomarkers.

### Complete 13-Biomarker Specification & Persistence Table

| # | Biomarker Name | Field Key (`BiomarkerKey`) | Category | Unit | Normal Reference Range | Bounds (`min–max`) | Onboarding UI (`Login.tsx`) | Profile Edit (`PatientProfileModal.tsx`) | DB Persistence (`users` & `patient_profiles`) | Dashboard & Progress (`Progress.tsx` & `PatientProfileView.tsx`) |
| :-: | :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | Glycated Haemoglobin (HbA1c) | `hba1c` | Metabolic & Glycemic | `%` | `< 5.7%` | `3.0 – 20.0` | Verified | Verified | `labBiomarkers.hba1c` | Verified |
| 2 | Haemoglobin (Hb) | `haemoglobin` | Hematology | `g/dL` | `12.0–15.5 (F) / 13.5–17.5 (M)` | `4.0 – 22.0` | Verified | Verified | `labBiomarkers.haemoglobin` | Verified |
| 3 | Total Cholesterol | `cholesterol` | Lipid Profile | `mg/dL` | `< 200 mg/dL` | `50 – 600` | Verified | Verified | `labBiomarkers.cholesterol` | Verified |
| 4 | Serum Triglycerides | `triglycerides` | Lipid Profile | `mg/dL` | `< 150 mg/dL` | `20 – 1500` | Verified | Verified | `labBiomarkers.triglycerides` | Verified |
| 5 | High-Density Lipoprotein (HDL) | `hdl` | Lipid Profile | `mg/dL` | `> 50 (F) / > 40 (M) mg/dL` | `10 – 150` | Verified | Verified | `labBiomarkers.hdl` | Verified |
| 6 | Low-Density Lipoprotein (LDL) | `ldl` | Lipid Profile | `mg/dL` | `< 100 mg/dL` | `20 – 400` | Verified | Verified | `labBiomarkers.ldl` | Verified |
| 7 | SGPT / ALT | `sgpt` | Liver Function | `U/L` | `7 – 56 U/L` | `1 – 1000` | Verified | Verified | `labBiomarkers.sgpt` | Verified |
| 8 | SGOT / AST | `sgot` | Liver Function | `U/L` | `10 – 40 U/L` | `1 – 1000` | Verified | Verified | `labBiomarkers.sgot` | Verified |
| 9 | Serum Sodium (Na) | `sodium` | Electrolytes | `mEq/L` | `135 – 145 mEq/L` | `100 – 180` | Verified | Verified | `labBiomarkers.sodium` | Verified |
| 10 | Serum Potassium (K) | `potassium` | Electrolytes | `mEq/L` | `3.5 – 5.0 mEq/L` | `1.5 – 9.0` | Verified | Verified | `labBiomarkers.potassium` | Verified |
| 11 | Serum Creatinine | `creatinine` | Renal & Uric Acid | `mg/dL` | `0.6 – 1.2 mg/dL` | `0.1 – 15.0` | Verified | Verified | `labBiomarkers.creatinine` | Verified |
| 12 | Blood Urea Nitrogen (BUN) | `bun` | Renal & Uric Acid | `mg/dL` | `7 – 20 mg/dL` | `1 – 150` | Verified | Verified | `labBiomarkers.bun` | Verified |
| 13 | Serum Uric Acid | `uricAcid` | Renal & Uric Acid | `mg/dL` | `2.4–6.0 (F) / 3.4–7.0 (M)` | `0.5 – 20.0` | Verified | Verified | `labBiomarkers.uricAcid` | Verified |

---

## 10. Files Created, Modified, and Removed

### Created
- [`api/auth/change-password.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/auth/change-password.ts) — Server-side Change Password handler, rate limiter, and input validator.
- [`src/components/ChangePasswordModal.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/components/ChangePasswordModal.tsx) — Mobile-responsive Change Password modal component.
- [`scripts/handover-accounts-and-seed.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/scripts/handover-accounts-and-seed.ts) — Account audit/cleanup, reversible backup, and deterministic VIP/Basic demo account seeder (`--dry-run`, `--execute`, `--reseed-demo`, `--rotate-passwords`).
- [`tests/handover-verification.test.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/tests/handover-verification.test.ts) — Automated regression & handover verification suite.
- [`HANDOVER_REPORT.md`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/HANDOVER_REPORT.md) — Production handover documentation.

### Modified
- [`api/_lib/security.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/_lib/security.ts) — Added [`isDataSubscribedOrVip`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/_lib/security.ts#L206-L216), [`assertSubscribedOrVip`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/_lib/security.ts#L222-L239), and test hooks.
- [`api/ai/scan-food.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/api/ai/scan-food.ts) — Enforced `await assertSubscribedOrVip(caller)` on the server.
- [`server.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/server.ts) — Mounted `/api/auth/change-password`.
- [`src/services/db.ts`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/services/db.ts) — Added `CLINICAL_BIOMARKER_DEFINITIONS`, `validateLabBiomarkers`, updated `evaluateLabBiomarkers`, updated `registerPatient` with read-back verification, and updated `updatePatientProfile` to strip privileged fields and append dated `labHistory` snapshots.
- [`src/pages/Login.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/Login.tsx) — Added 13-biomarker onboarding panel in Step 4 with per-biomarker and full-panel `"Skip / N/A"` toggles and `sessionStorage` draft persistence.
- [`src/components/PatientProfileModal.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/components/PatientProfileModal.tsx) — Added Section 5 (13 Clinical Lab Biomarkers Panel) and Change Password trigger.
- [`src/pages/Patient/Progress.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/Patient/Progress.tsx) — Added 13-biomarker status cards, historical progression table, and synthetic demo badge.
- [`src/pages/PatientDashboard.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/PatientDashboard.tsx) & [`src/pages/DieticianDashboard.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/DieticianDashboard.tsx) — Wired `ChangePasswordModal`.
- [`src/pages/Dietician/PatientProfileView.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/Dietician/PatientProfileView.tsx), [`src/pages/Dietician/MealPlanGenerator.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/Dietician/MealPlanGenerator.tsx), [`src/pages/Dietician/MessageInbox.tsx`](file:///c:/Users/Het%20Laheri/Desktop/AIDIET/src/pages/Dietician/MessageInbox.tsx) — Removed fallback merging of `DEFAULT_SAMPLE_LABS` into real patient profiles.

---

## 11. Database / Migration / Seed Changes

- No destructive schema migrations were required; Firestore documents in `ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf` now store structured `labBiomarkers` (all 13 keys + `unavailableBiomarkers` + `testDate` + `isSyntheticDemo`) and `labHistory` (chronological array of dated snapshots) on both `users/{uid}` and `patient_profiles/{uid}`.
- Full pre-cleanup snapshot was saved locally to `audit-results/evidence/raw/pre-cleanup-backup-1792429882744.json` (gitignored).

---

## 12. Automated and Manual Test Matrix

| Test Category | Test Suite / Case | Status |
| :--- | :--- | :---: |
| **13 Biomarkers Schema & Bounds** | `OBJ-5: CLINICAL_BIOMARKER_DEFINITIONS defines all 13 authoritative biomarkers` | **PASS** |
| **13 Biomarkers Validation & Missing vs `0`** | `OBJ-5: validateLabBiomarkers validates all 13 biomarkers and never confuses missing with 0` | **PASS** |
| **No Fabricated Sample Labs** | `OBJ-5: evaluateLabBiomarkers never fabricates DEFAULT_SAMPLE_LABS values when patient labs are missing` | **PASS** |
| **Change Password Policy Validation** | `OBJ-2: validatePasswordChangeInput enforces password policy and rejects invalid inputs` | **PASS** |
| **Change Password Auth, Revocation & Rate Limit** | `OBJ-2: /api/auth/change-password verifies current password, updates & revokes tokens, and rate-limits` | **PASS** |
| **VIP & Basic Synthetic Demo Builders** | `OBJ-3 & OBJ-4: VIP and Basic synthetic demo builders produce complete, coherent, schema-valid records` | **PASS** |
| **Server-Side VIP Entitlement Enforcement** | `OBJ-3: Basic Demo Client is rejected with 403 when calling /api/ai/scan-food directly` | **PASS** |
| **Lead Dietician Cleanup Protection** | `OBJ-1: Lead Dietician account is strictly protected from test account cleanup lists` | **PASS** |
| **API Security & Payment Verification** | `tests/api-security.test.ts`, `tests/static-security.test.ts` (`82` total tests across `7` suites) | **PASS (`82/82`)** |
| **TypeScript & Production Bundle Build** | `npm run build` (`tsc --noEmit && vite build && esbuild server.ts`) | **PASS (`0` errors)** |

---

## 13. Known Limitations, External Dependencies, or Manual Steps Required

1. **Service Account Credentials:** Administrative scripts (`scripts/handover-accounts-and-seed.ts`) require `GOOGLE_APPLICATION_CREDENTIALS` pointing to the Firebase Admin service account JSON outside the repository.
2. **Manual Review Accounts:** As noted in Section 4.3, personal `@gmail.com` developer test accounts were preserved per Objective 1 Requirement 7 and can be retained or removed by the owner at their discretion.
3. **Production Deployment:** Deploy the updated application to Vercel (`vercel --prod` or via the connected Git branch) and ensure `FIREBASE_WEB_API_KEY` is set in Vercel Environment Variables if server-side REST password verification without client pre-reauthentication is desired (client-side Firebase `reauthenticateWithCredential` + server-side `revokeRefreshTokens` works out of the box).

---

## 14. Rollback and Demo-Reset Instructions

- **Deterministic Demo Account Reset / Reseed:**
  To reset `vip.demo@nutrisnap.co.in` and `basic.demo@nutrisnap.co.in` back to their clean handover baseline at any time after live stakeholder demos:
  ```powershell
  $env:GOOGLE_APPLICATION_CREDENTIALS="<path-to-service-account.json>"
  npx tsx scripts/handover-accounts-and-seed.ts --reseed-demo
  ```
- **Reversible Account Cleanup Backup:**
  The full pre-cleanup snapshot of all Auth records and Firestore documents is stored in `audit-results/evidence/raw/pre-cleanup-backup-1792429882744.json` (gitignored).

---

## 15. Final Readiness Sign-Off

All seven objectives in the **NutriSnap — Final Production Handover, Account Cleanup & Onboarding Fix** specification have been implemented, verified against the live NutriSnap database (`ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf`), and validated with automated tests (`82/82` passing) and production builds.
