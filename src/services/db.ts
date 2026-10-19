import { collection, doc, getDoc, getDocs, setDoc, addDoc, query, where, updateDoc, orderBy, serverTimestamp, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';
export { db, auth };
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export function getApiUrl(endpoint: string): string {
  if (typeof window !== 'undefined' && window.location) {
    return endpoint;
  }
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}${endpoint}`;
}

export type Role = 'dietician' | 'patient';

/**
 * Builds a collection query that firestore.rules will accept for the given role.
 * Patients may only read documents whose patientId is their own uid, so their queries
 * must carry that filter; dieticians may read the whole collection.
 */
function roleScopedQuery(collectionName: string, role: Role | undefined, userId?: string) {
  const base = collection(db, collectionName);
  if (role === 'dietician') return query(base);
  const uid = userId || auth.currentUser?.uid || '__no_user__';
  return query(base, where('patientId', '==', uid));
}

export interface User {
  uid: string;
  email: string;
  role: Role;
  name: string;
  dietaryType?: string;
  isVip?: boolean;
  isTestPatient?: boolean;
  isDemoAccount?: boolean;
  demoTier?: 'vip' | 'basic';
  subscription?: {
    planId: string;
    planName: string;
    amountInr: number;
    durationMonths: number;
    status: 'active' | 'expired' | 'cancelled';
    dieticianId: string;
    paymentId?: string;
    orderId?: string;
    startDate: string;
    endDate: string;
    updatedAt?: string;
  } | null;
  onboardingCompleted?: boolean;
  createdAt: any;
}

export interface PatientProfile {
  id: string; // matches uid
  uid?: string;
  dieticianId: string;
  email: string;
  name: string;
  mobile: string;
  dob: string;
  gender: string;
  age?: number;
  startDate?: string;
  lifeStage?: 'Adult' | 'Geriatric' | 'Gynaec' | 'Pediatrics' | string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  waistCm?: number;
  initialWaistCm?: number;
  inchLoss?: number;
  idealBodyWeightKg?: number;
  bmi?: number;
  bmiClassification?: string;
  weightManagement?: {
    primaryGoal: string;
    targetPace?: string;
    specificFocus?: string[];
    targetDifferenceKg?: number;
    initialWeightKg?: number;
    inchLoss?: number;
  };
  medicalHistory?: string[];
  diagnosisOrProcedure?: string;
  occupation?: string;
  activityLevel: string;
  dietaryType: string;
  goals?: string[];
  goalDetails?: Record<string, string[]>;
  preferences: {
    favorites: string;
    dislikes: string;
    cuisine: string;
    budget: string;
  };
  healthInfo: {
    conditions: string;
    allergies: string;
    medications: string;
    notes: string;
  };
  clinicalSummary?: string | ClinicalSummary;
  onboardingCompleted?: boolean;
  allergies?: string[];
  labBiomarkers?: PatientLabBiomarkers;
  labHistory?: PatientLabBiomarkers[];
  isVip?: boolean;
  isTestPatient?: boolean;
  isDemoAccount?: boolean;
  demoTier?: 'vip' | 'basic';
  subscription?: {
    planId: string;
    planName: string;
    amountInr: number;
    durationMonths: number;
    status: 'active' | 'expired' | 'cancelled';
    dieticianId: string;
    paymentId?: string;
    orderId?: string;
    startDate: string;
    endDate: string;
    updatedAt?: string;
  } | null;
  status: 'active' | 'inactive';
  needsAttention: boolean;
  adherencePercentage?: number;
  lastConsultationDate?: string;
  nextFollowUpDate?: string;
  createdAt?: any;
}

// ─── 13 CORE CLINICAL LAB BIOMARKERS PANEL ──────────────────────────────────
export type BiomarkerKey =
  | 'hba1c'
  | 'haemoglobin'
  | 'cholesterol'
  | 'triglycerides'
  | 'hdl'
  | 'ldl'
  | 'sgpt'
  | 'sgot'
  | 'sodium'
  | 'potassium'
  | 'creatinine'
  | 'bun'
  | 'uricAcid';

export interface PatientLabBiomarkers {
  testDate?: string;
  hba1c?: number;           // % (Normal < 5.7, Prediabetes 5.7-6.4, Diabetes >= 6.5)
  haemoglobin?: number;     // g/dL (Female 12-15.5, Male 13.5-17.5)
  cholesterol?: number;     // mg/dL (Desirable < 200, Borderline 200-239, High >= 240)
  triglycerides?: number;   // mg/dL (Normal < 150, Borderline 150-199, High >= 200)
  hdl?: number;             // mg/dL (Optimal Female > 50, Male > 40)
  ldl?: number;             // mg/dL (Optimal < 100, Borderline 100-129, High >= 130)
  sgpt?: number;            // U/L (ALT, Normal 7-56)
  sgot?: number;            // U/L (AST, Normal 10-40)
  sodium?: number;          // mEq/L (Normal 135-145)
  potassium?: number;       // mEq/L (Normal 3.5-5.0)
  creatinine?: number;      // mg/dL (Normal 0.6-1.2)
  bun?: number;             // mg/dL (Normal 7-20)
  uricAcid?: number;        // mg/dL (Female 2.4-6.0, Male 3.4-7.0)
  unavailableBiomarkers?: BiomarkerKey[];
  isSyntheticDemo?: boolean;
  notes?: string;
}

export interface ClinicalBiomarkerDefinition {
  key: BiomarkerKey;
  name: string;
  shortName: string;
  category: 'Metabolic & Glycemic' | 'Hematology' | 'Lipid Profile' | 'Liver Function' | 'Electrolytes' | 'Renal & Uric Acid';
  unit: string;
  min: number;
  max: number;
  step: number;
  normalRange: string;
  placeholder: string;
  description: string;
}

export const CLINICAL_BIOMARKER_DEFINITIONS: readonly ClinicalBiomarkerDefinition[] = [
  {
    key: 'hba1c',
    name: 'Glycated Haemoglobin (HbA1c)',
    shortName: 'HbA1c',
    category: 'Metabolic & Glycemic',
    unit: '%',
    min: 3.0,
    max: 20.0,
    step: 0.1,
    normalRange: '< 5.7%',
    placeholder: 'e.g. 5.4',
    description: '3-month average blood glucose control'
  },
  {
    key: 'haemoglobin',
    name: 'Haemoglobin (Hb)',
    shortName: 'Haemoglobin',
    category: 'Hematology',
    unit: 'g/dL',
    min: 4.0,
    max: 22.0,
    step: 0.1,
    normalRange: '12.0–15.5 (F) / 13.5–17.5 (M) g/dL',
    placeholder: 'e.g. 13.2',
    description: 'Oxygen-carrying protein in red blood cells'
  },
  {
    key: 'cholesterol',
    name: 'Total Cholesterol',
    shortName: 'Cholesterol',
    category: 'Lipid Profile',
    unit: 'mg/dL',
    min: 50,
    max: 600,
    step: 1,
    normalRange: '< 200 mg/dL',
    placeholder: 'e.g. 185',
    description: 'Combined serum cholesterol concentration'
  },
  {
    key: 'triglycerides',
    name: 'Serum Triglycerides',
    shortName: 'Triglycerides',
    category: 'Lipid Profile',
    unit: 'mg/dL',
    min: 20,
    max: 1500,
    step: 1,
    normalRange: '< 150 mg/dL',
    placeholder: 'e.g. 130',
    description: 'Fasting blood lipid storage & glycemic conversion marker'
  },
  {
    key: 'hdl',
    name: 'High-Density Lipoprotein (HDL)',
    shortName: 'HDL ("Good")',
    category: 'Lipid Profile',
    unit: 'mg/dL',
    min: 10,
    max: 150,
    step: 1,
    normalRange: '> 50 (F) / > 40 (M) mg/dL',
    placeholder: 'e.g. 52',
    description: 'Cardioprotective lipoprotein cholesterol'
  },
  {
    key: 'ldl',
    name: 'Low-Density Lipoprotein (LDL)',
    shortName: 'LDL ("Bad")',
    category: 'Lipid Profile',
    unit: 'mg/dL',
    min: 20,
    max: 400,
    step: 1,
    normalRange: '< 100 mg/dL',
    placeholder: 'e.g. 95',
    description: 'Atherogenic lipoprotein cholesterol'
  },
  {
    key: 'sgpt',
    name: 'Serum Glutamic Pyruvic Transaminase (SGPT / ALT)',
    shortName: 'SGPT / ALT',
    category: 'Liver Function',
    unit: 'U/L',
    min: 1,
    max: 1000,
    step: 1,
    normalRange: '7 – 56 U/L',
    placeholder: 'e.g. 28',
    description: 'Alanine aminotransferase hepatic enzyme'
  },
  {
    key: 'sgot',
    name: 'Serum Glutamic Oxaloacetic Transaminase (SGOT / AST)',
    shortName: 'SGOT / AST',
    category: 'Liver Function',
    unit: 'U/L',
    min: 1,
    max: 1000,
    step: 1,
    normalRange: '10 – 40 U/L',
    placeholder: 'e.g. 24',
    description: 'Aspartate aminotransferase hepatic & tissue enzyme'
  },
  {
    key: 'sodium',
    name: 'Serum Sodium (Na)',
    shortName: 'Sodium (Na)',
    category: 'Electrolytes',
    unit: 'mEq/L',
    min: 100,
    max: 180,
    step: 0.5,
    normalRange: '135 – 145 mEq/L',
    placeholder: 'e.g. 140',
    description: 'Extracellular fluid & blood pressure electrolyte'
  },
  {
    key: 'potassium',
    name: 'Serum Potassium (K)',
    shortName: 'Potassium (K)',
    category: 'Electrolytes',
    unit: 'mEq/L',
    min: 1.5,
    max: 9.0,
    step: 0.1,
    normalRange: '3.5 – 5.0 mEq/L',
    placeholder: 'e.g. 4.2',
    description: 'Intracellular & cardiac conduction electrolyte'
  },
  {
    key: 'creatinine',
    name: 'Serum Creatinine',
    shortName: 'Creatinine',
    category: 'Renal & Uric Acid',
    unit: 'mg/dL',
    min: 0.1,
    max: 15.0,
    step: 0.01,
    normalRange: '0.6 – 1.2 mg/dL',
    placeholder: 'e.g. 0.85',
    description: 'Glomerular filtration & renal clearance marker'
  },
  {
    key: 'bun',
    name: 'Blood Urea Nitrogen (BUN)',
    shortName: 'BUN',
    category: 'Renal & Uric Acid',
    unit: 'mg/dL',
    min: 1,
    max: 150,
    step: 0.5,
    normalRange: '7 – 20 mg/dL',
    placeholder: 'e.g. 14',
    description: 'Renal nitrogenous waste & hydration marker'
  },
  {
    key: 'uricAcid',
    name: 'Serum Uric Acid',
    shortName: 'Uric Acid',
    category: 'Renal & Uric Acid',
    unit: 'mg/dL',
    min: 0.5,
    max: 20.0,
    step: 0.1,
    normalRange: '2.4–6.0 (F) / 3.4–7.0 (M) mg/dL',
    placeholder: 'e.g. 5.1',
    description: 'Purine metabolism & gout risk marker'
  }
] as const;

export interface BiomarkerValidationResult {
  valid: boolean;
  errors: Partial<Record<BiomarkerKey, string>>;
  sanitized: PatientLabBiomarkers;
  measuredCount: number;
  unavailableCount: number;
}

/**
 * Validates and sanitizes raw biomarker inputs.
 * - Never invents values when not entered.
 * - Never confuses missing/empty strings with 0.
 * - Rejects negative, non-numeric, or physiologically impossible values.
 */
export function validateLabBiomarkers(
  rawValues: Record<string, string | number | undefined | null>,
  unavailableKeys: BiomarkerKey[] = [],
  meta?: { testDate?: string; notes?: string; isSyntheticDemo?: boolean }
): BiomarkerValidationResult {
  const errors: Partial<Record<BiomarkerKey, string>> = {};
  const sanitized: PatientLabBiomarkers = {};
  const unavailableSet = new Set<BiomarkerKey>(unavailableKeys);
  let measuredCount = 0;

  for (const def of CLINICAL_BIOMARKER_DEFINITIONS) {
    if (unavailableSet.has(def.key)) {
      continue;
    }
    const raw = rawValues[def.key];
    if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
      // Missing value is NOT zero; mark as unavailable if not entered
      unavailableSet.add(def.key);
      continue;
    }
    const num = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (!Number.isFinite(num)) {
      errors[def.key] = `Enter a valid numeric value for ${def.shortName} (${def.unit}).`;
      continue;
    }
    if (num <= 0) {
      errors[def.key] = `${def.shortName} must be greater than 0 ${def.unit}.`;
      continue;
    }
    if (num < def.min || num > def.max) {
      errors[def.key] = `${def.shortName} must be between ${def.min} and ${def.max} ${def.unit}.`;
      continue;
    }
    (sanitized as any)[def.key] = Number(num.toFixed(2));
    measuredCount++;
  }

  if (meta?.testDate && meta.testDate.trim()) {
    sanitized.testDate = meta.testDate.trim();
  }
  if (meta?.notes && meta.notes.trim()) {
    sanitized.notes = meta.notes.trim();
  }
  if (meta?.isSyntheticDemo) {
    sanitized.isSyntheticDemo = true;
  }
  if (unavailableSet.size > 0) {
    sanitized.unavailableBiomarkers = Array.from(unavailableSet);
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized,
    measuredCount,
    unavailableCount: unavailableSet.size
  };
}

export interface ClinicalBiomarkerItem {
  key: keyof PatientLabBiomarkers;
  name: string;
  shortName: string;
  category: 'Metabolic & Glycemic' | 'Hematology' | 'Lipid Profile' | 'Liver Function' | 'Electrolytes' | 'Renal & Uric Acid';
  value: number;
  unit: string;
  normalRange: string;
  status: 'optimal' | 'borderline' | 'elevated' | 'low' | 'critical';
  statusLabel: string;
  badgeColor: string;
  dietaryAction: string;
  clinicalDiscussionPoint: string;
}

export const DEFAULT_SAMPLE_LABS: PatientLabBiomarkers = {
  testDate: '2026-09-28',
  hba1c: 6.8,            // Elevated (Diabetes range)
  haemoglobin: 12.6,      // Optimal
  cholesterol: 218,       // Borderline High
  triglycerides: 184,     // Borderline High
  hdl: 44,                // Borderline Low
  ldl: 137,               // Elevated
  sgpt: 48,               // Borderline Elevated (Fatty liver marker)
  sgot: 35,               // Normal
  sodium: 141,            // Normal
  potassium: 4.3,         // Normal
  creatinine: 0.88,       // Normal
  bun: 15,                // Normal
  uricAcid: 6.6,          // Borderline High
  isSyntheticDemo: true,
  notes: 'Synthetic Reference Panel: Moderate dyslipidemia and elevated HbA1c (6.8%) consistent with metabolic syndrome and Grade 1 Fatty Liver. Renal markers intact.'
};

export function evaluateLabBiomarkers(
  labs?: PatientLabBiomarkers,
  gender: string = 'Female',
  options?: { fallbackToSample?: boolean }
): ClinicalBiomarkerItem[] {
  const effectiveLabs: PatientLabBiomarkers = labs
    ? (options?.fallbackToSample ? { ...DEFAULT_SAMPLE_LABS, ...labs } : labs)
    : (options?.fallbackToSample ? DEFAULT_SAMPLE_LABS : {});
  const isFemale = (gender || '').toLowerCase() !== 'male';
  const list: ClinicalBiomarkerItem[] = [];

  // 1. HbA1c
  if (typeof effectiveLabs.hba1c === 'number') {
    const hba1c = effectiveLabs.hba1c;
    const hba1cStatus = hba1c < 5.7 ? 'optimal' : hba1c <= 6.4 ? 'borderline' : hba1c <= 8.0 ? 'elevated' : 'critical';
    list.push({
      key: 'hba1c',
      name: 'Glycated Haemoglobin',
      shortName: 'HbA1c',
      category: 'Metabolic & Glycemic',
      value: hba1c,
      unit: '%',
      normalRange: '< 5.7%',
      status: hba1cStatus,
      statusLabel: hba1cStatus === 'optimal' ? 'Optimal Glycemia' : hba1cStatus === 'borderline' ? 'Prediabetic Range' : 'Type 2 Diabetic',
      badgeColor: hba1cStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : hba1cStatus === 'borderline' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Prescribe low-glycemic complex carbohydrates (millets, daliya, oats, quinoa), ensure ≥ 30g daily fiber, and spread meals across 6 balanced intervals.',
      clinicalDiscussionPoint: `Current HbA1c of ${hba1c}% indicates average 3-month blood glucose elevation. Low-GI exchanges and meal timing will bring this toward < 6.5%.`
    });
  }

  // 2. Haemoglobin
  if (typeof effectiveLabs.haemoglobin === 'number') {
    const hb = effectiveLabs.haemoglobin;
    const hbMin = isFemale ? 12.0 : 13.5;
    const hbMax = isFemale ? 15.5 : 17.5;
    const hbStatus = hb < hbMin ? 'low' : hb > hbMax ? 'elevated' : 'optimal';
    list.push({
      key: 'haemoglobin',
      name: 'Haemoglobin',
      shortName: 'Hb',
      category: 'Hematology',
      value: hb,
      unit: 'g/dL',
      normalRange: isFemale ? '12.0 – 15.5 g/dL' : '13.5 – 17.5 g/dL',
      status: hbStatus,
      statusLabel: hbStatus === 'optimal' ? 'Normal Oxygenation' : hbStatus === 'low' ? 'Mild Anemia' : 'Elevated',
      badgeColor: hbStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Pair plant iron sources (spinach, beetroot, sprouted lentils) with Vitamin C (lemon juice, amla, capsicum) to optimize bioavailability.',
      clinicalDiscussionPoint: `Haemoglobin at ${hb} g/dL supports healthy cellular oxygenation and metabolic energy.`
    });
  }

  // 3. Cholesterol (Total)
  if (typeof effectiveLabs.cholesterol === 'number') {
    const chol = effectiveLabs.cholesterol;
    const cholStatus = chol < 200 ? 'optimal' : chol <= 239 ? 'borderline' : 'elevated';
    list.push({
      key: 'cholesterol',
      name: 'Total Cholesterol',
      shortName: 'Cholesterol',
      category: 'Lipid Profile',
      value: chol,
      unit: 'mg/dL',
      normalRange: '< 200 mg/dL',
      status: cholStatus,
      statusLabel: cholStatus === 'optimal' ? 'Desirable' : cholStatus === 'borderline' ? 'Borderline High' : 'High Hypercholesterolemia',
      badgeColor: cholStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : cholStatus === 'borderline' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Limit saturated cooking fats (butter, ghee, palm oil) to < 7% of total calories; add soluble beta-glucan fiber and plant sterols.',
      clinicalDiscussionPoint: `Total cholesterol of ${chol} mg/dL requires restriction of dietary saturated fats and boosting dietary soluble fiber.`
    });
  }

  // 4. Triglycerides
  if (typeof effectiveLabs.triglycerides === 'number') {
    const tg = effectiveLabs.triglycerides;
    const tgStatus = tg < 150 ? 'optimal' : tg <= 199 ? 'borderline' : 'elevated';
    list.push({
      key: 'triglycerides',
      name: 'Serum Triglycerides',
      shortName: 'Triglycerides',
      category: 'Lipid Profile',
      value: tg,
      unit: 'mg/dL',
      normalRange: '< 150 mg/dL',
      status: tgStatus,
      statusLabel: tgStatus === 'optimal' ? 'Normal' : tgStatus === 'borderline' ? 'Borderline High' : 'High (Metabolic Risk)',
      badgeColor: tgStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : tgStatus === 'borderline' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Eliminate simple sugars, commercial bakery snacks, and fruit concentrates. Increase plant-based omega-3s (flaxseeds, chia seeds, walnuts).',
      clinicalDiscussionPoint: `Triglycerides at ${tg} mg/dL reflect hepatic carbohydrate packaging; limiting refined sugar shows rapid normalization within 4 weeks.`
    });
  }

  // 5. HDL
  if (typeof effectiveLabs.hdl === 'number') {
    const hdl = effectiveLabs.hdl;
    const hdlMin = isFemale ? 50 : 40;
    const hdlStatus = hdl >= hdlMin ? 'optimal' : 'low';
    list.push({
      key: 'hdl',
      name: 'High-Density Lipoprotein',
      shortName: 'HDL ("Good")',
      category: 'Lipid Profile',
      value: hdl,
      unit: 'mg/dL',
      normalRange: isFemale ? '> 50 mg/dL' : '> 40 mg/dL',
      status: hdlStatus,
      statusLabel: hdlStatus === 'optimal' ? 'Cardioprotective' : 'Suboptimal HDL',
      badgeColor: hdlStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300',
      dietaryAction: 'Introduce healthy monounsaturated fatty acids (MUFA) from cold-pressed oils, soaked almonds, and walnuts; pair with regular brisk walking.',
      clinicalDiscussionPoint: `HDL of ${hdl} mg/dL needs a modest lift via heart-healthy MUFAs and aerobic physical activity.`
    });
  }

  // 6. LDL
  if (typeof effectiveLabs.ldl === 'number') {
    const ldl = effectiveLabs.ldl;
    const ldlStatus = ldl < 100 ? 'optimal' : ldl <= 129 ? 'borderline' : 'elevated';
    list.push({
      key: 'ldl',
      name: 'Low-Density Lipoprotein',
      shortName: 'LDL ("Bad")',
      category: 'Lipid Profile',
      value: ldl,
      unit: 'mg/dL',
      normalRange: '< 100 mg/dL',
      status: ldlStatus,
      statusLabel: ldlStatus === 'optimal' ? 'Optimal Profile' : ldlStatus === 'borderline' ? 'Near Optimal' : 'Atherogenic Risk',
      badgeColor: ldlStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : ldlStatus === 'borderline' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Minimize whole-milk dairy (switch to skim/almond milk); eliminate vanaspati/bakery items; take 5g isabgol (psyllium) before dinner.',
      clinicalDiscussionPoint: `LDL at ${ldl} mg/dL is the primary target for plaque risk prevention. Low saturated fat and high soluble fiber are critical.`
    });
  }

  // 7. SGPT (ALT)
  if (typeof effectiveLabs.sgpt === 'number') {
    const sgpt = effectiveLabs.sgpt;
    const sgptStatus = sgpt <= 45 ? 'optimal' : sgpt <= 65 ? 'borderline' : 'elevated';
    list.push({
      key: 'sgpt',
      name: 'Serum Glutamic Pyruvic Transaminase (ALT)',
      shortName: 'SGPT / ALT',
      category: 'Liver Function',
      value: sgpt,
      unit: 'U/L',
      normalRange: '7 – 56 U/L',
      status: sgptStatus,
      statusLabel: sgptStatus === 'optimal' ? 'Normal Hepatic Function' : sgptStatus === 'borderline' ? 'Mild Hepatic Strain (Fatty Liver)' : 'Active Hepatic Inflammation',
      badgeColor: sgptStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : sgptStatus === 'borderline' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Prescribe hepatic-safe nutrition: strictly avoid deep-fried foods, samosas, puris; boost cruciferous vegetables (broccoli, cauliflower, cabbage).',
      clinicalDiscussionPoint: `SGPT at ${sgpt} U/L indicates mild hepatic parenchymal stress common in Grade 1 Fatty Liver; reversible via weight and dietary fat reduction.`
    });
  }

  // 8. SGOT (AST)
  if (typeof effectiveLabs.sgot === 'number') {
    const sgot = effectiveLabs.sgot;
    const sgotStatus = sgot <= 40 ? 'optimal' : 'elevated';
    list.push({
      key: 'sgot',
      name: 'Serum Glutamic Oxaloacetic Transaminase (AST)',
      shortName: 'SGOT / AST',
      category: 'Liver Function',
      value: sgot,
      unit: 'U/L',
      normalRange: '10 – 40 U/L',
      status: sgotStatus,
      statusLabel: sgotStatus === 'optimal' ? 'Normal Tissue Activity' : 'Elevated AST',
      badgeColor: sgotStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Incorporate hepatic antioxidants: curcumin (turmeric with black pepper), green tea, and raw salads to support liver detoxification.',
      clinicalDiscussionPoint: `SGOT of ${sgot} U/L is within normal limits, showing hepatic cell integrity is preserved.`
    });
  }

  // 9. Sodium
  if (typeof effectiveLabs.sodium === 'number') {
    const na = effectiveLabs.sodium;
    const naStatus = na < 135 ? 'low' : na > 145 ? 'elevated' : 'optimal';
    list.push({
      key: 'sodium',
      name: 'Serum Sodium (Na)',
      shortName: 'Sodium',
      category: 'Electrolytes',
      value: na,
      unit: 'mEq/L',
      normalRange: '135 – 145 mEq/L',
      status: naStatus,
      statusLabel: naStatus === 'optimal' ? 'Electrolyte Equilibrium' : naStatus === 'low' ? 'Hyponatremic' : 'Hypernatremic Risk',
      badgeColor: naStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Adhere to DASH guideline: cap table salt to 1 level teaspoon (~2000mg sodium) daily; exclude pickles, papads, and MSG-rich sauces.',
      clinicalDiscussionPoint: `Serum sodium of ${na} mEq/L is well balanced. Maintaining dietary sodium under 2000mg prevents vascular hypertension.`
    });
  }

  // 10. Potassium
  if (typeof effectiveLabs.potassium === 'number') {
    const k = effectiveLabs.potassium;
    const kStatus = k < 3.5 ? 'low' : k > 5.0 ? 'elevated' : 'optimal';
    list.push({
      key: 'potassium',
      name: 'Serum Potassium (K)',
      shortName: 'Potassium',
      category: 'Electrolytes',
      value: k,
      unit: 'mEq/L',
      normalRange: '3.5 – 5.0 mEq/L',
      status: kStatus,
      statusLabel: kStatus === 'optimal' ? 'Safe Electrolyte Window' : kStatus === 'low' ? 'Hypokalemia' : 'Hyperkalemia Risk',
      badgeColor: kStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Safe to consume standard mineral-rich Indian vegetables (lauki, ridge gourd, spinach, tomato) and fruits; maintains healthy myocardial rhythm.',
      clinicalDiscussionPoint: `Potassium at ${k} mEq/L confirms normal electrolyte homeostasis and safe cardiac conduction.`
    });
  }

  // 11. Creatinine
  if (typeof effectiveLabs.creatinine === 'number') {
    const creat = effectiveLabs.creatinine;
    const creatStatus = creat < 0.6 ? 'low' : creat <= 1.2 ? 'optimal' : creat <= 1.5 ? 'borderline' : 'elevated';
    list.push({
      key: 'creatinine',
      name: 'Serum Creatinine',
      shortName: 'Creatinine',
      category: 'Renal & Uric Acid',
      value: creat,
      unit: 'mg/dL',
      normalRange: '0.6 – 1.2 mg/dL',
      status: creatStatus,
      statusLabel: creatStatus === 'optimal' ? 'Normal Kidney Filtration' : creatStatus === 'borderline' ? 'Mild Renal Load' : 'Renal Impairment',
      badgeColor: creatStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : creatStatus === 'borderline' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Maintain target protein prescription (0.8–1.0 g/kg body weight = ~60–65g daily) from balanced pulses and dairy; avoid unprescribed protein powders.',
      clinicalDiscussionPoint: `Creatinine at ${creat} mg/dL demonstrates healthy glomerular filtration and kidney clearance.`
    });
  }

  // 12. BUN
  if (typeof effectiveLabs.bun === 'number') {
    const bun = effectiveLabs.bun;
    const bunStatus = bun <= 20 ? 'optimal' : bun <= 25 ? 'borderline' : 'elevated';
    list.push({
      key: 'bun',
      name: 'Blood Urea Nitrogen',
      shortName: 'BUN',
      category: 'Renal & Uric Acid',
      value: bun,
      unit: 'mg/dL',
      normalRange: '7 – 20 mg/dL',
      status: bunStatus,
      statusLabel: bunStatus === 'optimal' ? 'Normal Nitrogen Balance' : 'Elevated BUN',
      badgeColor: bunStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300',
      dietaryAction: 'Maintain adequate hydration (2.5 – 3.0 liters daily fluid) to assist renal urea clearance and prevent nitrogenous concentration.',
      clinicalDiscussionPoint: `BUN of ${bun} mg/dL confirms good hydration and appropriate dietary protein metabolism.`
    });
  }

  // 13. Uric Acid
  if (typeof effectiveLabs.uricAcid === 'number') {
    const ua = effectiveLabs.uricAcid;
    const uaMax = isFemale ? 6.0 : 7.0;
    const uaStatus = ua <= uaMax ? 'optimal' : ua <= 7.2 ? 'borderline' : 'elevated';
    list.push({
      key: 'uricAcid',
      name: 'Serum Uric Acid',
      shortName: 'Uric Acid',
      category: 'Renal & Uric Acid',
      value: ua,
      unit: 'mg/dL',
      normalRange: isFemale ? '2.4 – 6.0 mg/dL' : '3.4 – 7.0 mg/dL',
      status: uaStatus,
      statusLabel: uaStatus === 'optimal' ? 'Normal Purine Clearance' : uaStatus === 'borderline' ? 'Hyperuricemic Tendency' : 'High Gout Risk',
      badgeColor: uaStatus === 'optimal' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : uaStatus === 'borderline' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300',
      dietaryAction: 'Reduce high-purine foods (avoid heavy red meats, organ meats, yeast, excess spinach/rajma if symptomatic); drink 3L water and add alkaline lemon water.',
      clinicalDiscussionPoint: `Uric acid at ${ua} mg/dL is on the higher threshold. Alkaline hydration and soaking legumes before cooking will normalize purine load.`
    });
  }

  return list;
}

// ─── RELEVANCE MAPPING: ONLY SHOW BIOMARKERS RELEVANT TO SPECIFIC CONDITIONS ──
export function isBiomarkerRelevantForConditions(key: string, conditionsStr: string = ''): { isRelevant: boolean; reason: string } {
  const cond = (conditionsStr || '').toLowerCase();

  switch (key) {
    case 'hba1c':
      if (cond.includes('diabet') || cond.includes('sugar') || cond.includes('insulin') || cond.includes('pcos') || cond.includes('metabolic') || cond.includes('weight')) {
        return { isRelevant: true, reason: 'Type 2 Diabetes / Glycemic Index Management' };
      }
      break;
    case 'haemoglobin':
      if (cond.includes('anemia') || cond.includes('iron') || cond.includes('fatigue') || cond.includes('deficiency') || cond.includes('pregnancy')) {
        return { isRelevant: true, reason: 'Iron Bioavailability & Oxygen Transport' };
      }
      break;
    case 'cholesterol':
      if (cond.includes('cholesterol') || cond.includes('lipid') || cond.includes('hypertens') || cond.includes('cardiac') || cond.includes('heart') || cond.includes('fatty liver') || cond.includes('diabet')) {
        return { isRelevant: true, reason: 'Cardiovascular Plaque & Lipid Safety' };
      }
      break;
    case 'triglycerides':
      if (cond.includes('diabet') || cond.includes('fatty liver') || cond.includes('lipid') || cond.includes('cholesterol') || cond.includes('metabolic') || cond.includes('pcos')) {
        return { isRelevant: true, reason: 'Insulin Resistance & Hepatic Lipid Packaging' };
      }
      break;
    case 'hdl':
      if (cond.includes('cholesterol') || cond.includes('lipid') || cond.includes('cardiac') || cond.includes('heart') || cond.includes('diabet') || cond.includes('hypertens')) {
        return { isRelevant: true, reason: 'Cardioprotective Reverse Cholesterol Transport' };
      }
      break;
    case 'ldl':
      if (cond.includes('cholesterol') || cond.includes('lipid') || cond.includes('cardiac') || cond.includes('heart') || cond.includes('hypertens') || cond.includes('fatty liver')) {
        return { isRelevant: true, reason: 'Atherogenic Plaque Risk & Saturated Fat Limit' };
      }
      break;
    case 'sgpt':
      if (cond.includes('fatty liver') || cond.includes('liver') || cond.includes('hepatic') || cond.includes('alcohol') || cond.includes('nafld') || cond.includes('diabet')) {
        return { isRelevant: true, reason: 'Hepatic Parenchymal Stress / Fatty Liver Marker' };
      }
      break;
    case 'sgot':
      if (cond.includes('fatty liver') || cond.includes('liver') || cond.includes('hepatic') || cond.includes('nafld') || cond.includes('cardiac')) {
        return { isRelevant: true, reason: 'Hepatic & Muscle Tissue Integrity' };
      }
      break;
    case 'sodium':
      if (cond.includes('hypertens') || cond.includes('bp') || cond.includes('blood pressure') || cond.includes('cardiac') || cond.includes('kidney') || cond.includes('renal') || cond.includes('edema')) {
        return { isRelevant: true, reason: 'Hypertension & DASH Fluid Homeostasis' };
      }
      break;
    case 'potassium':
      if (cond.includes('hypertens') || cond.includes('bp') || cond.includes('cardiac') || cond.includes('kidney') || cond.includes('renal') || cond.includes('ckd')) {
        return { isRelevant: true, reason: 'Renal Clearance & Myocardial Rhythm Safety' };
      }
      break;
    case 'creatinine':
      if (cond.includes('kidney') || cond.includes('renal') || cond.includes('ckd') || cond.includes('diabet') || cond.includes('hypertens') || cond.includes('nephro')) {
        return { isRelevant: true, reason: 'Renal Glomerular Filtration & Protein Target' };
      }
      break;
    case 'bun':
      if (cond.includes('kidney') || cond.includes('renal') || cond.includes('ckd') || cond.includes('hydration') || cond.includes('protein')) {
        return { isRelevant: true, reason: 'Nitrogenous Clearance & Hydration Monitoring' };
      }
      break;
    case 'uricAcid':
      if (cond.includes('gout') || cond.includes('uric') || cond.includes('joint') || cond.includes('kidney') || cond.includes('renal') || cond.includes('metabolic')) {
        return { isRelevant: true, reason: 'Purine Metabolism & Gout / Kidney Stone Risk' };
      }
      break;
  }

  return { isRelevant: false, reason: '' };
}

export interface ClinicalNote {
  id?: string;
  patientId: string;
  title?: string;
  category: 'Consultation' | 'Nutrition' | 'Behaviour' | 'Follow-up' | 'Meal plan' | 'General';
  content: string;
  authorName: string;
  date: string;
  createdAt?: any;
}

export interface ClinicalGuideItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Heart Health' | 'Keto' | 'Nutrition Facts' | 'General';
  imageUrl: string;
  description: string;
  chooseFoods?: string[];
  goEasyFoods?: string[];
  avoidFoods?: string[];
  bulletPoints?: string[];
}

export interface MealPlan {
  id?: string;
  title?: string;
  patientId: string;
  startDate: string;
  endDate: string;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  status: 'draft' | 'published';
  instructions?: string;
  clinicalGuides?: ClinicalGuideItem[];
  attachedGuideIds?: string[];
  days: MealPlanDay[];
  createdAt?: any;
}

export interface MealPlanDay {
  dayNumber: number;
  meals: Meal[];
}

export interface Meal {
  type: string; // Breakfast, Lunch, etc.
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
  recipe?: string[];
  prepTime?: string;
  cookTime?: string;
  notes?: string;
  slotNotes?: string;   // dietitian instructions for the whole meal slot
  itemNotes?: string;   // note for this food only
  noteOnly?: boolean;   // true = instructions-only entry for a slot with no food
}

export interface FoodLogItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  notes?: string;
}

export interface FoodLog {
  id?: string;
  patientId: string;
  patientName?: string;
  date: string; // YYYY-MM-DD
  mealType: string;
  description: string;
  userNotes?: string;
  imageUrl?: string;
  items?: FoodLogItem[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  insight?: string;
  source?: 'scanner' | 'quick_log' | 'manual';
  isExtra?: boolean;
  createdAt?: any;
}

export interface Query {
  id?: string;
  patientId: string;
  patientName: string;
  question: string;
  source: 'app';
  status: 'pending' | 'viewed' | 'answered';
  date: string;
  reply?: string;
  aiSuggestion?: string;
  repliedAt?: any;
  createdAt?: any;
}

export interface ProgressRecord {
  id?: string;
  patientId: string;
  date: string;
  weightKg: number;
  waterLiters?: number;
  adherencePercentage?: number;
  waistCm?: number;
  inchLoss?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  fastingSugar?: number;
  hba1c?: number;
  month?: string;
  notes?: string;
  createdAt?: any;
}

export interface MonthlyParameterRecord {
  id?: string;
  patientId: string;
  date: string;
  month: string; // e.g. "Oct 2026"
  weightKg: number;
  waistCm?: number;
  inchLoss?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  fastingSugar?: number;
  hba1c?: number;
  bmi?: number;
  notes?: string;
  createdAt?: any;
}

export interface Notification {
  id?: string;
  recipientRole?: 'dietician' | 'patient' | 'all';
  recipientId?: string; // patientId if for patient, dieticianId if for dietician
  type: 
    | 'NEW_PATIENT' 
    | 'PATIENT_LOGIN' 
    | 'SYSTEM' 
    | 'AI_COACH_MESSAGE'
    | 'MEAL_PLAN_PUBLISHED'
    | 'QUERY_SUBMITTED'
    | 'QUERY_ANSWERED'
    | 'MEAL_LOGGED'
    | 'TARGET_UPDATED'
    | 'CLINICAL_NOTE'
    | 'SUBSCRIPTION_UPGRADE';
  title?: string;
  patientId?: string;
  patientName?: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt?: any;
}

export interface AiCoachMessage {
  id?: string;
  patientId: string;
  patientName: string;
  question: string;
  aiDraft: string;
  approvedAnswer: string;
  status: 'pending' | 'approved' | 'rejected';
  dieticianNote?: string;
  createdAt?: any;
  approvedAt?: any;
}

export interface RecipeDBItem {
  contraindicatedFor?: string[];
  id?: string;
  name: string;
  dietaryType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  potassium?: number;
  ingredients: string[];
  recipe: string[];
  prepTime?: string;
  cookTime?: string;
  clinicalFocus?: string;
  sourceFileName?: string;
  sheetName?: string;
  // New fields for access control & meal plan assignment
  portionSize?: string;
  source?: string;
  notes?: string;
  tags?: string[];                     // e.g. ['diabetes_safe', 'low_sodium', 'high_fiber']
  restrictedConditions?: string[];     // e.g. ['diabetes', 'hypertension'] — patients with these conditions CANNOT access
  mealTypes?: string[];                // which meal slots this fits: ['Breakfast','Lunch','Dinner','Snack']
  isActive?: boolean;                  // false = soft-deleted / hidden
  createdAt?: any;
}

// ─── WEEK MEAL PLAN FROM KNOWLEDGE BASE ──────────────────────────────────────

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type MealSlot = 'Breakfast' | 'Morning Snack' | 'Lunch' | 'Evening Snack' | 'Dinner' | 'Bedtime Snack';

export interface WeekPlanEntry {
  day: WeekDay;
  mealSlot: MealSlot;
  recipeId: string;
  recipeName: string;
  portion?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fibre?: number;
  sodium?: number;
  potassium?: number;
  notes?: string;
}

export interface PatientWeekPlan {
  id?: string;
  title?: string;
  patientId: string;
  weekStartDate: string;  // ISO date of Monday
  entries: WeekPlanEntry[];
  status: 'draft' | 'published';
  createdAt?: any;
  updatedAt?: any;
}

export async function savePatientWeekPlan(plan: PatientWeekPlan, authorRole?: string): Promise<string> {
  if (authorRole && authorRole !== 'dietician') {
    throw new Error('Unauthorized: Only licensed dieticians can send or assign week plans.');
  }
  const sanitized = cleanFirestoreData(plan);
  let savedId = plan.id;
  if (plan.id) {
    await updateDoc(doc(db, 'patient_week_plans', plan.id), {
      ...sanitized,
      updatedAt: serverTimestamp()
    });
    savedId = plan.id;
  } else {
    const ref = await addDoc(collection(db, 'patient_week_plans'), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    savedId = ref.id;
  }

  return savedId;
}

export async function getPatientWeekPlan(patientId: string): Promise<PatientWeekPlan | null> {
  try {
    const q = query(
      collection(db, 'patient_week_plans'),
      where('patientId', '==', patientId),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    // Return most recent plan
    const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as PatientWeekPlan));
    docs.sort((a, b) => {
      const aTime = (a.createdAt as any)?.seconds || 0;
      const bTime = (b.createdAt as any)?.seconds || 0;
      return bTime - aTime;
    });
    return docs[0];
  } catch (e) {
    console.error('Error fetching patient week plan:', e);
    return null;
  }
}

export async function getAllDraftWeekPlans(patientId: string): Promise<PatientWeekPlan[]> {
  try {
    const q = query(collection(db, 'patient_week_plans'), where('patientId', '==', patientId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as PatientWeekPlan));
  } catch (e) {
    return [];
  }
}

export async function updateRecipeTags(
  recipeName: string,
  tags: string[],
  restrictedConditions: string[],
  mealTypes: string[]
): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'));
    if (!snap.exists()) return false;
    const data = snap.data();
    const recipes: RecipeDBItem[] = Array.isArray(data.recipes) ? data.recipes : [];
    const updated = recipes.map(r =>
      r.name.toLowerCase() === recipeName.toLowerCase()
        ? { ...r, tags, restrictedConditions, mealTypes }
        : r
    );
    await setDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'), {
      recipes: updated,
      count: updated.length,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error('Error updating recipe tags:', e);
    return false;
  }
}

export function filterRecipesForPatient(
  recipes: RecipeDBItem[],
  patientConditions: string[] = [],
  patientAllergies: string[] = []
): RecipeDBItem[] {
  if (
    (!patientConditions || patientConditions.length === 0) &&
    (!patientAllergies || patientAllergies.length === 0)
  ) {
    return recipes;
  }

  const lowerConditions = (patientConditions || [])
    .map(c => c.toLowerCase().trim())
    .filter(c => c && c !== 'none' && c !== 'nil' && c !== 'no');

  const lowerAllergies = (patientAllergies || [])
    .map(a => a.toLowerCase().trim())
    .filter(a => a && a !== 'none' && a !== 'nil' && a !== 'no');

  return recipes.filter(recipe => {
    // 1. Condition check against restrictedConditions & contraindicatedFor
    if (lowerConditions.length > 0) {
      if (recipe.restrictedConditions && recipe.restrictedConditions.length > 0) {
        const restricted = recipe.restrictedConditions.map(c => c.toLowerCase().trim());
        if (restricted.some(rc => lowerConditions.some(pc => pc.includes(rc) || rc.includes(pc)))) {
          return false;
        }
      }
      if (recipe.contraindicatedFor && recipe.contraindicatedFor.length > 0) {
        const contra = recipe.contraindicatedFor.map(c => c.toLowerCase().trim());
        if (contra.some(cc => lowerConditions.some(pc => pc.includes(cc) || cc.includes(pc)))) {
          return false;
        }
      }
    }

    // 2. Strict allergy check against ingredients and recipe preparation text
    if (lowerAllergies.length > 0) {
      const ingredientsText = (recipe.ingredients || []).join(' ').toLowerCase();
      const recipeText = (recipe.recipe || []).join(' ').toLowerCase();
      const recipeName = (recipe.name || '').toLowerCase();
      const fullText = `${recipeName} ${ingredientsText} ${recipeText}`;

      const hasAllergen = lowerAllergies.some(allergen => {
        // Match allergen as word or substring (e.g. "peanut", "egg", "milk", "gluten")
        return fullText.includes(allergen);
      });

      if (hasAllergen) return false;
    }

    return true;
  });
}

// Ensure Dietician Exists
export async function ensureDieticianExists() {
  // We'll check if the dietician user doc exists. If not, we don't create it via auth (as it requires password), 
  // but we can create the profile doc if they sign up. For this app, let's create a signup function for the dietician.
}

// Dietician accounts are provisioned by an administrator (Firebase console: create the Auth user,
// then set users/{uid}.role = 'dietician'). Clients cannot grant themselves this role (firestore.rules).

export interface ClinicalSummary {
  conditions?: string;
  notes?: string;
  primaryDiagnosis?: string;
}

export interface PatientSurveyData {
  mobile?: string;
  dob?: string;
  gender?: string;
  age?: number;
  lifeStage?: string;
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
  waistCm?: number;
  initialWaistCm?: number;
  inchLoss?: number;
  idealBodyWeightKg?: number;
  bmi?: number;
  bmiClassification?: string;
  weightManagement?: {
    primaryGoal: string;
    targetPace?: string;
    specificFocus?: string[];
    targetDifferenceKg?: number;
    initialWeightKg?: number;
    inchLoss?: number;
  };
  medicalHistory?: string[];
  diagnosisOrProcedure?: string;
  occupation?: string;
  dietaryType?: string;
  activityLevel?: string;
  goals?: string[];
  goalDetails?: Record<string, string[]>;
  conditions?: string;
  allergies?: string;
  favorites?: string;
  dislikes?: string;
  cuisine?: string;
  labBiomarkers?: PatientLabBiomarkers;
  onboardingCompleted?: boolean;
}

export async function registerPatient(
  email: string, 
  password: string, 
  name: string,
  surveyData?: PatientSurveyData
) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  const uid = userCredential.user.uid;

  const userDoc: User = {
    uid,
    email,
    role: 'patient',
    name,
    onboardingCompleted: true,
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, 'users', uid), userDoc);

  const height = Number(surveyData?.heightCm) || 165;
  const currentWeight = Number(surveyData?.currentWeightKg) || 65;
  const targetWeight = Number(surveyData?.targetWeightKg) || currentWeight;
  const gender = surveyData?.gender || 'Female';
  
  // Broca's clinical index from assessment form: Male: Ht - 100, Female: Ht - 105
  const idealBodyWeight = Number(surveyData?.idealBodyWeightKg) || (gender === 'Male' ? Math.max(30, height - 100) : Math.max(30, height - 105));
  const heightM = height / 100;
  const calculatedBmi = Number((currentWeight / (heightM * heightM)).toFixed(1));

  let bmiClass = 'Normal (18.5 - 24.9)';
  if (calculatedBmi < 18.5) bmiClass = 'Underweight (< 18.4)';
  else if (calculatedBmi < 25) bmiClass = 'Normal (18.5 - 24.9)';
  else if (calculatedBmi < 30) bmiClass = 'Overweight (25 - 29.9)';
  else if (calculatedBmi < 35) bmiClass = 'Obesity Grade I (30 - 34.9)';
  else if (calculatedBmi < 40) bmiClass = 'Obesity Grade II (35 - 39.9)';
  else bmiClass = 'Morbid Obesity (> 40)';

  const cleanedLabs: PatientLabBiomarkers | undefined = surveyData?.labBiomarkers
    ? cleanFirestoreData({
        ...surveyData.labBiomarkers,
        testDate: surveyData.labBiomarkers.testDate || new Date().toISOString().split('T')[0]
      })
    : undefined;

  const hasMeasuredBiomarker = cleanedLabs
    ? CLINICAL_BIOMARKER_DEFINITIONS.some(d => typeof (cleanedLabs as any)[d.key] === 'number')
    : false;

  const profile: PatientProfile = cleanFirestoreData({
    id: uid,
    dieticianId: 'default_dietician',
    email,
    name,
    mobile: surveyData?.mobile || '',
    dob: surveyData?.dob || '',
    gender,
    age: Number(surveyData?.age) || 32,
    lifeStage: surveyData?.lifeStage || 'Adult',
    heightCm: height,
    currentWeightKg: currentWeight,
    targetWeightKg: targetWeight,
    waistCm: Number(surveyData?.waistCm) || undefined,
    initialWaistCm: Number(surveyData?.initialWaistCm || surveyData?.waistCm) || undefined,
    inchLoss: Number(surveyData?.inchLoss) || 0,
    idealBodyWeightKg: idealBodyWeight,
    bmi: calculatedBmi,
    bmiClassification: surveyData?.bmiClassification || bmiClass,
    weightManagement: surveyData?.weightManagement || {
      primaryGoal: 'Weight Loss & Fat Reduction',
      targetPace: 'Steady & Sustainable (0.5 kg/week)',
      specificFocus: ['Visceral & Belly Fat Reduction', 'Preventing Weight Rebound'],
      targetDifferenceKg: Math.abs(currentWeight - targetWeight)
    },
    medicalHistory: surveyData?.medicalHistory || [],
    diagnosisOrProcedure: surveyData?.diagnosisOrProcedure || '',
    occupation: surveyData?.occupation || 'Business / Employed',
    activityLevel: surveyData?.activityLevel || 'Moderate',
    dietaryType: surveyData?.dietaryType || 'Vegetarian',
    goals: surveyData?.goals || ['Weight Loss & Fat Reduction', 'Metabolic Health'],
    goalDetails: surveyData?.goalDetails || {},
    preferences: {
      favorites: surveyData?.favorites || '',
      dislikes: surveyData?.dislikes || '',
      cuisine: surveyData?.cuisine || '',
      budget: ''
    },
    healthInfo: {
      conditions: surveyData?.conditions || (surveyData?.medicalHistory ? surveyData.medicalHistory.join(', ') : ''),
      allergies: surveyData?.allergies || 'None',
      medications: '',
      notes: surveyData?.diagnosisOrProcedure ? `Diagnosis / Procedure: ${surveyData.diagnosisOrProcedure}` : ''
    },
    labBiomarkers: cleanedLabs || {
      testDate: new Date().toISOString().split('T')[0],
      unavailableBiomarkers: CLINICAL_BIOMARKER_DEFINITIONS.map(d => d.key)
    },
    labHistory: hasMeasuredBiomarker && cleanedLabs ? [cleanedLabs] : [],
    onboardingCompleted: true,
    status: 'active',
    needsAttention: false,
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, 'patient_profiles', uid), profile);

  // Verify persistence before returning
  const verifySnap = await getDoc(doc(db, 'patient_profiles', uid));
  if (!verifySnap.exists()) {
    throw new Error('Profile persistence check failed: patient profile document was not saved.');
  }

  return userCredential.user;
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() as User : null;
}

export async function getPatientProfile(patientId: string): Promise<PatientProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'patient_profiles', patientId));
    return snap.exists() ? snap.data() as PatientProfile : null;
  } catch (err) {
    console.warn('getPatientProfile error:', err);
    return null;
  }
}

export async function updatePatientProfile(patientId: string, updates: Partial<PatientProfile>): Promise<boolean> {
  const sanitized = cleanFirestoreData(updates);
  // Strip privileged fields that Firestore rules prohibit from client-side mutation
  delete (sanitized as any).subscription;
  delete (sanitized as any).isVip;
  delete (sanitized as any).isTestPatient;
  delete (sanitized as any).role;
  delete (sanitized as any).dieticianId;

  try {
    await setDoc(doc(db, 'patient_profiles', patientId), sanitized, { merge: true });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nutrisnap:profile_updated', { detail: sanitized }));
    }
    return true;
  } catch (fsErr) {
    console.warn('Direct Firestore updatePatientProfile error:', fsErr);
    return false;
  }
}

export async function getPatients(): Promise<PatientProfile[]> {
  const q = query(collection(db, 'patient_profiles'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as PatientProfile));
}

// Patient Creation: 
// The dietician creates a patient. We cannot easily create a new Firebase Auth user while the dietician is logged in
// without using the Admin SDK or a secondary app instance. 
// Workaround for MVP: We store the temporary credentials in a 'pending_patients' collection, and when the patient
// tries to login, if they use the temp credentials, we do a trick or we just use a secondary Firebase App instance.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth as getAuthSecond } from 'firebase/auth';

const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(auth.app.options, 'SecondaryApp');
const secondaryAuth = getAuthSecond(secondaryApp);

export async function createPatientProfile(dieticianId: string, data: Partial<PatientProfile>, password?: string) {
  const tempPassword = password || Math.random().toString(36).slice(-8);
  const email = data.email || `patient_${Math.random().toString(36).slice(-6)}@nutrisnap.demo`;
  
  // Create auth user using secondary app so dietician doesn't get logged out
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
  await secondaryAuth.signOut(); // sign out the secondary instance

  const uid = userCredential.user.uid;
  
  const userDoc: User = {
    uid,
    email,
    role: 'patient',
    name: data.name || 'Patient',
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, 'users', uid), userDoc);

  const profile: PatientProfile = {
    ...data,
    id: uid,
    dieticianId,
    email,
    createdAt: serverTimestamp(),
    status: 'active',
    needsAttention: false
  } as PatientProfile;

  await setDoc(doc(db, 'patient_profiles', uid), profile);

  try {
    await createNotification({
      recipientRole: 'dietician',
      type: 'NEW_PATIENT',
      title: 'New Patient Onboarded',
      patientId: uid,
      patientName: data.name || 'New Patient',
      message: `${data.name || 'A new patient'} has been registered to your clinical caseload.`,
      link: `/dietician/patients/${uid}`,
      read: false
    });
  } catch (e) {
    // non-blocking
  }

  return { uid, email, tempPassword };
}

export async function getMealPlans(patientId: string): Promise<MealPlan[]> {
  const q = query(collection(db, 'meal_plans'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as MealPlan));
}

export async function saveMealPlan(plan: MealPlan, authorRole?: string) {
  if (authorRole && authorRole !== 'dietician') {
    throw new Error('Unauthorized: Only licensed dieticians can send or assign meal plans.');
  }
  const sanitized = cleanFirestoreData(plan);
  let savedId = plan.id;
  if (plan.id) {
    const ref = doc(db, 'meal_plans', plan.id);
    await updateDoc(ref, { ...sanitized });
  } else {
    const ref = await addDoc(collection(db, 'meal_plans'), { ...sanitized, createdAt: serverTimestamp() });
    savedId = ref.id;
  }

  if (plan.patientId && plan.status === 'published') {
    try {
      await createNotification({
        recipientRole: 'patient',
        recipientId: plan.patientId,
        type: 'MEAL_PLAN_PUBLISHED',
        title: 'New Meal Plan Assigned',
        patientId: plan.patientId,
        message: `Your dietician has updated your meal plan (${plan.title || 'Weekly Clinical Plan'}). Check your daily recommendations.`,
        link: '/patient/meals',
        read: false
      });
    } catch (e) {
      // non-blocking
    }
  }

  return savedId;
}

export function cleanFirestoreData<T extends Record<string, any>>(data: T): any {
  if (Array.isArray(data)) {
    return data.map(item => {
      if (item && typeof item === 'object' && !(item instanceof Date)) {
        return cleanFirestoreData(item);
      }
      return item;
    });
  }
  if (!data || typeof data !== 'object' || (data instanceof Date)) {
    return data;
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Preserve Firestore FieldValue symbols / instances like serverTimestamp()
        if (('_methodName' in (value as any)) || (value.constructor?.name === 'FieldValueImpl') || (value.constructor?.name === 'FieldValue')) {
          cleaned[key] = value;
        } else {
          cleaned[key] = cleanFirestoreData(value);
        }
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(item => {
          if (item && typeof item === 'object' && !(item instanceof Date)) {
            return cleanFirestoreData(item);
          }
          return item;
        });
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

export async function logMeal(log: FoodLog): Promise<string> {
  const sanitized = cleanFirestoreData(log);

  // 1. Try server endpoint first (bypasses Firestore client-side security rules for patients)
  try {
    const res = await fetch(getApiUrl('/api/patient/log-meal'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id) return data.id;
    }
  } catch (apiErr) {
    console.warn('Notice: Backend API log-meal failed, falling back to direct Firestore:', apiErr);
  }

  // 2. Direct Firestore fallback
  const ref = await addDoc(collection(db, 'food_logs'), { ...sanitized, createdAt: serverTimestamp() });

  try {
    await createNotification({
      recipientRole: 'dietician',
      type: 'MEAL_LOGGED',
      title: 'Meal Logged',
      patientId: log.patientId,
      patientName: log.patientName || 'Patient',
      message: `${log.patientName || 'A patient'} logged ${log.mealType || 'a meal'}: ${log.description || 'Nutrition intake'}.`,
      link: `/dietician/patients/${log.patientId}`,
      read: false
    });
  } catch (e) {
    // non-blocking
  }

  return ref.id;
}

export async function deleteFoodLog(logId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/api/patient/food-log/${encodeURIComponent(logId)}`), {
      method: 'DELETE'
    });
    if (res.ok) return true;
  } catch (apiErr) {
    console.warn('Notice: Backend API deleteFoodLog failed, falling back to direct Firestore:', apiErr);
  }
  try {
    await deleteDoc(doc(db, 'food_logs', logId));
    return true;
  } catch (e) {
    return false;
  }
}

