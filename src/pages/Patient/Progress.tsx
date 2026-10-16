import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getPatientProfile, 
  getMealPlans, 
  getPatientChecklist,
  getPatientWeekPlan,
  getAllPatientEatingLogs,
  getProgressRecords,
  ProgressRecord,
  getMonthlyParameters,
  saveMonthlyParameter,
  MonthlyParameterRecord,
  calculatePatientProgramTimeline,
  PatientProfile, 
  MealPlan,
  PatientWeekPlan,
  ChecklistMealItem,
  PatientEatingLogEntry
} from '../../services/db';
import { db } from '../../services/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Target, 
  CheckCircle2, 
  Award, 
  Flame, 
  Calendar, 
  Utensils, 
  Sparkles, 
  ChevronRight,
  Wheat,
  Droplet,
  Clock,
  Check,
  Scale,
  Edit3,
  TrendingDown,
  Dumbbell,
  Heart,
  Activity,
  PlusCircle,
  X,
  FileText
} from 'lucide-react';
import React from 'react';
import PatientProfileModal from '../../components/PatientProfileModal';

export default function Progress() {
  const { profile } = useAuth();
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [todayChecklist, setTodayChecklist] = useState<ChecklistMealItem[]>([]);
  const [eatingLogs, setEatingLogs] = useState<PatientEatingLogEntry[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [monthlyParams, setMonthlyParams] = useState<MonthlyParameterRecord[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddMonthlyModalOpen, setIsAddMonthlyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartsMounted, setChartsMounted] = useState(false);

  // Monthly parameter form state
  const [monthFormDate, setMonthFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [monthFormWeight, setMonthFormWeight] = useState('');
  const [monthFormWaist, setMonthFormWaist] = useState('');
  const [monthFormInchLoss, setMonthFormInchLoss] = useState('');
  const [monthFormBpSys, setMonthFormBpSys] = useState('');
  const [monthFormBpDia, setMonthFormBpDia] = useState('');
  const [monthFormSugar, setMonthFormSugar] = useState('');
  const [monthFormHba1c, setMonthFormHba1c] = useState('');
  const [monthFormNotes, setMonthFormNotes] = useState('');
  const [savingMonthly, setSavingMonthly] = useState(false);

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const patientUid = profile?.uid;

  useEffect(() => {
    setChartsMounted(true);
  }, []);

  useEffect(() => {
    if (!patientUid) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
        const [pData, plansData, , checklistData, allLogs, progData, mParams] = await Promise.all([
          getPatientProfile(patientUid!),
          getMealPlans(patientUid!),
          getPatientWeekPlan(patientUid!),
          getPatientChecklist(patientUid!, todayStr),
          getAllPatientEatingLogs(patientUid!),
          getProgressRecords(patientUid!),
          getMonthlyParameters(patientUid!)
        ]);

        if (!isMounted) return;

        setPatientProfile(pData);
        const activePlan = plansData.find(p => p.status === 'published') || plansData[0] || null;
        setMealPlan(activePlan);
        setTodayChecklist(checklistData || []);
        setEatingLogs(allLogs || []);
        setProgressRecords(progData || []);
        setMonthlyParams(mParams || []);
      } catch (err) {
        console.warn('Progress load data note:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    // 1. Real-time Firestore listener for today's checklist doc
    const checklistRef = doc(db, 'food_logs', `checklist_${patientUid}_${todayStr}`);
    const unsubChecklist = onSnapshot(checklistRef, (docSnap) => {
      if (docSnap.exists()) {
        const raw = docSnap.data().items;
        const items = (Array.isArray(raw) ? raw : Object.values(raw || {})) as ChecklistMealItem[];
        setTodayChecklist(items);
        getAllPatientEatingLogs(patientUid).then(logs => {
          if (isMounted) setEatingLogs(logs);
        }).catch(() => {});
      }
    }, (err) => {
      console.warn('Real-time checklist listener note:', err);
    });

    // 2. Real-time patient profile listener
    const profileRef = doc(db, 'patient_profiles', patientUid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists() && isMounted) {
        setPatientProfile(docSnap.data() as PatientProfile);
      }
    }, (err) => {
      console.warn('Real-time profile listener note:', err);
    });

    // 3. Real-time progress records listener
    const progQuery = query(collection(db, 'progress_records'), where('patientId', '==', patientUid));
    const unsubProg = onSnapshot(progQuery, (snap) => {
      if (isMounted) {
        const records = snap.docs
          .map(d => ({ ...d.data(), id: d.id } as ProgressRecord))
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setProgressRecords(records);
      }
    }, (err) => {
      console.warn('Real-time progress records listener note:', err);
    });

    // 4. Custom window events from MealNotepad and Profile Modal
    const handleChecklistUpdated = () => {
      getPatientChecklist(patientUid, todayStr).then(items => {
        if (isMounted) setTodayChecklist(items);
      }).catch(() => {});
      getAllPatientEatingLogs(patientUid).then(logs => {
        if (isMounted) setEatingLogs(logs);
      }).catch(() => {});
    };

    const handleProfileUpdated = () => {
      getPatientProfile(patientUid).then(p => {
        if (isMounted && p) setPatientProfile(p);
      }).catch(() => {});
    };

    const handleProgUpdated = () => {
      getProgressRecords(patientUid).then(records => {
        if (isMounted) setProgressRecords(records);
      }).catch(() => {});
      getMonthlyParameters(patientUid).then(records => {
        if (isMounted) setMonthlyParams(records);
      }).catch(() => {});
    };

    window.addEventListener('nutrisnap:checklist_updated', handleChecklistUpdated);
    window.addEventListener('nutrisnap:profile_updated', handleProfileUpdated);
    window.addEventListener('nutrisnap:progress_record_updated', handleProgUpdated);

    return () => {
      isMounted = false;
      unsubChecklist();
      unsubProfile();
      unsubProg();
      window.removeEventListener('nutrisnap:checklist_updated', handleChecklistUpdated);
      window.removeEventListener('nutrisnap:profile_updated', handleProfileUpdated);
      window.removeEventListener('nutrisnap:progress_record_updated', handleProgUpdated);
    };
  }, [patientUid, todayStr]);

  // ─── TARGET & COMPLIANCE CALCULATIONS ──────────────────────────────────────
  // 1. Prescribed / Assigned Meals planned for today
  const assignedPrescribedItems = todayChecklist.filter(i => !i.isExtra && !i.mealType?.toLowerCase().includes('extra'));
  const plannedDailyCalories = assignedPrescribedItems.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const plannedDailyProtein = assignedPrescribedItems.reduce((sum, i) => sum + (Number(i.protein) || 0), 0);
  const plannedDailyCarbs = assignedPrescribedItems.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0);
  const plannedDailyFat = assignedPrescribedItems.reduce((sum, i) => sum + (Number(i.fat) || 0), 0);

  // Fallback to active meal plan targets if planned meals aren't yet populated
  const targetCalories = plannedDailyCalories > 0 ? plannedDailyCalories : (mealPlan?.targets?.calories || 2000);
  const targetProtein = plannedDailyProtein > 0 ? plannedDailyProtein : (mealPlan?.targets?.protein || 68);
  const targetCarbs = plannedDailyCarbs > 0 ? plannedDailyCarbs : (mealPlan?.targets?.carbs || 130);
  const targetFat = plannedDailyFat > 0 ? plannedDailyFat : (mealPlan?.targets?.fat || 54);

  // 2. Completed checklist items for today (both assigned meals and extra items)
  const completedChecklist = todayChecklist.filter(i => i.completed);
  const assignedCompleted = completedChecklist.filter(i => !i.isExtra && !i.mealType?.toLowerCase().includes('extra'));
  const extraCompleted = completedChecklist.filter(i => i.isExtra || i.mealType?.toLowerCase().includes('extra'));

  const assignedCalories = assignedCompleted.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const extraCalories = extraCompleted.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const checklistProtein = completedChecklist.reduce((sum, i) => sum + (Number(i.protein) || 0), 0);
  const checklistCarbs = completedChecklist.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0);
  const checklistFat = completedChecklist.reduce((sum, i) => sum + (Number(i.fat) || 0), 0);

  // 3. Genuine scanned logs for today from eatingLogs (type === 'scanned')
  const todayScanned = eatingLogs.filter(l => l.date === todayStr && l.type === 'scanned');
  const scanCalories = todayScanned.reduce((sum, l) => sum + (Number(l.calories) || 0), 0);
  const scanProtein = todayScanned.reduce((sum, l) => sum + (Number(l.protein) || 0), 0);
  const scanCarbs = todayScanned.reduce((sum, l) => sum + (Number(l.carbs) || 0), 0);
  const scanFat = todayScanned.reduce((sum, l) => sum + (Number(l.fat) || 0), 0);

  // Grand totals consumed today
  const todayCalories = assignedCalories + extraCalories + scanCalories;
  const todayProtein = checklistProtein + scanProtein;
  const todayCarbs = checklistCarbs + scanCarbs;
  const todayFat = checklistFat + scanFat;
  const totalItemsConsumedToday = completedChecklist.length + todayScanned.length;

  // Percentage & bar scaling
  const scaleMax = Math.max(targetCalories, todayCalories);
  const caloriePct = Math.round((todayCalories / targetCalories) * 100);
  const remainingCalories = Math.max(0, targetCalories - todayCalories);
  const isOverTarget = todayCalories > targetCalories;

  const assignedProgressPercent = Math.min(100, Math.round((assignedCalories / scaleMax) * 100));
  const extraProgressPercent = Math.min(
    100 - assignedProgressPercent,
    Math.round(((extraCalories + scanCalories) / scaleMax) * 100)
  );

  // ─── OVERALL METRICS & TIMELINE ──────────────────────────────────────────
  // Merge eating logs with today's completed checklist items to ensure 100% synchronization
  const allCompletedMap = new Map<string, PatientEatingLogEntry>();

  eatingLogs.forEach(entry => {
    allCompletedMap.set(entry.id, entry);
  });

  completedChecklist.forEach(item => {
    const isExtra = item.isExtra || item.mealType?.toLowerCase().includes('extra');
    const itemId = `chk_${item.id}`;
    if (!allCompletedMap.has(itemId)) {
      allCompletedMap.set(itemId, {
        id: itemId,
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

  const allCompletedItems = Array.from(allCompletedMap.values()).sort(
    (a, b) => (b.date || '').localeCompare(a.date || '')
  );

  const totalMealsLogged = allCompletedItems.length;
  const uniqueLoggedDates = Array.from(new Set(allCompletedItems.map(l => l.date)));
  // Chronological day-by-day program timeline (e.g. reflects 10 days if enrolled 10 days ago, not arbitrary weeks)
  const timeline = calculatePatientProgramTimeline(
    patientProfile,
    mealPlan,
    eatingLogs,
    todayChecklist
  );

  const hasLogs = totalMealsLogged > 0 || timeline.loggedDaysCount > 0;

  // Chronological chart data: reflects Day 1 through Day N
  const dailyChartData = timeline.days.map(d => ({
    day: `Day ${d.dayNumber}`,
    dayNum: d.dayNumber,
    shortDate: d.displayDate,
    fullDate: d.fullDate,
    adherence: d.adherencePercentage,
    calories: d.caloriesConsumed,
    targetCalories: d.caloriesTarget,
    mealsLogged: d.mealsLogged
  }));

  // Weight Change and Inch Loss Calculations
  const startingWeight = Number(patientProfile?.weightManagement?.initialWeightKg || patientProfile?.currentWeightKg || 68);
  const currentWeight = Number(patientProfile?.currentWeightKg || 68);
  const weightChangeKg = Number((currentWeight - startingWeight).toFixed(1));
  const displayedInchLoss = patientProfile?.inchLoss ?? (
    patientProfile?.initialWaistCm && patientProfile?.waistCm 
      ? Number(((patientProfile.initialWaistCm - patientProfile.waistCm) / 2.54).toFixed(1))
      : 0
  );

  // Build Monthly Progression Data for Charts
  const monthlyChartData = React.useMemo(() => {
    const parseBaselineMonth = (createdAt: any) => {
      if (!createdAt) return 'Baseline';
      if (typeof createdAt?.toDate === 'function') {
        const d = createdAt.toDate();
        return isNaN(d.getTime()) ? 'Baseline' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      if (createdAt?.seconds) {
        const d = new Date(createdAt.seconds * 1000);
        return isNaN(d.getTime()) ? 'Baseline' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      const d = new Date(createdAt);
      return isNaN(d.getTime()) ? 'Baseline' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    if (!monthlyParams || monthlyParams.length === 0) {
      return [];
    }

    // Sort ascending chronologically for charts
    const sorted = [...monthlyParams].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return sorted.map(m => ({
      month: m.month || m.date,
      date: m.date,
      weight: Number(m.weightKg) || 0,
      inchLoss: Number(m.inchLoss) || 0,
      waist: m.waistCm ? Number(m.waistCm) : undefined,
      systolic: m.bloodPressureSystolic ? Number(m.bloodPressureSystolic) : undefined,
      diastolic: m.bloodPressureDiastolic ? Number(m.bloodPressureDiastolic) : undefined,
      fastingSugar: m.fastingSugar ? Number(m.fastingSugar) : undefined,
      hba1c: m.hba1c ? Number(m.hba1c) : undefined
    }));
  }, [monthlyParams, patientProfile?.createdAt, patientProfile?.initialWaistCm, patientProfile?.waistCm, startingWeight, currentWeight, displayedInchLoss, todayStr]);

  const handleSaveMonthly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientUid || !monthFormWeight) return;

    setSavingMonthly(true);
    try {
      const selectedDate = new Date(monthFormDate);
      const monthLabel = selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const newRec: Omit<MonthlyParameterRecord, 'id'> = {
        patientId: patientUid,
        date: monthFormDate,
        month: monthLabel,
        weightKg: parseFloat(monthFormWeight),
        waistCm: monthFormWaist ? parseFloat(monthFormWaist) : undefined,
        inchLoss: monthFormInchLoss ? parseFloat(monthFormInchLoss) : undefined,
        bloodPressureSystolic: monthFormBpSys ? parseInt(monthFormBpSys) : undefined,
        bloodPressureDiastolic: monthFormBpDia ? parseInt(monthFormBpDia) : undefined,
        fastingSugar: monthFormSugar ? parseFloat(monthFormSugar) : undefined,
        hba1c: monthFormHba1c ? parseFloat(monthFormHba1c) : undefined,
        notes: monthFormNotes || undefined
      };

      await saveMonthlyParameter(patientUid, newRec);
      const updated = await getMonthlyParameters(patientUid);
      setMonthlyParams(updated);
      setIsAddMonthlyModalOpen(false);
      // Reset form
      setMonthFormWeight('');
      setMonthFormWaist('');
      setMonthFormInchLoss('');
      setMonthFormBpSys('');
      setMonthFormBpDia('');
      setMonthFormSugar('');
      setMonthFormHba1c('');
      setMonthFormNotes('');
    } catch (err) {
      console.error('Failed to save monthly parameters:', err);
    } finally {
      setSavingMonthly(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Synchronization State Banner (non-blocking) */}
      {loading && (
        <div className="mb-6 p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-teal-900 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <Activity className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
          <span>Synchronizing latest clinical parameters and intake records...</span>
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-black text-stone-900 tracking-tight">Your Nutrition & Goal Progress</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs">
              Day {timeline.totalDays} of Care Plan
            </span>
            <span className="text-stone-600 text-xs font-medium">
              Enrolled {timeline.startDateFormatted} • Chronological Daily Analytics
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddMonthlyModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Record Monthly Parameters
          </button>
        </div>
      </div>

      {/* ─── TODAY'S INTAKE & ENERGY BALANCE (STATIC CLEAN CARD) ─────────── */}
      <div className="bg-white border-2 border-stone-200/80 rounded-3xl p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-stone-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-black text-stone-900">Today's Intake & Energy Balance</h2>
              <p className="text-xs text-stone-500 font-medium">Daily nutritional targets and recorded food checklist</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isOverTarget ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {caloriePct}% of Daily Target
            </span>
          </div>
        </div>

        {/* Calorie Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 flex flex-col justify-center">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-serif font-black text-stone-900">{todayCalories}</span>
              <span className="text-stone-500 font-bold text-sm">/ {targetCalories} kcal</span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-1">
              {targetCalories > todayCalories 
                ? `${remainingCalories} kcal remaining for today` 
                : 'Caloric target reached for today'}
            </p>

            {/* Calorie Bar */}
            <div className="w-full bg-stone-100 rounded-full h-3 mt-4 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${assignedProgressPercent}%` }}
                title={`Prescribed Meals: ${assignedCalories} kcal`}
              />
              <div 
                className="bg-amber-500 h-full transition-all duration-500" 
                style={{ width: `${extraProgressPercent}%` }}
                title={`Extra / Scanned Food: ${extraCalories + scanCalories} kcal`}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Prescribed ({assignedCalories} kcal)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Extra ({extraCalories + scanCalories} kcal)
              </span>
            </div>
          </div>

          {/* Macro Breakdown */}
          <div className="md:col-span-7 grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-purple-700 mb-1">
                <Dumbbell className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-black tracking-wider">Protein</span>
              </div>
              <span className="text-lg font-black font-serif text-stone-900 block">{Math.round(todayProtein)}g</span>
              <span className="text-[10px] text-stone-500 font-medium">Target: {targetProtein}g</span>
            </div>

            <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-amber-700 mb-1">
                <Wheat className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-black tracking-wider">Carbs</span>
              </div>
              <span className="text-lg font-black font-serif text-stone-900 block">{Math.round(todayCarbs)}g</span>
              <span className="text-[10px] text-stone-500 font-medium">Target: {targetCarbs}g</span>
            </div>

            <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-rose-700 mb-1">
                <Heart className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-black tracking-wider">Fats</span>
              </div>
              <span className="text-lg font-black font-serif text-stone-900 block">{Math.round(todayFat)}g</span>
              <span className="text-[10px] text-stone-500 font-medium">Target: {targetFat}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ANTHROPOMETRICS, WEEK END, WEIGHT CHANGE & INCH LOSS ─────────── */}
      <div className="bg-gradient-to-br from-white via-teal-50/15 to-emerald-50/15 border-2 border-teal-200/80 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-teal-100 mb-5">
          <div>
            <h2 className="text-sm uppercase tracking-wider font-black text-teal-950 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center">
                <Scale className="w-3.5 h-3.5 text-teal-700" />
              </div>
              Anthropometrics, Weight Change & Inch Loss
            </h2>
            <p className="text-xs text-stone-600 mt-1 font-medium">
              Target pace: <strong className="text-teal-900 font-bold">{patientProfile?.weightManagement?.targetPace || 'Steady & Sustainable (0.5 kg / week)'}</strong>
            </p>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Metrics / Log Weight & Inches
          </button>
        </div>

        {/* 6 Metric Grid: Current Weight, Weight Change, Inch Loss, Week End, Target Goal, Clinical BMI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
          {/* Current Weight */}
          <div className="p-3.5 bg-white/80 border-2 border-teal-100 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-teal-700 uppercase font-black tracking-wider">Current Weight</span>
            <span className="text-xl font-black font-serif text-stone-900 mt-0.5 block">{currentWeight} kg</span>
            <span className="block text-[10px] text-stone-500 font-medium mt-0.5">Ht: {patientProfile?.heightCm || 165} cm</span>
          </div>

          {/* Weight Change */}
          <div className="p-3.5 bg-white/80 border-2 border-teal-100 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-teal-700 uppercase font-black tracking-wider">Weight Change</span>
            <span className={`text-xl font-black font-serif mt-0.5 block ${weightChangeKg < 0 ? 'text-emerald-700' : weightChangeKg > 0 ? 'text-amber-700' : 'text-stone-900'}`}>
              {weightChangeKg < 0 ? `${weightChangeKg} kg` : weightChangeKg > 0 ? `+${weightChangeKg} kg` : '0.0 kg'}
            </span>
            <span className="block text-[10px] text-stone-500 font-medium mt-0.5">Since start</span>
          </div>

          {/* Inch Loss */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-300 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-emerald-800 uppercase font-black tracking-wider">Inch Loss</span>
            <span className="text-xl font-black font-serif text-emerald-700 mt-0.5 block">
              {displayedInchLoss > 0 ? `-${displayedInchLoss}"` : `${displayedInchLoss}"`}
            </span>
            <span className="block text-[10px] text-emerald-800 font-bold mt-0.5">
              Waist: {patientProfile?.waistCm ? `${patientProfile.waistCm} cm` : 'Logged'}
            </span>
          </div>

          {/* Week End Assessment */}
          <div className="p-3.5 bg-white/80 border-2 border-teal-100 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-teal-700 uppercase font-black tracking-wider">Week Cycle</span>
            <span className="text-xl font-black font-serif text-stone-900 mt-0.5 block">
              Week {Math.ceil(timeline.totalDays / 7)}
            </span>
            <span className="block text-[10px] text-stone-500 font-medium mt-0.5">
              Day {timeline.totalDays % 7 || 7} of 7
            </span>
          </div>

          {/* Target Goal */}
          <div className="p-3.5 bg-white/80 border-2 border-teal-100 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-teal-700 uppercase font-black tracking-wider">Target Goal</span>
            <span className="text-xl font-black font-serif text-stone-900 mt-0.5 block">{patientProfile?.targetWeightKg || 60} kg</span>
            <span className="block text-[10px] text-stone-500 font-medium mt-0.5">
              {Number(currentWeight) > Number(patientProfile?.targetWeightKg || 60)
                ? `${(Number(currentWeight) - Number(patientProfile?.targetWeightKg || 60)).toFixed(1)} kg to go`
                : 'Target Reached!'}
            </span>
          </div>

          {/* Clinical BMI */}
          <div className="p-3.5 bg-white/80 border-2 border-teal-100 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-teal-700 uppercase font-black tracking-wider">Clinical BMI</span>
            <span className="text-xl font-black font-serif text-stone-900 mt-0.5 block">{patientProfile?.bmi || 25.0}</span>
            <span className="block text-[10px] text-stone-600 font-medium mt-0.5">{patientProfile?.bmiClassification?.split(' ')[0] || 'Normal'}</span>
          </div>
        </div>

        {/* Recent weigh-in history */}
        {progressRecords.length > 0 && (
          <div className="mt-5 pt-4 border-t border-teal-100">
            <h4 className="text-xs font-black text-stone-700 mb-2 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
              Recent Weigh-in Log Records
            </h4>
            <div className="flex flex-wrap gap-2">
              {progressRecords.slice(0, 6).map((rec, i) => (
                <div key={rec.id || i} className="px-3.5 py-1.5 bg-white border border-teal-200 rounded-xl text-xs flex items-center gap-2 shadow-2xs">
                  <span className="text-stone-400 text-[11px] font-mono">{rec.date}</span>
                  <span className="font-black text-stone-900">{rec.weightKg} kg</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md font-black">Logged</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* (Health Overview 3-cards and Recorded Meals Scanned Food Logs have been removed per specifications) */}

      {/* ─── MONTHLY CLINICAL PROGRESS CHARTS (WEIGHT, INCHES & VITALS) ─── */}
      <div className="bg-white p-6 md:p-8 border-2 border-teal-200/80 rounded-3xl shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-stone-100 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
              <h2 className="text-lg font-serif font-bold text-stone-900">
                Monthly Parameters & Clinical Trajectory
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Monthly tracking of body weight, waist circumference & clinical vitals (BP, Fasting Sugar, HbA1c)
            </p>
          </div>

          <button
            onClick={() => setIsAddMonthlyModalOpen(true)}
            className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-teal-700" />
            + Record New Month
          </button>
        </div>

        {/* Chart 1: Monthly Weight (kg) & Inch Loss */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase font-black tracking-wider text-teal-900 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-600" />
              Monthly Weight (kg) & Waist Reduction Progression
            </h3>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Weight (kg)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Inch Loss (inches)
              </span>
            </div>
          </div>

          <div className="h-56 w-full min-w-0 overflow-hidden" style={{ width: '100%', height: 224, minHeight: 224, minWidth: 0 }}>
            {monthlyChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                <Activity className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-xs font-bold text-stone-700">No monthly biometric records logged yet</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Click "Log New Parameters" below to record your weight, inch loss, blood pressure, and sugar trends.</p>
              </div>
            ) : chartsMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                <LineChart data={monthlyChartData} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                  />
                  <YAxis 
                    yAxisId="weight"
                    domain={['auto', 'auto']}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#0d9488', fontSize: 11 }} 
                    unit="kg"
                  />
                  <YAxis 
                    yAxisId="inches"
                    orientation="right"
                    domain={[0, 'auto']}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#10b981', fontSize: 11 }} 
                    unit='"'
                  />
                  <Tooltip 
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '3 3' }} 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-md text-xs">
                            <p className="font-bold text-stone-900">{data.month} ({data.date})</p>
                            <div className="mt-1.5 space-y-1">
                              <p className="text-teal-700 font-bold">
                                Weight: <span className="font-mono">{data.weight} kg</span>
                              </p>
                              {data.waist && (
                                <p className="text-stone-600">
                                  Waist: <span className="font-mono">{data.waist} cm</span>
                                </p>
                              )}
                              <p className="text-emerald-700 font-bold">
                                Inch Loss: <span className="font-mono">{data.inchLoss}"</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    yAxisId="weight"
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#0d9488" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: '#0d9488' }}
                    activeDot={{ r: 6, fill: '#0f766e' }} 
                  />
                  <Line 
                    yAxisId="inches"
                    type="monotone" 
                    dataKey="inchLoss" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 5, fill: '#047857' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-stone-50 rounded-xl" />
            )}
          </div>
        </div>

        {/* Chart 2: Monthly Vitals & Biomarkers */}
        <div className="pt-6 border-t border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase font-black tracking-wider text-rose-900 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-600" />
              Monthly Blood Pressure (Systolic) & Fasting Sugar Trajectory
            </h3>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> BP Systolic (mmHg)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Fasting Sugar (mg/dL)
              </span>
            </div>
          </div>

          <div className="h-48 w-full min-w-0 overflow-hidden" style={{ width: '100%', height: 192, minHeight: 192, minWidth: 0 }}>
            {monthlyChartData.filter(d => d.systolic || d.fastingSugar || d.hba1c).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                <Heart className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-xs font-bold text-stone-700">No blood pressure or fasting sugar entries recorded yet</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Your clinical trajectory will chart here once you log health checks with your dietician.</p>
              </div>
            ) : chartsMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                <LineChart data={monthlyChartData} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                  />
                  <YAxis 
                    domain={[60, 160]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#e11d48', fontSize: 11 }} 
                  />
                  <Tooltip 
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '3 3' }} 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-md text-xs">
                            <p className="font-bold text-stone-900">{data.month} ({data.date})</p>
                            <div className="mt-1.5 space-y-1">
                              {data.systolic && (
                                <p className="text-rose-700 font-bold">
                                  BP: <span className="font-mono">{data.systolic}/{data.diastolic || 80} mmHg</span>
                                </p>
                              )}
                              {data.fastingSugar && (
                                <p className="text-amber-700 font-bold">
                                  Fasting Sugar: <span className="font-mono">{data.fastingSugar} mg/dL</span>
                                </p>
                              )}
                              {data.hba1c && (
                                <p className="text-purple-700 font-bold">
                                  HbA1c: <span className="font-mono">{data.hba1c}%</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="systolic" 
                    stroke="#f43f5e" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: '#f43f5e' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fastingSugar" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-stone-50 rounded-xl" />
            )}
          </div>
        </div>

        {/* Monthly Parameter Records Table */}
        {monthlyParams.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-100 overflow-x-auto">
            <h4 className="text-xs font-black text-stone-800 mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Recorded Monthly Parameter Logs
            </h4>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold">
                  <th className="pb-2">Month</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Waist / Inch Loss</th>
                  <th className="pb-2">BP (mmHg)</th>
                  <th className="pb-2">Sugar / HbA1c</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {monthlyParams.map((rec) => (
                  <tr key={rec.id} className="hover:bg-stone-50/80">
                    <td className="py-2.5 font-bold text-stone-900">{rec.month}</td>
                    <td className="py-2.5 font-mono text-stone-500">{rec.date}</td>
                    <td className="py-2.5 font-black text-teal-800">{rec.weightKg} kg</td>
                    <td className="py-2.5 text-stone-700">
                      {rec.waistCm ? `${rec.waistCm} cm` : '-'}{' '}
                      {rec.inchLoss ? <span className="text-emerald-700 font-bold">(-{rec.inchLoss}")</span> : ''}
                    </td>
                    <td className="py-2.5 text-stone-700">
                      {rec.bloodPressureSystolic ? `${rec.bloodPressureSystolic}/${rec.bloodPressureDiastolic || 80}` : '-'}
                    </td>
                    <td className="py-2.5 text-stone-700">
                      {rec.fastingSugar ? `${rec.fastingSugar} mg/dL` : ''}{' '}
                      {rec.hba1c ? <span className="text-purple-700 font-bold">({rec.hba1c}%)</span> : ''}
                    </td>
                    <td className="py-2.5 text-stone-500 max-w-xs truncate">{rec.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── RECORD MONTHLY PARAMETERS MODAL ─── */}
      {isAddMonthlyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-black text-stone-900">Record Monthly Parameters</h3>
                  <p className="text-xs text-stone-500">Track monthly weight, inch loss and clinical vitals</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMonthlyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMonthly} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={monthFormDate}
                    onChange={(e) => setMonthFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Body Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 66.5"
                    value={monthFormWeight}
                    onChange={(e) => setMonthFormWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Waist Circumference (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 78"
                    value={monthFormWaist}
                    onChange={(e) => setMonthFormWaist(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Cumulative Inch Loss (")</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2.0"
                    value={monthFormInchLoss}
                    onChange={(e) => setMonthFormInchLoss(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <span className="block text-[11px] font-black uppercase text-stone-500 tracking-wider">
                  Clinical Biomarkers & Vitals (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">BP Systolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={monthFormBpSys}
                      onChange={(e) => setMonthFormBpSys(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">BP Diastolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={monthFormBpDia}
                      onChange={(e) => setMonthFormBpDia(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Fasting Sugar (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 95"
                      value={monthFormSugar}
                      onChange={(e) => setMonthFormSugar(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">HbA1c (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 5.6"
                      value={monthFormHba1c}
                      onChange={(e) => setMonthFormHba1c(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Monthly Notes / Observations</label>
                <textarea
                  rows={2}
                  placeholder="Energy levels, adherence highlights, or doctor remarks..."
                  value={monthFormNotes}
                  onChange={(e) => setMonthFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddMonthlyModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMonthly || !monthFormWeight}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  {savingMonthly ? 'Saving...' : 'Save Monthly Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Profile & Health Details Modal */}
      {patientUid && isProfileModalOpen && (
        <PatientProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          patientId={patientUid}
        />
      )}
    </div>
  );
}
