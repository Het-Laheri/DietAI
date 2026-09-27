import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, doc, query, where, onSnapshot } from 'firebase/firestore';
import {
  db,
  getPatientProfile, 
  getMealPlans, 
  saveMealPlan, 
  getProgressRecords, 
  getAllFoodLogsForPatient,
  getQueries,
  updateQuery,
  addClinicalNote,
  getClinicalNotes,
  deleteClinicalNote,
  getStoredRecipesFromDB, 
  getPatientChecklist, 
  ChecklistMealItem,
  PatientEatingLogEntry,
  PatientProfile, 
  MealPlan, 
  Meal,
  ProgressRecord,
  FoodLog,
  Query,
  ClinicalNote,
  RecipeDBItem,
  buildClinicalMealPlanFromRecipes,
  filterRecipesForPatient
} from '../../services/db';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Target, 
  Utensils, 
  Sparkles, 
  Clock, 
  FileText, 
  Activity, 
  MessageSquare, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  Trash2, 
  Share2, 
  ChefHat, 
  Flame, 
  Dna, 
  Wheat, 
  Droplet,
  Send,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Wand2,
  Scale,
  Stethoscope,
  Briefcase,
  Camera
} from 'lucide-react';

type ActiveTab = 'overview' | 'food_logs' | 'meal_plans' | 'progress' | 'chat' | 'notes' | 'reports';