export async function getFoodLogs(patientId: string, date: string): Promise<FoodLog[]> {
  const q = query(collection(db, 'food_logs'), where('patientId', '==', patientId), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs
    .filter(d => d.data().type !== 'checklist')
    .map(d => ({ ...d.data(), id: d.id } as FoodLog));
}

export async function getAllFoodLogsForPatient(patientId: string): Promise<FoodLog[]> {
  const q = query(collection(db, 'food_logs'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  const logs = snap.docs
    .filter(d => d.data().type !== 'checklist')
    .map(d => ({ ...d.data(), id: d.id } as FoodLog));
  // Sort by date descending
  return logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function getAllFoodLogsAcrossAllPatients(): Promise<FoodLog[]> {
  const q = query(collection(db, 'food_logs'));
  const snap = await getDocs(q);
  const logs = snap.docs.map(d => ({ ...d.data(), id: d.id } as FoodLog));
  return logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function getProgressRecords(patientId: string): Promise<ProgressRecord[]> {
  // 1. Try backend API first
  try {
    const res = await fetch(getApiUrl(`/api/patient/progress-records/${encodeURIComponent(patientId)}`));
    if (res.ok) {
      const json = await res.json();
      if (json.records && Array.isArray(json.records)) {
        return json.records;
      }
    }
  } catch (apiErr) {
    // fallback
  }

  // 2. Direct Firestore fallback
  try {
    const q = query(collection(db, 'progress_records'), where('patientId', '==', patientId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ ...d.data(), id: d.id } as ProgressRecord))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  } catch (err) {
    console.warn('getProgressRecords error:', err);
    return [];
  }
}

export async function saveProgressRecord(record: ProgressRecord): Promise<string | null> {
  const sanitized = cleanFirestoreData(record);

  // 1. Try backend API first
  try {
    const res = await fetch(getApiUrl('/api/patient/progress-record'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized)
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrisnap:progress_record_updated', { detail: sanitized }));
      }
      return data.id || 'rec_saved';
    }
  } catch (apiErr) {
    console.warn('API saveProgressRecord note:', apiErr);
  }

  // 2. Direct Firestore fallback
  try {
    const ref = await addDoc(collection(db, 'progress_records'), {
      ...sanitized,
      createdAt: serverTimestamp()
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nutrisnap:progress_record_updated', { detail: sanitized }));
    }
    return ref.id;
  } catch (fsErr) {
    console.warn('Direct Firestore saveProgressRecord error:', fsErr);
    return null;
  }
}

const LOCAL_MONTHLY_PARAMS_PREFIX = 'nutrisnap_monthly_params_';

export async function getMonthlyParameters(patientId: string): Promise<MonthlyParameterRecord[]> {
  try {
    const q = query(
      collection(db, 'monthly_parameters'),
      where('patientId', '==', patientId)
    );
    const snap = await getDocs(q);
    const records = snap.docs.map(d => ({ ...d.data(), id: d.id } as MonthlyParameterRecord));
    records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (records.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${LOCAL_MONTHLY_PARAMS_PREFIX}${patientId}`, JSON.stringify(records));
      } catch {}
    }
    if (records.length > 0) return records;
  } catch (err) {
    console.warn('getMonthlyParameters firestore note:', err);
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${LOCAL_MONTHLY_PARAMS_PREFIX}${patientId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
  }

  return [];
}

export async function saveMonthlyParameter(patientId: string, record: Omit<MonthlyParameterRecord, 'id'>): Promise<string> {
  const sanitized = cleanFirestoreData({ ...record, patientId });
  let savedId = `mparam_${Date.now()}`;

  try {
    const ref = await addDoc(collection(db, 'monthly_parameters'), {
      ...sanitized,
      createdAt: serverTimestamp()
    });
    savedId = ref.id;
  } catch (err) {
    console.warn('saveMonthlyParameter firestore note:', err);
  }

  // Also cache in local storage
  if (typeof window !== 'undefined') {
    try {
      const key = `${LOCAL_MONTHLY_PARAMS_PREFIX}${patientId}`;
      const raw = localStorage.getItem(key);
      const existing: MonthlyParameterRecord[] = raw ? JSON.parse(raw) : [];
      const updated = [{ ...sanitized, id: savedId }, ...existing.filter(r => r.date !== record.date)];
      updated.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('nutrisnap:monthly_parameters_updated', { detail: sanitized }));
    } catch {}
  }

  return savedId;
}

const LOCAL_QUERIES_KEY = 'nutrisnap_cached_queries';

export function getLocalQueries(patientId?: string): Query[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_QUERIES_KEY) : null;
    if (!raw) return [];
    const list: Query[] = JSON.parse(raw);
    if (patientId) {
      return list.filter(q => q.patientId === patientId);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveLocalQuery(queryData: Query): Query {
  try {
    const list = getLocalQueries();
    const newQuery: Query = {
      ...queryData,
      id: queryData.id || `query_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: queryData.createdAt || new Date()
    };
    const updated = [newQuery, ...list.filter(q => q.id !== newQuery.id)];
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_QUERIES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('nutrisnap:query_change', { detail: newQuery }));
    }
    return newQuery;
  } catch (e) {
    console.warn('Failed to save to local query cache:', e);
    return queryData;
  }
}

export function updateLocalQuery(id: string, updates: Partial<Query>) {
  try {
    const list = getLocalQueries();
    const updated = list.map(q => q.id === id ? { ...q, ...updates } : q);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_QUERIES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('nutrisnap:query_change', { detail: { id, updates } }));
    }
  } catch (e) {
    console.warn('Failed to update local query cache:', e);
  }
}

