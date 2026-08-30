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
  whatsappNumber?: string;
  whatsappVerified?: boolean;
  whatsappOptIn?: boolean;
  whatsappConnectedAt?: any;
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

export interface FoodLog {
  id?: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  mealType: string;
  description: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt?: any;
}

export interface Query {
  id?: string;
  patientId: string;
  patientName: string;
  question: string;
  source: 'app' | 'whatsapp';
  whatsappNumber?: string;
  status: 'pending' | 'viewed' | 'answered';
  date: string;
  reply?: string;
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
  type: 'NEW_PATIENT' | 'PATIENT_LOGIN' | 'SYSTEM' | 'WHATSAPP_MESSAGE';
  patientId?: string;
  patientName?: string;
  message: string;
  read: boolean;
  createdAt?: any;
}

export interface WhatsAppMessage {
  id?: string;
  patientId?: string;
  conversationId: string;
  direction: 'INCOMING' | 'OUTGOING';
  messageType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'OTHER';
  whatsappMessageId: string;
  fromNumber: string;
  toNumber: string;
  body: string;
  mediaId?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  timestamp: string;
  status: 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'SENT' | 'DELIVERED' | 'READ';
  aiSuggestedReply?: string;
  createdAt?: any;
}

export interface WhatsAppConversation {
  id?: string;
  patientId?: string; // empty if unrecognized
  patientName: string;
  whatsappNumber: string;
  channel: 'WHATSAPP' | 'IN_APP';
  status: 'ACTIVE' | 'CLOSED' | 'UNRECOGNIZED';
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt?: any;
  updatedAt?: any;
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

export async function logMeal(log: FoodLog) {
  await addDoc(collection(db, 'food_logs'), { ...log, createdAt: serverTimestamp() });
}

export async function getFoodLogs(patientId: string, date: string): Promise<FoodLog[]> {
  const q = query(collection(db, 'food_logs'), where('patientId', '==', patientId), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as FoodLog));
}

export async function getAllFoodLogsForPatient(patientId: string): Promise<FoodLog[]> {
  const q = query(collection(db, 'food_logs'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as FoodLog));
}

export async function getProgressRecords(patientId: string): Promise<ProgressRecord[]> {
  const q = query(collection(db, 'progress_records'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as ProgressRecord));
}

export async function submitQuery(queryData: Query) {
  await addDoc(collection(db, 'queries'), { ...queryData, createdAt: serverTimestamp() });
}

export async function getQueries(dieticianId?: string, patientId?: string): Promise<Query[]> {
  let q;
  if (patientId) {
    q = query(collection(db, 'queries'), where('patientId', '==', patientId), orderBy('createdAt', 'desc'));
  } else {
    // Dietician sees all queries. Since there's only one dietician, we can just fetch all queries.
    // In a real app, we'd filter by dieticianId if multiple existed.
    q = query(collection(db, 'queries'), orderBy('createdAt', 'desc'));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as Query));
}

export async function updateQuery(id: string, updates: Partial<Query>) {
  await updateDoc(doc(db, 'queries', id), updates);
}

export async function createNotification(data: Notification) {
  await addDoc(collection(db, 'notifications'), { ...data, createdAt: serverTimestamp() });
}

export async function getNotifications(): Promise<Notification[]> {
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification));
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, 'notifications', id), { read: true });
}

// ─── WHATSAPP DB FUNCTIONS ───────────────────────────────────────────────────

export async function findPatientByWhatsAppNumber(rawNumber: string): Promise<PatientProfile | null> {
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
  const patients = await getPatients();
  
  // Match by whatsappNumber or mobile
  const found = patients.find(p => {
    const pWa = (p.whatsappNumber || '').replace(/[^0-9]/g, '');
    const pMob = (p.mobile || '').replace(/[^0-9]/g, '');
    return (pWa && (pWa === cleanNumber || cleanNumber.endsWith(pWa) || pWa.endsWith(cleanNumber))) ||
           (pMob && (pMob === cleanNumber || cleanNumber.endsWith(pMob) || pMob.endsWith(cleanNumber)));
  });

  return found || null;
}

export async function saveWhatsAppMessage(msg: WhatsAppMessage): Promise<string> {
  // Check for duplicate whatsappMessageId
  if (msg.whatsappMessageId) {
    const q = query(collection(db, 'whatsapp_messages'), where('whatsappMessageId', '==', msg.whatsappMessageId));
    const existing = await getDocs(q);
    if (!existing.empty) {
      console.log('Duplicate WhatsApp message skipped:', msg.whatsappMessageId);
      return existing.docs[0].id;
    }
  }

  const docRef = await addDoc(collection(db, 'whatsapp_messages'), {
    ...msg,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getWhatsAppMessages(conversationId: string): Promise<WhatsAppMessage[]> {
  const q = query(
    collection(db, 'whatsapp_messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as WhatsAppMessage));
}

export async function getWhatsAppConversations(): Promise<WhatsAppConversation[]> {
  const q = query(collection(db, 'whatsapp_conversations'), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as WhatsAppConversation));
}

export async function getWhatsAppConversation(id: string): Promise<WhatsAppConversation | null> {
  const snap = await getDoc(doc(db, 'whatsapp_conversations', id));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as WhatsAppConversation) : null;
}

export async function createOrUpdateWhatsAppConversation(
  whatsappNumber: string,
  patientName: string,
  patientId: string | undefined,
  lastMessagePreview: string,
  incrementUnread: boolean = false,
  status: 'ACTIVE' | 'CLOSED' | 'UNRECOGNIZED' = 'ACTIVE'
): Promise<string> {
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const q = query(collection(db, 'whatsapp_conversations'), where('whatsappNumber', '==', cleanNumber));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const existingDoc = snap.docs[0];
    const data = existingDoc.data() as WhatsAppConversation;
    await updateDoc(doc(db, 'whatsapp_conversations', existingDoc.id), {
      lastMessagePreview,
      lastMessageAt: new Date().toISOString(),
      unreadCount: incrementUnread ? (data.unreadCount || 0) + 1 : data.unreadCount || 0,
      updatedAt: serverTimestamp(),
      ...(patientId ? { patientId, patientName } : {}),
      status: status !== 'UNRECOGNIZED' ? status : data.status
    });
    return existingDoc.id;
  } else {
    const newConv: WhatsAppConversation = {
      patientId: patientId || '',
      patientName: patientName || 'Unknown Patient',
      whatsappNumber: cleanNumber,
      channel: 'WHATSAPP',
      status: patientId ? status : 'UNRECOGNIZED',
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview,
      unreadCount: incrementUnread ? 1 : 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'whatsapp_conversations'), newConv);
    return docRef.id;
  }
}

export async function markWhatsAppConversationRead(id: string) {
  await updateDoc(doc(db, 'whatsapp_conversations', id), { unreadCount: 0 });
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
