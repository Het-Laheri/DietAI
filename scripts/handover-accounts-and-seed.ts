/**
 * NutriSnap — Production Handover Account Cleanup, Demo Provisioning & Deterministic Reseed CLI
 *
 * Modes:
 *   npx tsx scripts/handover-accounts-and-seed.ts --dry-run
 *   npx tsx scripts/handover-accounts-and-seed.ts --execute
 *   npx tsx scripts/handover-accounts-and-seed.ts --reseed-demo
 *   npx tsx scripts/handover-accounts-and-seed.ts --rotate-passwords
 *
 * Environment Variables:
 *   GOOGLE_APPLICATION_CREDENTIALS : Path to Firebase Admin service account JSON
 *   VIP_DEMO_PASSWORD              : Optional custom password for vip.demo@nutrisnap.co.in
 *   BASIC_DEMO_PASSWORD            : Optional custom password for basic.demo@nutrisnap.co.in
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth, type Auth, type UserRecord } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type {
  PatientLabBiomarkers,
  PatientProfile,
  MealPlan,
  FoodLog,
  ProgressRecord,
  MonthlyParameterRecord,
  Query,
  ClinicalNote,
} from '../src/services/db.js';

export const NUTRISNAP_DB_ID = 'ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf';
export const LEAD_DIETICIAN_UID = 'Qw9mhpOd32TpKdEHWE1M4OOTUyw1';
export const LEAD_DIETICIAN_EMAIL = 'Nutrisnap2003@gmail.com';

export const VIP_DEMO_EMAIL = 'vip.demo@nutrisnap.co.in';
export const BASIC_DEMO_EMAIL = 'basic.demo@nutrisnap.co.in';

/**
 * Confirmed obsolete test/dummy accounts in NutriSnap DB + Firebase Auth.
 * Verified via full multi-database audit across (default) and NutriSnap DB.
 */
export const CONFIRMED_NUTRISNAP_TEST_UIDS: ReadonlyArray<{ uid: string; email: string; reason: string }> = [
  { uid: '6aOvo8r88bO44FVvr80mGaAGO9q1', email: 'admin@nutrisnap.demo', reason: 'Obsolete .demo dietician account' },
  { uid: 'FT2OTI0loQMeJq3m6wlFaMLn4E42', email: 'patient@nutrisnap.demo', reason: 'Obsolete .demo patient account' },
  { uid: 'yxY49cJmPcR814qYq9w2uxpsHsQ2', email: 'testpatient@nutrisnap.com', reason: 'Legacy testpatient@nutrisnap.com account (replaced by vip.demo@nutrisnap.co.in)' },
  { uid: '2QdCObsTbKefNFSkdEXu0qokwBh1', email: 'mealstest@nutrisnap.com', reason: 'Automated meals test account' },
  { uid: 'nc5gu1LvAldj12wH2tH8KIoxi732', email: 'sneha@demo.com', reason: 'Seeded @demo.com dummy account' },
  { uid: '7lkMt32aSNYL7KqfEBUEPze3V9g1', email: 'priya@demo.com', reason: 'Seeded @demo.com dummy account (#1)' },
  { uid: '0v89U4RV5nVqGS9HYgOEgMlOnou2', email: 'priya@demo.com', reason: 'Seeded @demo.com dummy account (#2)' },
  { uid: '6Lxb5YK8BCRvH6X1085837ujVTS2', email: 'amit@demo.com', reason: 'Seeded @demo.com dummy account (#1)' },
  { uid: '0yNoHBeacLeHBLSNOrGurMNuuhT2', email: 'amit@demo.com', reason: 'Seeded @demo.com dummy account (#2)' },
  { uid: 'NWqkd8TcHkVv17qYJGJTdt0IxpB3', email: 'rahul@demo.com', reason: 'Seeded @demo.com dummy account (#1)' },
  { uid: 'CKx8NIsnuuU28MJ2QWyj2O16ybc2', email: 'rahul@demo.com', reason: 'Seeded @demo.com dummy account (#2)' },
  { uid: 'PRWMAiCXcySOvy2XORQQsXKGVwv1', email: 'lalalalal@lalalla.com', reason: 'Keyboard-smash dummy test account' },
  { uid: 'p5DGOHc9cegEer5BJnaVgCCaCtm2', email: 'lalala@lalala.com', reason: 'Keyboard-smash dummy test account' },
];

/**
 * Confirmed unreferenced Firebase Auth-only test accounts (0 records in (default) and 0 records in NutriSnap DB).
 */
export const CONFIRMED_AUTH_ONLY_TEST_UIDS: ReadonlyArray<{ uid: string; email: string; reason: string }> = [
  { uid: '00rRDgD5mOUoWoO1iPRLAs9gwE32', email: 'hi@hi.com', reason: 'Unreferenced dummy Auth account' },
  { uid: '3om13CspSsPMkZQ0iRlYwaClUbS2', email: 'test@care4.com', reason: 'Unreferenced test Auth account' },
  { uid: '7s584uhlUZOlPW0ITcRG8ra2ZkD2', email: 'testuser23@careclarity.com', reason: 'Unreferenced testuser Auth account' },
  { uid: 'A8IrgcGxibZpoASYSBGBtTquE4w1', email: 'testfix2026@test.com', reason: 'Unreferenced @test.com Auth account' },
  { uid: 'AB2S7zV4RQU0tS8CinZ8DPUa9Hs1', email: 'testuser2026@test.com', reason: 'Unreferenced @test.com Auth account' },
  { uid: 'Grp0M2RPiTZeKpJC4doSfnAuctu2', email: 'error_trigger@example.com', reason: 'Unreferenced @example.com debug account' },
  { uid: 'KrGbK84M4MVOXhL6X1ooKxy5kxj1', email: 'test.tese@test.com', reason: 'Unreferenced @test.com Auth account' },
  { uid: 'g07lPteI4tero9j3ip0idg5bG4f2', email: 'test@care.com', reason: 'Unreferenced test Auth account' },
  { uid: 'mUWvfijC7Sdk6hTZVA7P2ZqdSbz1', email: 'test_final_debug@example.com', reason: 'Unreferenced @example.com debug account' },
  { uid: 'o2CpOwUAyyfv8magAqaxMnqAD083', email: 'testuser@example.com', reason: 'Unreferenced @example.com test account' },
  { uid: 'tDiHqQw7Chd4qSd6cQkZHVeamb62', email: 'het@tester.com', reason: 'Unreferenced @tester.com test account' },
  { uid: 'ypPup4BOrDYXQ3dvrgaPpPOmVD32', email: 'verified_fix@example.com', reason: 'Unreferenced @example.com debug account' },
  { uid: 'z2nvkkTWPdhY5ggUdxATso85L3K3', email: 'test_debug_jetski_4@example.com', reason: 'Unreferenced @example.com debug account' },
];

/**
 * Orphaned synthetic/test patientIds that have no corresponding user/profile.
 */