export function deleteLocalQuery(id: string) {
  try {
    const list = getLocalQueries();
    const updated = list.filter(q => q.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_QUERIES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('nutrisnap:query_change', { detail: { id, deleted: true } }));
    }
  } catch (e) {
    console.warn('Failed to delete from local query cache:', e);
  }
}

export async function submitQuery(queryData: Query): Promise<string> {
  // Save locally first to guarantee zero data loss
  const local = saveLocalQuery(queryData);
  let savedId = local.id!;

  // 1. Try serverless backend endpoint first (handles auth and Firestore write)
  try {
    const res = await fetch('/api/queries/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.id) {
        updateLocalQuery(local.id!, { id: data.id });
        savedId = data.id;
      }
    }
  } catch (backendErr) {
    console.warn('Backend query submit endpoint note:', backendErr);
  }

  // 2. Direct Firestore fallback
  if (savedId === local.id!) {
    try {
      const { id: _, ...sanitizedWithoutId } = cleanFirestoreData(queryData);
      const docRef = await addDoc(collection(db, 'queries'), {
        ...sanitizedWithoutId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      if (docRef.id) {
        updateLocalQuery(local.id!, { id: docRef.id });
        savedId = docRef.id;
      }
    } catch (err) {
      console.warn('Notice: Firestore query write failed (retained in client cache):', err);
    }
  }

  // Guarantee real-time notification to the dietician!
  createNotification({
    recipientRole: 'dietician',
    type: 'QUERY_SUBMITTED',
    title: 'New Patient Consultation Query 💬',
    patientId: queryData.patientId,
    patientName: queryData.patientName,
    message: `${queryData.patientName || 'A patient'} asked: "${(queryData.question || '').slice(0, 90)}"`,
    link: '/dietician/inbox',
    read: false
  }).catch(console.warn);

  window.dispatchEvent(new CustomEvent('nutrisnap:query_change'));
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel('nutrisnap_notification_bus');
      bc.postMessage({ type: 'QUERY_SUBMITTED', id: savedId });
      bc.close();
    } catch {}
  }

  return savedId;
}

