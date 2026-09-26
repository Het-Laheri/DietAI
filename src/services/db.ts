import { collection, doc, getDoc, getDocs, setDoc, addDoc, query, where, updateDoc, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

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
  category: 'Consultation' | 'Nutrition' | 'Behaviour' | 'Follow-up' | 'Meal plan' | 'General';
  content: string;
  authorName: string;
  date: string;
  createdAt?: any;
}

export interface MealPlan {
  id?: string;
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
  type: 'NEW_PATIENT' | 'PATIENT_LOGIN' | 'SYSTEM' | 'AI_COACH_MESSAGE';
  patientId?: string;
  patientName?: string;
  message: string;
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
  patientConditions: string[]
): RecipeDBItem[] {
  if (!patientConditions || patientConditions.length === 0) return recipes;
  const lowerConditions = patientConditions.map(c => c.toLowerCase().trim());
  return recipes.filter(recipe => {
    if (!recipe.restrictedConditions || recipe.restrictedConditions.length === 0) return true;
    const restricted = recipe.restrictedConditions.map(c => c.toLowerCase().trim());
    return !restricted.some(rc => lowerConditions.some(pc => pc.includes(rc) || rc.includes(pc)));
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
  if (plan.id) {
    const ref = doc(db, 'meal_plans', plan.id);
    await updateDoc(ref, { ...sanitized });
    return plan.id;
  } else {
    const ref = await addDoc(collection(db, 'meal_plans'), { ...sanitized, createdAt: serverTimestamp() });
    return ref.id;
  }
}

export function cleanFirestoreData<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

export async function logMeal(log: FoodLog): Promise<string> {
  const sanitized = cleanFirestoreData(log);
  const ref = await addDoc(collection(db, 'food_logs'), { ...sanitized, createdAt: serverTimestamp() });
  return ref.id;
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

export async function createNotification(data: Notification) {
  try {
    await addDoc(collection(db, 'notifications'), { ...data, createdAt: serverTimestamp() });
  } catch (err) {
    console.warn('Notice: Background notification not written to Firestore:', err);
  }
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification));
  } catch {
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (err) {
    console.warn('Notice: markNotificationRead failed:', err);
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
    return docRef.id;
  } catch (e) {
    console.warn('Notice: Clinical note saved to client cache:', e);
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

export const DEFAULT_CLINICAL_RECIPES: RecipeDBItem[] = [
  {
    id: 'rec_1',
    name: 'High-Protein Moong Dal Chilla & Mint Dip',
    dietaryType: 'Vegetarian',
    calories: 260,
    protein: 14,
    carbs: 34,
    fat: 6,
    ingredients: ['1/2 cup Yellow Moong Dal (soaked & blended)', '1/4 cup Grated Paneer', 'Chopped Coriander & Ginger', '1 tsp Olive Oil', 'Pinch of Hing & Cumin', 'Mint Yogurt Dip (50g)'],
    recipe: [
      'Blend soaked moong dal with green chilli, ginger, and cumin into a smooth batter.',
      'Heat a non-stick tawa with 1/2 tsp olive oil, pour ladle of batter and spread thin.',
      'Top with grated paneer and chopped coriander. Cook on medium flame until golden brown on both sides.',
      'Serve warm with fresh mint-coriander yogurt dip.'
    ],
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: 'Blood Sugar Control & Satiety',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Vegetarian High Protein'
  },
  {
    id: 'rec_2',
    name: 'Palak Paneer with Multigrain Phulka',
    dietaryType: 'Vegetarian',
    calories: 380,
    protein: 18,
    carbs: 32,
    fat: 16,
    ingredients: ['200g Fresh Spinach (blanched & pureed)', '80g Low-Fat Cow Milk Paneer cubes', '1 tsp Cumin Seeds', '1 tsp Ginger-Garlic Paste', '1 tsp Cold-Pressed Mustard Oil', '2 Multigrain Phulkas (50g)'],
    recipe: [
      'Blanch spinach leaves in hot water for 2 mins, shock in cold water, and puree smoothly.',
      'Heat oil in a pan, temper cumin seeds, and sauté ginger-garlic paste.',
      'Add spinach puree, mild spices (turmeric, garam masala, salt) and simmer for 5 mins.',
      'Add paneer cubes, cook on low flame for 2 mins, and serve fresh with 2 hot multigrain phulkas.'
    ],
    prepTime: '15 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Metabolic & Iron Replenishment',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Vegetarian'
  },
  {
    id: 'rec_3',
    name: 'Grilled Herb Chicken Breast with Steamed Quinoa & Greens',
    dietaryType: 'Non-Vegetarian',
    calories: 420,
    protein: 42,
    carbs: 28,
    fat: 10,
    ingredients: ['180g Boneless Skinless Chicken Breast', '1/2 cup Cooked Quinoa', '100g Steamed Broccoli & Zucchini', '1 tsp Extra Virgin Olive Oil', 'Lemon juice, Rosemary, Black Pepper & Himalayan Salt'],
    recipe: [
      'Marinate clean chicken breast with lemon juice, crushed garlic, rosemary, and olive oil for 20 mins.',
      'Grill on a ridged pan for 6-7 minutes on each side until internal temperature reaches 75°C.',
      'Steam broccoli florets and sliced zucchini for 4 mins to retain crispness and chlorophyll.',
      'Assemble plated meal with warm fluffy quinoa, sliced chicken breast, and steamed greens.'
    ],
    prepTime: '20 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Lean Muscle & Weight Management',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Non-Vegetarian'
  },
  {
    id: 'rec_4',
    name: 'Steamed Pomfret Fish Curry with Brown Basmati Rice',
    dietaryType: 'Non-Vegetarian',
    calories: 360,
    protein: 32,
    carbs: 35,
    fat: 7,
    ingredients: ['150g Fresh Pomfret / Rohu Fish Fillet', '1/2 cup Cooked Brown Basmati Rice', 'Tomato & Kokum / Tamarind Broth', 'Curry Leaves, Fenugreek Seeds & Turmeric', '1 tsp Sesame Oil'],
    recipe: [
      'Heat sesame oil, temper fenugreek seeds and fresh curry leaves.',
      'Pour in tomato-kokum broth with turmeric, red chili, and coriander powder; bring to a boil.',
      'Gently slide fish fillets into the simmering gravy. Cover and cook on gentle flame for 7-8 mins.',
      'Serve warm alongside measured portion of fiber-rich steamed brown basmati rice.'
    ],
    prepTime: '15 mins',
    cookTime: '12 mins',
    clinicalFocus: 'Cardiovascular & Omega-3 Care',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Non-Vegetarian'
  },
  {
    id: 'rec_5',
    name: 'Jain Paneer & Bottle Gourd (Doodhi) Curry with Roti',
    dietaryType: 'Jain',
    calories: 270,
    protein: 15,
    carbs: 28,
    fat: 9,
    ingredients: ['150g Peeled Bottle Gourd (Doodhi)', '60g Fresh Paneer cubes', 'Tomato Puree (no onion/garlic/root veg)', '1 tsp Ghee', 'Cumin, Hing, Turmeric, Coriander powder', '2 Whole Wheat Rotis'],
    recipe: [
      'Pressure cook diced bottle gourd with water and pinch of turmeric until soft.',
      'In a pan, heat 1 tsp ghee, add hing and cumin seeds. Add tomato puree and spices.',
      'Stir in cooked bottle gourd and paneer cubes. Simmer for 5 mins until thick gravy forms.',
      'Garnish with fresh coriander leaves and serve with fresh rotis.'
    ],
    prepTime: '10 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Jain Gut Health & Cooling Digestion',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Jain Clinical'
  },
  {
    id: 'rec_6',
    name: 'Jain Moong & Cabbage Tikki with Raw Mango Dip',
    dietaryType: 'Jain',
    calories: 240,
    protein: 12,
    carbs: 32,
    fat: 6,
    ingredients: ['1 cup Soaked & Coarsely Ground Moong Dal', '1/2 cup Shredded Cabbage (Jain compliant)', 'Ginger-free green chilli paste', '1 tsp Roasted Cumin Powder', '1 tsp Oil for shallow frying'],
    recipe: [
      'Mix coarsely ground moong dal with finely shredded cabbage, green chillies, and roasted cumin.',
      'Form into round flat cutlets/tikkis.',
      'Shallow fry on a non-stick pan with light oil brush until crisp and golden brown.',
      'Serve hot with Jain-friendly raw mango or mint chutney.'
    ],
    prepTime: '15 mins',
    cookTime: '10 mins',
    clinicalFocus: 'Jain Satiety & Low-GI',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Jain Clinical'
  },
  {
    id: 'rec_7',
    name: 'Tofu & Bell Pepper Stir-Fry with Sesame & Quinoa',
    dietaryType: 'Vegan',
    calories: 290,
    protein: 20,
    carbs: 24,
    fat: 11,
    ingredients: ['150g Firm Organic Tofu (cubed)', '1 cup Tri-color Bell Peppers & Spring Onion Greens', '1/2 cup Cooked Quinoa', '1 tsp Toasted Sesame Seeds', '1 tsp Cold-Pressed Sesame Oil & Low-Sodium Tamari'],
    recipe: [
      'Press tofu to remove excess moisture and cut into cubes.',
      'Heat sesame oil in a wok, stir fry sliced bell peppers and greens on high heat for 2 mins.',
      'Add tofu cubes and low-sodium tamari / soy sauce, tossing continuously until edges are golden.',
      'Sprinkle toasted sesame seeds and serve warm over fluffy quinoa.'
    ],
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: '100% Plant-Based Anti-Inflammatory',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Vegan'
  },
  {
    id: 'rec_8',
    name: 'Sprouted Methi & Black Chana Sundal',
    dietaryType: 'Vegan',
    calories: 250,
    protein: 13,
    carbs: 35,
    fat: 5,
    ingredients: ['1 cup Boiled Kala Chana (Black Chickpeas)', '2 tbsp Sprouted Fenugreek (Methi) seeds', '1 tbsp Fresh Grated Coconut', 'Curry Leaves, Mustard Seeds, Green Chili', '1 tsp Coconut Oil'],
    recipe: [
      'Boil pre-soaked black chickpeas until tender with a pinch of rock salt.',
      'Heat coconut oil in a pan, splutter mustard seeds, curry leaves, and green chillies.',
      'Add boiled chickpeas and sprouted methi seeds. Sauté for 3 mins.',
      'Garnish with grated fresh coconut and squeeze fresh lime juice before serving.'
    ],
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: 'Insulin Sensitivity & High Fiber',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Vegan'
  },
  {
    id: 'rec_9',
    name: 'Double Egg White & Spinach Bhurji with 2 Rotis',
    dietaryType: 'Eggetarian',
    calories: 320,
    protein: 22,
    carbs: 32,
    fat: 9,
    ingredients: ['3 Egg Whites + 1 Whole Egg', '1 cup Chopped Fresh Spinach', '1 Small Tomato & Green Chilli (chopped)', '1 tsp Olive Oil', 'Turmeric, Cumin & Black Pepper', '2 Whole Wheat Rotis'],
    recipe: [
      'Whisk egg whites and 1 whole egg together with black pepper and salt.',
      'Heat olive oil, sauté cumin seeds, chopped tomatoes, and green chillies.',
      'Add chopped spinach and cook for 2 mins until wilted.',
      'Pour whisked eggs into the pan and scramble gently on medium heat until soft and fluffy. Serve with rotis.'
    ],
    prepTime: '10 mins',
    cookTime: '8 mins',
    clinicalFocus: 'Lean Protein & Muscle Recovery',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Eggetarian'
  },
  {
    id: 'rec_10',
    name: 'Boiled Egg Chaat with Sprouted Moong & Lemon',
    dietaryType: 'Eggetarian',
    calories: 230,
    protein: 17,
    carbs: 18,
    fat: 8,
    ingredients: ['2 Hard-Boiled Eggs (sliced)', '1/2 cup Steamed Moong Sprouts', '1/4 cup Diced Cucumber & Tomatoes', '1/2 tsp Chaat Masala & Roasted Cumin', 'Fresh Lemon Juice & Chopped Mint'],
    recipe: [
      'Hard boil 2 fresh eggs for 9 mins, peel and slice into wedges.',
      'In a bowl, combine steamed moong sprouts, cucumber, and tomatoes.',
      'Toss with chaat masala, roasted cumin powder, and lemon juice.',
      'Arrange sliced eggs on top, garnish with fresh mint leaves and serve immediately.'
    ],
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: 'High-Protein Afternoon Satiety Snack',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Eggetarian'
  }
];

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

export async function getStoredRecipesFromDB(dietaryType?: string, clinicalFocus?: string): Promise<RecipeDBItem[]> {
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
      recipes = recipes.filter(r => r.dietaryType.toLowerCase() === dietaryType.toLowerCase());
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

  // Dietary filter
  const patientDiet = (patientProfile?.dietaryType || '').toLowerCase();
  if (patientDiet && patientDiet !== 'standard' && patientDiet !== 'all') {
    const dietFiltered = pool.filter(r => {
      const rd = (r.dietaryType || '').toLowerCase();
      if (patientDiet === 'vegetarian') return rd === 'vegetarian' || rd === 'jain' || rd === 'vegan';
      if (patientDiet === 'vegan') return rd === 'vegan';
      if (patientDiet === 'jain') return rd === 'jain';
      if (patientDiet === 'eggetarian') return rd === 'eggetarian' || rd === 'vegetarian' || rd === 'vegan';
      if (patientDiet === 'non-vegetarian') return true;
      return rd === patientDiet;
    });
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

    const dayMeals: Meal[] = [
      {
        type: 'Breakfast',
        name: bRecipe.name,
        portion: '1 serving',
        calories: Number(bRecipe.calories) || 300,
        protein: Number(bRecipe.protein) || 15,
        carbs: Number(bRecipe.carbs) || 35,
        fat: Number(bRecipe.fat) || 8,
        prepTime: bRecipe.prepTime || '10 mins',
        cookTime: bRecipe.cookTime || '10 mins',
        ingredients: bRecipe.ingredients || [],
        recipe: bRecipe.recipe || [],
        notes: `Clinical Approved Recipe (${bRecipe.dietaryType}) — ${bRecipe.clinicalFocus || 'High Satiety'}`
      },
      {
        type: 'Lunch',
        name: lRecipe.name,
        portion: '1 plate',
        calories: Number(lRecipe.calories) || 450,
        protein: Number(lRecipe.protein) || 25,
        carbs: Number(lRecipe.carbs) || 55,
        fat: Number(lRecipe.fat) || 12,
        prepTime: lRecipe.prepTime || '15 mins',
        cookTime: lRecipe.cookTime || '15 mins',
        ingredients: lRecipe.ingredients || [],
        recipe: lRecipe.recipe || [],
        notes: `Clinical Approved Recipe (${lRecipe.dietaryType}) — ${lRecipe.clinicalFocus || 'Balanced Glycemic Index'}`
      },
      {
        type: 'Evening Snack',
        name: sRecipe.name,
        portion: '1 portion',
        calories: Number(sRecipe.calories) || 180,
        protein: Number(sRecipe.protein) || 8,
        carbs: Number(sRecipe.carbs) || 22,
        fat: Number(sRecipe.fat) || 4,
        prepTime: sRecipe.prepTime || '10 mins',
        cookTime: sRecipe.cookTime || '5 mins',
        ingredients: sRecipe.ingredients || [],
        recipe: sRecipe.recipe || [],
        notes: `Clinical Approved Recipe (${sRecipe.dietaryType}) — ${sRecipe.clinicalFocus || 'Afternoon Energy Stability'}`
      },
      {
        type: 'Dinner',
        name: dRecipe.name,
        portion: '1 bowl',
        calories: Number(dRecipe.calories) || 350,
        protein: Number(dRecipe.protein) || 20,
        carbs: Number(dRecipe.carbs) || 35,
        fat: Number(dRecipe.fat) || 10,
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
}

export async function savePatientChecklist(patientId: string, date: string, items: ChecklistMealItem[]) {
  const sanitized = cleanFirestoreData(items);
  await setDoc(doc(db, 'food_logs', `checklist_${patientId}_${date}`), {
    patientId,
    date,
    items: sanitized,
    type: 'checklist',
    updatedAt: serverTimestamp()
  });
}

export async function getPatientChecklist(patientId: string, date: string): Promise<ChecklistMealItem[]> {
  try {
    const d = await getDoc(doc(db, 'food_logs', `checklist_${patientId}_${date}`));
    if (d.exists()) {
      return d.data().items || [];
    }
  } catch (err) {
    console.warn('Notice: getPatientChecklist failed:', err);
  }
  return [];
}
