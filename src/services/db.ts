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

export interface User {
  uid: string;
  email: string;
  role: Role;
  name: string;
  createdAt: any;
}

export interface PatientProfile {
  id: string; // matches uid
  dieticianId: string;
  email: string;
  name: string;
  mobile: string;
  dob: string;
  gender: string;
  age?: number;
  lifeStage?: 'Adult' | 'Geriatric' | 'Gynaec' | 'Pediatrics' | string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  idealBodyWeightKg?: number;
  bmi?: number;
  bmiClassification?: string;
  weightManagement?: {
    primaryGoal: string;
    targetPace?: string;
    specificFocus?: string[];
    targetDifferenceKg?: number;
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
  allergies?: string[];
  status: 'active' | 'inactive';
  needsAttention: boolean;
  adherencePercentage?: number;
  lastConsultationDate?: string;
  nextFollowUpDate?: string;
  createdAt?: any;
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
  waterLiters: number;
  adherencePercentage: number;
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
  notes?: string;
}

export interface PatientWeekPlan {
  id?: string;
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
  if (plan.id) {
    await updateDoc(doc(db, 'patient_week_plans', plan.id), {
      ...plan,
      updatedAt: serverTimestamp()
    });
    return plan.id;
  } else {
    const ref = await addDoc(collection(db, 'patient_week_plans'), {
      ...plan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  }
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

export async function createDietician(email: string, password: string, name: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  const userDoc = {
    uid: userCredential.user.uid,
    email,
    role: 'dietician' as Role,
    name,
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
  return userCredential.user;
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
  idealBodyWeightKg?: number;
  bmi?: number;
  bmiClassification?: string;
  weightManagement?: {
    primaryGoal: string;
    targetPace?: string;
    specificFocus?: string[];
    targetDifferenceKg?: number;
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

  const profile: PatientProfile = {
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
    status: 'active',
    needsAttention: false,
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, 'patient_profiles', uid), profile);

  return userCredential.user;
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() as User : null;
}

export async function getPatientProfile(patientId: string): Promise<PatientProfile | null> {
  const snap = await getDoc(doc(db, 'patient_profiles', patientId));
  return snap.exists() ? snap.data() as PatientProfile : null;
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

  if (plan.patientId) {
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
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
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
  const q = query(collection(db, 'progress_records'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as ProgressRecord));
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
        return data.id;
      }
    }
  } catch (backendErr) {
    console.warn('Backend query submit endpoint note:', backendErr);
  }

  // 2. Direct Firestore fallback
  try {
    const docRef = await addDoc(collection(db, 'queries'), { ...queryData, createdAt: serverTimestamp() });
    if (docRef.id) {
      updateLocalQuery(local.id!, { id: docRef.id });
      return docRef.id;
    }
  } catch (err) {
    console.warn('Notice: Firestore query write failed (retained in client cache):', err);
  }
  return local.id!;
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
  updateLocalQuery(id, updates);
  // 1. Direct Firestore update
  try {
    await updateDoc(doc(db, 'queries', id), updates);
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
  } catch (err) {
    console.warn('saveLocalNotifications error:', err);
  }
}

export async function createNotification(data: Notification) {
  const notifId = data.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const notifObj: Notification = {
    ...data,
    id: notifId,
    recipientRole: data.recipientRole || (data.recipientId ? 'patient' : 'dietician'),
    read: false,
    createdAt: new Date().toISOString()
  };

  // 1. Save to local storage for instant responsiveness
  const current = getLocalNotifications();
  saveLocalNotifications([notifObj, ...current.filter(n => n.id !== notifId)]);

  // 2. Persist to Firestore
  try {
    await setDoc(doc(db, 'notifications', notifId), {
      ...notifObj,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Notice: Background notification not written to Firestore, cached locally:', err);
  }
}

export async function getNotifications(role?: 'dietician' | 'patient', userId?: string): Promise<Notification[]> {
  try {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const remote = snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification));

    // Merge with local
    const local = getLocalNotifications();
    const map = new Map<string, Notification>();
    remote.forEach(n => { if (n.id) map.set(n.id, n); });
    local.forEach(n => { if (n.id && !map.has(n.id)) map.set(n.id, n); });

    const all = Array.from(map.values());
    if (!role) return all;

    return all.filter(n => {
      if (role === 'dietician') {
        return n.recipientRole === 'dietician' || n.recipientRole === 'all' || !n.recipientRole;
      }
      if (role === 'patient') {
        const matchesRole = n.recipientRole === 'patient' || n.recipientRole === 'all';
        const matchesUser = !n.recipientId || !userId || n.recipientId === userId;
        return matchesRole && matchesUser;
      }
      return true;
    });
  } catch {
    const local = getLocalNotifications();
    if (!role) return local;
    return local.filter(n => {
      if (role === 'dietician') {
        return n.recipientRole === 'dietician' || n.recipientRole === 'all' || !n.recipientRole;
      }
      if (role === 'patient') {
        return (n.recipientRole === 'patient' || n.recipientRole === 'all') &&
          (!n.recipientId || !userId || n.recipientId === userId);
      }
      return true;
    });
  }
}

export function subscribeToNotifications(
  role: 'dietician' | 'patient',
  userId: string | undefined,
  onUpdate: (notifs: Notification[]) => void
) {
  const filterList = (items: Notification[]) => {
    return items.filter(n => {
      if (role === 'dietician') {
        return n.recipientRole === 'dietician' || n.recipientRole === 'all' || !n.recipientRole;
      }
      if (role === 'patient') {
        const matchesRole = n.recipientRole === 'patient' || n.recipientRole === 'all';
        const matchesUser = !n.recipientId || !userId || n.recipientId === userId;
        return matchesRole && matchesUser;
      }
      return true;
    });
  };

  const notifyMerged = (remoteItems: Notification[] = []) => {
    const local = getLocalNotifications();
    const map = new Map<string, Notification>();
    remoteItems.forEach(n => { if (n.id) map.set(n.id, n); });
    local.forEach(n => { if (n.id && !map.has(n.id)) map.set(n.id, n); });
    const all = Array.from(map.values());
    onUpdate(filterList(all));
  };

  // Immediate callback from cache
  notifyMerged([]);

  // Listen to Firestore
  let unsubFirestore = () => {};
  try {
    const q = query(collection(db, 'notifications'));
    unsubFirestore = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification));
      notifyMerged(items);
    }, (err) => {
      console.warn('Notifications stream notice:', err);
    });
  } catch (e) {
    console.warn('Firestore snapshot failed, listening to local:', e);
  }

  // Listen to local changes
  const handleLocalChange = () => notifyMerged([]);
  window.addEventListener('nutrisnap:notification_change', handleLocalChange);

  return () => {
    unsubFirestore();
    window.removeEventListener('nutrisnap:notification_change', handleLocalChange);
  };
}