export async function getQueries(dieticianId?: string, patientId?: string): Promise<Query[]> {
  const localList = getLocalQueries(patientId);
  const getTime = (item: Query) => {
    const val = item.createdAt;
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if ((val as any)?.seconds) return (val as any).seconds * 1000;
    if (typeof (val as any)?.toDate === 'function') return (val as any).toDate().getTime();
    const parsed = new Date(val as any).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  try {
    let q;
    if (patientId) {
      q = query(collection(db, 'queries'), where('patientId', '==', patientId));
    } else {
      q = query(collection(db, 'queries'));
    }
    const snap = await getDocs(q);
    const remoteList = snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as Query));
    
    // Merge remote and local (remote takes precedence, local fills any gaps)
    const map = new Map<string, Query>();
    remoteList.forEach(item => { if (item.id) map.set(item.id, item); });
    localList.forEach(item => { if (item.id && !map.has(item.id)) map.set(item.id, item); });
    return Array.from(map.values()).sort((a, b) => getTime(b) - getTime(a));
  } catch (err) {
    console.warn('Notice: Firestore getQueries failed, returning local cache:', err);
    return localList.sort((a, b) => getTime(b) - getTime(a));
  }
}

export async function updateQuery(id: string, updates: Partial<Query>) {
  const answeredAt = new Date().toISOString();
  const enrichedUpdates = {
    ...updates,
    ...(updates.reply ? { repliedAt: new Date(), answeredAt } : {})
  };

  updateLocalQuery(id, enrichedUpdates);

  // If this update provides an answer or sets answered status, notify the patient!
  if (updates.reply && (updates.status === 'answered' || updates.status === 'viewed' || !updates.status)) {
    try {
      let patientId: string | undefined = updates.patientId;
      let patientName: string | undefined = updates.patientName;
      if (!patientId) {
        const localQ = getLocalQueries().find(q => q.id === id);
        if (localQ) {
          patientId = localQ.patientId;
          patientName = localQ.patientName;
        }
      }
      if (!patientId) {
        const snap = await getDoc(doc(db, 'queries', id));
        if (snap.exists()) {
          const d = snap.data();
          patientId = d?.patientId;
          patientName = d?.patientName;
        }
      }
      if (patientId) {
        const replyText = updates.reply;
        createNotification({
          recipientRole: 'patient',
          recipientId: patientId,
          patientId: patientId,
          patientName: patientName,
          type: 'QUERY_ANSWERED',
          title: 'Dietician Answered Your Query 🩺',
          message: `Jyoti Ma'am replied: "${replyText.slice(0, 80)}${replyText.length > 80 ? '...' : ''}"`,
          link: '/patient/inbox',
          read: false
        }).catch(console.warn);
      }
    } catch (notifErr) {
      console.warn('Notice: Failed to dispatch query reply notification:', notifErr);
    }
  }

  // 1. Direct Firestore update
  try {
    const { id: _, ...sanitized } = cleanFirestoreData(enrichedUpdates);
    await updateDoc(doc(db, 'queries', id), {
      ...sanitized,
      ...(updates.reply ? { repliedAt: serverTimestamp() } : {})
    });
    window.dispatchEvent(new CustomEvent('nutrisnap:query_change'));
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('nutrisnap_notification_bus');
        bc.postMessage({ type: 'QUERY_UPDATED', id });
        bc.close();
      } catch {}
    }
    return;
  } catch (err) {
    console.warn('Notice: Firestore updateDoc note, trying backend endpoint:', err);
  }

  // 2. Backend endpoint fallback
  try {
    await fetch('/api/queries/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryId: id, ...updates })
    });
    window.dispatchEvent(new CustomEvent('nutrisnap:query_change'));
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('nutrisnap_notification_bus');
        bc.postMessage({ type: 'QUERY_UPDATED', id });
        bc.close();
      } catch {}
    }
  } catch (err2) {
    console.warn('Backend update query failed:', err2);
  }
}

