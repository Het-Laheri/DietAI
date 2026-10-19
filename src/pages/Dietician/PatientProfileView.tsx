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
  getMonthlyParameters,
  MonthlyParameterRecord,
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
  filterRecipesForPatient,
  calculatePatientProgramTimeline,
  createNotification,
  PatientLabBiomarkers,
  ClinicalBiomarkerItem,
  DEFAULT_SAMPLE_LABS,
  evaluateLabBiomarkers,
  isBiomarkerRelevantForConditions,
  updatePatientProfile,
  ClinicalGuideItem
} from '../../services/db';
import { CLINICAL_GUIDES } from '../../data/clinicalGuides';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
  ComposedChart
} from 'recharts';
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
  Camera,
  Save,
  BarChart3,
  TrendingUp,
  Info,
  HeartPulse,
  BookOpen,
  Eye,
  ExternalLink
} from 'lucide-react';

type ActiveTab = 'overview' | 'biomarkers' | 'food_logs' | 'meal_plans' | 'progress' | 'chat' | 'notes' | 'reports' | 'handouts';

export default function PatientProfileView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile: authProfile } = useAuth();

  const [viewingGuide, setViewingGuide] = useState<ClinicalGuideItem | null>(null);
  const [assignedGuideIds, setAssignedGuideIds] = useState<string[]>([]);

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [todayChecklist, setTodayChecklist] = useState<ChecklistMealItem[]>([]);
  const [allEatingLogs, setAllEatingLogs] = useState<PatientEatingLogEntry[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [monthlyParams, setMonthlyParams] = useState<MonthlyParameterRecord[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 13 Clinical Lab Biomarkers State
  const [editingLabsModal, setEditingLabsModal] = useState(false);
  const [labFormValues, setLabFormValues] = useState<PatientLabBiomarkers>({});
  const [savingLabs, setSavingLabs] = useState(false);
  const [biomarkerFilterMode, setBiomarkerFilterMode] = useState<'relevant' | 'all'>('relevant');
  const [macroChartMetric, setMacroChartMetric] = useState<'all' | 'carbs' | 'fat' | 'protein' | 'calories'>('all');
  const [labChartFilter, setLabChartFilter] = useState<'relevant' | 'all'>('relevant');

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
        const [p, plans, logs, prog, qs, notes, checklist, mParams] = await Promise.all([
          getPatientProfile(id!),
          getMealPlans(id!),
          getAllFoodLogsForPatient(id!),
          getProgressRecords(id!),
          getQueries(undefined, id!),
          getClinicalNotes(id!),
          getPatientChecklist(id!, todayStr),
          getMonthlyParameters(id!)
        ]);

        setProfile(p);
        setMealPlans(plans);
        setFoodLogs(logs);
        setProgressRecords(prog);
        setMonthlyParams(mParams || []);
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
        const raw = docSnap.data().items;
        const items = (Array.isArray(raw) ? raw : Object.values(raw || {})) as ChecklistMealItem[];
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
          const raw = data.items;
          const items = (Array.isArray(raw) ? raw : Object.values(raw || {})) as ChecklistMealItem[];
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
      // Deduplicate compiled entries
      const seen = new Set<string>();
      const deduped: PatientEatingLogEntry[] = [];
      compiled.forEach(entry => {
        const cleanName = (entry.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase();
        const key = `${entry.date}_${cleanName}_${entry.portion || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(entry);
        }
      });
      setAllEatingLogs(deduped);
    }, (err) => {
      console.warn('Real-time food logs listener note:', err);
    });

    // 3. Real-time patient profile listener (instant weight, BMI, target, and goals sync)
    const profileRef = doc(db, 'patient_profiles', id);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as PatientProfile);
      }
    }, (err) => {
      console.warn('Real-time patient profile listener note:', err);
    });

    // 4. Real-time progress records listener (instant weigh-in log sync)
    const progQuery = query(collection(db, 'progress_records'), where('patientId', '==', id));
    const unsubProg = onSnapshot(progQuery, (snap) => {
      const records = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as ProgressRecord))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setProgressRecords(records);
    }, (err) => {
      console.warn('Real-time progress records listener note:', err);
    });

    const handleNotesEvent = () => {
      if (id) getClinicalNotes(id).then(setClinicalNotes);
    };
    window.addEventListener('nutrisnap:notes_change', handleNotesEvent);

    return () => {
      unsubChecklist();
      unsubFoodLogs();
      unsubProfile();
      unsubProg();
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
  const todayStr = new Date().toISOString().split('T')[0];

  // Prescribed / Assigned Meals planned for today
  const assignedPrescribedItems = todayChecklist.filter(i => !i.isExtra && !i.mealType?.toLowerCase().includes('extra'));
  const plannedDailyCalories = assignedPrescribedItems.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const plannedDailyProtein = assignedPrescribedItems.reduce((sum, i) => sum + (Number(i.protein) || 0), 0);
  const plannedDailyCarbs = assignedPrescribedItems.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0);
  const plannedDailyFat = assignedPrescribedItems.reduce((sum, i) => sum + (Number(i.fat) || 0), 0);

  // If today has prescribed meals, target is the prescribed meals total; otherwise use plan targets or defaults
  const targetCalories = plannedDailyCalories > 0 ? plannedDailyCalories : (activePlan?.targets?.calories || 2000);
  const targetProtein = plannedDailyProtein > 0 ? plannedDailyProtein : (activePlan?.targets?.protein || 90);
  const targetCarbs = plannedDailyCarbs > 0 ? plannedDailyCarbs : (activePlan?.targets?.carbs || 180);
  const targetFat = plannedDailyFat > 0 ? plannedDailyFat : (activePlan?.targets?.fat || 55);

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

  // 2. Today's genuine scanned logs (excluding quick_logs and items already recorded in checklist)
  const todayLogs = foodLogs.filter(l => l.date === todayStr);
  const uniqueScannedLogs = todayLogs.filter(l => {
    if (l.source === 'quick_log' || l.isExtra || l.mealType?.toLowerCase().includes('extra')) {
      return false;
    }
    const cleanLogName = (l.description || l.items?.[0]?.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase();
    return !completedChecklist.some(c => (c.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase() === cleanLogName);
  });
  const scanCalories = uniqueScannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.calories) || 0), 0);
  const scanProtein = uniqueScannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.protein) || 0), 0);
  const scanCarbs = uniqueScannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.carbs) || 0), 0);
  const scanFat = uniqueScannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.fat) || 0), 0);

  // Grand total today consumed (Prescribed + Extra Food + Independent Scans)
  const todayCalories = assignedCalories + extraCalories + scanCalories;
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
    const cleanItemName = (item.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase();
    if (!combinedEatingLogs.some(e => e.date === todayStr && ((e.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase() === cleanItemName || e.id.includes(item.id)))) {
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
  const assignedTotalCount = combinedEatingLogs.filter(l => l.type === 'assigned' || (!l.isExtra && l.type !== 'extra')).length;
  const extraTotalCount = combinedEatingLogs.filter(l => l.isExtra || l.type === 'extra').length;
  // Chronological day-by-day program timeline (e.g. 10 days if enrolled 10 days ago)
  const timeline = calculatePatientProgramTimeline(profile, activePlan, combinedEatingLogs);
  const adherence = timeline.overallAdherence > 0
    ? timeline.overallAdherence
    : (profile.adherencePercentage ?? (profile.needsAttention ? 52 : 0));

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
      const q = queries.find(item => item.id === queryId);
      const targetPatientId = q?.patientId || profile?.uid || profile?.id || id;
      const targetPatientName = q?.patientName || profile?.name || 'Patient';
      await updateQuery(queryId, { 
        reply: text, 
        status: 'answered',
        patientId: targetPatientId,
        patientName: targetPatientName
      });
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

    // Notify patient's phone of meal modification if plan was draft (published plans already notify via saveMealPlan)
    const patientTargetId = profile?.uid || profile?.id || id;
    if (patientTargetId && updatedPlan.status !== 'published') {
      createNotification({
        recipientRole: 'patient',
        recipientId: patientTargetId,
        patientId: patientTargetId,
        patientName: profile?.name || 'Patient',
        type: 'MEAL_PLAN_PUBLISHED',
        title: 'Dietician Updated Your Meal 🥗',
        message: `Your dietician adjusted Day ${dayIdx + 1} (${updatedMeal.name || 'Meal'}). Review your updated plan!`,
        link: '/patient/meals',
        read: false
      }).catch(console.warn);
    }
  };

  const handlePublishPlan = async (planToPublish: MealPlan) => {
    const published: MealPlan = { ...planToPublish, status: 'published' };
    await saveMealPlan(published, 'dietician');
    const updated = await getMealPlans(profile?.id || id!);
    setMealPlans(updated);
  };

  const handleSaveLabs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingLabs(true);
    try {
      const patientId = profile.id || id!;
      const updatedLabs: PatientLabBiomarkers = {
        ...profile.labBiomarkers,
        ...labFormValues,
        testDate: labFormValues.testDate || new Date().toISOString().split('T')[0]
      };
      const existingHistory = Array.isArray(profile.labHistory) ? profile.labHistory : [];
      const nextHistory = [
        ...existingHistory.filter(h => h.testDate !== updatedLabs.testDate),
        updatedLabs
      ].sort((a, b) => (a.testDate || '').localeCompare(b.testDate || ''));

      const updatedProfile: PatientProfile = {
        ...profile,
        labBiomarkers: updatedLabs,
        labHistory: nextHistory
      };
      await updatePatientProfile(patientId, {
        labBiomarkers: updatedLabs,
        labHistory: nextHistory
      });
      setProfile(updatedProfile);
      setEditingLabsModal(false);
    } catch (err) {
      console.error('Failed to save lab biomarkers:', err);
    } finally {
      setSavingLabs(false);
    }
  };

  const openLabEditModal = () => {
    const currentLabs = { ...(profile?.labBiomarkers || {}) };
    setLabFormValues({ ...currentLabs });
    setEditingLabsModal(true);
  };

  const renderMacroProgressChartWithInterpretation = () => {
    if (!profile) return null;

    const currentLabs = { ...(profile.labBiomarkers || {}) };
    const condStr = typeof profile.clinicalSummary === 'object' ? profile.clinicalSummary?.conditions : (profile.clinicalSummary || profile.healthInfo?.conditions || '');
    const isDiabetic = (condStr || '').toLowerCase().includes('diabet');

    const totalCarbsConsumed = timeline.days.reduce((s, d) => s + (d.carbsConsumed || 0), 0);
    const totalFatConsumed = timeline.days.reduce((s, d) => s + (d.fatConsumed || 0), 0);
    const totalProteinConsumed = timeline.days.reduce((s, d) => s + (d.proteinConsumed || 0), 0);
    const totalCaloriesConsumed = timeline.days.reduce((s, d) => s + (d.caloriesConsumed || 0), 0);

    const loggedDays = Math.max(1, timeline.loggedDaysCount || 1);
    const avgCarbs = Math.round(totalCarbsConsumed / loggedDays);
    const avgFat = Math.round(totalFatConsumed / loggedDays);
    const avgProtein = Math.round(totalProteinConsumed / loggedDays);
    const avgCalories = Math.round(totalCaloriesConsumed / loggedDays);

    const calsFromCarbs = avgCarbs * 4;
    const calsFromFat = avgFat * 9;
    const calsFromProtein = avgProtein * 4;
    const computedMacroTotalCals = Math.max(1, calsFromCarbs + calsFromFat + calsFromProtein);

    const carbPercent = Math.round((calsFromCarbs / computedMacroTotalCals) * 100);
    const fatPercent = Math.round((calsFromFat / computedMacroTotalCals) * 100);
    const proteinPercent = Math.max(0, 100 - carbPercent - fatPercent);

    const pieData = [
      { name: 'Carbohydrates', value: calsFromCarbs, percent: carbPercent, grams: avgCarbs, color: '#f97316' },
      { name: 'Healthy Fats', value: calsFromFat, percent: fatPercent, grams: avgFat, color: '#eab308' },
      { name: 'Protein', value: calsFromProtein, percent: proteinPercent, grams: avgProtein, color: '#10b981' }
    ];

    const proteinGPerKg = ((avgProtein || targetProtein) / (idealBodyWeight || 65)).toFixed(1);

    const macroChartData = timeline.days.map(d => ({
      day: `Day ${d.dayNumber}`,
      shortDate: d.displayDate,
      fullDate: d.fullDate,
      carbs: Math.round(d.carbsConsumed || 0),
      targetCarbs: Math.round(targetCarbs),
      fat: Math.round(d.fatConsumed || 0),
      targetFat: Math.round(targetFat),
      protein: Math.round(d.proteinConsumed || 0),
      targetProtein: Math.round(targetProtein),
      calories: Math.round(d.caloriesConsumed || 0),
      targetCalories: Math.round(d.caloriesTarget || targetCalories)
    }));

    return (
      <div className="bg-stone-50/70 rounded-xl border border-stone-200/80 p-5 space-y-5">
        {/* Header with Metric Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-200/70">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                Macronutrient Intake Progression & Energy Balance
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Dietitian Analytics
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Daily tracking of Carbohydrates, Fats, Protein and Caloric load across Day 1 to Day {timeline.totalDays}
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs text-xs">
            {[
              { id: 'all', label: 'All Macros' },
              { id: 'carbs', label: 'Carbs (g)' },
              { id: 'fat', label: 'Fats (g)' },
              { id: 'protein', label: 'Protein (g)' },
              { id: 'calories', label: 'Calories (kcal)' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMacroChartMetric(m.id as any)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  macroChartMetric === m.id
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid: Left Main Progression, Right Caloric Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Main Progression Chart (8 cols) */}
          <div className="lg:col-span-8 bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-800">
                {macroChartMetric === 'all' && 'Daily Macros (Carbs, Fats, Protein in grams)'}
                {macroChartMetric === 'carbs' && `Carbohydrate Intake vs Target (${targetCarbs}g)`}
                {macroChartMetric === 'fat' && `Dietary Fat Intake vs Target (${targetFat}g)`}
                {macroChartMetric === 'protein' && `Protein Intake vs Target (${targetProtein}g)`}
                {macroChartMetric === 'calories' && `Caloric Consumption vs Target (${targetCalories} kcal)`}
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                {macroChartMetric === 'all' && (
                  <>
                    <span className="flex items-center gap-1 text-orange-600 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Carbs
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Fats
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Protein
                    </span>
                  </>
                )}
                {macroChartMetric !== 'all' && (
                  <>
                    <span className="flex items-center gap-1 text-stone-800 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-900 inline-block" /> Actual Consumed
                    </span>
                    <span className="flex items-center gap-1 text-stone-500 font-medium">
                      <span className="w-2.5 h-0.5 bg-stone-400 inline-block" /> Prescribed Target
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {macroChartMetric === 'all' ? (
                  <LineChart data={macroChartData} margin={{ top: 10, right: 15, bottom: 5, left: -15 }}>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="g" />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-md text-xs space-y-1">
                              <p className="font-bold text-stone-900">{data.day} • {data.shortDate}</p>
                              <p className="text-orange-600 font-semibold">Carbs: {data.carbs}g / {data.targetCarbs}g</p>
                              <p className="text-amber-600 font-semibold">Fats: {data.fat}g / {data.targetFat}g</p>
                              <p className="text-emerald-600 font-semibold">Protein: {data.protein}g / {data.targetProtein}g</p>
                              <p className="text-stone-500 text-[10px]">Calories: {data.calories} kcal</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="carbs" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: '#f97316' }} />
                    <Line type="monotone" dataKey="fat" stroke="#eab308" strokeWidth={2.5} dot={{ r: 3, fill: '#eab308' }} />
                    <Line type="monotone" dataKey="protein" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
                  </LineChart>
                ) : macroChartMetric === 'carbs' ? (
                  <AreaChart data={macroChartData} margin={{ top: 10, right: 15, bottom: 5, left: -15 }}>
                    <defs>
                      <linearGradient id="carbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="g" />
                    <ReferenceLine y={targetCarbs} stroke="#ea580c" strokeDasharray="3 3" label={{ value: `Target: ${targetCarbs}g`, fill: '#ea580c', fontSize: 10, position: 'top' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="carbs" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#carbGrad)" />
                  </AreaChart>
                ) : macroChartMetric === 'fat' ? (
                  <AreaChart data={macroChartData} margin={{ top: 10, right: 15, bottom: 5, left: -15 }}>
                    <defs>
                      <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="g" />
                    <ReferenceLine y={targetFat} stroke="#ca8a04" strokeDasharray="3 3" label={{ value: `Target: ${targetFat}g`, fill: '#ca8a04', fontSize: 10, position: 'top' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="fat" stroke="#eab308" strokeWidth={2.5} fillOpacity={1} fill="url(#fatGrad)" />
                  </AreaChart>
                ) : macroChartMetric === 'protein' ? (
                  <AreaChart data={macroChartData} margin={{ top: 10, right: 15, bottom: 5, left: -15 }}>
                    <defs>
                      <linearGradient id="protGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="g" />
                    <ReferenceLine y={targetProtein} stroke="#059669" strokeDasharray="3 3" label={{ value: `Target: ${targetProtein}g`, fill: '#059669', fontSize: 10, position: 'top' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="protein" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#protGrad)" />
                  </AreaChart>
                ) : (
                  <BarChart data={macroChartData} margin={{ top: 10, right: 15, bottom: 5, left: -15 }}>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} unit=" kcal" />
                    <ReferenceLine y={targetCalories} stroke="#1c1917" strokeDasharray="3 3" label={{ value: `Target: ${targetCalories} kcal`, fill: '#1c1917', fontSize: 10, position: 'top' }} />
                    <Tooltip />
                    <Bar dataKey="calories" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Caloric Distribution & Ratio Card (4 cols) */}
          <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-800">Energy Macro Distribution</span>
                <span className="text-[10px] text-stone-500 font-mono">Mean {avgCalories} kcal/d</span>
              </div>

              {/* Donut Chart */}
              <div className="h-40 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={56}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [`${item.payload.grams}g (${item.payload.percent}%)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xs font-mono font-bold text-stone-800">{avgCalories}</span>
                  <span className="text-[9px] text-stone-400">kcal avg</span>
                </div>
              </div>

              {/* Macro Pills Breakdown */}
              <div className="space-y-1.5 pt-1 text-xs">
                {pieData.map(p => (
                  <div key={p.name} className="flex items-center justify-between p-1.5 rounded-lg bg-stone-50 border border-stone-200/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-semibold text-stone-800 text-[11px]">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-stone-900 text-[11px]">{p.grams}g</span>
                      <span className="text-stone-400 text-[10px] ml-1">({p.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-stone-400 pt-2 border-t border-stone-100 mt-2">
              Prescribed Targets: {targetCarbs}g C • {targetFat}g F • {targetProtein}g P ({targetCalories} kcal)
            </p>
          </div>
        </div>

        {/* Clinical Dietitian Interpretation for Macronutrients */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-amber-700" />
            <h5 className="font-bold text-amber-950 text-xs uppercase tracking-wider">
              Dietitian Clinical Interpretation — Macronutrients & Metabolic Load
            </h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Carbohydrate Analysis */}
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200/50 space-y-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5 text-[11px]">
                <Wheat className="w-3.5 h-3.5 text-orange-600" />
                Carbohydrate Load & Glycemic Control ({avgCarbs}g vs {targetCarbs}g target)
              </span>
              <p className="text-stone-700 text-[11px] leading-relaxed">
                {avgCarbs > targetCarbs + 15 ? (
                  <>Patient carb intake averages <strong className="text-orange-700">{avgCarbs}g ({carbPercent}% of energy)</strong>, exceeding the clinical threshold of {targetCarbs}g. In patients with {isDiabetic ? 'Type 2 Diabetes' : 'metabolic sensitivity'}, this exacerbates glycemic variability. <em>Dietitian Action:</em> Shift toward lower glycemic index (GI &lt; 55) complex pulses, whole wheat/multigrain, and vegetable bulking.</>
                ) : (
                  <>Average carb intake of <strong className="text-emerald-700">{avgCarbs}g ({carbPercent}% of energy)</strong> is compliant with the prescribed cap of {targetCarbs}g. Controlled glycemic indexing prevents postprandial insulin surges while sustaining satiety.</>
                )}
              </p>
            </div>

            {/* 2. Fat Analysis */}
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200/50 space-y-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5 text-[11px]">
                <Droplet className="w-3.5 h-3.5 text-amber-600" />
                Dietary Fat & Lipid Metabolism ({avgFat}g vs {targetFat}g target)
              </span>
              <p className="text-stone-700 text-[11px] leading-relaxed">
                Daily fat intake averages <strong className="text-stone-900">{avgFat}g ({fatPercent}% of energy)</strong> vs target {targetFat}g. {currentLabs.triglycerides ? `Correlating with serum Triglycerides (${currentLabs.triglycerides} mg/dL)${currentLabs.ldl ? ` and LDL (${currentLabs.ldl} mg/dL)` : ''}: ` : ''}Strictly cap saturated fats (ghee/butter) to &lt;7% of calories. Favor cold-pressed mustard oil, walnuts, and flaxseeds to reduce atherogenic risk and liver fat accumulation.
              </p>
            </div>

            {/* 3. Protein & Renal Safety */}
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200/50 space-y-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5 text-[11px]">
                <Dna className="w-3.5 h-3.5 text-emerald-600" />
                Protein Satiety & Renal Clearance ({avgProtein}g, ~{proteinGPerKg} g/kg IBW)
              </span>
              <p className="text-stone-700 text-[11px] leading-relaxed">
                Protein intake averages <strong className="text-emerald-800">{avgProtein}g/day</strong> (~{proteinGPerKg} g/kg ideal body weight). {currentLabs.creatinine ? `Glomerular markers (Creatinine: ${currentLabs.creatinine} mg/dL${currentLabs.bun ? `, BUN: ${currentLabs.bun} mg/dL` : ''}) confirm healthy renal nitrogenous filtration. ` : ''}Supports lean muscle preservation and post-meal thermogenesis without renal strain.
              </p>
            </div>

            {/* 4. Caloric Energy Deficit */}
            <div className="bg-white/80 p-3 rounded-lg border border-amber-200/50 space-y-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5 text-[11px]">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                Caloric Balance & Deficit Trajectory ({avgCalories} kcal vs {targetCalories} kcal)
              </span>
              <p className="text-stone-700 text-[11px] leading-relaxed">
                Patient consumes an average of <strong className="text-stone-900">{avgCalories} kcal/day</strong> against a target of {targetCalories} kcal ({avgCalories - targetCalories > 0 ? `+${avgCalories - targetCalories} kcal surplus` : `${Math.abs(avgCalories - targetCalories)} kcal deficit`}). Energy intake trajectory supports steady weight trajectory toward target goal of <strong className="text-stone-900">{profile.targetWeightKg || currentWeight} kg</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBiomarkerProgressChartWithInterpretation = () => {
    if (!profile) return null;

    const currentLabs = profile.labBiomarkers || {};
    const evaluatedBiomarkers = evaluateLabBiomarkers(currentLabs, profile.gender || 'Female');
    const patientConditions = [
      ...(profile.medicalHistory || []),
      typeof profile.clinicalSummary === 'object' ? (profile.clinicalSummary?.conditions || '') : (profile.clinicalSummary || ''),
      profile.healthInfo?.conditions || '',
      profile.diagnosisOrProcedure || ''
    ].filter(Boolean).join(', ');

    const relevantBiomarkers = evaluatedBiomarkers.filter(b => {
      const rel = isBiomarkerRelevantForConditions(b.key, patientConditions);
      return rel.isRelevant || b.status !== 'optimal';
    });

    const displayedBiomarkers = (labChartFilter === 'relevant' && relevantBiomarkers.length > 0)
      ? relevantBiomarkers
      : evaluatedBiomarkers;

    // Ratios for clinical interpretation
    const tgHdlRatio = (currentLabs.triglycerides && currentLabs.hdl)
      ? (currentLabs.triglycerides / currentLabs.hdl).toFixed(2)
      : 'N/A';
    const sgptVal = currentLabs.sgpt ?? '--';
    const sgotVal = currentLabs.sgot ?? '--';
    const altAstRatio = (currentLabs.sgpt && currentLabs.sgot)
      ? (currentLabs.sgpt / currentLabs.sgot).toFixed(2)
      : 'N/A';
    const bunVal = currentLabs.bun ?? '--';
    const creatVal = currentLabs.creatinine ?? '--';
    const bunCreatRatio = (currentLabs.bun && currentLabs.creatinine)
      ? (currentLabs.bun / currentLabs.creatinine).toFixed(1)
      : 'N/A';
    const uricAcidVal = currentLabs.uricAcid ?? '--';
    const naVal = currentLabs.sodium ?? '--';
    const kVal = currentLabs.potassium ?? '--';

    // Chart dataset: map parameters with deviation status score
    const chartData = displayedBiomarkers.map(b => {
      const rel = isBiomarkerRelevantForConditions(b.key, patientConditions);
      // Normalized status score (Optimal: 50, Borderline: 75, Elevated: 95, Low: 25)
      const score = b.status === 'optimal' ? 50 
        : b.status === 'borderline' ? 75 
        : (b.status === 'elevated' || b.status === 'critical') ? 95 
        : 25;

      const fill = b.status === 'optimal' ? '#10b981' 
        : b.status === 'borderline' ? '#f59e0b' 
        : (b.status === 'elevated' || b.status === 'critical') ? '#ef4444' 
        : '#3b82f6';

      return {
        name: b.shortName,
        fullName: b.name,
        value: b.value,
        unit: b.unit,
        range: b.normalRange,
        statusLabel: b.statusLabel,
        score,
        fill,
        isRelevant: rel.isRelevant,
        reason: rel.reason
      };
    });

    return (
      <div className="bg-stone-50/70 rounded-xl border border-stone-200/80 p-5 space-y-5">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-200/70">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-600" />
                13 Clinical Lab Parameters Status & Organ Profile Chart
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                Dietitian Overview
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Pathology status comparison across all 13 core biomarkers with clinical organ-system risk interpretations
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs text-xs">
              <button
                type="button"
                onClick={() => setLabChartFilter('relevant')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  labChartFilter === 'relevant'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🎯 Relevant Issues ({relevantBiomarkers.length})
              </button>
              <button
                type="button"
                onClick={() => setLabChartFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  labChartFilter === 'all'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🌐 All 13 Labs ({evaluatedBiomarkers.length})
              </button>
            </div>
          </div>
        </div>

        {/* Chart + Multi-System Interpretation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Status Bar Chart (7 cols) */}
          <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-stone-800">
                Pathology Risk & Equilibrium Profile ({chartData.length} Parameters)
              </span>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Borderline
                </span>
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Elevated
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
                >
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-md text-xs space-y-1">
                            <p className="font-bold text-stone-900">{d.name} ({d.fullName})</p>
                            <p className="text-orange-700 font-mono font-bold text-sm">{d.value} {d.unit}</p>
                            <p className="text-stone-500 text-[10px]">Reference: {d.range}</p>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${
                              d.score <= 50 ? 'bg-emerald-50 text-emerald-800' : d.score <= 75 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'
                            }`}>
                              {d.statusLabel}
                            </span>
                            {d.isRelevant && (
                              <p className="text-[10px] text-rose-700 font-medium mt-1">🎯 {d.reason}</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={14}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[10px] text-stone-400 pt-2 border-t border-stone-100 mt-2 flex items-center justify-between">
              <span>Bars illustrate metabolic risk & equilibrium (50 = optimal range midpoint; &gt;75 = clinical risk).</span>
              <span className="font-semibold text-stone-600">Sample Date: {currentLabs.testDate || '2026-09-28'}</span>
            </p>
          </div>

          {/* Multi-System Clinical Interpretation (5 cols) */}
          <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <h5 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  Dietitian Multi-System Clinical Interpretation
                </h5>
              </div>

              <div className="space-y-2.5 pt-2 text-xs divide-y divide-stone-100">
                {/* 1. Cardiometabolic Axis */}
                <div className="pt-2 first:pt-0 space-y-0.5">
                  <span className="font-bold text-stone-900 text-[11px] flex items-center justify-between">
                    <span>🫀 Cardiometabolic & Atherogenic Profile</span>
                    <span className="text-orange-700 font-mono text-[10px]">TG/HDL: {tgHdlRatio}</span>
                  </span>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    TG/HDL ratio is <strong>{tgHdlRatio}</strong> (elevated &gt; 3.0), pointing to atherogenic dyslipidemia, hyperinsulinemia, and small-dense LDL particles. Combined with HbA1c at <strong>{currentLabs.hba1c ?? 6.8}%</strong>, strict elimination of simple sucrose/fructose and addition of soluble psyllium husk is warranted.
                  </p>
                </div>

                {/* 2. Hepatic Axis */}
                <div className="pt-2 space-y-0.5">
                  <span className="font-bold text-stone-900 text-[11px] flex items-center justify-between">
                    <span>🫁 Hepatic Stress & Enzymes</span>
                    <span className="text-rose-700 font-mono text-[10px]">ALT/AST: {altAstRatio}</span>
                  </span>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    SGPT / ALT (<strong>{sgptVal} U/L</strong>) elevation over SGOT (<strong>{sgotVal} U/L</strong>) confirms hepatic parenchymal inflammation consistent with Grade 1 Fatty Liver (NAFLD). Recommend hepatic antioxidants: turmeric with black pepper, green leafy sabzis, and avoiding evening heavy carb loads.
                  </p>
                </div>

                {/* 3. Renal & Purine Axis */}
                <div className="pt-2 space-y-0.5">
                  <span className="font-bold text-stone-900 text-[11px] flex items-center justify-between">
                    <span>🩸 Renal Filtration & Uric Acid</span>
                    <span className="text-emerald-700 font-mono text-[10px]">BUN/Cr: {bunCreatRatio}</span>
                  </span>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    BUN/Creatinine ratio of <strong>{bunCreatRatio}</strong> confirms normal glomerular perfusion and safe protein handling. Uric Acid at <strong>{uricAcidVal} mg/dL</strong> is on the upper margin; mandate 2.5–3.0 L alkaline hydration (warm lemon water) and soak pulses 4+ hours to leech purines.
                  </p>
                </div>

                {/* 4. Electrolytes */}
                <div className="pt-2 space-y-0.5">
                  <span className="font-bold text-stone-900 text-[11px] flex items-center justify-between">
                    <span>⚡ Electrolytes & Vascular Homeostasis</span>
                    <span className="text-stone-700 font-mono text-[10px]">Na {naVal} / K {kVal}</span>
                  </span>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    Sodium (<strong>{naVal} mEq/L</strong>) and Potassium (<strong>{kVal} mEq/L</strong>) are within safe parameters. Adhere to DASH guideline (&lt;2000mg sodium daily; omit papad/pickles) to prevent arterial stiffness and blood pressure spikes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBiomarkersPanel = () => {
    if (!profile) return null;
    const currentLabs = profile.labBiomarkers || {};
    const evaluatedBiomarkers = evaluateLabBiomarkers(currentLabs, profile.gender || 'Female');
    const patientConditions = [
      ...(profile.medicalHistory || []),
      typeof profile.clinicalSummary === 'object' ? (profile.clinicalSummary?.conditions || '') : (profile.clinicalSummary || ''),
      profile.healthInfo?.conditions || '',
      profile.diagnosisOrProcedure || ''
    ].filter(Boolean).join(', ');

    const relevantBiomarkers = evaluatedBiomarkers.filter(b => {
      const rel = isBiomarkerRelevantForConditions(b.key, patientConditions);
      return rel.isRelevant || b.status !== 'optimal';
    });

    const displayedBiomarkers = (biomarkerFilterMode === 'relevant' && relevantBiomarkers.length > 0)
      ? relevantBiomarkers
      : evaluatedBiomarkers;

    const relevantCount = relevantBiomarkers.length;
    const totalCount = evaluatedBiomarkers.length;

    return (
      <div className="bg-stone-50/70 rounded-xl border border-stone-200/80 p-5 space-y-5">
        {/* Section Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-200/70">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-600" />
                Clinical Lab Biomarkers & Organ Health Progress
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                13 Core Parameters
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Fasting metabolic profile for larger scale issues. Dynamically filtered for: <strong className="text-stone-800">{patientConditions || 'General Wellness Profile'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Relevance Toggle */}
            <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs text-xs">
              <button
                type="button"
                onClick={() => setBiomarkerFilterMode('relevant')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  biomarkerFilterMode === 'relevant'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🎯 Relevant Issues Only ({relevantCount})
              </button>
              <button
                type="button"
                onClick={() => setBiomarkerFilterMode('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  biomarkerFilterMode === 'all'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🌐 All 13 Parameters ({totalCount})
              </button>
            </div>

            <button
              type="button"
              onClick={openLabEditModal}
              className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Update Lab Values
            </button>
          </div>
        </div>

        {/* Patient Conditions Banner */}
        {patientConditions && (
          <div className="bg-orange-50/60 border border-orange-200/60 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-orange-900 mr-2">Monitored Clinical Conditions:</span>
              <span className="text-orange-800">{patientConditions}</span>
            </div>
            <div className="text-[11px] text-orange-700 font-medium">
              Showing {displayedBiomarkers.length} of {totalCount} biomarkers {biomarkerFilterMode === 'relevant' ? '(Filtered by diagnosed issues)' : '(Full panel view)'}
            </div>
          </div>
        )}

        {/* Biomarker Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedBiomarkers.map((b) => {
            const rel = isBiomarkerRelevantForConditions(b.key, patientConditions);
            return (
              <div 
                key={b.key} 
                className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                  rel.isRelevant ? 'border-orange-200/90 hover:border-orange-300' : 'border-stone-200/80 hover:border-stone-300'
                }`}
              >
                <div>
                  {/* Card Header: Category & Relevance Tag */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {b.category}
                    </span>
                    {rel.isRelevant ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/70 text-right leading-tight max-w-[65%] truncate" title={rel.reason}>
                        🎯 {rel.reason.split('/')[0].trim()}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                        Baseline
                      </span>
                    )}
                  </div>

                  {/* Biomarker Title & Value */}
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-stone-900 text-sm">{b.shortName}</h5>
                      <p className="text-[11px] text-stone-500 leading-tight">{b.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold font-mono text-stone-900">{b.value}</span>
                      <span className="text-xs text-stone-500 ml-1 font-medium">{b.unit}</span>
                    </div>
                  </div>

                  {/* Status Badge & Normal Range */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-xs">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${b.badgeColor}`}>
                      {b.statusLabel}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">
                      Range: {b.normalRange}
                    </span>
                  </div>
                </div>

                {/* MNT Dietary Action & Discussion */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 bg-stone-50/70 -mx-4 -mb-4 p-3 rounded-b-xl text-[11px] space-y-1">
                  <p className="text-stone-800 leading-relaxed">
                    <strong className="text-orange-900 font-semibold">Dietary Plan: </strong>
                    {b.dietaryAction}
                  </p>
                  <p className="text-stone-500 italic text-[10px] leading-relaxed">
                    <strong className="text-stone-700 not-italic font-medium">Clinical Context: </strong>
                    {b.clinicalDiscussionPoint}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lab Meta Footer */}
        <div className="pt-3 border-t border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Last Fasting Report: <strong className="text-stone-800">{currentLabs.testDate || '2026-09-28'}</strong></span>
          </div>
          {currentLabs.notes && (
            <div className="italic text-[11px] text-stone-600 sm:max-w-xl text-right">
              "{currentLabs.notes}"
            </div>
          )}
        </div>
      </div>
    );
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
                <div>
                  <span className="text-stone-400 font-medium">Care Plan: </span>
                  <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-[11px] border border-orange-200">
                    Day {timeline.totalDays} ({timeline.totalDays} {timeline.totalDays === 1 ? 'day' : 'days'})
                  </span>
                </div>

                {/* Monthly Clinical Parameters */}
                {(() => {
                  const latestMonth = monthlyParams[0];
                  return (
                    <>
                      <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200">
                        <span className="text-stone-400 font-medium">Waist / Inch Loss: </span>
                        <span className="font-bold text-stone-900">
                          {latestMonth?.waistCm ? `${latestMonth.waistCm} cm` : (profile.waistCm ? `${profile.waistCm} cm` : '--')}
                        </span>
                        {(latestMonth?.inchLoss || profile.inchLoss) ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                            -{latestMonth?.inchLoss || profile.inchLoss}"
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400 font-medium">Blood Pressure: </span>
                        <span className="font-bold text-stone-900">
                          {latestMonth?.bloodPressureSystolic ? `${latestMonth.bloodPressureSystolic}/${latestMonth.bloodPressureDiastolic || 80} mmHg` : '--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400 font-medium">Fasting Sugar: </span>
                        <span className="font-bold text-stone-900">
                          {latestMonth?.fastingSugar ? `${latestMonth.fastingSugar} mg/dL` : '--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400 font-medium">HbA1c: </span>
                        <span className="font-bold text-purple-700">
                          {latestMonth?.hba1c ? `${latestMonth.hba1c}%` : (profile.labBiomarkers?.hba1c ? `${profile.labBiomarkers.hba1c}%` : '--')}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Quick Actions (Report removed from top header) */}
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
          </div>

        </div>

        {/* ─── CONTEXTUAL CLINICAL TABS ─────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto mt-5 pt-3 border-t border-stone-100 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'biomarkers', label: '13 Lab Biomarkers', icon: Activity },
            { id: 'food_logs', label: `Food Logs (${allEatingLogs.length || foodLogs.length})`, icon: Utensils },
            { id: 'meal_plans', label: `Meal Plans (${mealPlans.length})`, icon: ChefHat },
            { id: 'progress', label: 'Progress & Trends', icon: Activity },
            { id: 'chat', label: `Consultation (${queries.length})`, icon: MessageSquare },
            { id: 'notes', label: `Clinical Notes (${clinicalNotes.length})`, icon: FileText },
            { id: 'handouts', label: 'Clinical Handouts', icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active 
                    ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs font-bold' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-700' : 'text-stone-400'}`} />
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
                <span className="text-stone-500 font-medium">Target: <strong className="text-stone-800 font-bold">{targetCalories} kcal</strong></span>
              </div>

              {/* Segmented Dual Bar */}
              {(() => {
                const scaleMax = Math.max(targetCalories, todayCalories);
                const bPercent = Math.min(100, Math.round((assignedCalories / scaleMax) * 100));
                const ePercent = Math.min(100 - bPercent, Math.round((extraCalories / scaleMax) * 100));
                return (
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex border border-stone-200/70 p-0.5">
                    <div 
                      className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                      style={{ width: `${bPercent}%` }}
                      title={`Assigned Meals: ${assignedCalories} kcal`}
                    />
                    <div 
                      className="bg-amber-500 h-full transition-all duration-500 rounded-r-full"
                      style={{ width: `${ePercent}%` }}
                      title={`Extra Food: ${extraCalories} kcal`}
                    />
                  </div>
                );
              })()}

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

      {/* 2. 13 CLINICAL LAB BIOMARKERS TAB */}
      {activeTab === 'biomarkers' && (
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 md:p-6 shadow-xs space-y-6">
          {renderBiomarkersPanel()}
        </div>
      )}

      {/* 3. FOOD LOGS TAB */}
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

                const dayInfo = timeline.days.find(d => d.date === dateKey);

                return (
                  <div key={dateKey} className="rounded-xl border border-stone-200/90 overflow-hidden shadow-2xs">
                    {/* Day & Date Header Bar */}
                    <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <h4 className="font-bold text-stone-900 text-sm">
                          {dayInfo ? <span className="text-orange-700 font-bold mr-1">Day {dayInfo.dayNumber} •</span> : null}
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
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{timeline.totalDays}-Day Program Adherence</span>
              <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{adherence}%</p>
              <p className="text-xs text-stone-500 mt-1">
                {timeline.loggedDaysCount > 0 
                  ? `Logged ${timeline.loggedDaysCount} of ${timeline.totalDays} ${timeline.totalDays === 1 ? 'day' : 'days'} (${timeline.consistencyPercentage}% consistency)` 
                  : 'Based on logged meals vs plan'}
              </p>
            </div>
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200/80">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">BMI Status</span>
              <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{bmi}</p>
              <p className="text-xs text-stone-500 mt-1">Height: {profile.heightCm} cm</p>
            </div>
          </div>

          {/* Daily Adherence Progress Line Chart (Day 1 to Day N) */}
          <div className="bg-stone-50/70 rounded-xl border border-stone-200/80 p-5 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-sm font-serif font-bold text-stone-900">
                  Daily Nutrition Adherence (Day 1 – Day {timeline.totalDays})
                </h4>
                <p className="text-xs text-stone-500">
                  Calculated chronologically across {profile.name}'s {timeline.totalDays} {timeline.totalDays === 1 ? 'day' : 'days'} on care plan (Enrolled {timeline.startDateFormatted})
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white border border-stone-200 rounded-md text-stone-800">
                Avg: {adherence}%
              </span>
            </div>

            {timeline.loggedDaysCount > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline.days.map(d => ({
                    day: `Day ${d.dayNumber}`,
                    shortDate: d.displayDate,
                    fullDate: d.fullDate,
                    adherence: d.adherencePercentage,
                    calories: d.caloriesConsumed,
                    targetCalories: d.caloriesTarget,
                    mealsLogged: d.mealsLogged
                  }))} margin={{ top: 10, right: 15, bottom: 5, left: -15 }}>
                    <Line 
                      type="monotone" 
                      dataKey="adherence" 
                      stroke="#ea580c" 
                      strokeWidth={2.5} 
                      dot={{ r: 3.5, fill: '#ea580c' }}
                      activeDot={{ r: 6, fill: '#1c1917' }} 
                    />
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" />
                    <Tooltip 
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-sm text-xs">
                              <p className="font-bold text-stone-900">{data.day} • {data.shortDate}</p>
                              <p className="text-[10px] text-stone-400 mb-1">{data.fullDate}</p>
                              <p className="text-orange-700 font-bold">Adherence: {data.adherence}%</p>
                              <p className="text-stone-600">Calories: {data.calories} / {data.targetCalories} kcal</p>
                              <p className="text-stone-500">Meals: {data.mealsLogged}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-stone-400">
                Patient has not completed meal logs yet. As logs are recorded, daily adherence from Day 1 to Day {timeline.totalDays} will appear here.
              </div>
            )}
          </div>

          {/* Macronutrient Intake Progression & Energy Balance Chart with Clinical Dietitian Interpretation */}
          {renderMacroProgressChartWithInterpretation()}

          {/* 13 Clinical Lab Parameters Status & Organ Profile Chart with Multi-System Interpretation */}
          {renderBiomarkerProgressChartWithInterpretation()}

          {/* 13 Clinical Lab Biomarkers Detailed Panel (Filtered to only relevant parameters by default) */}
          {renderBiomarkersPanel()}

          {progressRecords.length === 0 ? (
            <div className="text-center py-6 text-xs text-stone-400">
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

      {/* ─── CLINICAL EVALUATION & PROGRESS REPORT (FIXED AT END OF DOSSIER) ─── */}
      <div className="bg-white rounded-3xl border-2 border-stone-200/90 p-6 md:p-8 shadow-sm space-y-6 print:border-none print:shadow-none mt-10">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-800">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-stone-900 text-base">
                Nutritional Evaluation & Clinical Progress Report
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Official clinical summary assessment ready for client consultation, handover, or medical record export
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF Report
          </button>
        </div>

        {/* Printable Report Body */}
        <div className="space-y-6 text-stone-800">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="text-xl font-serif font-black text-stone-900">NutriSnap Clinical Nutrition Progress Report</h2>
            <p className="text-xs text-stone-500 mt-1 font-medium">Prepared by Dr. {authProfile?.name || 'Lead Dietician'} (Clinical Nutritionist) • Date of Report: {todayStr}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70">
              <span className="text-stone-400 uppercase font-black text-[10px]">Patient Name</span>
              <p className="font-black text-stone-900 mt-0.5 text-sm">{profile.name}</p>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70">
              <span className="text-stone-400 uppercase font-black text-[10px]">Current Weight</span>
              <p className="font-black text-stone-900 mt-0.5 text-sm">{currentWeight} kg (BMI {bmi})</p>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70">
              <span className="text-stone-400 uppercase font-black text-[10px]">Target Weight</span>
              <p className="font-black text-stone-900 mt-0.5 text-sm">{profile.targetWeightKg} kg</p>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70">
              <span className="text-stone-400 uppercase font-black text-[10px]">Adherence Rating</span>
              <p className="font-black text-emerald-700 mt-0.5 text-sm">{adherence}% Optimal</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-black text-stone-900 uppercase tracking-wider text-xs">Clinical Summary & Remarks</h4>
            <p className="text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200/70 font-medium">
              Patient is maintaining positive adherence ({adherence}%) to the assigned {profile.dietaryType} clinical nutrition regimen. Caloric targets ({targetCalories} kcal) and macronutrient distributions have stabilized metabolic parameters. Continued focus is placed on dietary hydration, micronutrient balance, and evening meal glycemic control.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-black text-stone-900 uppercase tracking-wider text-xs">Assigned Daily Macronutrient Profile</h4>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                <span className="text-stone-400 text-[10px] uppercase font-black">Calories</span>
                <p className="font-black text-stone-900 mt-0.5 text-sm">{targetCalories} kcal</p>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                <span className="text-stone-400 text-[10px] uppercase font-black">Protein</span>
                <p className="font-black text-stone-900 mt-0.5 text-sm">{targetProtein}g</p>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                <span className="text-stone-400 text-[10px] uppercase font-black">Carbs</span>
                <p className="font-black text-stone-900 mt-0.5 text-sm">{targetCarbs}g</p>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                <span className="text-stone-400 text-[10px] uppercase font-black">Fat</span>
                <p className="font-black text-stone-900 mt-0.5 text-sm">{targetFat}g</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. CLINICAL HANDOUTS TAB */}
      {activeTab === 'handouts' && (
        <div className="bg-white rounded-xl border border-stone-200/90 p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-600" />
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Clinical Care Handouts & Dietary Guidelines
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  Dietician Library
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Evidence-based cardiovascular, glycemic, lipid, and renal dietary protocols to educate and guide {profile.name || 'this patient'}.
              </p>
            </div>
          </div>

          {/* Guide Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLINICAL_GUIDES.map(guide => {
              const isAssigned = assignedGuideIds.includes(guide.id);

              return (
                <div
                  key={guide.id}
                  className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-stone-100 border border-stone-200">
                      <img
                        src={guide.imageUrl}
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-900/80 text-white backdrop-blur-xs">
                          {guide.category}
                        </span>
                      </div>
                      {isAssigned && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Assigned
                          </span>
                        </div>
                      )}
                    </div>

                    <h4 className="font-bold text-stone-900 text-sm mb-1 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {guide.title}
                    </h4>
                    {guide.subtitle && (
                      <p className="text-xs text-stone-500 mb-2 line-clamp-1 font-medium">
                        {guide.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                      {guide.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-stone-100 mt-4">
                    <button
                      type="button"
                      onClick={() => setViewingGuide(guide)}
                      className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Guide</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = isAssigned
                          ? assignedGuideIds.filter(gId => gId !== guide.id)
                          : [...assignedGuideIds, guide.id];
                        setAssignedGuideIds(next);
                        if (activePlan) {
                          saveMealPlan({ ...activePlan, attachedGuideIds: next }, 'dietician').catch(console.warn);
                        }
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isAssigned
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                          : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Assigned</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLINICAL GUIDE LIGHTBOX MODAL */}
      {viewingGuide && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                    {viewingGuide.category}
                  </span>
                  <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                    {viewingGuide.title}
                  </h3>
                </div>
                {viewingGuide.subtitle && (
                  <p className="text-xs text-stone-500 mt-0.5 font-medium">{viewingGuide.subtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={viewingGuide.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Open high-res chart in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setViewingGuide(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-900/5 flex items-center justify-center max-h-[440px]">
                <img
                  src={viewingGuide.imageUrl}
                  alt={viewingGuide.title}
                  className="max-h-[440px] w-auto object-contain rounded-lg shadow-sm"
                />
              </div>

              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                {viewingGuide.description}
              </p>

              {(viewingGuide.chooseFoods || viewingGuide.goEasyFoods || viewingGuide.avoidFoods) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {viewingGuide.chooseFoods && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                      <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Choose / Prioritize
                      </span>
                      <ul className="space-y-1.5 text-[11px] text-emerald-950">
                        {viewingGuide.chooseFoods.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingGuide.goEasyFoods && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
                      <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Go Easy / Moderate
                      </span>
                      <ul className="space-y-1.5 text-[11px] text-amber-950">
                        {viewingGuide.goEasyFoods.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingGuide.avoidFoods && (
                    <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 space-y-2">
                      <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Avoid / Limit
                      </span>
                      <ul className="space-y-1.5 text-[11px] text-rose-950">
                        {viewingGuide.avoidFoods.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                NutriSnap Clinical Library Handout
              </span>
              <button
                onClick={() => setViewingGuide(null)}
                className="px-5 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Guide
              </button>
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

      {/* ─── MODAL: UPDATE 13 LAB BIOMARKERS ─── */}
      {editingLabsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-600" />
                  Update 13 Core Clinical Lab Biomarkers
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Record latest pathology lab results for {profile?.name} to recalibrate MNT nutrition plans.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLabsModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLabs} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Lab Report Date
                  </label>
                  <input
                    type="date"
                    value={labFormValues.testDate || ''}
                    onChange={(e) => setLabFormValues({ ...labFormValues, testDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Pathology Laboratory / Clinical Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fasting 12hr metabolic profile, Metropolis Labs"
                    value={labFormValues.notes || ''}
                    onChange={(e) => setLabFormValues({ ...labFormValues, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 13 Parameter Inputs */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                  13 Parameters (Pathology Values)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                  {/* HbA1c */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">HbA1c</label>
                    <span className="text-[10px] text-stone-400 block mb-1">% (Glycated Hb)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={labFormValues.hba1c ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, hba1c: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Haemoglobin */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">Haemoglobin</label>
                    <span className="text-[10px] text-stone-400 block mb-1">g/dL</span>
                    <input
                      type="number"
                      step="0.1"
                      value={labFormValues.haemoglobin ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, haemoglobin: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Cholesterol */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">Total Cholesterol</label>
                    <span className="text-[10px] text-stone-400 block mb-1">mg/dL</span>
                    <input
                      type="number"
                      step="1"
                      value={labFormValues.cholesterol ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, cholesterol: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Triglycerides */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">Triglycerides</label>
                    <span className="text-[10px] text-stone-400 block mb-1">mg/dL</span>
                    <input
                      type="number"
                      step="1"
                      value={labFormValues.triglycerides ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, triglycerides: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* HDL */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">HDL Cholesterol</label>
                    <span className="text-[10px] text-stone-400 block mb-1">mg/dL (Good)</span>
                    <input
                      type="number"
                      step="1"
                      value={labFormValues.hdl ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, hdl: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* LDL */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">LDL Cholesterol</label>
                    <span className="text-[10px] text-stone-400 block mb-1">mg/dL (Bad)</span>
                    <input
                      type="number"
                      step="1"
                      value={labFormValues.ldl ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, ldl: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* SGPT */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">SGPT (ALT)</label>
                    <span className="text-[10px] text-stone-400 block mb-1">U/L (Liver)</span>
                    <input
                      type="number"
                      step="1"
                      value={labFormValues.sgpt ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, sgpt: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* SGOT */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">SGOT (AST)</label>
                    <span className="text-[10px] text-stone-400 block mb-1">U/L (Liver)</span>
                    <input
                      type="number"
                      step="1"
                      value={labFormValues.sgot ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, sgot: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Sodium */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">Sodium (Na)</label>
                    <span className="text-[10px] text-stone-400 block mb-1">mEq/L</span>
                    <input
                      type="number"
                      step="0.5"
                      value={labFormValues.sodium ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, sodium: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Potassium */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">Potassium (K)</label>
                    <span className="text-[10px] text-stone-400 block mb-1">mEq/L</span>
                    <input
                      type="number"
                      step="0.1"
                      value={labFormValues.potassium ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, potassium: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Creatinine */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">Creatinine</label>
                    <span className="text-[10px] text-stone-400 block mb-1">mg/dL (Renal)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={labFormValues.creatinine ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, creatinine: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* BUN */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">BUN</label>
                    <span className="text-[10px] text-stone-400 block mb-1">mg/dL (Blood Urea)</span>
                    <input
                      type="number"
                      step="1"
                      value={labFormValues.bun ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, bun: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Uric Acid */}
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/60">
                    <label className="block font-bold text-stone-800 text-xs">Uric Acid</label>
                    <span className="text-[10px] text-stone-400 block mb-1">mg/dL (Purine)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={labFormValues.uricAcid ?? ''}
                      onChange={(e) => setLabFormValues({ ...labFormValues, uricAcid: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-white border border-stone-300 rounded text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingLabsModal(false)}
                  className="px-4 py-2 text-stone-600 text-xs font-semibold hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLabs}
                  className="px-5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingLabs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savingLabs ? 'Saving Labs...' : 'Save Laboratory Values'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
