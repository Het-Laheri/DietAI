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
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
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
  status: 'active' | 'inactive';
  needsAttention: boolean;
  adherencePercentage?: number;
  lastConsultationDate?: string;
  nextFollowUpDate?: string;
  age?: number;
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
  createdAt?: any;
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

export async function registerPatient(
  email: string, 
  password: string, 
  name: string,
  surveyData?: {
    goals?: string[];
    goalDetails?: Record<string, string[]>;
    dietaryType?: string;
    activityLevel?: string;
    conditions?: string;
    allergies?: string;
  }
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

  const profile: PatientProfile = {
    id: uid,
    dieticianId: 'default_dietician',
    email,
    name,
    mobile: '',
    dob: '',
    gender: '',
    heightCm: 170,
    currentWeightKg: 70,
    targetWeightKg: 70,
    activityLevel: surveyData?.activityLevel || 'Moderate',
    dietaryType: surveyData?.dietaryType || 'Vegetarian',
    goals: surveyData?.goals || [],
    goalDetails: surveyData?.goalDetails || {},
    preferences: {
      favorites: '',
      dislikes: '',
      cuisine: '',
      budget: ''
    },
    healthInfo: {
      conditions: surveyData?.conditions || '',
      allergies: surveyData?.allergies || '',
      medications: '',
      notes: ''
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

export async function saveMealPlan(plan: MealPlan) {
  if (plan.id) {
    const ref = doc(db, 'meal_plans', plan.id);
    await updateDoc(ref, { ...plan });
    return plan.id;
  } else {
    const ref = await addDoc(collection(db, 'meal_plans'), { ...plan, createdAt: serverTimestamp() });
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
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as FoodLog));
}

export async function getAllFoodLogsForPatient(patientId: string): Promise<FoodLog[]> {
  const q = query(collection(db, 'food_logs'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  const logs = snap.docs.map(d => ({ ...d.data(), id: d.id } as FoodLog));
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

export async function saveRecipesToDB(recipes: RecipeDBItem[]): Promise<number> {
  let count = 0;
  for (const recipe of recipes) {
    await addDoc(collection(db, 'recipes_db'), {
      ...recipe,
      createdAt: serverTimestamp()
    });
    count++;
  }
  return count;
}

export async function getStoredRecipesFromDB(dietaryType?: string, clinicalFocus?: string): Promise<RecipeDBItem[]> {
  try {
    const snap = await getDocs(collection(db, 'recipes_db'));
    let recipes = snap.docs.map(d => ({ ...d.data(), id: d.id } as RecipeDBItem));

    if (dietaryType && dietaryType !== 'All') {
      recipes = recipes.filter(r => r.dietaryType.toLowerCase() === dietaryType.toLowerCase());
    }
    if (clinicalFocus && clinicalFocus !== 'All') {
      recipes = recipes.filter(r => (r.clinicalFocus || '').toLowerCase().includes(clinicalFocus.toLowerCase()));
    }
    return recipes;
  } catch (e) {
    console.error('Error fetching recipes from DB:', e);
    return [];
  }
}

export async function clearRecipeDB(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'recipes_db'));
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'recipes_db', d.id));
    }
    return true;
  } catch (e) {
    console.error('Error clearing recipe DB:', e);
    return false;
  }
}