export async function deleteQuery(id: string) {
  deleteLocalQuery(id);
  // 1. Direct Firestore delete
  try {
    await deleteDoc(doc(db, 'queries', id));
    return;
  } catch (err) {
    console.warn('Notice: Firestore deleteDoc note, trying backend endpoint:', err);
  }

  // 2. Backend endpoint fallback
  try {
    await fetch('/api/queries/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryId: id, action: 'delete' })
    });
  } catch (err2) {
    console.warn('Backend delete query failed:', err2);
  }
}

// ─── NOTIFICATIONS ENGINE (PATIENT & DIETICIAN) ──────────────────────────────
const LOCAL_NOTIFS_KEY = 'nutrisnap_notifications';

export function getLocalNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalNotifications(notifs: Notification[]) {
  try {
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(notifs.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('nutrisnap:notification_change'));
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('nutrisnap_notification_bus');
        bc.postMessage({ type: 'NOTIFS_UPDATED' });
        bc.close();
      } catch {}
    }
  } catch (err) {
    console.warn('saveLocalNotifications error:', err);
  }
}

const READ_NOTIFS_KEY = 'nutrisnap_read_notification_ids';

export function getReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_NOTIFS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadNotificationId(id: string) {
  try {
    const current = getReadNotificationIds();
    current.add(id);
    const list = Array.from(current).slice(-400);
    localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('nutrisnap:notification_change'));
  } catch (err) {
    console.warn('saveReadNotificationId note:', err);
  }
}

const DISMISSED_NOTIFS_KEY = 'nutrisnap_dismissed_notification_ids';

export function getDismissedNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_NOTIFS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveDismissedNotificationId(id: string) {
  try {
    const current = getDismissedNotificationIds();
    current.add(id);
    const list = Array.from(current).slice(-400);
    localStorage.setItem(DISMISSED_NOTIFS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('nutrisnap:notification_change'));
  } catch (err) {
    console.warn('saveDismissedNotificationId note:', err);
  }
}

export const parseNotificationTime = (n: Notification): number => {
  const val = n.createdAt;
  if (!val) return Date.now();
  if (typeof val === 'number') return val;
  if ((val as any)?.seconds) return (val as any).seconds * 1000;
  if (typeof (val as any)?.toDate === 'function') return (val as any).toDate().getTime();
  const parsed = new Date(val as any).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
};

export async function createNotification(data: Notification) {
  const notifId = data.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const notifObj: Notification = {
    ...data,
    id: notifId,
    recipientRole: data.recipientRole || (data.recipientId ? 'patient' : 'dietician'),
    read: false,
    createdAt: data.createdAt || new Date().toISOString()
  };

  // 1. Save to local storage for instant responsiveness
  const current = getLocalNotifications();
  saveLocalNotifications([notifObj, ...current.filter(n => n.id !== notifId)]);

  // 2. Persist to Firestore 'dietician_notes' collection (100% granted cloud permissions!)
  try {
    const cleanDoc = {
      ...cleanFirestoreData(notifObj),
      isNotification: true,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'dietician_notes', notifId), cleanDoc);
  } catch (err) {
    console.warn('Notice: Background dietician_notes write note:', err);
  }

  // 3. Fallback attempt on collection 'notifications'
  try {
    const cleanDoc = {
      ...cleanFirestoreData(notifObj),
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'notifications', notifId), cleanDoc);
  } catch {}

  // 4. Dispatch Web Push notification to devices via backend (works even when tab/browser is closed!)
  try {
    if (typeof window !== 'undefined') {
      fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: notifObj.recipientRole,
          recipientId: notifObj.recipientId || notifObj.patientId,
          title: notifObj.title || 'NutriSnap Health Alert',
          message: notifObj.message,
          link: notifObj.link,
          tag: notifObj.id,
          type: notifObj.type
        })
      }).catch(() => {});
    }
  } catch {}
}

export async function getNotifications(role?: 'dietician' | 'patient', userId?: string): Promise<Notification[]> {
  const readIds = getReadNotificationIds();
  const dismissedIds = getDismissedNotificationIds();
  const synthesized: Notification[] = [];

  // 1. Fetch live queries
  try {
    const snap = await getDocs(roleScopedQuery('queries', role ?? 'dietician', userId));
    const queries = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));

    if (!role || role === 'dietician') {
      queries.forEach(q => {
        if (!q.id) return;
        const notifId = `query_${q.id}`;
        const isRead = q.status !== 'pending' || (q as any).dieticianRead === true || readIds.has(notifId);
        synthesized.push({
          id: notifId,
          recipientRole: 'dietician',
          type: 'QUERY_SUBMITTED',
          title: 'New Patient Consultation Query 💬',
          patientId: q.patientId,
          patientName: q.patientName || 'Patient',
          message: `${q.patientName || 'A patient'} asked: "${(q.question || '').slice(0, 85)}"`,
          link: '/dietician/inbox',
          read: isRead,
          createdAt: q.createdAt
        });
      });
    }

    if (!role || role === 'patient') {
      queries
        .filter(q => (!userId || q.patientId === userId) && q.reply)
        .forEach(q => {
          if (!q.id) return;
          const notifId = `reply_${q.id}`;
          const isRead = (q as any).patientRead === true || readIds.has(notifId);
          synthesized.push({
            id: notifId,
            recipientRole: 'patient',
            recipientId: q.patientId,
            patientId: q.patientId,
            patientName: q.patientName,
            type: 'QUERY_ANSWERED',
            title: 'Dietician Answered Your Query 🩺',
            message: `Jyoti Ma'am replied: "${(q.reply || '').slice(0, 85)}"`,
            link: '/patient/inbox',
            read: isRead,
            createdAt: (q as any).answeredAt || (q as any).updatedAt || q.createdAt
          });
        });
    }
  } catch (err) {
    console.warn('getNotifications queries fetch note:', err);
  }

  // 2. Fetch live meal plans for patients
  if (!role || role === 'patient') {
    try {
      const snap = await getDocs(roleScopedQuery('meal_plans', role ?? 'dietician', userId));
      const plans = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
      plans
        .filter(p => (!userId || p.patientId === userId) && (p.status === 'published' || !p.status))
        .forEach(p => {
          if (!p.id) return;
          const notifId = `plan_${p.id}`;
          const isRead = (p as any).patientRead === true || readIds.has(notifId);
          synthesized.push({
            id: notifId,
            recipientRole: 'patient',
            recipientId: p.patientId,
            patientId: p.patientId,
            type: 'MEAL_PLAN_PUBLISHED',
            title: 'New Meal Plan Assigned! 🥗',
            message: `Your dietician published your meal plan (${p.title || 'Weekly Clinical Plan'}). Tap to view today's meals!`,
            link: '/patient/meals',
            read: isRead,
            createdAt: (p as any).updatedAt || p.createdAt
          });
        });
    } catch (err) {
      console.warn('getNotifications meal_plans fetch note:', err);
    }
  }

  // 3. Fetch notifications stored in dietician_notes
  try {
    const snap = await getDocs(roleScopedQuery('dietician_notes', role ?? 'dietician', userId));
    snap.docs.forEach(d => {
      const data = d.data() as any;
      if (data && data.isNotification) {
        synthesized.push({ ...data, id: d.id, read: data.read || readIds.has(d.id) });
      }
    });
  } catch (err) {
    console.warn('getNotifications dietician_notes fetch note:', err);
  }

  // 4. Merge with local cache
  const local = getLocalNotifications();
  const allCandidates = [...synthesized, ...local];

  const filtered = allCandidates.filter(n => {
    if (n.id && dismissedIds.has(n.id)) return false;
    if (role === 'dietician') {
      return n.recipientRole === 'dietician' || n.recipientRole === 'all' || !n.recipientRole;
    }
    if (role === 'patient') {
      const matchesRole = n.recipientRole === 'patient' || n.recipientRole === 'all';
      const targetUser = n.recipientId || n.patientId;
      const matchesUser = !targetUser || !userId || targetUser === userId;
      return matchesRole && matchesUser;
    }
    return true;
  });

  const map = new Map<string, Notification>();
  filtered.forEach(n => {
    if (n.id) {
      if (!map.has(n.id)) {
        map.set(n.id, n);
      } else {
        const existing = map.get(n.id)!;
        map.set(n.id, { ...existing, ...n, read: existing.read || n.read });
      }
    }
  });

  const finalItems = Array.from(map.values());
  finalItems.sort((a, b) => parseNotificationTime(b) - parseNotificationTime(a));
  return finalItems;
}

export function subscribeToNotifications(
  role: 'dietician' | 'patient',
  userId: string | undefined,
  onUpdate: (notifs: Notification[]) => void
) {
  let isMounted = true;
  let remoteQueries: Query[] = [];
  let remoteMealPlans: MealPlan[] = [];
  let remoteNotes: any[] = [];

  const computeAndPublish = () => {
    if (!isMounted) return;
    const currentReadIds = getReadNotificationIds();
    const currentDismissedIds = getDismissedNotificationIds();
    const synthesized: Notification[] = [];

    // 1. Synthesize from Live Queries (Firestore 'queries' collection is 100% cloud-allowed!)
    if (role === 'dietician') {
      remoteQueries.forEach(q => {
        if (!q.id) return;
        const notifId = `query_${q.id}`;
        const isRead = q.status !== 'pending' || (q as any).dieticianRead === true || currentReadIds.has(notifId);
        synthesized.push({
          id: notifId,
          recipientRole: 'dietician',
          type: 'QUERY_SUBMITTED',
          title: 'New Patient Consultation Query 💬',
          patientId: q.patientId,
          patientName: q.patientName || 'Patient',
          message: `${q.patientName || 'A patient'} asked: "${(q.question || '').slice(0, 85)}"`,
          link: '/dietician/inbox',
          read: isRead,
          createdAt: q.createdAt || new Date().toISOString()
        });
      });
    } else if (role === 'patient') {
      remoteQueries
        .filter(q => (!userId || q.patientId === userId) && q.reply)
        .forEach(q => {
          if (!q.id) return;
          const notifId = `reply_${q.id}`;
          const isRead = (q as any).patientRead === true || currentReadIds.has(notifId);
          synthesized.push({
            id: notifId,
            recipientRole: 'patient',
            recipientId: q.patientId,
            patientId: q.patientId,
            patientName: q.patientName,
            type: 'QUERY_ANSWERED',
            title: 'Dietician Answered Your Query 🩺',
            message: `Jyoti Ma'am replied: "${(q.reply || '').slice(0, 85)}"`,
            link: '/patient/inbox',
            read: isRead,
            createdAt: (q as any).answeredAt || (q as any).updatedAt || q.createdAt || new Date().toISOString()
          });
        });
    }

    // 2. Synthesize from Live Meal Plans (Firestore 'meal_plans' collection is 100% cloud-allowed!)
    if (role === 'patient') {
      remoteMealPlans
        .filter(p => (!userId || p.patientId === userId) && (p.status === 'published' || !p.status))
        .forEach(p => {
          if (!p.id) return;
          const notifId = `plan_${p.id}`;
          const isRead = (p as any).patientRead === true || currentReadIds.has(notifId);
          synthesized.push({
            id: notifId,
            recipientRole: 'patient',
            recipientId: p.patientId,
            patientId: p.patientId,
            type: 'MEAL_PLAN_PUBLISHED',
            title: 'New Meal Plan Assigned! 🥗',
            message: `Your dietician published your meal plan (${p.title || 'Weekly Clinical Plan'}). Tap to view today's meals!`,
            link: '/patient/meals',
            read: isRead,
            createdAt: (p as any).updatedAt || p.createdAt || new Date().toISOString()
          });
        });
    }

    // 3. Notifications stored in Firestore 'dietician_notes' (100% cloud-allowed!)
    remoteNotes.forEach(docData => {
      if (!docData || !docData.isNotification) return;
      const targetUser = docData.recipientId || docData.patientId;
      const matchesRole = role === 'dietician'
        ? (docData.recipientRole === 'dietician' || docData.recipientRole === 'all' || !docData.recipientRole)
        : ((docData.recipientRole === 'patient' || docData.recipientRole === 'all') && (!targetUser || !userId || targetUser === userId));
      if (!matchesRole) return;

      const notifId = docData.id;
      const isRead = docData.read || (notifId && currentReadIds.has(notifId));
      synthesized.push({
        ...docData,
        read: isRead
      });
    });

    // 4. Merge with local storage cache
    const local = getLocalNotifications();
    const candidateList = [...synthesized, ...local];

    const filtered = candidateList.filter(n => {
      if (n.id && currentDismissedIds.has(n.id)) return false;
      if (role === 'dietician') {
        return n.recipientRole === 'dietician' || n.recipientRole === 'all' || !n.recipientRole;
      }
      if (role === 'patient') {
        const matchesRole = n.recipientRole === 'patient' || n.recipientRole === 'all';
        const targetUser = n.recipientId || n.patientId;
        const matchesUser = !targetUser || !userId || targetUser === userId;
        return matchesRole && matchesUser;
      }
      return true;
    });

    const map = new Map<string, Notification>();
    filtered.forEach(n => {
      if (n.id) {
        if (!map.has(n.id)) {
          map.set(n.id, n);
        } else {
          const existing = map.get(n.id)!;
          map.set(n.id, { ...existing, ...n, read: existing.read || n.read });
        }
      }
    });

    const finalItems = Array.from(map.values());
    finalItems.sort((a, b) => parseNotificationTime(b) - parseNotificationTime(a));
    onUpdate(finalItems);
  };

  // Immediate callback from current cache
  computeAndPublish();

  // Listen to Firestore 'queries' (100% live and permitted!)
  let unsubQueries = () => {};
  try {
    const qQueries = roleScopedQuery('queries', role, userId);
    unsubQueries = onSnapshot(qQueries, (snap) => {
      remoteQueries = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
      computeAndPublish();
    }, (err) => {
      console.warn('Queries snapshot note:', err);
    });
  } catch (e) {
    console.warn('Queries stream error:', e);
  }

  // Listen to Firestore 'meal_plans' (100% live and permitted!)
  let unsubMealPlans = () => {};
  if (role === 'patient') {
    try {
      const qPlans = roleScopedQuery('meal_plans', role, userId);
      unsubMealPlans = onSnapshot(qPlans, (snap) => {
        remoteMealPlans = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
        computeAndPublish();
      }, (err) => {
        console.warn('MealPlans snapshot note:', err);
      });
    } catch (e) {
      console.warn('MealPlans stream error:', e);
    }
  }

  // Listen to Firestore 'dietician_notes' (100% live and permitted!)
  let unsubNotes = () => {};
  try {
    const qNotes = roleScopedQuery('dietician_notes', role, userId);
    unsubNotes = onSnapshot(qNotes, (snap) => {
      remoteNotes = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
      computeAndPublish();
    }, (err) => {
      console.warn('Notes snapshot note:', err);
    });
  } catch (e) {
    console.warn('Notes stream error:', e);
  }

  // Listen to local window events
  const handleLocalChange = () => computeAndPublish();
  window.addEventListener('nutrisnap:notification_change', handleLocalChange);
  window.addEventListener('nutrisnap:query_change', handleLocalChange);

  return () => {
    isMounted = false;
    unsubQueries();
    unsubMealPlans();
    unsubNotes();
    window.removeEventListener('nutrisnap:notification_change', handleLocalChange);
    window.removeEventListener('nutrisnap:query_change', handleLocalChange);
  };
}