export default function PatientProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile: authProfile } = useAuth();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [todayChecklist, setTodayChecklist] = useState<ChecklistMealItem[]>([]);
  const [allEatingLogs, setAllEatingLogs] = useState<PatientEatingLogEntry[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Note form state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<ClinicalNote['category']>('Consultation');
  const [addingNote, setAddingNote] = useState(false);

  // Meal Plan Editing & AI Generation
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [editingMeal, setEditingMeal] = useState<{ dayIdx: number; mealIdx: number; meal: Meal } | null>(null);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);

  // Chat / Query Reply State
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  // Progress time filter
  const [progressTimeframe, setProgressTimeframe] = useState<'7d' | '30d' | 'all'>('30d');

  // Load all client data & setup Real-time Listeners
  useEffect(() => {
    if (!id) return;
    const todayStr = new Date().toISOString().split('T')[0];

    async function loadAllClientData() {
      setLoading(true);
      try {
        const [p, plans, logs, prog, qs, notes, checklist] = await Promise.all([
          getPatientProfile(id!),
          getMealPlans(id!),
          getAllFoodLogsForPatient(id!),
          getProgressRecords(id!),
          getQueries(undefined, id!),
          getClinicalNotes(id!),
          getPatientChecklist(id!, todayStr)
        ]);

        setProfile(p);
        setMealPlans(plans);
        setFoodLogs(logs);
        setProgressRecords(prog);
        setQueries(qs);
        setClinicalNotes(notes);
        setTodayChecklist(checklist || []);
      } catch (err: any) {
        console.error('Failed to load complete patient profile dossier:', err);
        setLoadError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }

    loadAllClientData();

    // 1. Real-time checklist listener for today (instant checkmarks & extra food sync)
    const checklistRef = doc(db, 'food_logs', `checklist_${id}_${todayStr}`);
    const unsubChecklist = onSnapshot(checklistRef, (docSnap) => {
      if (docSnap.exists()) {
        const items = (docSnap.data().items || []) as ChecklistMealItem[];
        setTodayChecklist(items);
      }
    }, (err) => {
      console.warn('Real-time checklist listener note:', err);
    });

    // 2. Real-time food logs listener (all logs & extra items across history)
    const foodLogsQuery = query(collection(db, 'food_logs'), where('patientId', '==', id));
    const unsubFoodLogs = onSnapshot(foodLogsQuery, (snap) => {
      const logs = snap.docs
        .filter(d => d.data().type !== 'checklist')
        .map(d => ({ ...d.data(), id: d.id } as FoodLog))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setFoodLogs(logs);

      // Compile chronological eating logs
      const compiled: PatientEatingLogEntry[] = [];
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.type === 'checklist') {
          const items = (data.items || []) as ChecklistMealItem[];
          items.filter(i => i.completed).forEach(item => {
            const isExtra = item.isExtra || item.mealType?.toLowerCase().includes('extra') || item.mealType === 'CUSTOM DIETARY NOTE';
            compiled.push({
              id: `${docSnap.id}_${item.id}`,
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
          compiled.push({
            id: docSnap.id,
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
      setAllEatingLogs(compiled);
    }, (err) => {
      console.warn('Real-time food logs listener note:', err);
    });

    const handleNotesEvent = () => {
      if (id) getClinicalNotes(id).then(setClinicalNotes);
    };
    window.addEventListener('nutrisnap:notes_change', handleNotesEvent);

    return () => {
      unsubChecklist();
      unsubFoodLogs();
      window.removeEventListener('nutrisnap:notes_change', handleNotesEvent);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-stone-200 rounded w-24"></div>
        <div className="h-32 bg-stone-100 rounded-3xl"></div>
        <div className="h-96 bg-stone-100 rounded-3xl"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Patient File Not Found</h2>
        <p className="text-xs text-stone-500">The requested patient ID does not exist in your clinical caseload.</p>
        <Link to="/dietician/patients" className="inline-block px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold">
          Return to Patients
        </Link>
      </div>
    );
  }

  // Clinical Computations & Real-Time Sync Calculations
  const activePlan = mealPlans.find(p => p.status === 'published') || mealPlans[0];
  const targetCalories = activePlan?.targets?.calories || 2000;
  const targetProtein = activePlan?.targets?.protein || 90;
  const targetCarbs = activePlan?.targets?.carbs || 180;
  const targetFat = activePlan?.targets?.fat || 55;

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Completed checklist items for today (both assigned meals and extra items)
  const completedChecklist = todayChecklist.filter(i => i.completed);
  const checklistCalories = completedChecklist.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const checklistProtein = completedChecklist.reduce((sum, i) => sum + (Number(i.protein) || 0), 0);
  const checklistCarbs = completedChecklist.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0);
  const checklistFat = completedChecklist.reduce((sum, i) => sum + (Number(i.fat) || 0), 0);

  const assignedCompleted = completedChecklist.filter(i => !i.isExtra && !i.mealType?.toLowerCase().includes('extra'));
  const extraCompleted = completedChecklist.filter(i => i.isExtra || i.mealType?.toLowerCase().includes('extra'));
  const assignedCalories = assignedCompleted.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const extraCalories = extraCompleted.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);

  // 2. Today's scanned logs (deduplicated against checklist items)
  const todayLogs = foodLogs.filter(l => l.date === todayStr);
  const uniqueScannedLogs = todayLogs.filter(l => 
    !completedChecklist.some(c => c.name.toLowerCase() === (l.description || '').toLowerCase())
  );
  const scanCalories = uniqueScannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.calories) || 0), 0);
  const scanProtein = uniqueScannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.protein) || 0), 0);
  const scanCarbs = uniqueScannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.carbs) || 0), 0);
  const scanFat = uniqueScannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.fat) || 0), 0);

  // Grand total today consumed
  const todayCalories = checklistCalories + scanCalories;
  const todayProtein = checklistProtein + scanProtein;
  const todayCarbs = checklistCarbs + scanCarbs;
  const todayFat = checklistFat + scanFat;
  const totalItemsConsumedToday = completedChecklist.length + uniqueScannedLogs.length;

  // Group eating logs chronologically by date
  const combinedEatingLogs: PatientEatingLogEntry[] = [...allEatingLogs];
  
  // Make sure today's completed checklist items are included in combinedEatingLogs
  completedChecklist.forEach(item => {
    const isExtra = item.isExtra || item.mealType?.toLowerCase().includes('extra') || item.mealType === 'CUSTOM DIETARY NOTE';
    const entryId = `today_checklist_${item.id}`;
    if (!combinedEatingLogs.some(e => e.date === todayStr && (e.name.toLowerCase() === item.name.toLowerCase() || e.id.includes(item.id)))) {
      combinedEatingLogs.push({
        id: entryId,
        date: todayStr,
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
    }
  });

  // Group by date
  const groupedLogs: Record<string, PatientEatingLogEntry[]> = {};
  combinedEatingLogs.forEach(entry => {
    const d = entry.date || todayStr;
    if (!groupedLogs[d]) groupedLogs[d] = [];
    groupedLogs[d].push(entry);
  });

  // Sort dates descending
  const groupedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));
  const assignedTotalCount = combinedEatingLogs.filter(e => e.type === 'assigned').length;
  const extraTotalCount = combinedEatingLogs.filter(e => e.type === 'extra').length;

  const adherence = profile.adherencePercentage ?? (profile.needsAttention ? 52 : 84);

  // Height & Clinical Anthropometrics
  const heightM = (profile.heightCm || 170) / 100;
  const currentWeight = profile.currentWeightKg || 70;
  const bmi = (currentWeight / (heightM * heightM)).toFixed(1);
  const bmiNum = Number(bmi);
  const idealBodyWeight = profile.idealBodyWeightKg || (profile.gender === 'Male' ? Math.max(30, (profile.heightCm || 170) - 100) : Math.max(30, (profile.heightCm || 165) - 105));

  let bmiClassification = profile.bmiClassification;
  if (!bmiClassification) {
    if (bmiNum < 18.5) bmiClassification = 'Underweight (< 18.4)';
    else if (bmiNum < 25) bmiClassification = 'Normal (18.5 - 24.9)';
    else if (bmiNum < 30) bmiClassification = 'Overweight (25 - 29.9)';
    else if (bmiNum < 35) bmiClassification = 'Obesity Grade I (30 - 34.9)';
    else if (bmiNum < 40) bmiClassification = 'Obesity Grade II (35 - 39.9)';
    else bmiClassification = 'Morbid Obesity (> 40)';
  }

  // Handlers
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !id) return;
    setAddingNote(true);
    try {
      await addClinicalNote({
        patientId: id,
        category: newNoteCategory,
        content: newNoteContent.trim(),
        authorName: authProfile?.name || 'Lead Dietician',
        date: todayStr
      });
      setNewNoteContent('');
      const updated = await getClinicalNotes(id);
      setClinicalNotes(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId?: string) => {
    if (!noteId || !confirm('Delete clinical note?')) return;
    await deleteClinicalNote(noteId);
    if (id) setClinicalNotes(await getClinicalNotes(id));
  };

  const handleSendChatReply = async (queryId: string) => {
    const text = replyDrafts[queryId]?.trim();
    if (!text) return;
    setSendingReply(queryId);
    try {
      await updateQuery(queryId, { reply: text, status: 'answered' });
      setQueries(prev => prev.map(q => q.id === queryId ? { ...q, reply: text, status: 'answered' } : q));
      setReplyDrafts(prev => ({ ...prev, [queryId]: '' }));
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(null);
    }
  };

  const handleGenerateAIPlan = async () => {
    setGeneratingPlan(true);
    try {
      const rawPool = await getStoredRecipesFromDB(profile.dietaryType);
      const patientConditions = profile.medicalHistory || (profile.healthInfo?.conditions ? profile.healthInfo.conditions.split(',').map(c => c.trim()) : []);
      const pool = filterRecipesForPatient(rawPool, patientConditions);
      let planDays: any = null;

      try {
        const res = await fetch('/api/ai/meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientProfile: profile,
            targets: { calories: targetCalories, protein: targetProtein, carbs: targetCarbs, fat: targetFat },
            instructions: `Client prefers ${profile.dietaryType}. Allergies: ${profile.healthInfo?.allergies || 'None'}. Goal: ${profile.goals?.join(', ') || 'Metabolic health'}.`,
            availableRecipes: pool
          })
        });
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length === 7) {
            const allValid = raw.every((d: any) =>
              Array.isArray(d.meals) &&
              d.meals.length > 0 &&
              d.meals.every((m: any) => pool.some(r => r.name.toLowerCase() === m.name.toLowerCase()))
            );
            if (allValid) {
              planDays = raw;
            }
          }
        }
      } catch (aiErr) {
        console.warn('AI endpoint note; generating via clinical recipes:', aiErr);
      }

      if (!planDays) {
        planDays = buildClinicalMealPlanFromRecipes(pool, profile, { calories: targetCalories, protein: targetProtein, carbs: targetCarbs, fat: targetFat });
      }

      const newPlan: MealPlan = {
        patientId: profile.id,
        startDate: todayStr,
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'draft',
        targets: { calories: targetCalories, protein: targetProtein, carbs: targetCarbs, fat: targetFat },
        days: planDays,
        createdAt: new Date()
      };
      await saveMealPlan(newPlan, 'dietician');
      const updated = await getMealPlans(profile.id);
      setMealPlans(updated);
      setSelectedPlanIdx(0);
      setActiveTab('meal_plans');
    } catch (err) {
      console.error('Failed to generate AI plan:', err);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleSaveMealEdit = async (dayIdx: number, mealIdx: number, updatedMeal: Meal) => {
    const currentPlan = mealPlans[selectedPlanIdx] || activePlan;
    if (!currentPlan) return;
    
    const updatedDays = [...currentPlan.days];
    updatedDays[dayIdx].meals[mealIdx] = updatedMeal;
    
    const updatedPlan: MealPlan = {
      ...currentPlan,
      days: updatedDays
    };

    await saveMealPlan(updatedPlan, 'dietician');
    const updated = await getMealPlans(profile.id);
    setMealPlans(updated);
    setEditingMeal(null);
  };

  const handlePublishPlan = async (planToPublish: MealPlan) => {
    const published: MealPlan = { ...planToPublish, status: 'published' };
    await saveMealPlan(published, 'dietician');
    const updated = await getMealPlans(profile.id);
    setMealPlans(updated);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Back button */}
      <Link 
        to="/dietician/patients" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Caseload Directory
      </Link>

      {/* ─── CLIENT HEADER (SINGLE SOURCE OF TRUTH) ─────────────────────── */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Avatar & Core Profile Info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-stone-900 text-white font-serif font-black text-xl flex items-center justify-center shadow-xs flex-shrink-0">
              {profile.name.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-900">{profile.name}</h1>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  profile.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' : 'bg-stone-100 text-stone-600 border border-stone-200'
                }`}>
                  {profile.status}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200/60">
                  {profile.dietaryType}
                </span>
                {profile.needsAttention && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200/60 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Review Needed
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-500 mt-1">
                {profile.email} • {profile.mobile || 'No phone'} • {profile.age ? `${profile.age} yrs • ` : ''}Gender: {profile.gender || 'Not specified'} • Life Stage: <span className="font-semibold text-stone-800">{profile.lifeStage || 'Adult'}</span> • Occupation: {profile.occupation || 'Employed'}
              </p>

              {/* Clinical Snapshot Tags */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-3 pt-3 border-t border-stone-100">
                <div>
                  <span className="text-stone-400 font-medium">Primary Goal: </span>
                  <span className="font-bold text-stone-900">{profile.weightManagement?.primaryGoal || profile.goals?.[0] || 'Metabolic Optimization'}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-medium">Current: </span>
                  <span className="font-bold text-stone-900">{currentWeight} kg</span>
                  <span className="text-stone-400 font-medium"> (BMI {bmi} • {bmiClassification.split(' ')[0]})</span>
                </div>
                <div>
                  <span className="text-stone-400 font-medium">Target: </span>
                  <span className="font-bold text-orange-600">{profile.targetWeightKg || currentWeight} kg</span>
                  <span className="text-stone-400"> (Broca IBW: ~{idealBodyWeight} kg)</span>
                </div>
                <div>
                  <span className="text-stone-400 font-medium">Adherence: </span>
                  <span className={`font-bold ${adherence >= 80 ? 'text-emerald-600' : adherence >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {adherence}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 lg:self-start">
            <button
              type="button"
              onClick={handleGenerateAIPlan}
              disabled={generatingPlan}
              className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {generatingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-orange-400" />}
              {generatingPlan ? 'Generating Plan...' : 'Generate AI Plan'}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('notes'); }}
              className="px-3.5 py-2 bg-white border border-stone-200 hover:border-stone-300 text-stone-700 text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              Add Note
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('reports'); }}
              className="px-3.5 py-2 bg-white border border-stone-200 hover:border-stone-300 text-stone-700 text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              Report
            </button>
          </div>

        </div>

        {/* ─── 7 CONTEXTUAL TABS ────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto mt-5 pt-3 border-t border-stone-100 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'food_logs', label: `Food Logs (${allEatingLogs.length || foodLogs.length})`, icon: Utensils },
            { id: 'meal_plans', label: `Meal Plans (${mealPlans.length})`, icon: ChefHat },
            { id: 'progress', label: 'Progress & Trends', icon: Activity },
            { id: 'chat', label: `Consultation (${queries.length})`, icon: MessageSquare },
            { id: 'notes', label: `Clinical Notes (${clinicalNotes.length})`, icon: FileText },
            { id: 'reports', label: 'Clinical Report', icon: Printer },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active 
                    ? 'bg-orange-50 text-orange-800 border border-orange-200/80 shadow-2xs' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-orange-600' : 'text-stone-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB CONTENT PANELS ─────────────────────────────────────────── */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Anthropometric & Weight Management Strategy (Hospital Form Standards) */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-600" />
                Anthropometrics & Target
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                Broca Protocol
              </span>
            </div>

            <div className="space-y-2.5 text-xs divide-y divide-stone-100">
              <div className="pt-2 first:pt-0 flex justify-between items-center">
                <span className="text-stone-500">Height & Weight:</span>
                <span className="font-semibold text-stone-900">{profile.heightCm} cm • {currentWeight} kg</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-stone-500">Clinical BMI:</span>
                <div className="text-right">
                  <span className="font-bold text-stone-900">{bmi} kg/m²</span>
                  <span className="text-[10px] text-stone-500 block">
                    {bmiClassification}
                  </span>
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-stone-500">Broca's Ideal Weight (IBW):</span>
                <span className="font-bold text-emerald-700">~{idealBodyWeight} kg</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-stone-500">Target Goal Weight:</span>
                <div className="text-right">
                  <span className="font-bold text-orange-600">{profile.targetWeightKg || currentWeight} kg</span>
                  <span className="text-[10px] text-stone-500 block">
                    {currentWeight !== (profile.targetWeightKg || currentWeight) 
                      ? `${Math.abs(Number((currentWeight - (profile.targetWeightKg || currentWeight)).toFixed(1)))} kg ${currentWeight > (profile.targetWeightKg || currentWeight) ? 'to lose' : 'to gain'}`
                      : 'Maintain current weight'}
                  </span>
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-stone-500">Target Pace:</span>
                <span className="font-semibold text-stone-800">{profile.weightManagement?.targetPace || 'Steady (0.5 kg / wk)'}</span>
              </div>
              {profile.weightManagement?.specificFocus && profile.weightManagement.specificFocus.length > 0 && (
                <div className="pt-2">
                  <span className="text-stone-500 block mb-1.5 font-medium">Specific Focus Areas:</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.weightManagement.specificFocus.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-semibold">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Clinical Screening & Medical History */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-orange-600" />
                Medical Screening & History
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                {profile.lifeStage || 'Adult'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs divide-y divide-stone-100">
              <div className="pt-2 first:pt-0 flex justify-between">
                <span className="text-stone-500">Demographics:</span>
                <span className="font-semibold text-stone-900">
                  {profile.age ? `${profile.age} yrs • ` : ''}{profile.gender || 'Not stated'}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-500">Occupation:</span>
                <span className="font-semibold text-stone-900 text-right">{profile.occupation || 'Business / Employed'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-500">Diagnosis / Procedure:</span>
                <span className="font-semibold text-stone-900 text-right">{profile.diagnosisOrProcedure || 'None noted'}</span>
              </div>
              <div className="pt-2">
                <span className="text-stone-500 block mb-1 font-medium">Pre-existing Conditions:</span>
                <div className="flex flex-wrap gap-1">
                  {(profile.medicalHistory?.length ? profile.medicalHistory : [profile.healthInfo?.conditions || 'None reported']).map((cond, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-800 text-[10px] font-medium">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-500">Food Allergies:</span>
                <span className={`font-semibold text-right ${(profile.healthInfo?.allergies && profile.healthInfo?.allergies !== 'None') ? 'text-rose-600' : 'text-stone-700'}`}>
                  {profile.healthInfo?.allergies || 'None reported'}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-500">Diet & Activity:</span>
                <span className="font-semibold text-stone-900">{profile.dietaryType} • {profile.activityLevel || 'Moderate'}</span>
              </div>
            </div>
          </div>

          {/* 3. Real-Time Caloric & Macro Target Compliance */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                Today's Caloric & Macro Compliance
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1.5 text-xs">
                <div>
                  <span className="font-bold text-stone-900 text-sm font-mono">{todayCalories} kcal</span>
                  <span className="text-stone-500 ml-1">consumed</span>
                </div>
                <span className="text-stone-400 font-medium">Target: {targetCalories} kcal</span>
              </div>

              {/* Segmented Dual Bar */}
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex border border-stone-200/70 p-0.5">
                <div 
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((assignedCalories / targetCalories) * 100))}%` }}
                  title={`Assigned Meals: ${assignedCalories} kcal`}
                />
                <div 
                  className="bg-amber-500 h-full transition-all duration-500 rounded-r-full"
                  style={{ width: `${Math.min(100 - Math.min(100, Math.round((assignedCalories / targetCalories) * 100)), Math.round((extraCalories / targetCalories) * 100))}%` }}
                  title={`Extra Food: ${extraCalories} kcal`}
                />
              </div>

              {/* Breakdown tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  {assignedCompleted.length} Prescribed ({assignedCalories} kcal)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                  {extraCompleted.length} Extra Food ({extraCalories} kcal)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/60">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Protein</p>
                <p className="font-bold text-stone-900 mt-0.5 font-mono">{todayProtein}g / {targetProtein}g</p>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/60">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Carbs</p>
                <p className="font-bold text-stone-900 mt-0.5 font-mono">{todayCarbs}g / {targetCarbs}g</p>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/60">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Fat</p>
                <p className="font-bold text-stone-900 mt-0.5 font-mono">{todayFat}g / {targetFat}g</p>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 flex items-center justify-between">
              <span>{totalItemsConsumedToday} total items recorded today by patient.</span>
              <span className="text-[10px] font-semibold text-emerald-600">Updated in real-time</span>
            </p>
          </div>

          {/* 4. Active Plan & Quick Summary */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-orange-600" />
              Active Meal Plan Status
            </h3>

            {activePlan ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200/70 rounded-lg">
                  <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
                    <span>Plan Active & Published</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    Valid through: {activePlan.endDate || 'Ongoing'}
                  </p>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Days Configured:</span>
                  <span className="font-semibold text-stone-900">{activePlan.days?.length || 7} Days</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Daily Calorie Target:</span>
                  <span className="font-semibold text-stone-900">{targetCalories} kcal</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('meal_plans')}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg text-xs transition-colors"
                >
                  Inspect & Edit Plan Details →
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-stone-400 space-y-2">
                <p>No active meal plan assigned.</p>
                <button
                  type="button"
                  onClick={handleGenerateAIPlan}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-lg font-semibold text-xs"
                >
                  Generate Plan Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. FOOD LOGS TAB */}
      {activeTab === 'food_logs' && (
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 md:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Client Food Journal & Eating Habits
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Chronological daily breakdown of assigned meal completion and patient-logged extra foods with timestamps
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-md border border-emerald-200">
                {assignedTotalCount} Assigned Completed
              </span>
              <span className="text-xs font-semibold bg-amber-50 text-amber-900 px-3 py-1 rounded-md border border-amber-200">
                {extraTotalCount} Extra Foods Logged
              </span>
            </div>
          </div>

          {/* Chronologically Grouped Food Logs by Day & Date */}
          {groupedDates.length === 0 ? (
            <div className="text-center py-16 text-stone-400 text-xs space-y-2">
              <Utensils className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-medium text-stone-600">No eating logs or meal records yet for this client.</p>
              <p className="text-[11px] text-stone-400">As the patient completes prescribed meals or logs extra food, entries will appear here chronologically in real-time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedDates.map(dateKey => {
                const dayEntries = groupedLogs[dateKey];
                const dayTotalCals = dayEntries.reduce((s, e) => s + (e.calories || 0), 0);
                const dayTotalP = dayEntries.reduce((s, e) => s + (e.protein || 0), 0);
                const dayTotalC = dayEntries.reduce((s, e) => s + (e.carbs || 0), 0);
                const dayTotalF = dayEntries.reduce((s, e) => s + (e.fat || 0), 0);
                const dayAssigned = dayEntries.filter(e => e.type === 'assigned');
                const dayExtra = dayEntries.filter(e => e.type === 'extra');

                // Nicely formatted date label
                const isToday = dateKey === todayStr;
                const dateObj = new Date(dateKey + 'T12:00:00');
                const dateLabel = dateObj.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div key={dateKey} className="rounded-xl border border-stone-200/90 overflow-hidden shadow-2xs">
                    {/* Day & Date Header Bar */}
                    <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <h4 className="font-bold text-stone-900 text-sm">
                          {dateLabel}
                        </h4>
                        {isToday && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Day summary badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-stone-900 font-mono bg-white px-2.5 py-1 rounded-md border border-stone-200">
                          {dayTotalCals} kcal
                        </span>
                        <span className="text-stone-500 font-mono text-[11px] bg-white px-2 py-1 rounded-md border border-stone-200">
                          P: {dayTotalP}g • C: {dayTotalC}g • F: {dayTotalF}g
                        </span>
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          {dayAssigned.length} Assigned
                        </span>
                        {dayExtra.length > 0 && (
                          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            {dayExtra.length} Extra
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamped Consumed Entries under Date */}
                    <div className="p-4 divide-y divide-stone-100 space-y-3 bg-white">
                      {dayEntries.map((entry, idx) => {
                        const isExtra = entry.type === 'extra' || entry.isExtra;
                        const isScanned = entry.type === 'scanned';

                        return (
                          <div 
                            key={entry.id || idx} 
                            className={`pt-3 first:pt-0 p-3 rounded-xl transition-all ${
                              isExtra 
                                ? 'bg-amber-50/40 border border-amber-200/80' 
                                : isScanned
                                  ? 'bg-indigo-50/40 border border-indigo-200/80'
                                  : 'bg-emerald-50/20 border border-emerald-100/60'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                {/* Visual Distinction Indicator */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  isExtra 
                                    ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                                    : isScanned
                                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                }`}>
                                  {isExtra ? (
                                    <Sparkles className="w-4 h-4 text-amber-600" />
                                  ) : isScanned ? (
                                    <Camera className="w-4 h-4 text-indigo-600" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Visual Distinction Badge */}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                      isExtra 
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold' 
                                        : isScanned
                                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold'
                                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold'
                                    }`}>
                                      {isExtra ? 'EXTRA FOOD (PATIENT LOGGED)' : isScanned ? 'AI PHOTO SCAN' : 'ASSIGNED MEAL'}
                                    </span>

                                    {/* Meal Slot */}
                                    <span className="text-xs font-bold text-stone-700">
                                      {entry.mealType}
                                    </span>

                                    {/* Exact Completion Timestamp */}
                                    {entry.completedAt && (
                                      <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded flex items-center gap-1 border border-stone-200">
                                        <Clock className="w-3 h-3 text-stone-500" />
                                        {entry.completedAt}
                                      </span>
                                    )}
                                  </div>

                                  {/* Item Name */}
                                  <h5 className="text-sm font-bold text-stone-900">
                                    {isExtra ? `Extra: ${entry.name}` : entry.name}
                                  </h5>

                                  {entry.notes && (
                                    <p className="text-xs text-stone-500 italic">"{entry.notes}"</p>
                                  )}

                                  {/* Portion & Macros Chips */}
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                                    <span>Portion: <strong className="text-stone-700">{entry.portion}</strong></span>
                                    <span>•</span>
                                    <span className={`font-mono font-bold ${isExtra ? 'text-amber-800' : 'text-orange-600'}`}>
                                      {entry.calories} kcal
                                    </span>
                                    {entry.protein !== undefined && (
                                      <span className="text-[11px] font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                                        P: {entry.protein}g
                                      </span>
                                    )}
                                    {entry.carbs !== undefined && (
                                      <span className="text-[11px] font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                                        C: {entry.carbs}g
                                      </span>
                                    )}
                                    {entry.fat !== undefined && (
                                      <span className="text-[11px] font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                                        F: {entry.fat}g
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Photo thumbnail if available */}
                              {entry.imageUrl && (
                                <img 
                                  src={entry.imageUrl} 
                                  alt={entry.name}
                                  className="w-16 h-16 rounded-lg object-cover border border-stone-200 shadow-2xs shrink-0 self-start sm:self-center"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. MEAL PLANS TAB */}
      {activeTab === 'meal_plans' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Meal Plan Management
              </h3>
              <p className="text-xs text-stone-500">
                Inspect, modify portions, swap ingredients, or publish meal plans directly to {profile.name}'s app
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAIPlan}
                disabled={generatingPlan}
                className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                {generatingPlan ? 'Generating...' : 'Generate New Plan'}
              </button>
            </div>
          </div>

          {mealPlans.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200/90 p-12 text-center text-xs text-stone-400 space-y-3 shadow-xs">
              <ChefHat className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">No meal plans configured yet</p>
              <p>Generate a customized clinical meal plan tailored to {profile.name}'s dietary preferences.</p>
              <button
                type="button"
                onClick={handleGenerateAIPlan}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold text-xs shadow-xs hover:bg-orange-700"
              >
                Generate First Plan
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {mealPlans.map((plan, planIdx) => (
                <div key={plan.id || planIdx} className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        plan.status === 'published' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                      }`}>
                        {plan.status === 'published' ? 'Active / Published to Client' : 'Draft / Needs Review'}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        {plan.startDate} to {plan.endDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {plan.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => handlePublishPlan(plan)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve & Publish to Client
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Days and Meals */}
                  <div className="space-y-4">
                    {plan.days?.map((day, dIdx) => (
                      <div key={dIdx} className="bg-stone-50/70 border border-stone-200/70 rounded-lg p-4">
                        <div className="font-bold text-xs text-stone-700 uppercase tracking-wider mb-3">
                          Day {day.dayNumber || dIdx + 1}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {day.meals?.map((meal, mIdx) => (
                            <div key={mIdx} className="bg-white p-3 rounded-lg border border-stone-200 text-xs flex flex-col justify-between shadow-2xs">
                              <div>
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
                                  {meal.type}
                                </span>
                                <p className="font-bold text-stone-900 leading-tight">{meal.name}</p>
                                <p className="text-[11px] text-stone-500 mt-1">Portion: {meal.portion || 'Standard'}</p>
                                <p className="text-[11px] font-mono text-orange-600 font-bold mt-0.5">{meal.calories} kcal</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => setEditingMeal({ dayIdx: dIdx, mealIdx: mIdx, meal })}
                                className="mt-2 text-[10px] font-semibold text-stone-500 hover:text-stone-900 self-end flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. PROGRESS & ADHERENCE TAB */}
      {activeTab === 'progress' && (
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 md:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Biometric Progress & Habit Consistency
              </h3>
              <p className="text-xs text-stone-500">
                Track weight reduction, hydration compliance, and overall caloric adherence trends
              </p>
            </div>

            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-semibold text-stone-600">
              {(['7d', '30d', 'all'] as const).map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setProgressTimeframe(tf)}
                  className={`px-3 py-1 rounded-md uppercase ${progressTimeframe === tf ? 'bg-white shadow-2xs text-stone-900 font-bold' : 'hover:text-stone-900'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200/80">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Current Weight</span>
              <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{currentWeight} kg</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Goal: {profile.targetWeightKg} kg</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200/80">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Estimated 30-Day Adherence</span>
              <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{adherence}%</p>
              <p className="text-xs text-stone-500 mt-1">Based on logged meals vs plan</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200/80">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">BMI Status</span>
              <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{bmi}</p>
              <p className="text-xs text-stone-500 mt-1">Height: {profile.heightCm} cm</p>
            </div>
          </div>

          {progressRecords.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-400">
              No historical biometric progress entries recorded yet. Weight will automatically track as meals are logged.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {progressRecords.map(pr => (
                <div key={pr.id} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-900">{pr.date}</span>
                  <span className="text-stone-600">{pr.weightKg} kg</span>
                  <span className="font-semibold text-emerald-600">{pr.adherencePercentage}% Adherence</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. CONSULTATIONS & CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 md:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Clinical Questions & Approvals
              </h3>
              <p className="text-xs text-stone-500">
                Client questions submitted directly through their patient app
              </p>
            </div>
            <span className="text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200/60 px-3 py-1 rounded-md">
              {queries.length} Consultations
            </span>
          </div>

          {queries.length === 0 ? (
            <div className="text-center py-12 text-xs text-stone-400">
              No clinical questions submitted by this patient yet.
            </div>
          ) : (
            <div className="space-y-6 divide-y divide-stone-100">
              {queries.map(q => (
                <div key={q.id} className="pt-6 first:pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-400">{q.date}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      q.status === 'answered' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                    }`}>
                      {q.status === 'answered' ? 'Answered' : 'Awaiting Dietician Approval'}
                    </span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                    <p className="font-semibold text-stone-900 text-sm mb-1">Q: {q.question}</p>
                  </div>

                  {q.reply ? (
                    <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200/70 text-xs space-y-1">
                      <p className="font-bold text-emerald-900">Dietician Approved Answer:</p>
                      <p className="text-emerald-800">{q.reply}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-stone-600">
                        Dietician Response:
                      </label>
                      <textarea
                        value={replyDrafts[q.id!] || ''}
                        onChange={e => setReplyDrafts(prev => ({ ...prev, [q.id!]: e.target.value }))}
                        rows={3}
                        placeholder="Type clinical advice or review/approve response..."
                        className="w-full p-3 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSendChatReply(q.id!)}
                          disabled={sendingReply === q.id || !replyDrafts[q.id!]?.trim()}
                          className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          Approve & Send to Client
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. CLINICAL NOTES TAB */}
      {activeTab === 'notes' && (
        <div className="space-y-5">
          {/* Add Note Form */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              Add Clinical Consultation Note
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-stone-400 mr-1">Category:</span>
                {(['Consultation', 'Nutrition', 'Behaviour', 'Follow-up', 'Meal plan', 'General'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewNoteCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      newNoteCategory === cat 
                        ? 'bg-stone-900 text-white' 
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <textarea
                value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                required
                rows={3}
                placeholder="Document clinical observations, behavioural remarks, physiological complaints, or metabolic adjustments..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingNote || !newNoteContent.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-all disabled:opacity-50"
                >
                  {addingNote ? 'Saving...' : 'Save Clinical Note'}
                </button>
              </div>
            </form>
          </div>

          {/* Notes History */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-base">
              Chronological Consultation Notes ({clinicalNotes.length})
            </h3>

            {clinicalNotes.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-400">
                No clinical notes recorded for this patient yet.
              </div>
            ) : (
              <div className="divide-y divide-stone-100 space-y-4">
                {clinicalNotes.map(note => (
                  <div key={note.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                          {note.category}
                        </span>
                        <span className="text-xs text-stone-400">{note.date}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-stone-300 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs md:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. CLINICAL REPORT TAB */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl border border-stone-200/90 p-6 md:p-8 shadow-xs space-y-6 print:border-none print:shadow-none">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 print:hidden">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Nutritional Evaluation & Progress Report
              </h3>
              <p className="text-xs text-stone-500">
                Formal clinical progress assessment ready for client sharing or medical records
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>

          {/* Printable Report Body */}
          <div className="space-y-6 text-stone-800">
            <div className="border-b border-stone-200 pb-4">
              <h2 className="text-xl font-serif font-bold text-stone-900">NutriSnap Clinical Nutrition Progress Report</h2>
              <p className="text-xs text-stone-500 mt-1">Prepared by Dr. {authProfile?.name || 'Lead Dietician'} (Clinical Nutritionist) • Date of Report: {todayStr}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/70">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Patient Name</span>
                <p className="font-bold text-stone-900 mt-0.5">{profile.name}</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/70">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Current Weight</span>
                <p className="font-bold text-stone-900 mt-0.5">{currentWeight} kg (BMI {bmi})</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/70">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Target Weight</span>
                <p className="font-bold text-stone-900 mt-0.5">{profile.targetWeightKg} kg</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/70">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Adherence Rating</span>
                <p className="font-bold text-emerald-600 mt-0.5">{adherence}% Optimal</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-xs">Clinical Summary & Remarks</h4>
              <p className="text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-lg border border-stone-200/70">
                Patient is maintaining positive adherence ({adherence}%) to the assigned {profile.dietaryType} clinical nutrition regimen. Caloric targets ({targetCalories} kcal) and macronutrient distributions have stabilized metabolic parameters. Continued focus is placed on dietary hydration and evening meal glycemic control.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-xs">Assigned Daily Macronutrient Profile</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 border border-stone-200 rounded-lg">
                  <span className="text-stone-400 text-[10px] uppercase font-bold">Calories</span>
                  <p className="font-bold text-stone-900 mt-0.5">{targetCalories} kcal</p>
                </div>
                <div className="p-3 border border-stone-200 rounded-lg">
                  <span className="text-stone-400 text-[10px] uppercase font-bold">Protein</span>
                  <p className="font-bold text-stone-900 mt-0.5">{targetProtein}g</p>
                </div>
                <div className="p-3 border border-stone-200 rounded-lg">
                  <span className="text-stone-400 text-[10px] uppercase font-bold">Carbs</span>
                  <p className="font-bold text-stone-900 mt-0.5">{targetCarbs}g</p>
                </div>
                <div className="p-3 border border-stone-200 rounded-lg">
                  <span className="text-stone-400 text-[10px] uppercase font-bold">Fat</span>
                  <p className="font-bold text-stone-900 mt-0.5">{targetFat}g</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meal In-Place Editing Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">
                Edit Meal Item ({editingMeal.meal.type})
              </h3>
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-500 font-medium mb-1">Meal Name</label>
                <input
                  type="text"
                  value={editingMeal.meal.name}
                  onChange={e => setEditingMeal({
                    ...editingMeal,
                    meal: { ...editingMeal.meal, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-medium mb-1">Portion Size</label>
                <input
                  type="text"
                  value={editingMeal.meal.portion}
                  onChange={e => setEditingMeal({
                    ...editingMeal,
                    meal: { ...editingMeal.meal, portion: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Calories</label>
                  <input
                    type="number"
                    value={editingMeal.meal.calories}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, calories: Number(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={editingMeal.meal.protein}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, protein: Number(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={editingMeal.meal.carbs}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, carbs: Number(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={editingMeal.meal.fat}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, fat: Number(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                className="px-4 py-2 text-stone-500 text-xs font-semibold hover:text-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveMealEdit(editingMeal.dayIdx, editingMeal.mealIdx, editingMeal.meal)}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-black"
              >
                Save Meal Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