export const ORPHANED_TEST_PATIENT_IDS = [
  'test_notif_123',
  'test_doc_admin',
  'some-id',
  'test_patient_live',
  'demo_patient',
];

function generateCompliantPassword(prefix: string): string {
  const token = crypto.randomBytes(6).toString('base64url').replace(/[^a-zA-Z0-9]/g, '9');
  return `${prefix}#${token}9A`;
}

function resolveOrCreateDemoPasswords(forceRotate = false): { vipPassword: string; basicPassword: string } {
  const secretsPath = path.resolve(process.cwd(), 'SECRETS.txt');
  let existingContent = '';
  if (fs.existsSync(secretsPath)) {
    existingContent = fs.readFileSync(secretsPath, 'utf8');
  }

  const envVip = process.env.VIP_DEMO_PASSWORD?.trim();
  const envBasic = process.env.BASIC_DEMO_PASSWORD?.trim();

  const matchVip = !forceRotate ? existingContent.match(/^VIP_DEMO_PASSWORD=(.+)$/m)?.[1]?.trim() : undefined;
  const matchBasic = !forceRotate ? existingContent.match(/^BASIC_DEMO_PASSWORD=(.+)$/m)?.[1]?.trim() : undefined;

  const vipPassword = envVip || matchVip || generateCompliantPassword('NutriVip');
  const basicPassword = envBasic || matchBasic || generateCompliantPassword('NutriBasic');

  const timestamp = new Date().toISOString();
  const block = [
    '',
    `# === NutriSnap Handover Demo Credentials (Updated ${timestamp}) ===`,
    `VIP_DEMO_EMAIL=${VIP_DEMO_EMAIL}`,
    `VIP_DEMO_PASSWORD=${vipPassword}`,
    `BASIC_DEMO_EMAIL=${BASIC_DEMO_EMAIL}`,
    `BASIC_DEMO_PASSWORD=${basicPassword}`,
    '',
  ].join('\n');

  const cleaned = existingContent
    .replace(/\n?# === NutriSnap Handover Demo Credentials[\s\S]*?(?=\n# ===|$)/g, '')
    .trimEnd();

  fs.writeFileSync(secretsPath, `${cleaned}\n${block}`, { mode: 0o600 });
  return { vipPassword, basicPassword };
}

function isoDaysAgo(daysAgo: number, hour = 8, minute = 30): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateKeyDaysAgo(daysAgo: number): string {
  return isoDaysAgo(daysAgo).split('T')[0];
}

export function buildVipSyntheticData(vipUid: string) {
  const nowIso = new Date().toISOString();
  const subStart = isoDaysAgo(60, 9, 0);
  const subEnd = isoDaysAgo(-120, 9, 0); // +120 days in the future

  const subscription = {
    status: 'active' as const,
    planId: '3_months' as const,
    planName: '3 Months Total Health (VIP Demo)',
    amount: 4000,
    amountInr: 4000,
    durationMonths: 3,
    dieticianId: LEAD_DIETICIAN_UID,
    startDate: subStart,
    endDate: subEnd,
    expiresAt: subEnd,
    updatedAt: nowIso,
  };

  // 3 dated historical biomarker panels covering all 13 clinical biomarkers in CLINICAL_BIOMARKER_DEFINITIONS
  const panelBaseline: PatientLabBiomarkers = {
    testDate: '2026-08-15',
    hba1c: 6.4,            // Prediabetic
    haemoglobin: 14.1,     // Normal Male (13.5-17.5)
    cholesterol: 218,      // Borderline High (<200)
    triglycerides: 186,    // Borderline High (<150)
    hdl: 41,               // Low-Normal (>40)
    ldl: 140,              // Elevated (<100)
    sgpt: 48,              // Mildly Elevated (7-56)
    sgot: 38,              // Upper Normal (10-40)
    sodium: 142,           // Normal (135-145)
    potassium: 4.1,        // Normal (3.5-5.0)
    creatinine: 0.96,      // Normal (0.6-1.2)
    bun: 16,               // Normal (7-20)
    uricAcid: 6.8,         // Upper Borderline (3.4-7.0)
    unavailableBiomarkers: [],
    isSyntheticDemo: true,
    notes: 'Baseline Onboarding Lab Panel — Synthetic Demo Data (Not Genuine Lab Results). Shows prediabetes (HbA1c 6.4%), borderline hypertriglyceridemia (186 mg/dL), and elevated LDL (140 mg/dL).',
  };

  const panelMidpoint: PatientLabBiomarkers = {
    testDate: '2026-09-15',
    hba1c: 6.1,            // Improving
    haemoglobin: 14.3,
    cholesterol: 198,      // Normalized <200
    triglycerides: 162,    // Improving
    hdl: 44,               // Improving
    ldl: 122,              // Improving
    sgpt: 39,              // Normalized
    sgot: 33,
    sodium: 140,
    potassium: 4.3,
    creatinine: 0.92,
    bun: 14.5,
    uricAcid: 6.2,
    unavailableBiomarkers: [],
    isSyntheticDemo: true,
    notes: 'Week 4 Clinical Follow-Up Panel — Synthetic Demo Data (Not Genuine Lab Results). Clear reduction in HbA1c, Total Cholesterol, and SGPT.',
  };

  const panelLatest: PatientLabBiomarkers = {
    testDate: '2026-10-15',
    hba1c: 5.8,            // Near-normal glycemic control
    haemoglobin: 14.5,     // Optimal
    cholesterol: 182,      // Desirable (<200)
    triglycerides: 138,    // Normalized (<150)
    hdl: 48,               // Improved cardioprotective HDL
    ldl: 106,              // Near optimal
    sgpt: 31,              // Optimal hepatic enzyme
    sgot: 28,              // Optimal
    sodium: 139,           // Optimal
    potassium: 4.4,        // Optimal
    creatinine: 0.89,      // Optimal renal clearance
    bun: 13.5,             // Optimal
    uricAcid: 5.6,         // Normalized purine clearance
    unavailableBiomarkers: [],
    isSyntheticDemo: true,
    notes: 'Week 8 Clinical Follow-Up Panel — Synthetic Demo Data (Not Genuine Lab Results). Significant metabolic & lipid improvement across all 13 biomarkers.',
  };

  const userDoc = {
    uid: vipUid,
    email: VIP_DEMO_EMAIL,
    name: 'Aarav Sharma (VIP Demo)',
    role: 'patient' as const,
    dieticianId: LEAD_DIETICIAN_UID,
    isVip: true,
    isTestPatient: false,
    isDemoAccount: true,
    isSyntheticDemo: true,
    demoTier: 'vip' as const,
    onboardingCompleted: true,
    subscription,
    labBiomarkers: panelLatest,
    labHistory: [panelBaseline, panelMidpoint, panelLatest],
    createdAt: subStart,
    updatedAt: nowIso,
  };

  const profileDoc: PatientProfile & Record<string, any> = {
    id: vipUid,
    uid: vipUid,
    dieticianId: LEAD_DIETICIAN_UID,
    email: VIP_DEMO_EMAIL,
    name: 'Aarav Sharma (VIP Demo)',
    mobile: '+919000000001',
    dob: '1988-04-12',
    gender: 'Male',
    age: 38,
    startDate: '2026-08-15',
    lifeStage: 'Adult',
    heightCm: 174,
    currentWeightKg: 78.6,
    targetWeightKg: 73.0,
    waistCm: 89.0,
    initialWaistCm: 94.0,
    inchLoss: 2.0,
    idealBodyWeightKg: 68.5,
    bmi: 26.0,
    bmiClassification: 'Overweight (Improving)',
    weightManagement: {
      primaryGoal: 'Weight Loss',
      targetPace: '0.5 kg / week',
      specificFocus: ['Visceral Fat Reduction', 'Glycemic Control', 'Lipid Optimization'],
      targetDifferenceKg: -5.6,
      initialWeightKg: 82.4,
      inchLoss: 2.0,
    },
    medicalHistory: ['Prediabetes (HbA1c 6.4% -> 5.8%)', 'Borderline Dyslipidemia'],
    diagnosisOrProcedure: 'Metabolic Syndrome & Grade 1 Fatty Liver Reversal Protocol',
    occupation: 'Product Architect (Synthetic Demo Profile)',
    activityLevel: 'Moderately Active',
    dietaryType: 'Vegetarian + Eggetarian',
    goals: ['Metabolic Health & Glycemic Control', 'Sustainable Fat Loss'],
    preferences: {
      favorites: 'Moong Dal Chilla, Palak Paneer, Jowar Roti, Roasted Makhana, Quinoa Pulao',
      dislikes: 'Bitter gourd juice, deep-fried snacks',
      cuisine: 'North & West Indian Home Style',
      budget: 'Premium / Flexible',
    },
    healthInfo: {
      conditions: 'Prediabetes (Improving), Mild Dyslipidemia, Grade 1 Fatty Liver',
      allergies: 'Peanuts',
      medications: 'Vitamin D3 60,000 IU (Completed 8-week course)',
      notes: 'SYNTHETIC DEMO ACCOUNT — All records are deterministic synthetic data for handover demonstration only.',
    },
    allergies: ['Peanuts'],
    onboardingCompleted: true,
    labBiomarkers: panelLatest,
    labHistory: [panelBaseline, panelMidpoint, panelLatest],
    isVip: true,
    isTestPatient: false,
    isDemoAccount: true,
    isSyntheticDemo: true,
    demoTier: 'vip',
    subscription,
    status: 'active',
    needsAttention: false,
    adherencePercentage: 94,
    lastConsultationDate: dateKeyDaysAgo(3),
    nextFollowUpDate: dateKeyDaysAgo(-7),
    createdAt: subStart,
    updatedAt: nowIso,
  };

  const dailyMealsTemplate = [
    {
      type: 'Breakfast',
      name: 'Moong Dal Chilla with Low-Fat Paneer Stuffing & Mint Chutney',
      portion: '2 medium chillas (160g) + 50g paneer + 2 tbsp chutney',
      calories: 420,
      protein: 26,
      carbs: 44,
      fat: 14,
      ingredients: ['Split green moong dal (60g)', 'Low-fat paneer (50g)', 'Fresh mint & coriander', 'Ginger & cumin'],
      notes: 'High-protein, low-GI breakfast to prevent morning glucose spikes.',
    },
    {
      type: 'Mid-Morning',
      name: 'Fresh Guava + Soaked Almonds & Walnuts',
      portion: '1 medium guava (120g) + 6 almonds + 2 walnut halves',
      calories: 165,
      protein: 5,
      carbs: 18,
      fat: 9,
      ingredients: ['Pink guava', 'Soaked almonds', 'Walnuts'],
      notes: 'Rich in soluble pectin fiber and omega-3s for LDL & triglyceride reduction.',
    },
    {
      type: 'Lunch',
      name: 'Jowar-Wheat Multigrain Roti + Palak Paneer Bhurji + Yellow Moong Dal + Kachumber Salad',
      portion: '2 rotis + 120g palak paneer + 150g dal + 150g salad',
      calories: 560,
      protein: 34,
      carbs: 64,
      fat: 18,
      ingredients: ['Jowar flour', 'Spinach', 'Low-fat paneer', 'Yellow moong dal', 'Cucumber, tomato, lemon'],
      notes: 'Eat kachumber salad 10 minutes before rotis to blunt post-meal glycemic excursion.',
    },
    {
      type: 'Evening Snack',
      name: 'Turmeric Roasted Makhana + Spiced Buttermilk (Chaas)',
      portion: '30g makhana + 200ml chaas',
      calories: 155,
      protein: 7,
      carbs: 22,
      fat: 4,
      ingredients: ['Foxnuts (Makhana)', 'Low-fat curd', 'Roasted cumin, black pepper, curry leaves'],
      notes: 'Zero-trans-fat evening snack supporting gut microbiome and satiety.',
    },
    {
      type: 'Dinner',
      name: 'Quinoa & Grilled Tofu/Paneer Vegetable Pulao + Bottle Gourd (Lauki) Raita',
      portion: '200g quinoa bowl + 120g lauki raita + 100g steamed broccoli',
      calories: 450,
      protein: 33,
      carbs: 37,
      fat: 13,
      ingredients: ['White quinoa', 'Firm tofu / low-fat paneer', 'Broccoli & bell peppers', 'Grated bottle gourd raita'],
      notes: 'Finish dinner at least 2.5 hours prior to bedtime; follow with a 15-minute easy walk.',
    },
  ];

  const mealPlanDoc: MealPlan & Record<string, any> = {
    id: `vip_demo_plan_${vipUid}`,
    title: 'Glycemic & Lipid Optimization Protocol (VIP Demo)',
    patientId: vipUid,
    startDate: dateKeyDaysAgo(7),
    endDate: dateKeyDaysAgo(-21),
    targets: {
      calories: 1750,
      protein: 105,
      carbs: 185,
      fat: 58,
    },
    status: 'published',
    instructions: '1. Strictly peanut-free preparation (allergy alert).\n2. Maintain 3.0L daily water intake.\n3. Take a 15-minute brisk walk after Lunch and Dinner to optimize HbA1c and triglycerides.',
    days: Array.from({ length: 7 }, (_, i) => ({
      dayNumber: i + 1,
      meals: dailyMealsTemplate.map((m) => ({
        ...m,
        name: i % 2 === 1 && m.type === 'Breakfast'
          ? 'Steel-Cut Vegetable Oats Upma + 2 Boiled Egg Whites & 1 Whole Egg'
          : i % 2 === 1 && m.type === 'Lunch'
          ? 'Brown Basmati Rice (1 cup) + Home-Style Rajma Masala + Cucumber Raita'
          : m.name,
      })),
    })),
    isSyntheticDemo: true,
    createdAt: isoDaysAgo(7, 10, 0),
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
  const weekPlanDays: Record<string, any> = {};
  weekDays.forEach((day, idx) => {
    weekPlanDays[day] = {
      Breakfast: idx % 2 === 0
        ? 'Moong Dal Chilla (2) with 50g Paneer Stuffing + Mint Chutney'
        : 'Steel-Cut Vegetable Oats Upma (150g) + 2 Boiled Egg Whites + 1 Whole Egg',
      'Mid-Morning': idx % 2 === 0
        ? '1 Medium Guava + 6 Soaked Almonds + 2 Walnut Halves'
        : '1 Small Apple + 1 tbsp Roasted Pumpkin & Flax Seeds',
      Lunch: idx % 2 === 0
        ? '2 Jowar Rotis + Palak Paneer (120g) + Yellow Moong Dal + Kachumber Salad'
        : '1 Cup Brown Rice + Rajma Masala (150g) + Curd (100g) + Cucumber Salad',
      'Evening Snack': idx % 2 === 0
        ? 'Roasted Makhana (30g) + Spiced Chaas (200ml)'
        : 'Sprouted Moong Bhel with Pomegranate & Lemon (120g)',
      Dinner: idx % 2 === 0
        ? 'Quinoa & Grilled Paneer Bowl (200g) + Lauki Raita'
        : '2 Missi Rotis + Methi Matar Paneer (Light) + Clear Vegetable Soup',
      'Post-Dinner': 'Warm Cinnamon-Chamomile Herbal Infusion (Unsweetened)',
    };
  });

  const patientWeekPlanDoc = {
    patientId: vipUid,
    dieticianId: LEAD_DIETICIAN_UID,
    weekStartDate: dateKeyDaysAgo(3),
    days: weekPlanDays,
    notes: 'VIP Demo 7-Day Clinical Meal Schedule — Peanuts strictly excluded.',
    isSyntheticDemo: true,
    updatedAt: nowIso,
  };

  const foodLogs: Array<FoodLog & Record<string, any>> = [
    {
      id: `vip_demo_food_${vipUid}_1`,
      patientId: vipUid,
      patientName: 'Aarav Sharma (VIP Demo)',
      date: dateKeyDaysAgo(0),
      mealType: 'Breakfast',
      description: 'Moong Dal Chilla (2 medium) with Low-Fat Paneer Stuffing & Mint Chutney',
      userNotes: 'Cooked with 1 tsp cold-pressed mustard oil. Felt very energetic.',
      items: [
        { name: 'Moong Dal Chilla with Paneer', portion: '2 medium (210g)', calories: 390, protein: 25, carbs: 41, fat: 13, fiber: 7 },
        { name: 'Mint Coriander Chutney', portion: '2 tbsp (30g)', calories: 25, protein: 1, carbs: 3, fat: 1, fiber: 1 },
      ],
      nutrition: { calories: 415, protein: 26, carbs: 44, fat: 14, fiber: 8 },
      insight: 'High-protein, low-glycemic breakfast aligned with HbA1c < 6.0% target.',
      source: 'scanner',
      isSyntheticDemo: true,
      createdAt: isoDaysAgo(0, 8, 35),
    },
    {
      id: `vip_demo_food_${vipUid}_2`,
      patientId: vipUid,
      patientName: 'Aarav Sharma (VIP Demo)',
      date: dateKeyDaysAgo(0),
      mealType: 'Lunch',
      description: '2 Jowar Rotis, Palak Paneer Bhurji, Yellow Moong Dal, and Kachumber Salad',
      userNotes: 'Ate salad first as advised. Took a 15-min walk after lunch.',
      items: [
        { name: 'Jowar Multigrain Roti', portion: '2 medium (80g)', calories: 210, protein: 6, carbs: 42, fat: 2, fiber: 6 },
        { name: 'Palak Paneer Bhurji', portion: '1 bowl (150g)', calories: 215, protein: 18, carbs: 8, fat: 13, fiber: 4 },
        { name: 'Yellow Moong Dal Tadka', portion: '1 bowl (150g)', calories: 110, protein: 8, carbs: 14, fat: 2, fiber: 3 },
        { name: 'Cucumber Tomato Kachumber Salad', portion: '1 plate (150g)', calories: 25, protein: 1, carbs: 5, fat: 0, fiber: 3 },
      ],
      nutrition: { calories: 560, protein: 33, carbs: 69, fat: 17, fiber: 16 },
      insight: 'Excellent soluble and insoluble fiber load (16g) supporting LDL and triglyceride control.',
      source: 'scanner',
      isSyntheticDemo: true,
      createdAt: isoDaysAgo(0, 13, 40),
    },
    {
      id: `vip_demo_food_${vipUid}_3`,
      patientId: vipUid,
      patientName: 'Aarav Sharma (VIP Demo)',
      date: dateKeyDaysAgo(1),
      mealType: 'Breakfast',
      description: 'Steel-Cut Vegetable Oats Upma with 2 Boiled Egg Whites & 1 Whole Egg',
      userNotes: 'Morning post-workout breakfast.',
      items: [
        { name: 'Steel-Cut Vegetable Oats Upma', portion: '1 bowl (180g)', calories: 285, protein: 10, carbs: 42, fat: 8, fiber: 6 },
        { name: 'Boiled Eggs (1 Whole + 2 Whites)', portion: '3 eggs', calories: 110, protein: 14, carbs: 1, fat: 5, fiber: 0 },
      ],
      nutrition: { calories: 395, protein: 24, carbs: 43, fat: 13, fiber: 6 },
      insight: 'Beta-glucan fiber from steel-cut oats directly supports cholesterol reduction.',
      source: 'scanner',
      isSyntheticDemo: true,
      createdAt: isoDaysAgo(1, 8, 45),
    },
    {
      id: `vip_demo_food_${vipUid}_4`,
      patientId: vipUid,
      patientName: 'Aarav Sharma (VIP Demo)',
      date: dateKeyDaysAgo(1),
      mealType: 'Snacks',
      description: 'Turmeric Roasted Makhana (30g) & Masala Chaas (200ml)',
      userNotes: 'Evening snack at office.',
      items: [
        { name: 'Roasted Makhana', portion: '30g', calories: 105, protein: 4, carbs: 18, fat: 2, fiber: 2 },
        { name: 'Spiced Buttermilk (Chaas)', portion: '200ml', calories: 45, protein: 3, carbs: 4, fat: 2, fiber: 0 },
      ],
      nutrition: { calories: 150, protein: 7, carbs: 22, fat: 4, fiber: 2 },
      insight: 'Low-sodium, low-GI evening bridge snack.',
      source: 'quick_log',
      isSyntheticDemo: true,
      createdAt: isoDaysAgo(1, 17, 10),
    },
    {
      id: `vip_demo_food_${vipUid}_5`,
      patientId: vipUid,
      patientName: 'Aarav Sharma (VIP Demo)',
      date: dateKeyDaysAgo(1),
      mealType: 'Dinner',
      description: 'Quinoa & Grilled Tofu Bowl with Steamed Broccoli and Lauki Raita',
      userNotes: 'Finished dinner by 7:55 PM.',
      items: [
        { name: 'Quinoa & Grilled Tofu Vegetable Bowl', portion: '200g', calories: 360, protein: 27, carbs: 32, fat: 11, fiber: 6 },
        { name: 'Bottle Gourd (Lauki) Raita', portion: '120g', calories: 85, protein: 5, carbs: 6, fat: 2, fiber: 1 },
      ],
      nutrition: { calories: 445, protein: 32, carbs: 38, fat: 13, fiber: 7 },
      insight: 'Complete plant amino acid profile with light evening carbohydrate load.',
      source: 'scanner',
      isSyntheticDemo: true,
      createdAt: isoDaysAgo(1, 20, 5),
    },
    {
      id: `vip_demo_food_${vipUid}_6`,
      patientId: vipUid,
      patientName: 'Aarav Sharma (VIP Demo)',
      date: dateKeyDaysAgo(2),
      mealType: 'Lunch',
      description: 'Brown Basmati Rice, Home-Cooked Rajma Masala, Curd & Cucumber Salad',
      userNotes: 'Soaked rajma overnight for 12 hours as instructed.',
      items: [
        { name: 'Brown Basmati Rice', portion: '1 cup cooked (150g)', calories: 215, protein: 5, carbs: 45, fat: 2, fiber: 4 },
        { name: 'Home-Style Rajma Masala', portion: '1 bowl (160g)', calories: 240, protein: 15, carbs: 28, fat: 7, fiber: 8 },
        { name: 'Low-Fat Probiotic Curd & Salad', portion: '100g curd + 100g salad', calories: 95, protein: 6, carbs: 8, fat: 3, fiber: 2 },
      ],
      nutrition: { calories: 550, protein: 26, carbs: 81, fat: 12, fiber: 14 },
      insight: 'Well-balanced resistant starch and legume fiber meal.',
      source: 'manual',
      isSyntheticDemo: true,
      createdAt: isoDaysAgo(2, 13, 30),
    },
  ];

  const progressRecords: Array<ProgressRecord & Record<string, any>> = [
    {
      id: `vip_demo_prog_${vipUid}_w1`,
      patientId: vipUid,
      date: '2026-08-15',
      month: 'Aug 2026',
      weightKg: 82.4,
      waistCm: 94.0,
      inchLoss: 0,
      waterLiters: 2.5,
      adherencePercentage: 82,
      bloodPressureSystolic: 128,
      bloodPressureDiastolic: 84,
      fastingSugar: 114,
      hba1c: 6.4,
      notes: 'Baseline Onboarding Week (Synthetic Demo) — Initiated low-GI millet & high-fiber protocol.',
      isSyntheticDemo: true,
      createdAt: '2026-08-15T09:00:00.000Z',
    },
    {
      id: `vip_demo_prog_${vipUid}_w2`,
      patientId: vipUid,
      date: '2026-08-29',
      month: 'Aug 2026',
      weightKg: 81.5,
      waistCm: 93.0,
      inchLoss: 0.4,
      waterLiters: 2.8,
      adherencePercentage: 88,
      bloodPressureSystolic: 126,
      bloodPressureDiastolic: 82,
      fastingSugar: 109,
      hba1c: 6.3,
      notes: 'Week 2 (Synthetic Demo) — Post-meal 15m walks established; evening snack cravings resolved.',
      isSyntheticDemo: true,
      createdAt: '2026-08-29T09:00:00.000Z',
    },
    {
      id: `vip_demo_prog_${vipUid}_w4`,
      patientId: vipUid,
      date: '2026-09-15',
      month: 'Sep 2026',
      weightKg: 80.1,
      waistCm: 91.0,
      inchLoss: 1.2,
      waterLiters: 3.0,
      adherencePercentage: 92,
      bloodPressureSystolic: 122,
      bloodPressureDiastolic: 80,
      fastingSugar: 104,
      hba1c: 6.1,
      notes: 'Week 4 Follow-Up (Synthetic Demo) — HbA1c dropped to 6.1%, Total Cholesterol under 200 mg/dL.',
      isSyntheticDemo: true,
      createdAt: '2026-09-15T09:00:00.000Z',
    },
    {
      id: `vip_demo_prog_${vipUid}_w6`,
      patientId: vipUid,
      date: '2026-09-29',
      month: 'Sep 2026',
      weightKg: 79.3,
      waistCm: 90.0,
      inchLoss: 1.6,
      waterLiters: 3.1,
      adherencePercentage: 94,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 78,
      fastingSugar: 99,
      hba1c: 5.9,
      notes: 'Week 6 (Synthetic Demo) — Consistent strength training 3x/wk and >90% meal plan adherence.',
      isSyntheticDemo: true,
      createdAt: '2026-09-29T09:00:00.000Z',
    },
    {
      id: `vip_demo_prog_${vipUid}_w8`,
      patientId: vipUid,
      date: '2026-10-15',
      month: 'Oct 2026',
      weightKg: 78.6,
      waistCm: 89.0,
      inchLoss: 2.0,
      waterLiters: 3.2,
      adherencePercentage: 95,
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 76,
      fastingSugar: 95,
      hba1c: 5.8,
      notes: 'Week 8 Follow-Up (Synthetic Demo) — HbA1c 5.8%, Triglycerides 138 mg/dL, SGPT 31 U/L.',
      isSyntheticDemo: true,
      createdAt: '2026-10-15T09:00:00.000Z',
    },
  ];

  const monthlyParameters: Array<MonthlyParameterRecord & Record<string, any>> = [
    {
      id: `vip_demo_mp_${vipUid}_2026_08`,
      patientId: vipUid,
      date: '2026-08-15',
      month: 'Aug 2026',
      weightKg: 82.4,
      waistCm: 94.0,
      inchLoss: 0,
      bloodPressureSystolic: 128,
      bloodPressureDiastolic: 84,
      fastingSugar: 114,
      hba1c: 6.4,
      bmi: 27.2,
      notes: 'August Baseline Clinical Parameters (Synthetic Demo)',
      isSyntheticDemo: true,
      createdAt: '2026-08-15T09:00:00.000Z',
    },
    {
      id: `vip_demo_mp_${vipUid}_2026_09`,
      patientId: vipUid,
      date: '2026-09-15',
      month: 'Sep 2026',
      weightKg: 80.1,
      waistCm: 91.0,
      inchLoss: 1.2,
      bloodPressureSystolic: 122,
      bloodPressureDiastolic: 80,
      fastingSugar: 104,
      hba1c: 6.1,
      bmi: 26.5,
      notes: 'September Midpoint Clinical Parameters (Synthetic Demo)',
      isSyntheticDemo: true,
      createdAt: '2026-09-15T09:00:00.000Z',
    },
    {
      id: `vip_demo_mp_${vipUid}_2026_10`,
      patientId: vipUid,
      date: '2026-10-15',
      month: 'Oct 2026',
      weightKg: 78.6,
      waistCm: 89.0,
      inchLoss: 2.0,
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 76,
      fastingSugar: 95,
      hba1c: 5.8,
      bmi: 26.0,
      notes: 'October Follow-Up Clinical Parameters (Synthetic Demo)',
      isSyntheticDemo: true,
      createdAt: '2026-10-15T09:00:00.000Z',
    },
  ];

  const queries: Array<Query & Record<string, any>> = [
    {
      id: `vip_demo_query_${vipUid}_1`,
      patientId: vipUid,
      patientName: 'Aarav Sharma (VIP Demo)',
      question: 'Can I swap evening roasted makhana with roasted black chana on strength-training days?',
      source: 'app',
      status: 'answered',
      date: dateKeyDaysAgo(4),
      reply: 'Yes, Aarav! 35g of unsalted roasted black chana is an excellent swap on strength-training days—it provides extra plant protein and slow-release complex carbs while keeping your glycemic load low. Pair it with 200ml spiced chaas.',
      aiSuggestion: 'Yes, swapping 30g roasted makhana with 35g roasted black chana is a great high-protein, low-GI swap on workout days.',
      repliedAt: isoDaysAgo(4, 14, 0),
      createdAt: isoDaysAgo(4, 11, 30),
      isSyntheticDemo: true,
    },
  ];

  const dieticianNotes: Array<ClinicalNote & Record<string, any>> = [
    {
      id: `vip_demo_note_${vipUid}_1`,
      patientId: vipUid,
      title: 'Week 8 Biomarker & Metabolic Review (Synthetic Demo)',
      category: 'Follow-up',
      content: '[SYNTHETIC DEMO RECORD] Patient demonstrated 94% adherence over 8 weeks. Weight reduced from 82.4 kg to 78.6 kg (-3.8 kg, -2.0 inches waist). HbA1c improved from 6.4% to 5.8%, Triglycerides normalized from 186 to 138 mg/dL, LDL reduced from 140 to 106 mg/dL, and SGPT normalized from 48 to 31 U/L. Continue current 1750 kcal low-GI protocol.',
      authorName: 'Lead Dietician',
      date: '2026-10-15',
      createdAt: '2026-10-15T11:00:00.000Z',
      isSyntheticDemo: true,
    },
  ];

  return {
    userDoc,
    profileDoc,
    mealPlanDoc,
    patientWeekPlanDoc,
    foodLogs,
    progressRecords,
    monthlyParameters,
    queries,
    dieticianNotes,
  };
}

export function buildBasicSyntheticData(basicUid: string) {
  const nowIso = new Date().toISOString();
  const createdIso = isoDaysAgo(10, 10, 0);

  // Baseline 13-biomarker onboarding panel for Basic Demo (11 measured + 2 marked unavailable to demonstrate partial/N/A support)
  const baselinePanel: PatientLabBiomarkers = {
    testDate: '2026-10-10',
    hba1c: 5.4,
    haemoglobin: 12.6,
    cholesterol: 184,
    triglycerides: 118,
    hdl: 54,
    ldl: 106,
    sgpt: 24,
    sgot: 21,
    sodium: 139,
    potassium: 4.2,
    creatinine: 0.78,
    unavailableBiomarkers: ['bun', 'uricAcid'],
    isSyntheticDemo: true,
    notes: 'Baseline Onboarding Lab Panel — Synthetic Demo Data (Not Genuine Lab Results). BUN and Uric Acid marked as Not Available at onboarding.',
  };

  const userDoc = {
    uid: basicUid,
    email: BASIC_DEMO_EMAIL,
    name: 'Meera Nair (Basic Demo)',
    role: 'patient' as const,
    dieticianId: LEAD_DIETICIAN_UID,
    isVip: false,
    isTestPatient: false,
    isDemoAccount: true,
    isSyntheticDemo: true,
    demoTier: 'basic' as const,
    onboardingCompleted: true,
    subscription: null,
    labBiomarkers: baselinePanel,
    labHistory: [baselinePanel],
    createdAt: createdIso,
    updatedAt: nowIso,
  };

  const profileDoc: PatientProfile & Record<string, any> = {
    id: basicUid,
    uid: basicUid,
    dieticianId: LEAD_DIETICIAN_UID,
    email: BASIC_DEMO_EMAIL,
    name: 'Meera Nair (Basic Demo)',
    mobile: '+919000000002',
    dob: '1995-07-19',
    gender: 'Female',
    age: 31,
    startDate: '2026-10-10',
    lifeStage: 'Adult',
    heightCm: 162,
    currentWeightKg: 64.5,
    targetWeightKg: 60.0,
    waistCm: 76.0,
    initialWaistCm: 76.5,
    inchLoss: 0.2,
    idealBodyWeightKg: 56.0,
    bmi: 24.6,
    bmiClassification: 'Normal',
    weightManagement: {
      primaryGoal: 'Maintenance & Toning',
      targetPace: '0.25 kg / week',
      specificFocus: ['Balanced Daily Energy', 'Iron & Protein Sufficiency'],
      targetDifferenceKg: -4.5,
      initialWeightKg: 65.0,
      inchLoss: 0.2,
    },
    medicalHistory: ['None'],
    diagnosisOrProcedure: 'General Wellness & Balanced Nutrition',
    occupation: 'UX Researcher (Synthetic Basic Demo Profile)',
    activityLevel: 'Lightly Active',
    dietaryType: 'Vegetarian',
    goals: ['Balanced Nutrition & Daily Energy', 'Gradual Toning'],
    preferences: {
      favorites: 'Ragi Idli, Vegetable Sambar, Red Matta Rice, Chickpea Sundal',
      dislikes: 'Excessive oily gravies',
      cuisine: 'South Indian Home Style',
      budget: 'Standard',
    },
    healthInfo: {
      conditions: 'None',
      allergies: 'None',
      medications: 'None',
      notes: 'SYNTHETIC BASIC DEMO ACCOUNT — Standard/non-VIP account demonstrating locked premium features (Build My Plate & AI Food Scanner).',
    },
    allergies: [],
    onboardingCompleted: true,
    labBiomarkers: baselinePanel,
    labHistory: [baselinePanel],
    isVip: false,
    isTestPatient: false,
    isDemoAccount: true,
    isSyntheticDemo: true,
    demoTier: 'basic',
    subscription: null,
    status: 'active',
    needsAttention: false,
    adherencePercentage: 85,
    lastConsultationDate: dateKeyDaysAgo(5),
    nextFollowUpDate: dateKeyDaysAgo(-10),
    createdAt: createdIso,
    updatedAt: nowIso,
  };

  const mealPlanDoc: MealPlan & Record<string, any> = {
    id: `basic_demo_plan_${basicUid}`,
    title: 'Everyday Balanced South Indian Wellness Plan (Basic Demo)',
    patientId: basicUid,
    startDate: dateKeyDaysAgo(5),
    endDate: dateKeyDaysAgo(-25),
    targets: {
      calories: 1600,
      protein: 75,
      carbs: 195,
      fat: 52,
    },
    status: 'published',
    instructions: 'Standard wellness meal plan. Upgrade to VIP anytime to unlock AI Food Photo Scanner and Interactive Build My Plate.',
    days: [
      {
        dayNumber: 1,
        meals: [
          {
            type: 'Breakfast',
            name: 'Steamed Ragi Idli (3) with Drumstick Vegetable Sambar & Coconut Chutney',
            portion: '3 idlis + 150ml sambar + 1 tbsp chutney',
            calories: 380,
            protein: 14,
            carbs: 62,
            fat: 8,
            notes: 'High-calcium millet breakfast.',
          },
          {
            type: 'Lunch',
            name: 'Red Matta Rice (1 cup) + Mixed Vegetable Avial + Moong Dal Parippu + Buttermilk',
            portion: '150g rice + 150g avial + 100g dal + 150ml buttermilk',
            calories: 540,
            protein: 22,
            carbs: 78,
            fat: 15,
            notes: 'Balanced traditional lunch.',
          },
          {
            type: 'Evening Snack',
            name: 'Boiled Chickpea Sundal with Curry Leaves & Grated Coconut',
            portion: '1 bowl (100g)',
            calories: 210,
            protein: 11,
            carbs: 27,
            fat: 6,
            notes: 'High-fiber protein snack.',
          },
          {
            type: 'Dinner',
            name: 'Whole Wheat Phulka (2) + Paneer & Green Peas Kurma + Cucumber Salad',
            portion: '2 phulkas + 150g kurma + 100g salad',
            calories: 470,
            protein: 28,
            carbs: 28,
            fat: 23,
            notes: 'Light early dinner before 8:30 PM.',
          },
        ],
      },
    ],
    isSyntheticDemo: true,
    createdAt: isoDaysAgo(5, 11, 0),
  };

  const progressRecords: Array<ProgressRecord & Record<string, any>> = [
    {
      id: `basic_demo_prog_${basicUid}_w1`,
      patientId: basicUid,
      date: '2026-10-10',
      month: 'Oct 2026',
      weightKg: 64.5,
      waistCm: 76.0,
      inchLoss: 0.2,
      waterLiters: 2.4,
      adherencePercentage: 85,
      bloodPressureSystolic: 116,
      bloodPressureDiastolic: 74,
      fastingSugar: 90,
      hba1c: 5.4,
      notes: 'Baseline Onboarding Log (Synthetic Basic Demo).',
      isSyntheticDemo: true,
      createdAt: '2026-10-10T10:00:00.000Z',
    },
  ];

  return {
    userDoc,
    profileDoc,
    mealPlanDoc,
    progressRecords,
  };
}

async function deletePatientRelatedDocs(db: Firestore, patientId: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  const singleDocCollections = ['users', 'patient_profiles', 'patient_week_plans'];
  for (const col of singleDocCollections) {
    const ref = db.collection(col).doc(patientId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
      counts[col] = (counts[col] || 0) + 1;
    }
  }

  const queryCollections: Array<{ col: string; field: string }> = [
    { col: 'food_logs', field: 'patientId' },
    { col: 'progress_records', field: 'patientId' },
    { col: 'meal_plans', field: 'patientId' },
    { col: 'queries', field: 'patientId' },
    { col: 'dietician_notes', field: 'patientId' },
    { col: 'monthly_parameters', field: 'patientId' },
    { col: 'notifications', field: 'userId' },
  ];

  for (const { col, field } of queryCollections) {
    const snap = await db.collection(col).where(field, '==', patientId).get();
    for (const docSnap of snap.docs) {
      if (col === 'dietician_notes' && docSnap.id === 'clinical_knowledge_base') {
        continue; // Never delete clinical_knowledge_base
      }
      await docSnap.ref.delete();
      counts[col] = (counts[col] || 0) + 1;
    }
  }

  return counts;
}

async function ensureAuthUser(
  auth: Auth,
  email: string,
  displayName: string,
  password: string
): Promise<UserRecord> {
  try {
    const existing = await auth.getUserByEmail(email);
    return await auth.updateUser(existing.uid, {
      email,
      displayName,
      password,
      emailVerified: true,
      disabled: false,
    });
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      return await auth.createUser({
        email,
        displayName,
        password,
        emailVerified: true,
        disabled: false,
      });
    }
    throw err;
  }
}

async function seedDemoAccounts(
  auth: Auth,
  db: Firestore,
  forceRotatePasswords = false
) {
  const { vipPassword, basicPassword } = resolveOrCreateDemoPasswords(forceRotatePasswords);

  // 1. Provision or update Firebase Auth accounts
  const vipUser = await ensureAuthUser(auth, VIP_DEMO_EMAIL, 'Aarav Sharma (VIP Demo)', vipPassword);
  const basicUser = await ensureAuthUser(auth, BASIC_DEMO_EMAIL, 'Meera Nair (Basic Demo)', basicPassword);

  // 2. Clean any existing demo records for these two UIDs before deterministic reseed
  await deletePatientRelatedDocs(db, vipUser.uid);
  await deletePatientRelatedDocs(db, basicUser.uid);

  // 3. Seed VIP Demo Account
  const vipData = buildVipSyntheticData(vipUser.uid);
  await db.collection('users').doc(vipUser.uid).set(vipData.userDoc);
  await db.collection('patient_profiles').doc(vipUser.uid).set(vipData.profileDoc);
  await db.collection('meal_plans').doc(vipData.mealPlanDoc.id!).set(vipData.mealPlanDoc);
  await db.collection('patient_week_plans').doc(vipUser.uid).set(vipData.patientWeekPlanDoc);

  for (const fl of vipData.foodLogs) {
    await db.collection('food_logs').doc(fl.id!).set(fl);
  }
  for (const pr of vipData.progressRecords) {
    await db.collection('progress_records').doc(pr.id!).set(pr);
  }
  for (const mp of vipData.monthlyParameters) {
    await db.collection('monthly_parameters').doc(mp.id!).set(mp);
  }
  for (const q of vipData.queries) {
    await db.collection('queries').doc(q.id!).set(q);
  }
  for (const dn of vipData.dieticianNotes) {
    await db.collection('dietician_notes').doc(dn.id!).set(dn);
  }

  // 4. Seed Basic Demo Account
  const basicData = buildBasicSyntheticData(basicUser.uid);
  await db.collection('users').doc(basicUser.uid).set(basicData.userDoc);
  await db.collection('patient_profiles').doc(basicUser.uid).set(basicData.profileDoc);
  await db.collection('meal_plans').doc(basicData.mealPlanDoc.id!).set(basicData.mealPlanDoc);
  for (const pr of basicData.progressRecords) {
    await db.collection('progress_records').doc(pr.id!).set(pr);
  }

  return {
    vipUid: vipUser.uid,
    basicUid: basicUser.uid,
    credentialsSavedTo: 'SECRETS.txt (gitignored)',
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const isDryRun = args.has('--dry-run') || (!args.has('--execute') && !args.has('--reseed-demo') && !args.has('--rotate-passwords'));
  const isExecute = args.has('--execute');
  const isReseedOnly = args.has('--reseed-demo');
  const isRotatePasswords = args.has('--rotate-passwords');

  if (!getApps().length) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath && fs.existsSync(credPath)) {
      const sa = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      initializeApp({
        credential: cert(sa),
        projectId: sa.project_id,
      });
    } else {
      initializeApp();
    }
  }

  const app = getApp();
  const auth = getAuth(app);
  const db = getFirestore(app, NUTRISNAP_DB_ID);

  // Safety Check: Verify Lead Dietician account exists and is untouched
  const leadAuth = await auth.getUser(LEAD_DIETICIAN_UID);
  const leadDoc = await db.collection('users').doc(LEAD_DIETICIAN_UID).get();
  if (!leadDoc.exists || leadDoc.data()?.role !== 'dietician') {
    throw new Error(`ABORT: Lead Dietician account (${LEAD_DIETICIAN_UID} / ${LEAD_DIETICIAN_EMAIL}) not verified!`);
  }
  console.log(`[SAFETY PASS] Lead Dietician verified: ${leadAuth.email} (UID: ${leadAuth.uid}, role: ${leadDoc.data()?.role})`);

  if (isReseedOnly || isRotatePasswords) {
    console.log(`[MODE] ${isRotatePasswords ? 'Rotating Demo Passwords & Reseeding' : 'Deterministic Demo Reseed'}...`);
    const res = await seedDemoAccounts(auth, db, isRotatePasswords);
    console.log('[DONE] Demo accounts reseeded:', res);
    return;
  }

  console.log(`[MODE] ${isDryRun ? 'DRY RUN (No deletions or writes will occur)' : 'EXECUTE (Backing up, cleaning test accounts, and seeding demo accounts)'}`);

  const allTargetTestAccounts = [...CONFIRMED_NUTRISNAP_TEST_UIDS, ...CONFIRMED_AUTH_ONLY_TEST_UIDS];

  // Safety guard: Ensure Lead Dietician is NEVER in target list
  for (const t of allTargetTestAccounts) {
    if (t.uid === LEAD_DIETICIAN_UID || t.email.toLowerCase() === LEAD_DIETICIAN_EMAIL) {
      throw new Error('CRITICAL SAFETY ABORT: Lead dietician found in target list!');
    }
  }

  if (isDryRun) {
    console.log(`\nPlanned NutriSnap Test Account Removals (${CONFIRMED_NUTRISNAP_TEST_UIDS.length}):`);
    for (const item of CONFIRMED_NUTRISNAP_TEST_UIDS) {
      console.log(`  - ${item.uid} | ${item.email} | ${item.reason}`);
    }
    console.log(`\nPlanned Unreferenced Auth-Only Test Account Removals (${CONFIRMED_AUTH_ONLY_TEST_UIDS.length}):`);
    for (const item of CONFIRMED_AUTH_ONLY_TEST_UIDS) {
      console.log(`  - ${item.uid} | ${item.email} | ${item.reason}`);
    }
    console.log(`\nPlanned Orphaned Test PatientIds Cleanup: ${ORPHANED_TEST_PATIENT_IDS.join(', ')}`);
    console.log(`\nPlanned Demo Client Accounts to Provision/Seed:`);
    console.log(`  - Account A (VIP):   ${VIP_DEMO_EMAIL}`);
    console.log(`  - Account B (Basic): ${BASIC_DEMO_EMAIL}`);
    return;
  }

  if (isExecute) {
    // 1. Write full reversible backup to gitignored audit-results/evidence/raw/pre-cleanup-backup.json
    const backupDir = path.resolve(process.cwd(), 'audit-results', 'evidence', 'raw');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `pre-cleanup-backup-${Date.now()}.json`);

    const backupPayload: Record<string, any> = {
      createdAt: new Date().toISOString(),
      databaseId: NUTRISNAP_DB_ID,
      authUsers: [],
      firestoreDocs: {},
    };

    const collectionsToBackup = [
      'users',
      'patient_profiles',
      'patient_week_plans',
      'food_logs',
      'progress_records',
      'meal_plans',
      'queries',
      'dietician_notes',
      'monthly_parameters',
    ];

    for (const col of collectionsToBackup) {
      const snap = await db.collection(col).get();
      backupPayload.firestoreDocs[col] = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    }

    const listUsersResult = await auth.listUsers(1000);
    backupPayload.authUsers = listUsersResult.users.map((u) => u.toJSON());

    fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), { mode: 0o600 });
    console.log(`[BACKUP] Reversible snapshot written to ${path.relative(process.cwd(), backupPath)}`);

    // 2. Delete confirmed NutriSnap test accounts and their Firestore documents
    const deletionSummary: Array<{ uid: string; email: string; authDeleted: boolean; firestoreDeleted: Record<string, number> }> = [];

    for (const target of allTargetTestAccounts) {
      const fsCounts = await deletePatientRelatedDocs(db, target.uid);
      let authDeleted = false;
      try {
        await auth.deleteUser(target.uid);
        authDeleted = true;
      } catch (err: any) {
        if (err?.code === 'auth/user-not-found') {
          authDeleted = false;
        } else {
          throw err;
        }
      }
      deletionSummary.push({
        uid: target.uid,
        email: target.email,
        authDeleted,
        firestoreDeleted: fsCounts,
      });
    }

    // 3. Delete orphaned test patientId documents
    const orphanSummary: Record<string, Record<string, number>> = {};
    for (const orphanId of ORPHANED_TEST_PATIENT_IDS) {
      orphanSummary[orphanId] = await deletePatientRelatedDocs(db, orphanId);
    }

    // 4. Provision & seed the two dedicated demo accounts (VIP + Basic)
    const demoResult = await seedDemoAccounts(auth, db, false);

    // 5. Post-cleanup verification of Lead Dietician & clinical_knowledge_base
    const postLeadAuth = await auth.getUser(LEAD_DIETICIAN_UID);
    const postLeadDoc = await db.collection('users').doc(LEAD_DIETICIAN_UID).get();
    const postKbDoc = await db.collection('dietician_notes').doc('clinical_knowledge_base').get();

    console.log('\n=== EXECUTION SUMMARY ===');
    console.log(`Removed Test Accounts: ${deletionSummary.length}`);
    console.log(`Cleaned Orphaned Test IDs:`, orphanSummary);
    console.log(`Provisioned Demo Accounts:`, demoResult);
    console.log(`Post-Check Lead Dietician: ${postLeadAuth.email} (Active: ${!postLeadAuth.disabled}, Role: ${postLeadDoc.data()?.role})`);
    console.log(`Post-Check clinical_knowledge_base preserved: ${postKbDoc.exists}`);
  }
}

const isDirectExecution =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  main().catch((err) => {
    console.error('Handover script failed:', err);
    process.exit(1);
  });
}