export async function markNotificationRead(id: string) {
  saveReadNotificationId(id);

  // Local update
  const local = getLocalNotifications();
  const updated = local.map(n => n.id === id ? { ...n, read: true } : n);
  saveLocalNotifications(updated);

  // Firestore update if it represents a query or meal plan or note
  if (id.startsWith('query_')) {
    const qId = id.replace('query_', '');
    // PRESERVE pending status so queries remain in the dietician inbox until answered!
    updateDoc(doc(db, 'queries', qId), { dieticianRead: true }).catch(() => {});
  } else if (id.startsWith('reply_')) {
    const qId = id.replace('reply_', '');
    updateDoc(doc(db, 'queries', qId), { patientRead: true }).catch(() => {});
  } else if (id.startsWith('plan_')) {
    const pId = id.replace('plan_', '');
    updateDoc(doc(db, 'meal_plans', pId), { patientRead: true }).catch(() => {});
  } else {
    updateDoc(doc(db, 'dietician_notes', id), { read: true }).catch(() => {});
    try {
      updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {});
    } catch {}
  }
}

export async function markAllNotificationsRead(role: 'dietician' | 'patient', userId?: string) {
  const notifs = await getNotifications(role, userId);
  for (const n of notifs) {
    if (n.id) {
      saveReadNotificationId(n.id);
      if (n.id.startsWith('query_')) {
        const qId = n.id.replace('query_', '');
        updateDoc(doc(db, 'queries', qId), { dieticianRead: true }).catch(() => {});
      } else if (n.id.startsWith('reply_')) {
        const qId = n.id.replace('reply_', '');
        updateDoc(doc(db, 'queries', qId), { patientRead: true }).catch(() => {});
      } else if (n.id.startsWith('plan_')) {
        const pId = n.id.replace('plan_', '');
        updateDoc(doc(db, 'meal_plans', pId), { patientRead: true }).catch(() => {});
      } else {
        updateDoc(doc(db, 'dietician_notes', n.id), { read: true }).catch(() => {});
      }
    }
  }

  const local = getLocalNotifications();
  saveLocalNotifications(local.map(n => ({ ...n, read: true })));
  window.dispatchEvent(new CustomEvent('nutrisnap:notification_change'));
}

export async function dismissNotification(id: string) {
  saveDismissedNotificationId(id);
  saveReadNotificationId(id);
  const local = getLocalNotifications();
  saveLocalNotifications(local.filter(n => n.id !== id));
  try {
    await deleteDoc(doc(db, 'dietician_notes', id));
  } catch {}
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch {}
  window.dispatchEvent(new CustomEvent('nutrisnap:notification_change'));
}

export async function clearAllReadNotifications(role: 'dietician' | 'patient', userId?: string) {
  const notifs = await getNotifications(role, userId);
  const readItems = notifs.filter(n => n.read);
  for (const item of readItems) {
    if (item.id) {
      saveDismissedNotificationId(item.id);
    }
  }
  const local = getLocalNotifications();
  saveLocalNotifications(local.filter(n => !n.read));
  window.dispatchEvent(new CustomEvent('nutrisnap:notification_change'));
}

export async function clearNotification(id: string) {
  await dismissNotification(id);
}

// ─── CLINICAL CONSULTATION NOTES ─────────────────────────────────────────────
const LOCAL_NOTES_KEY = 'nutrisnap_clinical_notes';

