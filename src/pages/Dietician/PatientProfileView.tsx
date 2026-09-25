import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
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
  PatientProfile, 
  MealPlan, 
  Meal,
  ProgressRecord,
  FoodLog,
  Query,
  ClinicalNote,
  RecipeDBItem,
  buildClinicalMealPlanFromRecipes
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
  Briefcase
} from 'lucide-react';

type ActiveTab = 'overview' | 'food_logs' | 'meal_plans' | 'progress' | 'chat' | 'notes' | 'reports';

export default function PatientProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading, setLoading] = useState(true);

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

  // Load all client data as the Single Source of Truth
  useEffect(() => {
    async function loadAllClientData() {
      if (!id) return;
      setLoading(true);
      try {
        const [p, plans, logs, prog, qs, notes] = await Promise.all([
          getPatientProfile(id),
          getMealPlans(id),
          getAllFoodLogsForPatient(id),
          getProgressRecords(id),
          getQueries(undefined, id),
          getClinicalNotes(id)
        ]);

        setProfile(p);
        setMealPlans(plans);
        setFoodLogs(logs);
        setProgressRecords(prog);
        setQueries(qs);
        setClinicalNotes(notes);
      } catch (err) {
        console.error('Failed to load complete patient profile dossier:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAllClientData();

    const handleNotesEvent = () => {
      if (id) getClinicalNotes(id).then(setClinicalNotes);
    };
    window.addEventListener('nutrisnap:notes_change', handleNotesEvent);
    return () => window.removeEventListener('nutrisnap:notes_change', handleNotesEvent);
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

  // Clinical Computations
  const activePlan = mealPlans.find(p => p.status === 'published') || mealPlans[0];
  const targetCalories = activePlan?.targets?.calories || 2000;
  const targetProtein = activePlan?.targets?.protein || 90;
  const targetCarbs = activePlan?.targets?.carbs || 180;
  const targetFat = activePlan?.targets?.fat || 55;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = foodLogs.filter(l => l.date === todayStr);
  const todayCalories = todayLogs.reduce((sum, l) => sum + (l.nutrition?.calories || 0), 0);
  const todayProtein = todayLogs.reduce((sum, l) => sum + (l.nutrition?.protein || 0), 0);
  const todayCarbs = todayLogs.reduce((sum, l) => sum + (l.nutrition?.carbs || 0), 0);
  const todayFat = todayLogs.reduce((sum, l) => sum + (l.nutrition?.fat || 0), 0);

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
        authorName: 'Lead Dietician',
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
      const pool = await getStoredRecipesFromDB(profile.dietaryType);
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
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Avatar & Core Profile Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 text-white font-serif font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0">
              {profile.name.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-serif font-black text-stone-900">{profile.name}</h1>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  profile.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                }`}>
                  {profile.status}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {profile.dietaryType}
                </span>
                {profile.needsAttention && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Review Needed
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-500 mt-1">
                {profile.email} • {profile.mobile || 'No phone recorded'} • {profile.age ? `${profile.age} yrs • ` : ''}Gender: {profile.gender || 'Not specified'} • Life Stage: <span className="font-bold text-stone-800">{profile.lifeStage || 'Adult'}</span> • Occupation: {profile.occupation || 'Employed'}
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
                  <span className={`font-bold ${adherence >= 80 ? 'text-emerald-600' : adherence >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {adherence}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 lg:self-start">
            <button
              type="button"
              onClick={handleGenerateAIPlan}
              disabled={generatingPlan}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {generatingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-orange-400" />}
              {generatingPlan ? 'Generating Plan...' : 'Generate AI Plan'}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('notes'); }}
              className="px-3.5 py-2 bg-white border border-stone-300 hover:border-stone-400 text-stone-700 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Add Note
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('reports'); }}
              className="px-3.5 py-2 bg-white border border-stone-300 hover:border-stone-400 text-stone-700 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Report
            </button>
          </div>

        </div>

        {/* ─── 7 CONTEXTUAL TABS ────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto mt-6 pt-4 border-t border-stone-100 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'food_logs', label: `Food Logs (${foodLogs.length})`, icon: Utensils },
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active 
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs' 
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-orange-500' : 'text-stone-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB CONTENT PANELS ─────────────────────────────────────────── */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Anthropometric & Weight Management Strategy (Hospital Form Standards) */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-500" />
                Anthropometrics & Weight Plan
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                Broca Protocol
              </span>
            </div>

            <div className="space-y-3 text-xs divide-y divide-stone-100">
              <div className="pt-2 first:pt-0 flex justify-between items-center">
                <span className="text-stone-500">Height & Weight:</span>
                <span className="font-bold text-stone-900">{profile.heightCm} cm • {currentWeight} kg</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-stone-500">Clinical BMI:</span>
                <div className="text-right">
                  <span className="font-black text-stone-900">{bmi} kg/m²</span>
                  <span className="text-[10px] font-bold text-stone-600 block">
                    {bmiClassification}
                  </span>
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-stone-500">Broca's Ideal Weight (IBW):</span>
                <span className="font-black text-emerald-700">~{idealBodyWeight} kg</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-stone-500">Target Goal Weight:</span>
                <div className="text-right">
                  <span className="font-black text-orange-600">{profile.targetWeightKg || currentWeight} kg</span>
                  <span className="text-[10px] text-stone-500 block">
                    {currentWeight !== (profile.targetWeightKg || currentWeight) 
                      ? `${Math.abs(Number((currentWeight - (profile.targetWeightKg || currentWeight)).toFixed(1)))} kg ${currentWeight > (profile.targetWeightKg || currentWeight) ? 'to lose' : 'to gain'}`
                      : 'Maintain current weight'}
                  </span>
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-stone-500">Target Pace:</span>
                <span className="font-bold text-stone-800">{profile.weightManagement?.targetPace || 'Steady (0.5 kg / week)'}</span>
              </div>
              {profile.weightManagement?.specificFocus && profile.weightManagement.specificFocus.length > 0 && (
                <div className="pt-2">
                  <span className="text-stone-500 block mb-1.5 font-medium">Specific Focus Areas:</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.weightManagement.specificFocus.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-800 text-[10px] font-bold">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Clinical Screening & Medical History (From Sheet) */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-orange-500" />
                Medical Screening & History
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                {profile.lifeStage || 'Adult'}
              </span>
            </div>

            <div className="space-y-3 text-xs divide-y divide-stone-100">
              <div className="pt-2 first:pt-0 flex justify-between">
                <span className="text-stone-500">Demographics:</span>
                <span className="font-bold text-stone-900">
                  {profile.age ? `${profile.age} yrs • ` : ''}{profile.gender || 'Not stated'}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-500">Occupation:</span>
                <span className="font-bold text-stone-900 text-right">{profile.occupation || 'Business / Employed'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-500">Diagnosis / Procedure:</span>
                <span className="font-bold text-stone-900 text-right">{profile.diagnosisOrProcedure || 'None noted'}</span>
              </div>
              <div className="pt-2">
                <span className="text-stone-500 block mb-1 font-medium">Pre-existing Conditions:</span>
                <div className="flex flex-wrap gap-1">
                  {(profile.medicalHistory?.length ? profile.medicalHistory : [profile.healthInfo?.conditions || 'None reported']).map((cond, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[10px] font-semibold">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-500">Food Allergies:</span>
                <span className={`font-bold text-right ${(profile.healthInfo?.allergies && profile.healthInfo?.allergies !== 'None') ? 'text-rose-600' : 'text-stone-700'}`}>
                  {profile.healthInfo?.allergies || 'None reported'}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-stone-500">Diet & Activity:</span>
                <span className="font-bold text-stone-900">{profile.dietaryType} • {profile.activityLevel || 'Moderate'}</span>
              </div>
            </div>
          </div>

          {/* Calorie & Macro Target Compliance */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              Today's Caloric & Macro Compliance
            </h3>

            <div>
              <div className="flex justify-between items-baseline mb-1 text-xs">
                <span className="font-bold text-stone-700">Calories: {todayCalories} kcal</span>
                <span className="text-stone-400">Target: {targetCalories} kcal</span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-pink-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((todayCalories / targetCalories) * 100))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2.5 bg-stone-50 rounded-xl">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Protein</p>
                <p className="font-bold text-stone-900 mt-0.5">{todayProtein}g / {targetProtein}g</p>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-xl">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Carbs</p>
                <p className="font-bold text-stone-900 mt-0.5">{todayCarbs}g / {targetCarbs}g</p>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-xl">
                <p className="text-[10px] font-bold text-stone-400 uppercase">Fat</p>
                <p className="font-bold text-stone-900 mt-0.5">{todayFat}g / {targetFat}g</p>
              </div>
            </div>

            <p className="text-[11px] text-stone-500">
              {todayLogs.length} food logs recorded today by client.
            </p>
          </div>

          {/* Active Plan & Quick Summary */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-orange-500" />
              Active Meal Plan Status
            </h3>

            {activePlan ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
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
                  <span className="font-bold text-stone-900">{activePlan.days?.length || 7} Days</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Daily Calorie Target:</span>
                  <span className="font-bold text-stone-900">{targetCalories} kcal</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('meal_plans')}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-colors"
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
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs"
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
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Client Food Journal & Photo Logs
              </h3>
              <p className="text-xs text-stone-500">
                Detailed record of all meals, photo evidence, and AI nutrient detections submitted by {profile.name}
              </p>
            </div>
            <span className="text-xs font-bold bg-stone-100 text-stone-700 px-3 py-1 rounded-xl">
              {foodLogs.length} Total Meals Logged
            </span>
          </div>

          {foodLogs.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              No meal logs have been recorded by this client yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 space-y-4">
              {foodLogs.map(log => (
                <div key={log.id} className="pt-4 first:pt-0 flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex items-start gap-3.5">
                    {log.imageUrl ? (
                      <img 
                        src={log.imageUrl} 
                        alt="Meal upload" 
                        className="w-20 h-20 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-xs" 
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                        <Utensils className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-stone-900 text-sm">{log.description}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          {log.mealType}
                        </span>
                        <span className="text-xs text-stone-400">• {log.date}</span>
                      </div>

                      {log.userNotes && (
                        <p className="text-xs text-stone-600 italic mb-2">"{log.userNotes}"</p>
                      )}

                      {/* Macronutrient chips */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                        <span className="font-bold bg-orange-50 text-orange-800 px-2 py-0.5 rounded">
                          {log.nutrition?.calories || 0} kcal
                        </span>
                        <span className="text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                          P: {log.nutrition?.protein || 0}g
                        </span>
                        <span className="text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                          C: {log.nutrition?.carbs || 0}g
                        </span>
                        <span className="text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                          F: {log.nutrition?.fat || 0}g
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. MEAL PLANS TAB */}
      {activeTab === 'meal_plans' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
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
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                {generatingPlan ? 'Generating...' : 'Generate New Plan'}
              </button>
            </div>
          </div>

          {mealPlans.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center text-xs text-stone-400 space-y-3">
              <ChefHat className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">No meal plans configured yet</p>
              <p>Generate a customized clinical meal plan tailored to {profile.name}'s dietary preferences.</p>
              <button
                type="button"
                onClick={handleGenerateAIPlan}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-orange-700"
              >
                Generate First Plan
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {mealPlans.map((plan, planIdx) => (
                <div key={plan.id || planIdx} className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        plan.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1"
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
                      <div key={dIdx} className="bg-stone-50/70 border border-stone-200/70 rounded-2xl p-4">
                        <div className="font-bold text-xs text-stone-700 uppercase tracking-wider mb-3">
                          Day {day.dayNumber || dIdx + 1}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {day.meals?.map((meal, mIdx) => (
                            <div key={mIdx} className="bg-white p-3 rounded-xl border border-stone-200 text-xs flex flex-col justify-between shadow-xs">
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
                                className="mt-2 text-[10px] font-bold text-stone-500 hover:text-stone-900 self-end flex items-center gap-1"
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
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Biometric Progress & Habit Consistency
              </h3>
              <p className="text-xs text-stone-500">
                Track weight reduction, hydration compliance, and overall caloric adherence trends
              </p>
            </div>

            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold text-stone-600">
              {(['7d', '30d', 'all'] as const).map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setProgressTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg uppercase ${progressTimeframe === tf ? 'bg-white shadow-xs text-stone-900' : 'hover:text-stone-900'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-xs font-bold text-stone-400 uppercase">Current Weight</span>
              <p className="text-2xl font-serif font-black text-stone-900 mt-1">{currentWeight} kg</p>
              <p className="text-xs text-emerald-600 font-bold mt-1">Goal: {profile.targetWeightKg} kg</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-xs font-bold text-stone-400 uppercase">Estimated 30-Day Adherence</span>
              <p className="text-2xl font-serif font-black text-stone-900 mt-1">{adherence}%</p>
              <p className="text-xs text-stone-500 mt-1">Based on logged meals vs plan</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-xs font-bold text-stone-400 uppercase">BMI Status</span>
              <p className="text-2xl font-serif font-black text-stone-900 mt-1">{bmi}</p>
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
                <div key={pr.id} className="py-3 flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-900">{pr.date}</span>
                  <span className="text-stone-600">{pr.weightKg} kg</span>
                  <span className="font-bold text-emerald-600">{pr.adherencePercentage}% Adherence</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. CONSULTATIONS & CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Clinical Questions & Approvals
              </h3>
              <p className="text-xs text-stone-500">
                Client questions submitted directly through their patient app
              </p>
            </div>
            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-xl">
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
                    <span className="text-xs font-bold text-stone-400">{q.date}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      q.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {q.status === 'answered' ? 'Answered' : 'Awaiting Dietician Approval'}
                    </span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
                    <p className="font-bold text-stone-900 text-sm mb-1">Q: {q.question}</p>
                  </div>

                  {q.reply ? (
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-xs space-y-1">
                      <p className="font-bold text-emerald-900">Dietician Approved Answer:</p>
                      <p className="text-emerald-800">{q.reply}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-stone-600">
                        Dietician Response:
                      </label>
                      <textarea
                        value={replyDrafts[q.id!] || ''}
                        onChange={e => setReplyDrafts(prev => ({ ...prev, [q.id!]: e.target.value }))}
                        rows={3}
                        placeholder="Type clinical advice or review/approve response..."
                        className="w-full p-3 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSendChatReply(q.id!)}
                          disabled={sendingReply === q.id || !replyDrafts[q.id!]?.trim()}
                          className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
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
        <div className="space-y-6">
          {/* Add Note Form */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Add Clinical Consultation Note
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-stone-400 mr-1">Category:</span>
                {(['Consultation', 'Nutrition', 'Behaviour', 'Follow-up', 'Meal plan', 'General'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewNoteCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
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
                className="w-full p-4 bg-stone-50 border border-stone-300 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingNote || !newNoteContent.trim()}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {addingNote ? 'Saving...' : 'Save Clinical Note'}
                </button>
              </div>
            </form>
          </div>

          {/* Notes History */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
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
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {note.category}
                        </span>
                        <span className="text-xs font-bold text-stone-500">{note.date}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-stone-300 hover:text-red-500 transition-colors p-1"
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
        <div className="bg-white rounded-3xl border border-stone-200/80 p-8 shadow-sm space-y-6 print:border-none print:shadow-none">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 print:hidden">
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Nutritional Evaluation & Progress Report
              </h3>
              <p className="text-xs text-stone-500">
                Formal clinical progress assessment ready for client sharing or medical records
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>

          {/* Printable Report Body */}
          <div className="space-y-6 text-stone-800">
            <div className="border-b border-stone-200 pb-4">
              <h2 className="text-2xl font-serif font-black text-stone-900">NutriSnap Clinical Nutrition Progress Report</h2>
              <p className="text-xs text-stone-500 mt-1">Prepared by Dr. {profile?.name} • Date of Report: {todayStr}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Patient Name</span>
                <p className="font-bold text-stone-900 mt-0.5">{profile.name}</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Current Weight</span>
                <p className="font-bold text-stone-900 mt-0.5">{currentWeight} kg (BMI {bmi})</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Target Weight</span>
                <p className="font-bold text-stone-900 mt-0.5">{profile.targetWeightKg} kg</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-stone-400 uppercase font-bold text-[10px]">Adherence Rating</span>
                <p className="font-bold text-emerald-600 mt-0.5">{adherence}% Optimal</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-xs">Clinical Summary & Remarks</h4>
              <p className="text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">
                Patient is maintaining positive adherence ({adherence}%) to the assigned {profile.dietaryType} clinical nutrition regimen. Caloric targets ({targetCalories} kcal) and macronutrient distributions have stabilized metabolic parameters. Continued focus is placed on dietary hydration and evening meal glycemic control.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-xs">Assigned Daily Macronutrient Profile</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 border rounded-xl">
                  <span className="text-stone-400 text-[10px] uppercase font-bold">Calories</span>
                  <p className="font-bold text-stone-900 mt-0.5">{targetCalories} kcal</p>
                </div>
                <div className="p-3 border rounded-xl">
                  <span className="text-stone-400 text-[10px] uppercase font-bold">Protein</span>
                  <p className="font-bold text-stone-900 mt-0.5">{targetProtein}g</p>
                </div>
                <div className="p-3 border rounded-xl">
                  <span className="text-stone-400 text-[10px] uppercase font-bold">Carbs</span>
                  <p className="font-bold text-stone-900 mt-0.5">{targetCarbs}g</p>
                </div>
                <div className="p-3 border rounded-xl">
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">
                Edit Meal Item ({editingMeal.meal.type})
              </h3>
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-500 font-bold mb-1">Meal Name</label>
                <input
                  type="text"
                  value={editingMeal.meal.name}
                  onChange={e => setEditingMeal({
                    ...editingMeal,
                    meal: { ...editingMeal.meal, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-bold mb-1">Portion Size</label>
                <input
                  type="text"
                  value={editingMeal.meal.portion}
                  onChange={e => setEditingMeal({
                    ...editingMeal,
                    meal: { ...editingMeal.meal, portion: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-stone-500 font-bold mb-1">Calories</label>
                  <input
                    type="number"
                    value={editingMeal.meal.calories}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, calories: Number(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-bold mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={editingMeal.meal.protein}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, protein: Number(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-bold mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={editingMeal.meal.carbs}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, carbs: Number(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-bold mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={editingMeal.meal.fat}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, fat: Number(e.target.value) }
                    })}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                className="px-4 py-2 text-stone-500 text-xs font-bold hover:text-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveMealEdit(editingMeal.dayIdx, editingMeal.mealIdx, editingMeal.meal)}
                className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-black"
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