export async function markNotificationRead(id: string) {
  // Local update
  const local = getLocalNotifications();
  const updated = local.map(n => n.id === id ? { ...n, read: true } : n);
  saveLocalNotifications(updated);

  // Firestore update
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (err) {
    console.warn('Notice: markNotificationRead remote failed:', err);
  }
}

export async function markAllNotificationsRead(role: 'dietician' | 'patient', userId?: string) {
  const local = getLocalNotifications();
  const updated = local.map(n => {
    const matchesRole = role === 'dietician' 
      ? (n.recipientRole === 'dietician' || !n.recipientRole)
      : ((n.recipientRole === 'patient' || n.recipientRole === 'all') && (!n.recipientId || !userId || n.recipientId === userId));
    return matchesRole ? { ...n, read: true } : n;
  });
  saveLocalNotifications(updated);

  // Batch update remote if possible
  try {
    const notifs = await getNotifications(role, userId);
    for (const n of notifs) {
      if (!n.read && n.id) {
        updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {});
      }
    }
  } catch (e) {
    console.warn('markAllNotificationsRead remote failed:', e);
  }
}

export async function clearNotification(id: string) {
  const local = getLocalNotifications();
  saveLocalNotifications(local.filter(n => n.id !== id));
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (e) {
    console.warn('clearNotification remote failed:', e);
  }
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
        const parsed: ClinicalNote[] = JSON.parse(raw);
        localNotes = parsed.filter(n => n.patientId === patientId);
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
    const remoteNotes = snap.docs.map(d => ({ ...d.data(), id: d.id } as ClinicalNote));
    
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

import { DEFAULT_CLINICAL_RECIPES } from './defaultRecipes';
export { DEFAULT_CLINICAL_RECIPES };

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
    if (recipes.length === 0) {
      recipes = DEFAULT_CLINICAL_RECIPES;
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
    return DEFAULT_CLINICAL_RECIPES;
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
  // 1. Try backend API first
  try {
    const res = await fetch(getApiUrl(`/api/patient/checklist/${encodeURIComponent(patientId)}/${encodeURIComponent(date)}`));
    if (res.ok) {
      const data = await res.json();
      if (data.items) {
        return Array.isArray(data.items) ? data.items : Object.values(data.items);
      }
    }
  } catch (apiErr) {
    // fallback to direct Firestore
  }

  // 2. Direct Firestore fallback
  try {
    const d = await getDoc(doc(db, 'food_logs', `checklist_${patientId}_${date}`));
    if (d.exists()) {
      const raw = d.data().items;
      return (Array.isArray(raw) ? raw : Object.values(raw || {})) as ChecklistMealItem[];
    }
  } catch (err) {
    console.warn('Notice: getPatientChecklist direct read failed:', err);
  }
  return [];
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