export async function addClinicalNote(note: ClinicalNote): Promise<string> {
  const noteId = `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newNote: ClinicalNote = {
    ...note,
    id: noteId,
    createdAt: new Date().toISOString()
  };

  // Local storage cache
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_NOTES_KEY);
      const list: ClinicalNote[] = raw ? JSON.parse(raw) : [];
      list.unshift(newNote);
      localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('nutrisnap:notes_change', { detail: newNote }));
    }
  } catch (e) {
    console.warn('Failed to cache clinical note:', e);
  }

  // Firestore attempt
  try {
    const docRef = await addDoc(collection(db, 'dietician_notes'), {
      ...note,
      createdAt: serverTimestamp()
    });

    if (note.patientId) {
      createNotification({
        recipientRole: 'patient',
        recipientId: note.patientId,
        type: 'CLINICAL_NOTE',
        title: 'New Clinical Guidance',
        patientId: note.patientId,
        message: note.title ? `Dietician added: "${note.title}"` : 'Your dietician has posted new clinical guidance notes.',
        link: '/patient',
        read: false
      }).catch(() => {});
    }

    return docRef.id;
  } catch (e) {
    console.warn('Notice: Clinical note saved to client cache:', e);
    if (note.patientId) {
      createNotification({
        recipientRole: 'patient',
        recipientId: note.patientId,
        type: 'CLINICAL_NOTE',
        title: 'New Clinical Guidance',
        patientId: note.patientId,
        message: note.title ? `Dietician added: "${note.title}"` : 'Your dietician has posted new clinical guidance notes.',
        link: '/patient',
        read: false
      }).catch(() => {});
    }
    return noteId;
  }
}

export async function getClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
  let localNotes: ClinicalNote[] = [];
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_NOTES_KEY);
      if (raw) {
        const parsed: any[] = JSON.parse(raw);
        localNotes = parsed.filter(n => n.patientId === patientId && !n.isNotification && (n.note || n.title));
      }
    }
  } catch (e) {
    console.warn('Error reading local clinical notes:', e);
  }

  try {
    const q = query(
      collection(db, 'dietician_notes'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const remoteNotes = snap.docs
      .map(d => ({ ...d.data(), id: d.id } as any))
      .filter(d => !d.isNotification && !['MEAL_PLAN_PUBLISHED', 'PATIENT_LOGIN', 'QUERY_SUBMITTED', 'QUERY_ANSWERED'].includes(d.type) && (d.note || d.title)) as ClinicalNote[];
    
    // Merge remote and local
    const map = new Map<string, ClinicalNote>();
    remoteNotes.forEach(n => { if (n.id) map.set(n.id, n); });
    localNotes.forEach(n => { if (n.id && !map.has(n.id)) map.set(n.id, n); });
    return Array.from(map.values());
  } catch (err) {
    return localNotes;
  }
}

export async function deleteClinicalNote(noteId: string): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_NOTES_KEY);
      if (raw) {
        const parsed: ClinicalNote[] = JSON.parse(raw);
        const filtered = parsed.filter(n => n.id !== noteId);
        localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('nutrisnap:notes_change', { detail: { noteId } }));
      }
    }
    await deleteDoc(doc(db, 'dietician_notes', noteId));
  } catch (err) {
    console.warn('Notice: deleteClinicalNote notice:', err);
  }
}



// ─── AI COACH FIRESTORE FUNCTIONS ────────────────────────────────────────────

export async function saveAiCoachMessage(msg: AiCoachMessage): Promise<string> {
  const docRef = await addDoc(collection(db, 'ai_coach_messages'), {
    patientId: msg.patientId,
    patientName: msg.patientName,
    question: msg.question,
    aiDraft: msg.aiDraft,
    approvedAnswer: msg.approvedAnswer,
    status: msg.status,
    dieticianNote: msg.dieticianNote || '',
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getAiCoachMessages(patientId?: string): Promise<AiCoachMessage[]> {
  try {
    let q;
    if (patientId) {
      q = query(
        collection(db, 'ai_coach_messages'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(collection(db, 'ai_coach_messages'), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as AiCoachMessage));
  } catch (e) {
    console.error('Error fetching AI coach messages:', e);
    return [];
  }
}

export async function approveAiCoachMessage(id: string, approvedAnswer: string, dieticianNote?: string): Promise<void> {
  await updateDoc(doc(db, 'ai_coach_messages', id), {
    status: 'approved',
    approvedAnswer,
    dieticianNote: dieticianNote || '',
    approvedAt: serverTimestamp()
  });
}

export async function rejectAiCoachMessage(id: string, dieticianNote?: string): Promise<void> {
  await updateDoc(doc(db, 'ai_coach_messages', id), {
    status: 'rejected',
    dieticianNote: dieticianNote || '',
    approvedAt: serverTimestamp()
  });
}

export async function deleteAiCoachMessage(id: string): Promise<void> {
  await deleteDoc(doc(db, 'ai_coach_messages', id));
}

export async function sendDirectPatientMessage(patientId: string, patientName: string, message: string, dieticianNote?: string): Promise<string> {
  const docRef = await addDoc(collection(db, 'ai_coach_messages'), {
    patientId,
    patientName,
    question: dieticianNote || 'Direct Dietician Recommendation',
    aiDraft: message,
    approvedAnswer: message,
    status: 'approved',
    dieticianNote: dieticianNote || 'Direct message from Lead Dietician',
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp()
  });
  return docRef.id;
}

// ─── RECIPE KNOWLEDGE BASE FIRESTORE DB FUNCTIONS ────────────────────────────

import { DEFAULT_CLINICAL_RECIPES, EXCHANGE_SYSTEM_REFERENCE } from './defaultRecipes';
export { DEFAULT_CLINICAL_RECIPES, EXCHANGE_SYSTEM_REFERENCE };

export async function saveRecipesToDB(recipes: RecipeDBItem[]): Promise<number> {
  try {
    const existing = await getStoredRecipesFromDB();
    const merged = [
      ...recipes,
      ...existing.filter(e => !recipes.some(r => r.name.toLowerCase() === e.name.toLowerCase()))
    ];
    await setDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'), {
      recipes: merged,
      count: merged.length,
      updatedAt: serverTimestamp()
    });
    return recipes.length;
  } catch (e) {
    console.error('Error saving recipes to DB:', e);
    return 0;
  }
}

/**
 * Clinical Dietary Hierarchy Compatibility Engine
 *
 * Higher dietary tiers can consume items from compatible lower / more restrictive tiers:
 * - Non-Vegetarian: Can eat Non-Vegetarian, Eggetarian, Vegetarian, Jain, and Vegan (all foods).
 * - Eggetarian: Can eat Eggetarian, Vegetarian, Jain, and Vegan (strictly NO poultry, meat, or fish).
 * - Vegetarian: Can eat Vegetarian, Jain, and Vegan (dairy allowed; strictly NO eggs or meat).
 * - Jain: Strictly Jain recipes (no meat, eggs, or underground root vegetables: onion, garlic, potatoes, carrots, etc.).
 * - Vegan: Strictly 100% plant-based recipes (no dairy/paneer/ghee/butter/curd, no eggs, no honey, no meat).
 */
export function isRecipeDietaryCompatible(recipeDiet?: string, patientDiet?: string): boolean {
  if (!patientDiet || !patientDiet.trim()) return true;

  const pd = patientDiet.trim().toLowerCase();
  const rd = (recipeDiet || 'vegetarian').trim().toLowerCase();

  // Non-Vegetarian, Standard, All, or Omnivore can consume all recipes
  if (
    pd === 'all' ||
    pd === 'standard' ||
    pd === 'non-vegetarian' ||
    pd === 'non veg' ||
    pd === 'nonveg' ||
    pd === 'omnivore'
  ) {
    return true;
  }

  // Eggetarian: Eggetarian, Vegetarian, Jain, Vegan
  if (pd === 'eggetarian' || pd === 'eggitarian') {
    return (
      rd === 'eggetarian' ||
      rd === 'eggitarian' ||
      rd === 'vegetarian' ||
      rd === 'veg' ||
      rd === 'jain' ||
      rd === 'vegan'
    );
  }

  // Vegetarian: Vegetarian, Jain, Vegan
  if (pd === 'vegetarian' || pd === 'veg' || pd === 'lacto-vegetarian' || pd === 'lacto vegetarian') {
    return (
      rd === 'vegetarian' ||
      rd === 'veg' ||
      rd === 'jain' ||
      rd === 'vegan'
    );
  }

  // Jain: Strictly Jain
  if (pd === 'jain') {
    return rd === 'jain';
  }

  // Vegan: Strictly Vegan
  if (pd === 'vegan') {
    return rd === 'vegan';
  }

  // Direct match fallback
  return rd === pd;
}

import { PLATE_FOODS } from '../data/plateFoods';
import { MASTER_FOODS } from '../data/masterFoods';

// Convert PLATE_FOODS (457 items) to RecipeDBItem structure
const PLATE_FOODS_AS_RECIPES: RecipeDBItem[] = PLATE_FOODS.map(pf => {
  let diet = pf.dietaryType;
  if (!diet) {
    const lower = (pf.dish + ' ' + (pf.notes || '')).toLowerCase();
    if (lower.includes('egg') && !lower.includes('chicken') && !lower.includes('fish') && !lower.includes('mutton')) {
      diet = 'Eggetarian';
    } else if (lower.includes('chicken') || lower.includes('fish') || lower.includes('prawn') || lower.includes('mutton') || lower.includes('meat') || lower.includes('keema')) {
      diet = 'Non-Vegetarian';
    } else {
      diet = 'Vegetarian';
    }
  }

  // Infer meal types
  const lowerName = pf.dish.toLowerCase();
  const mealTypes: string[] = [];
  if (/poha|upma|idli|dosa|cheela|chilla|paratha|toast|egg|oats|smoothie|thepla/i.test(lowerName)) {
    mealTypes.push('Breakfast');
  }
  if (/dal|curry|sabzi|sabji|roti|rice|khichdi|paneer|chicken|fish|mutton|thali|biryani|pulao/i.test(lowerName)) {
    mealTypes.push('Lunch', 'Dinner');
  }
  if (/chaat|snack|makhana|tea|salad|soup|sprout|bhel|sundal|tikki/i.test(lowerName)) {
    mealTypes.push('Morning Snack', 'Evening Snack');
  }
  if (mealTypes.length === 0) {
    mealTypes.push('Lunch', 'Dinner');
  }

  return {
    id: `pf_${pf.id}`,
    name: pf.dish,
    dietaryType: diet,
    calories: Math.round(pf.cal || 0),
    carbs: Math.round(pf.carb || 0),
    protein: Math.round(pf.protein || 0),
    fat: Math.round(pf.fat || 0),
    fiber: Math.round(pf.fibre || 0),
    sodium: Math.round(pf.sodium || 0),
    potassium: Math.round(pf.potassium || 0),
    ingredients: [pf.dish, pf.region ? `${pf.region} traditional preparation` : 'Indian preparation'],
    recipe: [
      `Standard portion: ${pf.serving || '1 serving'}`,
      pf.notes || 'Nutrient values standardized according to traditional home-style preparation.'
    ],
    prepTime: '10 mins',
    cookTime: '15 mins',
    portionSize: pf.serving || '1 serving',
    clinicalFocus: `${pf.region || 'Indian'} Cuisine • ${pf.diab || 'Balanced Nutrition'}`,
    source: 'Indian Regional Food Database',
    sourceFileName: 'plateFoods.ts',
    sheetName: pf.region || 'Regional',
    tags: [
      pf.diab === 'Portion Controlled' ? 'portion_controlled' : 'diabetes_safe',
      pf.sodium < 200 ? 'low_sodium' : '',
      pf.fibre >= 3 ? 'high_fiber' : ''
    ].filter(Boolean),
    restrictedConditions: pf.diab === 'Limit / No' ? ['diabetes'] : [],
    mealTypes,
    notes: pf.notes || `Traditional ${pf.region} preparation estimate.`
  };
});

// Master baseline combining 200 Exchange recipes, 457 Plate foods and 73 master-list foods
const ALL_BASELINE_RECIPES: RecipeDBItem[] = [
  ...DEFAULT_CLINICAL_RECIPES,
  ...PLATE_FOODS_AS_RECIPES.filter(pf => 
    !DEFAULT_CLINICAL_RECIPES.some(dr => dr.name.toLowerCase() === pf.name.toLowerCase())
  ),
  // 73 extra foods from Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx (names already unique vs the lists above)
  ...MASTER_FOODS
];

export async function getStoredRecipesFromDB(
  dietaryType?: string,
  clinicalFocus?: string,
  exactMatch = false
): Promise<RecipeDBItem[]> {
  try {
    const snap = await getDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'));
    let recipes: RecipeDBItem[] = [];
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.recipes) && data.recipes.length > 0) {
        recipes = data.recipes;
      }
    }
    if (recipes.length < 200) {
      recipes = ALL_BASELINE_RECIPES;
    } else {
      // Ensure baseline plate foods and clinical recipes are included if custom DB is smaller
      recipes = [
        ...recipes,
        ...ALL_BASELINE_RECIPES.filter(b => !recipes.some(r => r.name.toLowerCase() === b.name.toLowerCase()))
      ];
    }

    if (dietaryType && dietaryType !== 'All') {
      if (exactMatch) {
        recipes = recipes.filter(r => (r.dietaryType || '').toLowerCase() === dietaryType.toLowerCase());
      } else {
        recipes = recipes.filter(r => isRecipeDietaryCompatible(r.dietaryType, dietaryType));
      }
    }
    if (clinicalFocus && clinicalFocus !== 'All') {
      recipes = recipes.filter(r => (r.clinicalFocus || '').toLowerCase().includes(clinicalFocus.toLowerCase()));
    }
    return recipes;
  } catch (e) {
    console.error('Error fetching recipes from DB:', e);
    return ALL_BASELINE_RECIPES;
  }
}

export async function clearRecipeDB(): Promise<boolean> {
  try {
    await setDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'), {
      recipes: [],
      count: 0,
      clearedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error('Error clearing recipe DB:', e);
    return false;
  }
}

export function buildClinicalMealPlanFromRecipes(
  availableRecipes: RecipeDBItem[],
  patientProfile?: Partial<PatientProfile> | null,
  targets?: { calories: number; protein: number; carbs: number; fat: number }
): { dayNumber: number; meals: Meal[] }[] {
  let pool = availableRecipes && availableRecipes.length > 0 ? availableRecipes : DEFAULT_CLINICAL_RECIPES;

  // Dietary filter via clinical hierarchy
  const patientDiet = patientProfile?.dietaryType || '';
  if (patientDiet && patientDiet.toLowerCase() !== 'standard' && patientDiet.toLowerCase() !== 'all') {
    const dietFiltered = pool.filter(r => isRecipeDietaryCompatible(r.dietaryType, patientDiet));
    if (dietFiltered.length > 0) {
      pool = dietFiltered;
    }
  }

  // Filter out contraindicated recipes based on medical conditions
  const conditions = [
    ...(patientProfile?.medicalHistory || []),
    ...(patientProfile?.healthInfo?.allergies ? [patientProfile.healthInfo.allergies] : []),
    ...(patientProfile?.goals || [])
  ].map(c => c.toLowerCase());

  const safePool = pool.filter(r => {
    if (!r.contraindicatedFor || r.contraindicatedFor.length === 0) return true;
    return !r.contraindicatedFor.some(tag => 
      conditions.some(cond => cond.includes(tag.toLowerCase()) || tag.toLowerCase().includes(cond))
    );
  });

  const finalPool = safePool.length >= 4 ? safePool : pool;

  // Slot-based indexing for variety
  const breakfasts = finalPool.filter(r => 
    /chilla|oats|egg|bhurji|poha|upma|smoothie|idli|dosa|toast|paratha|breakfast/i.test(r.name) ||
    /breakfast|morning/i.test(r.clinicalFocus || '') ||
    r.calories < 400
  );
  const lunches = finalPool.filter(r => 
    /thali|dal|curry|rice|paneer|chicken|fish|roti|quinoa|stir-fry|khichdi|lunch/i.test(r.name) ||
    /lunch|satiety|main/i.test(r.clinicalFocus || '') ||
    r.calories >= 300
  );
  const snacks = finalPool.filter(r => 
    /chaat|makhana|chana|sundal|snack|tea|tikki|soup|salad|sprout|smoothie/i.test(r.name) ||
    /snack|afternoon|recovery/i.test(r.clinicalFocus || '') ||
    r.calories <= 280
  );
  const dinners = finalPool.filter(r => 
    /soup|curry|salad|paneer|chicken|fish|tofu|stir-fry|dinner|light/i.test(r.name) ||
    /dinner|digest|restful/i.test(r.clinicalFocus || '')
  );

  const getSlotRecipe = (slotCandidates: RecipeDBItem[], fallbackIndex: number): RecipeDBItem => {
    if (slotCandidates.length > 0) {
      return slotCandidates[fallbackIndex % slotCandidates.length];
    }
    return finalPool[fallbackIndex % finalPool.length];
  };

  const days: { dayNumber: number; meals: Meal[] }[] = [];

  for (let day = 1; day <= 7; day++) {
    const bRecipe = getSlotRecipe(breakfasts, day - 1);
    const lRecipe = getSlotRecipe(lunches, day - 1);
    const sRecipe = getSlotRecipe(snacks, day - 1);
    const dRecipe = getSlotRecipe(dinners, day);

    const targetCalories = Number(targets?.calories) || 2000;
    const bTarget = Math.round(targetCalories * 0.28);
    const lTarget = Math.round(targetCalories * 0.38);
    const sTarget = Math.round(targetCalories * 0.12);
    const dTarget = Math.max(150, targetCalories - bTarget - lTarget - sTarget);

    const bBase = Number(bRecipe.calories) || 300;
    const lBase = Number(lRecipe.calories) || 450;
    const sBase = Number(sRecipe.calories) || 180;
    const dBase = Number(dRecipe.calories) || 350;

    const bScale = bTarget / bBase;
    const lScale = lTarget / lBase;
    const sScale = sTarget / sBase;
    const dScale = dTarget / dBase;

    const formatPortion = (basePortion: string, scale: number) => {
      if (scale > 1.25 || scale < 0.8) {
        return `${Math.round(scale * 10) / 10}x portion (${basePortion})`;
      }
      return basePortion;
    };

    const dayMeals: Meal[] = [
      {
        type: 'Breakfast',
        name: bRecipe.name,
        portion: formatPortion(bRecipe.portionSize || '1 serving', bScale),
        calories: bTarget,
        protein: Math.round((Number(bRecipe.protein) || 15) * bScale),
        carbs: Math.round((Number(bRecipe.carbs) || 35) * bScale),
        fat: Math.round((Number(bRecipe.fat) || 8) * bScale),
        prepTime: bRecipe.prepTime || '10 mins',
        cookTime: bRecipe.cookTime || '10 mins',
        ingredients: bRecipe.ingredients || [],
        recipe: bRecipe.recipe || [],
        notes: `Clinical Approved Recipe (${bRecipe.dietaryType}) — ${bRecipe.clinicalFocus || 'High Satiety'}`
      },
      {
        type: 'Lunch',
        name: lRecipe.name,
        portion: formatPortion(lRecipe.portionSize || '1 plate', lScale),
        calories: lTarget,
        protein: Math.round((Number(lRecipe.protein) || 25) * lScale),
        carbs: Math.round((Number(lRecipe.carbs) || 55) * lScale),
        fat: Math.round((Number(lRecipe.fat) || 12) * lScale),
        prepTime: lRecipe.prepTime || '15 mins',
        cookTime: lRecipe.cookTime || '15 mins',
        ingredients: lRecipe.ingredients || [],
        recipe: lRecipe.recipe || [],
        notes: `Clinical Approved Recipe (${lRecipe.dietaryType}) — ${lRecipe.clinicalFocus || 'Balanced Glycemic Index'}`
      },
      {
        type: 'Evening Snack',
        name: sRecipe.name,
        portion: formatPortion(sRecipe.portionSize || '1 portion', sScale),
        calories: sTarget,
        protein: Math.round((Number(sRecipe.protein) || 8) * sScale),
        carbs: Math.round((Number(sRecipe.carbs) || 22) * sScale),
        fat: Math.round((Number(sRecipe.fat) || 4) * sScale),
        prepTime: sRecipe.prepTime || '10 mins',
        cookTime: sRecipe.cookTime || '5 mins',
        ingredients: sRecipe.ingredients || [],
        recipe: sRecipe.recipe || [],
        notes: `Clinical Approved Recipe (${sRecipe.dietaryType}) — ${sRecipe.clinicalFocus || 'Afternoon Energy Stability'}`
      },
      {
        type: 'Dinner',
        name: dRecipe.name,
        portion: formatPortion(dRecipe.portionSize || '1 bowl', dScale),
        calories: dTarget,
        protein: Math.round((Number(dRecipe.protein) || 20) * dScale),
        carbs: Math.round((Number(dRecipe.carbs) || 35) * dScale),
        fat: Math.round((Number(dRecipe.fat) || 10) * dScale),
        prepTime: dRecipe.prepTime || '12 mins',
        cookTime: dRecipe.cookTime || '12 mins',
        ingredients: dRecipe.ingredients || [],
        recipe: dRecipe.recipe || [],
        notes: `Clinical Approved Recipe (${dRecipe.dietaryType}) — ${dRecipe.clinicalFocus || 'Gentle Night Digestion'}`
      }
    ];

    days.push({ dayNumber: day, meals: dayMeals });
  }

  return days;
}

export interface ChecklistMealItem {
  id: string;
  mealType: string;
  name: string;
  portion: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  recipe?: string[];
  ingredients?: string[];
  completed: boolean;
  completedAt?: string;
  isExtra?: boolean;
  logMealId?: string;
}

export interface PatientEatingLogEntry {
  id: string;
  date: string;
  type: 'assigned' | 'extra' | 'scanned';
  mealType: string;
  name: string;
  portion: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  completedAt?: string;
  imageUrl?: string;
  notes?: string;
  isExtra?: boolean;
}

export async function savePatientChecklist(patientId: string, date: string, items: ChecklistMealItem[]) {
  const sanitized = cleanFirestoreData(items);

  // 1. Route via backend API (bypasses Firestore client-side security rules for patients)
  try {
    const res = await fetch(getApiUrl('/api/patient/save-checklist'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, date, items: sanitized })
    });
    if (res.ok) {
      return;
    }
  } catch (apiErr) {
    console.warn('Notice: Backend API save-checklist failed, falling back to direct Firestore:', apiErr);
  }

  // 2. Direct Firestore write fallback
  await setDoc(doc(db, 'food_logs', `checklist_${patientId}_${date}`), {
    patientId,
    date,
    items: sanitized,
    type: 'checklist',
    updatedAt: serverTimestamp()
  });
}

export async function getPatientChecklist(patientId: string, date: string): Promise<ChecklistMealItem[]> {
  // 1. Direct Firestore read first
  try {
    const d = await getDoc(doc(db, 'food_logs', `checklist_${patientId}_${date}`));
    if (d.exists()) {
      const raw = d.data().items;
      return (Array.isArray(raw) ? raw : Object.values(raw || {})) as ChecklistMealItem[];
    }
  } catch (err) {
    console.warn('Notice: getPatientChecklist direct read failed:', err);
  }

  // 2. Try backend API fallback
  try {
    const res = await fetch(getApiUrl(`/api/patient/checklist/${encodeURIComponent(patientId)}/${encodeURIComponent(date)}`));
    if (res.ok) {
      const data = await res.json();
      if (data.items) {
        return Array.isArray(data.items) ? data.items : Object.values(data.items);
      }
    }
  } catch (apiErr) {
    // ignore
  }

  return [];
}

/**
 * Universal Patient Daily Checklist Engine
 * Guarantees that today's meals, calories, macros, and completion checkmarks
 * are always consistently populated and synchronized in real-time between
 * the Patient Dashboard Carousel and the Meal Notepad.
 */
export async function getOrBuildPatientTodayChecklist(
  patientId: string, 
  date: string, 
  patientProfile?: any
): Promise<ChecklistMealItem[]> {
  const [plans, weekPlan, allDbRecipes, savedFirestoreList] = await Promise.all([
    getMealPlans(patientId),
    getPatientWeekPlan(patientId),
    getStoredRecipesFromDB(),
    getPatientChecklist(patientId, date)
  ]);

  const recipePool = allDbRecipes && allDbRecipes.length > 0 ? allDbRecipes : DEFAULT_CLINICAL_RECIPES;

  // Local storage completion map for instant synchronous UI responsiveness
  const storageKey = `nutrisnap_meals_checklist_${patientId}_${date}`;
  let localStateMap: Record<string, { completed: boolean; completedAt?: string }> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) localStateMap = JSON.parse(raw);
    } catch {}
  }

  const savedMap: Record<string, ChecklistMealItem> = {};
  (savedFirestoreList || []).forEach(i => {
    if (i && i.id) savedMap[i.id] = i;
  });

  const published = plans.find(p => p.status === 'published');
  let result: ChecklistMealItem[] = [];

  const DAYS_OF_WEEK: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = DAYS_OF_WEEK[new Date().getDay()];

  // 1. From WeekPlan assigned by Dietician
  if (weekPlan && weekPlan.status === 'published' && weekPlan.entries && weekPlan.entries.length > 0) {
    let todaysEntries = weekPlan.entries.filter(e => e.day === todayDay);
    if (todaysEntries.length === 0) {
      todaysEntries = weekPlan.entries.filter(e => e.day === 'Monday');
    }
    const MEAL_SLOT_ORDER = ['Early Morning', 'Breakfast', 'Morning Snack', 'Mid Morning', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime', 'Bedtime Snack'];
    const sorted = [...todaysEntries].sort(
      (a, b) => {
        const ia = MEAL_SLOT_ORDER.indexOf(a.mealSlot);
        const ib = MEAL_SLOT_ORDER.indexOf(b.mealSlot);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      }
    );

    if (sorted.length > 0) {
      result = sorted.map((entry, idx) => {
        const itemId = `wp_${entry.day}_${entry.mealSlot}_${idx}`;
        const savedItem = savedMap[itemId];
        const isSwappedByPatient = Boolean(savedItem?.notes?.includes('Swapped'));

        const detail = recipePool.find(r => r.name.toLowerCase() === entry.recipeName.toLowerCase()) ||
                       recipePool.find(r => r.id === entry.recipeId);
        
        const isCompleted = localStateMap[itemId]?.completed !== undefined 
          ? localStateMap[itemId].completed 
          : (savedItem?.completed || false);
        const completedAt = localStateMap[itemId]?.completedAt || savedItem?.completedAt;

        const fallbackCal = entry.mealSlot.toLowerCase().includes('snack') ? 180 : entry.mealSlot.toLowerCase().includes('lunch') ? 500 : 380;
        const fallbackP = entry.mealSlot.toLowerCase().includes('snack') ? 8 : entry.mealSlot.toLowerCase().includes('lunch') ? 22 : 16;
        const fallbackC = entry.mealSlot.toLowerCase().includes('snack') ? 25 : entry.mealSlot.toLowerCase().includes('lunch') ? 60 : 45;
        const fallbackF = entry.mealSlot.toLowerCase().includes('snack') ? 6 : entry.mealSlot.toLowerCase().includes('lunch') ? 16 : 12;

        if (isSwappedByPatient && savedItem) {
          return {
            ...savedItem,
            id: itemId,
            completed: isCompleted,
            completedAt,
            isExtra: false
          };
        }

        return {
          id: itemId,
          mealType: entry.mealSlot,
          name: entry.recipeName,
          portion: entry.portion || '1 serving',
          calories: Number(entry.calories) || Number(detail?.calories) || fallbackCal,
          protein: Number(entry.protein) || Number(detail?.protein) || fallbackP,
          carbs: Number(entry.carbs) || Number(detail?.carbs) || fallbackC,
          fat: Number(entry.fat) || Number(detail?.fat) || fallbackF,
          notes: entry.notes || detail?.clinicalFocus,
          recipe: detail?.recipe || [],
          ingredients: detail?.ingredients || [],
          completed: isCompleted,
          completedAt,
          isExtra: false
        };
      });
    }
  }

  // 2. From standard MealPlan if no week plan entries
  if (result.length === 0 && published && published.days && published.days.length > 0) {
    const timeline = calculatePatientProgramTimeline(patientProfile || { uid: patientId }, published);
    const dayIndex = (timeline.totalDays - 1) % published.days.length;
    const dayPlan = published.days[dayIndex] || published.days[0];
    
    result = dayPlan.meals.map((m, idx) => {
      const cleanType = m.type.toLowerCase().replace(/\s+/g, '_');
      const itemId = `plan_meal_${idx}_${cleanType}`;
      const savedItem = savedMap[itemId];
      const isSwappedByPatient = Boolean(savedItem?.notes?.includes('Swapped'));

      const isCompleted = localStateMap[itemId]?.completed !== undefined
        ? localStateMap[itemId].completed
        : (savedItem?.completed || false);
      const completedAt = localStateMap[itemId]?.completedAt || savedItem?.completedAt;

      if (isSwappedByPatient && savedItem) {
        return {
          ...savedItem,
          id: itemId,
          completed: isCompleted,
          completedAt,
          isExtra: false
        };
      }

      const fallbackCal = m.type.toLowerCase().includes('snack') ? 180 : m.type.toLowerCase().includes('lunch') ? 500 : 380;
      const fallbackP = m.type.toLowerCase().includes('snack') ? 8 : m.type.toLowerCase().includes('lunch') ? 22 : 16;
      const fallbackC = m.type.toLowerCase().includes('snack') ? 25 : m.type.toLowerCase().includes('lunch') ? 60 : 45;
      const fallbackF = m.type.toLowerCase().includes('snack') ? 6 : m.type.toLowerCase().includes('lunch') ? 16 : 12;

      return {
        id: itemId,
        mealType: m.type,
        name: m.name,
        portion: m.portion || '1 serving',
        calories: Number(m.calories) || fallbackCal,
        protein: Number(m.protein) || fallbackP,
        carbs: Number(m.carbs) || fallbackC,
        fat: Number(m.fat) || fallbackF,
        notes: m.notes || published.instructions,
        recipe: Array.isArray(m.recipe) ? m.recipe : (m.recipe ? [m.recipe] : []),
        ingredients: Array.isArray(m.ingredients) ? m.ingredients : (m.ingredients ? [m.ingredients] : []),
        completed: isCompleted,
        completedAt,
        isExtra: false
      };
    });
  }

  // 3. Fallback standard meals if neither plan nor week plan is configured yet
  if (result.length === 0) {
    const defaultSlots = [
      { slot: 'Breakfast', name: 'Whole Wheat Toast with Paneer & Sprouts', cal: 360, p: 18, c: 45, f: 12 },
      { slot: 'Morning Snack', name: 'Fresh Seasonal Fruit & Roasted Seeds', cal: 160, p: 4, c: 30, f: 4 },
      { slot: 'Lunch', name: 'Roti with Dal Tadka & Steamed Vegetables', cal: 520, p: 24, c: 68, f: 16 },
      { slot: 'Dinner', name: 'Vegetable Khichdi with Low-Fat Curd', cal: 420, p: 18, c: 58, f: 12 }
    ];
    result = defaultSlots.map((d, idx) => {
      const itemId = `default_meal_${idx}_${d.slot.toLowerCase().replace(/\s+/g, '_')}`;
      const isCompleted = localStateMap[itemId]?.completed !== undefined
        ? localStateMap[itemId].completed
        : (savedMap[itemId]?.completed || false);
      return {
        id: itemId,
        mealType: d.slot,
        name: d.name,
        portion: '1 standard serving',
        calories: d.cal,
        protein: d.p,
        carbs: d.c,
        fat: d.f,
        completed: isCompleted,
        completedAt: localStateMap[itemId]?.completedAt || savedMap[itemId]?.completedAt,
        isExtra: false
      };
    });
  }

  // 4. Append saved custom or extra items
  (savedFirestoreList || []).forEach(item => {
    if (item.isExtra || item.mealType === 'Extra Food' || !result.some(r => r.id === item.id)) {
      if (!result.some(r => r.id === item.id)) {
        const isCompleted = localStateMap[item.id]?.completed !== undefined
          ? localStateMap[item.id].completed
          : item.completed;
        result.push({
          ...item,
          completed: isCompleted,
          completedAt: localStateMap[item.id]?.completedAt || item.completedAt
        });
      }
    }
  });

  return result;
}

export async function getAllPatientEatingLogs(patientId: string): Promise<PatientEatingLogEntry[]> {
  try {
    let rawDocs: any[] = [];

    // 1. Try backend API first (guaranteed server admin auth)
    try {
      const res = await fetch(getApiUrl(`/api/patient/food-logs/${encodeURIComponent(patientId)}`));
      if (res.ok) {
        const json = await res.json();
        if (json.logs && Array.isArray(json.logs)) {
          rawDocs = json.logs;
        }
      }
    } catch (apiErr) {
      // fallback to direct Firestore query
    }

    // 2. Direct Firestore fallback
    if (rawDocs.length === 0) {
      try {
        const q = query(collection(db, 'food_logs'), where('patientId', '==', patientId));
        const snap = await getDocs(q);
        rawDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (fsErr) {
        console.warn('getAllPatientEatingLogs direct Firestore query failed:', fsErr);
      }
    }

    const rawEntries: PatientEatingLogEntry[] = [];

    rawDocs.forEach(data => {
      if (data.type === 'checklist') {
        const rawItems = data.items;
        const items = (Array.isArray(rawItems) ? rawItems : Object.values(rawItems || {})) as ChecklistMealItem[];
        items.filter(i => i.completed).forEach(item => {
          const isExtra = item.isExtra || item.mealType?.toLowerCase().includes('extra') || item.mealType === 'CUSTOM DIETARY NOTE';
          rawEntries.push({
            id: `${data.id || 'chk'}_${item.id}`,
            date: data.date,
            type: isExtra ? 'extra' : 'assigned',
            mealType: isExtra ? 'Extra Food' : item.mealType,
            name: item.name,
            portion: item.portion || '1 serving',
            calories: Number(item.calories) || 0,
            protein: Number(item.protein) || 0,
            carbs: Number(item.carbs) || 0,
            fat: Number(item.fat) || 0,
            completedAt: item.completedAt || 'Completed',
            notes: item.notes,
            isExtra
          });
        });
      } else {
        const isExtra = data.mealType?.toLowerCase().includes('extra') || data.isExtra || data.source === 'quick_log';
        rawEntries.push({
          id: data.id,
          date: data.date,
          type: isExtra ? 'extra' : (data.imageUrl ? 'scanned' : 'assigned'),
          mealType: isExtra ? 'Extra Food' : (data.mealType || 'Meal'),
          name: data.description || data.items?.[0]?.name || 'Logged Food',
          portion: data.items?.[0]?.portion || data.userNotes || '1 serving',
          calories: Number(data.nutrition?.calories) || 0,
          protein: Number(data.nutrition?.protein) || 0,
          carbs: Number(data.nutrition?.carbs) || 0,
          fat: Number(data.nutrition?.fat) || 0,
          completedAt: data.completedAt || (data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : undefined),
          imageUrl: data.imageUrl,
          notes: data.userNotes,
          isExtra
        });
      }
    });

    // Deduplicate entries between checklist and food_logs
    const seen = new Set<string>();
    const entries: PatientEatingLogEntry[] = [];
    rawEntries.forEach(entry => {
      const cleanName = (entry.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase();
      const key = `${entry.date}_${entry.mealType}_${cleanName}_${entry.portion || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        entries.push(entry);
      }
    });

    // Sort by date descending (and then by completedAt descending)
    return entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  } catch (err) {
    console.warn('getAllPatientEatingLogs error:', err);
    return [];
  }
}

// ─── CHRONOLOGICAL PATIENT TIMELINE & ADHERENCE ENGINE ───────────────────────

export interface ChronologicalDayProgress {
  dayNumber: number; // 1, 2, ... 10
  date: string; // YYYY-MM-DD
  displayDate: string; // "Sep 18"
  fullDate: string; // "Wed, Sep 18, 2026"
  isToday: boolean;
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  mealsLogged: number;
  assignedCount: number;
  extraCount: number;
  adherencePercentage: number;
}

export interface PatientProgramTimeline {
  startDate: string; // YYYY-MM-DD
  startDateFormatted: string; // "Sep 18, 2026"
  totalDays: number; // e.g. 10
  currentDayNumber: number; // e.g. 10
  days: ChronologicalDayProgress[];
  overallAdherence: number; // 0-100%
  loggedDaysCount: number; // e.g. 8
  consistencyPercentage: number; // (8 / 10) * 100 = 80%
}

export function calculatePatientProgramTimeline(
  profile?: PatientProfile | User | null,
  mealPlan?: MealPlan | null,
  eatingLogs: PatientEatingLogEntry[] = [],
  todayChecklist: ChecklistMealItem[] = []
): PatientProgramTimeline {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // 1. Determine patient program start date chronologically
  let startDateObj: Date | null = null;

  // Check profile.createdAt
  if (profile?.createdAt) {
    if (typeof profile.createdAt.toDate === 'function') {
      startDateObj = profile.createdAt.toDate();
    } else if (profile.createdAt.seconds) {
      startDateObj = new Date(profile.createdAt.seconds * 1000);
    } else if (typeof profile.createdAt === 'string' || typeof profile.createdAt === 'number') {
      const parsed = new Date(profile.createdAt);
      if (!isNaN(parsed.getTime())) startDateObj = parsed;
    }
  }

  // Check mealPlan.startDate
  if (!startDateObj && mealPlan?.startDate) {
    const planStart = new Date(mealPlan.startDate + 'T00:00:00');
    if (!isNaN(planStart.getTime())) startDateObj = planStart;
  }

  // Check earliest eating log date
  if (eatingLogs.length > 0) {
    const logDates = eatingLogs
      .map(l => l.date)
      .filter((d): d is string => Boolean(d) && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    if (logDates.length > 0) {
      const earliestLog = new Date(logDates[0] + 'T00:00:00');
      if (!isNaN(earliestLog.getTime())) {
        if (!startDateObj || earliestLog.getTime() < startDateObj.getTime()) {
          startDateObj = earliestLog;
        }
      }
    }
  }

  // Fallback to today if no earlier record exists
  if (!startDateObj || isNaN(startDateObj.getTime())) {
    startDateObj = new Date();
  }

  // Normalize startDateObj to midnight local date string YYYY-MM-DD
  let startYear = startDateObj.getFullYear();
  let startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0');
  let startDay = String(startDateObj.getDate()).padStart(2, '0');
  let startDateStr = `${startYear}-${startMonth}-${startDay}`;

  // If start date is in the future (due to device clock skew), clamp to today
  if (startDateStr > todayStr) {
    startDateStr = todayStr;
  }

  const startMidnight = new Date(startDateStr + 'T00:00:00');
  const todayMidnight = new Date(todayStr + 'T00:00:00');

  // Exact calendar days on program (Day 1 through Day totalDays, e.g. Sep 18 to Sep 27 = 10 days)
  const diffTime = Math.max(0, todayMidnight.getTime() - startMidnight.getTime());
  const totalDays = Math.max(1, Math.round(diffTime / 86400000) + 1);

  // Merge today's completed checklist items into log pool if not already in eatingLogs
  const allLogs = [...eatingLogs];
  const completedTodayChecklist = todayChecklist.filter(i => i.completed);
  completedTodayChecklist.forEach(chk => {
    const cleanName = (chk.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase();
    const alreadyLogged = allLogs.some(
      l => l.date === todayStr && (l.id === `chk_${chk.id}` || (l.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase() === cleanName)
    );
    if (!alreadyLogged) {
      const isExtra = chk.isExtra || chk.mealType?.toLowerCase().includes('extra');
      allLogs.push({
        id: `chk_${chk.id}`,
        date: todayStr,
        type: isExtra ? 'extra' : 'assigned',
        mealType: isExtra ? 'Extra Food' : chk.mealType,
        name: chk.name,
        portion: chk.portion || '1 serving',
        calories: Number(chk.calories) || 0,
        protein: Number(chk.protein) || 0,
        carbs: Number(chk.carbs) || 0,
        fat: Number(chk.fat) || 0,
        completedAt: chk.completedAt || 'Today',
        notes: chk.notes,
        isExtra
      });
    }
  });

  const targetCalsBase = mealPlan?.targets?.calories || 2000;
  const days: ChronologicalDayProgress[] = [];

  for (let i = 0; i < totalDays; i++) {
    const dayNumber = i + 1;
    const currentDayDate = new Date(startMidnight.getTime() + i * 86400000);
    const dateStr = currentDayDate.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    // Filter all food logs for this exact date
    const dayLogs = allLogs.filter(l => l.date === dateStr);

    const caloriesConsumed = dayLogs.reduce((sum, l) => sum + (Number(l.calories) || 0), 0);
    const proteinConsumed = dayLogs.reduce((sum, l) => sum + (Number(l.protein) || 0), 0);
    const carbsConsumed = dayLogs.reduce((sum, l) => sum + (Number(l.carbs) || 0), 0);
    const fatConsumed = dayLogs.reduce((sum, l) => sum + (Number(l.fat) || 0), 0);
    const assignedCount = dayLogs.filter(l => l.type === 'assigned').length;
    const extraCount = dayLogs.filter(l => l.type === 'extra' || l.isExtra).length;
    const mealsLogged = dayLogs.length;

    // Determine target calories for this day
    let caloriesTarget = targetCalsBase;
    let plannedMealCount = 4;
    if (mealPlan?.days && mealPlan.days.length > 0) {
      const planDayIdx = i % mealPlan.days.length;
      const planDay = mealPlan.days[planDayIdx];
      if (planDay?.meals && planDay.meals.length > 0) {
        plannedMealCount = planDay.meals.length;
        const planCals = planDay.meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
        if (planCals > 0) caloriesTarget = planCals;
      }
    }

    // Accurate Adherence Percentage
    let adherencePercentage = 0;
    if (mealsLogged > 0) {
      const calRatio = caloriesTarget > 0 ? caloriesConsumed / caloriesTarget : 1;
      const calAdh = Math.max(0, Math.min(100, Math.round(calRatio * 100)));
      const mealAdh = Math.min(100, Math.round((assignedCount / plannedMealCount) * 100));
      adherencePercentage = Math.min(100, Math.round((calAdh * 0.5) + (Math.min(100, mealAdh > 0 ? mealAdh : calAdh) * 0.5)));
    }

    days.push({
      dayNumber,
      date: dateStr,
      displayDate: currentDayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: currentDayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      isToday,
      caloriesConsumed,
      caloriesTarget,
      proteinConsumed,
      carbsConsumed,
      fatConsumed,
      mealsLogged,
      assignedCount,
      extraCount,
      adherencePercentage
    });
  }

  // Summary Metrics across the exact patient program days
  const loggedDays = days.filter(d => d.mealsLogged > 0);
  const loggedDaysCount = loggedDays.length;
  const consistencyPercentage = Math.round((loggedDaysCount / totalDays) * 100);

  // Overall adherence is the average across active days, or calculated proportionally
  const overallAdherence = loggedDays.length > 0
    ? Math.round(loggedDays.reduce((sum, d) => sum + d.adherencePercentage, 0) / loggedDays.length)
    : 0;

  const startDateFormatted = startMidnight.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    startDate: startDateStr,
    startDateFormatted,
    totalDays,
    currentDayNumber: totalDays,
    days,
    overallAdherence,
    loggedDaysCount,
    consistencyPercentage
  };
}
