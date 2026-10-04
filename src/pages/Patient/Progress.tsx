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
  Camera, 
  ChevronRight,
  Dna,
  Wheat,
  Droplet,
  Clock,
  Check,
  Scale,
  Edit3,
  TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PatientProfileModal from '../../components/PatientProfileModal';

export default function Progress() {
  const { profile } = useAuth();
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [, setWeekPlan] = useState<PatientWeekPlan | null>(null);
  const [todayChecklist, setTodayChecklist] = useState<ChecklistMealItem[]>([]);
  const [eatingLogs, setEatingLogs] = useState<PatientEatingLogEntry[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile?.uid) return;

    let isMounted = true;

    async function loadData() {
      try {
        const [pData, plansData, wpData, checklistData, allLogs, progData] = await Promise.all([
          getPatientProfile(profile!.uid),
          getMealPlans(profile!.uid),
          getPatientWeekPlan(profile!.uid),
          getPatientChecklist(profile!.uid, todayStr),
          getAllPatientEatingLogs(profile!.uid),
          getProgressRecords(profile!.uid)
        ]);

        if (!isMounted) return;

        setPatientProfile(pData);
        const activePlan = plansData.find(p => p.status === 'published') || plansData[0] || null;
        setMealPlan(activePlan);
        setWeekPlan(wpData);
        setTodayChecklist(checklistData || []);
        setEatingLogs(allLogs || []);
        setProgressRecords(progData || []);
      } catch (err) {
        console.warn('Progress load data note:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    // 1. Real-time Firestore listener for today's checklist doc (instant checkmark & extra food updates)
    const checklistRef = doc(db, 'food_logs', `checklist_${profile.uid}_${todayStr}`);
    const unsubChecklist = onSnapshot(checklistRef, (docSnap) => {
      if (docSnap.exists()) {
        const raw = docSnap.data().items;
        const items = (Array.isArray(raw) ? raw : Object.values(raw || {})) as ChecklistMealItem[];
        setTodayChecklist(items);
        getAllPatientEatingLogs(profile.uid).then(logs => {
          if (isMounted) setEatingLogs(logs);
        });
      }
    }, (err) => {
      console.warn('Real-time checklist listener note:', err);
    });

    // 2. Real-time patient profile listener (instant weight, goals, BMI updates)
    const profileRef = doc(db, 'patient_profiles', profile.uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists() && isMounted) {
        setPatientProfile(docSnap.data() as PatientProfile);
      }
    }, (err) => {
      console.warn('Real-time profile listener note:', err);
    });

    // 3. Real-time progress records listener (instant weigh-in log sync)
    const progQuery = query(collection(db, 'progress_records'), where('patientId', '==', profile.uid));
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
      getPatientChecklist(profile.uid, todayStr).then(items => {
        if (isMounted) setTodayChecklist(items);
      });
      getAllPatientEatingLogs(profile.uid).then(logs => {
        if (isMounted) setEatingLogs(logs);
      });
    };

    const handleProfileUpdated = () => {
      getPatientProfile(profile.uid).then(p => {
        if (isMounted && p) setPatientProfile(p);
      });
    };

    const handleProgUpdated = () => {
      getProgressRecords(profile.uid).then(records => {
        if (isMounted) setProgressRecords(records);
      });
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
  }, [profile, todayStr]);

  if (loading) {
    return <div className="p-8 max-w-4xl mx-auto text-stone-500 font-medium">Loading your nutrition progress profile...</div>;
  }

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

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-black text-stone-900 tracking-tight">Your Nutrition & Goal Progress</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs shadow-orange-500/20">
              Day {timeline.totalDays} of Care Plan
            </span>
            <span className="text-stone-600 text-xs font-medium">
              Enrolled {timeline.startDateFormatted} • Chronological Daily Analytics
            </span>
          </div>
        </div>
        <Link 
          to="/patient/scanner"
          className="px-5 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white text-xs uppercase font-black tracking-wider rounded-xl transition-all inline-flex items-center gap-2 shrink-0 shadow-lg shadow-purple-500/25 hover:scale-102 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-purple-200" />
          Scan Meal
        </Link>
      </div>

      {/* ─── TODAY'S CALORIE & MACRO INTAKE TRACKER ───────────────────────── */}
      <div className="bg-gradient-to-br from-white via-orange-50/15 to-amber-50/20 border-2 border-orange-200/90 rounded-3xl p-6 md:p-8 mb-8 shadow-xl shadow-orange-500/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-orange-100 gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-black px-3 py-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full shadow-2xs inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Today's Live Intake Target
            </span>
            <h2 className="text-xl md:text-2xl font-serif font-black text-stone-900 mt-2">Daily Calorie Consumption Goal</h2>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              {totalItemsConsumedToday} {totalItemsConsumedToday === 1 ? 'meal' : 'meals'} logged today ({todayStr})
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-white px-6 py-3.5 rounded-2xl text-right shadow-lg shadow-orange-500/25">
            <div className="text-2xl md:text-3xl font-black text-white font-mono flex items-baseline justify-end gap-1">
              {todayCalories} <span className="text-xs font-semibold text-rose-100 font-sans">/ {targetCalories} kcal</span>
            </div>
            <p className="text-[11px] text-amber-100 mt-0.5 font-bold">
              {remainingCalories > 0 
                ? `${remainingCalories} kcal remaining today` 
                : isOverTarget 
                  ? `Goal achieved (+${todayCalories - targetCalories} kcal extra) 🎉` 
                  : 'Target reached for today! 🎉'}
            </p>
          </div>
        </div>

        {/* Calorie Dual-Segment Progress Bar */}
        <div className="my-6">
          <div className="flex justify-between text-xs font-black mb-2">
            <span className="text-stone-700">Daily Calorie Goal Adherence</span>
            <span className={todayCalories > targetCalories ? 'text-amber-800' : 'text-emerald-700 font-mono text-sm'}>
              {caloriePct}%
            </span>
          </div>

          <div className="w-full bg-stone-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-stone-200 flex shadow-inner">
            {/* Prescribed meals portion (emerald-teal) */}
            <div 
              className={`bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-l-full transition-all duration-500 shadow-xs ${
                extraProgressPercent === 0 && assignedProgressPercent >= 100 ? 'rounded-r-full' : ''
              }`}
              style={{ width: `${assignedProgressPercent}%` }}
              title={`Prescribed Meals: ${assignedCalories} kcal`}
            />
            {/* Extra food portion (amber-orange) */}
            {extraProgressPercent > 0 && (
              <div 
                className={`bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-500 ${
                  assignedProgressPercent === 0 ? 'rounded-l-full' : ''
                } ${(assignedProgressPercent + extraProgressPercent) >= 100 ? 'rounded-r-full' : ''}`}
                style={{ width: `${extraProgressPercent}%` }}
                title={`Extra Food & Scans: ${extraCalories + scanCalories} kcal`}
              />
            )}
          </div>

          {/* Bar legend tags */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 mt-2.5 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shadow-xs" />
                Prescribed: <strong className="text-stone-900">{assignedCalories} kcal</strong>
              </span>
              {(extraCalories + scanCalories) > 0 && (
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs" />
                  Extra Food: <strong className="text-stone-900">{extraCalories + scanCalories} kcal</strong>
                </span>
              )}
            </div>
            <span className="font-black text-stone-800">
              {targetCalories} kcal (Target)
              {isOverTarget && ` • ${todayCalories} kcal total`}
            </span>
          </div>
        </div>

        {/* Today's Macronutrient Breakdown vs Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Protein */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-emerald-900 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Dna className="w-4 h-4 text-emerald-600" /> Protein
              </span>
              <span className="text-xs font-mono text-emerald-950 font-black">{todayProtein}g / {targetProtein}g</span>
            </div>
            <div className="w-full bg-emerald-200/70 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 shadow-xs" 
                style={{ width: `${Math.min(Math.round((todayProtein / targetProtein) * 100), 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-amber-900 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Wheat className="w-4 h-4 text-amber-600" /> Carbs
              </span>
              <span className="text-xs font-mono text-amber-950 font-black">{todayCarbs}g / {targetCarbs}g</span>
            </div>
            <div className="w-full bg-amber-200/70 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full transition-all duration-500 shadow-xs" 
                style={{ width: `${Math.min(Math.round((todayCarbs / targetCarbs) * 100), 100)}%` }}
              />
            </div>
          </div>

          {/* Fats */}
          <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-rose-900 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-rose-600" /> Fats
              </span>
              <span className="text-xs font-mono text-rose-950 font-black">{todayFat}g / {targetFat}g</span>
            </div>
            <div className="w-full bg-rose-200/70 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-gradient-to-r from-rose-500 to-pink-600 h-full rounded-full transition-all duration-500 shadow-xs" 
                style={{ width: `${Math.min(Math.round((todayFat / targetFat) * 100), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── ACTIVE CLINICAL GOALS BADGES ─────────────────────────────────── */}
      <div className="bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/15 border-2 border-purple-200/80 rounded-3xl p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-wider font-black text-purple-950 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-purple-700" />
            </div>
            Active Health & Clinical Goals
          </h2>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="text-xs font-black text-purple-700 hover:text-purple-900 uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Goals
          </button>
        </div>
        {patientProfile?.goals && patientProfile.goals.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {patientProfile.goals.map((goal, idx) => {
              const pillColors = [
                'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950 border-emerald-300',
                'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-950 border-purple-300',
                'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-950 border-sky-300',
                'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 border-amber-300',
                'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-950 border-rose-300'
              ];
              const colorClass = pillColors[idx % pillColors.length];
              return (
                <span key={idx} className={`px-3.5 py-1.5 border-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-2xs ${colorClass}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {goal}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-stone-600 bg-white/80 p-4 border border-purple-100 rounded-2xl font-medium">
            Primary Goal: <span className="font-black text-purple-950">General Clinical Nutrition & Health Optimization</span>
          </div>
        )}
      </div>

      {/* ─── ANTHROPOMETRICS & CLINICAL WEIGHT MANAGEMENT CARD ───────────── */}
      <div className="bg-gradient-to-br from-white via-teal-50/15 to-emerald-50/15 border-2 border-teal-200/80 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-teal-100 mb-5">
          <div>
            <h2 className="text-sm uppercase tracking-wider font-black text-teal-950 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center">
                <Scale className="w-3.5 h-3.5 text-teal-700" />
              </div>
              Anthropometrics & Weight Progress
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
            Alter Metrics / Log Weight
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-center">
          <div className="p-4 bg-white/80 border-2 border-teal-100 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-teal-700 uppercase font-black tracking-wider">Current Weight</span>
            <span className="text-2xl font-black font-serif text-stone-900 mt-0.5 block">{patientProfile?.currentWeightKg || 68} kg</span>
            <span className="block text-[11px] text-stone-500 font-medium mt-0.5">Height: {patientProfile?.heightCm || 165} cm</span>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-300 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-emerald-800 uppercase font-black tracking-wider">Target Goal</span>
            <span className="text-2xl font-black font-serif text-emerald-700 mt-0.5 block">{patientProfile?.targetWeightKg || 60} kg</span>
            <span className="block text-[11px] text-emerald-800 font-bold mt-0.5">
              {Number(patientProfile?.currentWeightKg || 68) > Number(patientProfile?.targetWeightKg || 60)
                ? `${(Number(patientProfile?.currentWeightKg || 68) - Number(patientProfile?.targetWeightKg || 60)).toFixed(1)} kg to lose`
                : 'Target Reached! 🎉'}
            </span>
          </div>

          <div className="p-4 bg-white/80 border-2 border-teal-100 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-teal-700 uppercase font-black tracking-wider">Clinical BMI</span>
            <span className="text-2xl font-black font-serif text-stone-900 mt-0.5 block">{patientProfile?.bmi || 25.0}</span>
            <span className="block text-[11px] text-stone-600 font-medium mt-0.5">{patientProfile?.bmiClassification || 'Overweight (25 - 29.9)'}</span>
          </div>

          <div className="p-4 bg-white/80 border-2 border-teal-100 rounded-2xl shadow-2xs">
            <span className="block text-[10px] text-teal-700 uppercase font-black tracking-wider">Broca Ideal Weight</span>
            <span className="text-2xl font-black font-serif text-stone-900 mt-0.5 block">~{patientProfile?.idealBodyWeightKg || 60} kg</span>
            <span className="block text-[11px] text-stone-500 font-medium mt-0.5">Broca Protocol</span>
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

      {/* ─── HEALTH OVERVIEW CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 p-6 rounded-3xl border-2 border-amber-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-black text-amber-900">Program Consistency</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-serif font-black text-stone-900">{timeline.consistencyPercentage}%</p>
          <p className="text-xs text-stone-600 mt-1 font-medium">
            {timeline.loggedDaysCount > 0 
              ? `Logged ${timeline.loggedDaysCount} of ${timeline.totalDays} ${timeline.totalDays === 1 ? 'day' : 'days'} on program` 
              : 'No logs recorded yet'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white via-sky-50/20 to-blue-50/30 p-6 rounded-3xl border-2 border-sky-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-black text-sky-900">Program Duration</span>
            <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <p className="text-3xl font-serif font-black text-stone-900">Day {timeline.totalDays}</p>
          <p className="text-xs text-stone-600 mt-1 font-medium">
            Enrolled {timeline.startDateFormatted}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white via-rose-50/20 to-pink-50/30 p-6 rounded-3xl border-2 border-rose-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-black text-rose-900">Total Logged Meals</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <p className="text-3xl font-serif font-black text-stone-900">{totalMealsLogged}</p>
          <p className="text-xs text-stone-600 mt-1 font-medium">
            {uniqueLoggedDates.length} unique recording {uniqueLoggedDates.length === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      {/* ─── LOGGED MEALS TIMELINE & PLATE BREAKDOWN ──────────────────────── */}
      <div className="bg-white border-2 border-orange-200/80 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-orange-100 mb-5">
          <div>
            <h2 className="text-lg md:text-xl font-serif font-black text-stone-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                <Utensils className="w-4 h-4 text-orange-600" />
              </div>
              Recorded Meals & Scanned Food Logs
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Complete history of meals completed in your Daily Notepad and Food Scanner
            </p>
          </div>
          <Link 
            to="/patient/scanner"
            className="text-xs font-black text-orange-600 hover:text-orange-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            + Scan New <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {allCompletedItems.length === 0 ? (
          <div className="py-12 px-4 border-2 border-dashed border-orange-200 rounded-2xl text-center bg-orange-50/20">
            <Link
              to="/patient/scanner"
              title="Open AI Food Scanner"
              className="w-16 h-16 rounded-2xl bg-orange-100 hover:bg-orange-200 flex items-center justify-center mx-auto mb-3 transition-transform hover:scale-110 active:scale-95 cursor-pointer group shadow-xs"
            >
              <Camera className="w-8 h-8 text-orange-500 group-hover:scale-105 transition-transform" />
            </Link>
            <h3 className="text-base font-black text-stone-900 mb-1">No Food Logs Recorded Yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6 font-medium">
              Check off meals in your Today's Meals plan or click the camera icon above to scan a picture.
            </p>
            <Link 
              to="/patient/meals"
              className="px-6 py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white text-xs uppercase font-black tracking-wider rounded-xl transition-all inline-flex items-center gap-2 shadow-md shadow-orange-500/25"
            >
              <Utensils className="w-4 h-4" /> Go to Today's Meals
            </Link>
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-orange-100/70">
            {allCompletedItems.map((log) => {
              const isExtra = log.isExtra || log.type === 'extra';
              const isScanned = log.type === 'scanned';
              const dayInfo = timeline.days.find(d => d.date === log.date);

              return (
                <div key={log.id} className="pt-4 first:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      {/* Thumbnail or Icon */}
                      {log.imageUrl ? (
                        <div className="w-14 h-14 bg-stone-100 border-2 border-orange-200 overflow-hidden shrink-0 rounded-2xl shadow-2xs">
                          <img src={log.imageUrl} alt="Meal" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 border-2 flex items-center justify-center shrink-0 rounded-2xl shadow-2xs ${
                          isExtra 
                            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-amber-700' 
                            : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700'
                        }`}>
                          <Utensils className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-800 text-[10px] font-black uppercase tracking-wider rounded-md">
                            {log.mealType || 'Meal'}
                          </span>

                          {isExtra ? (
                            <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-2xs">
                              Extra Food
                            </span>
                          ) : isScanned ? (
                            <span className="px-2.5 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-2xs flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-200" /> AI Scan
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-2xs flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Prescribed Meal
                            </span>
                          )}

                          <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {dayInfo ? <strong className="text-orange-700 font-black">Day {dayInfo.dayNumber} • </strong> : null}
                            {log.completedAt || log.date}
                          </span>
                        </div>

                        <h4 className="font-black text-stone-900 text-sm tracking-tight">{log.name}</h4>

                        {log.portion && (
                          <p className="text-xs text-stone-500 mt-0.5 font-medium">
                            Portion: <strong className="text-stone-800 font-bold">{log.portion}</strong>
                          </p>
                        )}

                        {log.notes && (
                          <p className="text-xs text-stone-700 bg-orange-50/50 p-2.5 border border-orange-200/80 rounded-xl mt-2 font-medium">
                            <strong className="text-orange-950 font-black">Note:</strong> "{log.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Nutrition pills */}
                    <div className="text-right shrink-0">
                      <span className={`px-3.5 py-1.5 font-black text-xs rounded-xl inline-block font-mono shadow-xs ${
                        isExtra 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                          : 'bg-stone-900 text-white'
                      }`}>
                        {log.calories} kcal
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1.5 justify-end font-medium">
                        <span className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-900 border border-emerald-200/60">P: <strong className="font-bold">{log.protein || 0}g</strong></span>
                        <span className="bg-amber-50 px-1.5 py-0.5 rounded text-amber-900 border border-amber-200/60">C: <strong className="font-bold">{log.carbs || 0}g</strong></span>
                        <span className="bg-rose-50 px-1.5 py-0.5 rounded text-rose-900 border border-rose-200/60">F: <strong className="font-bold">{log.fat || 0}g</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── CHRONOLOGICAL DAILY ADHERENCE TREND CHART ────────────────────── */}
      <div className="bg-white p-6 md:p-8 border-2 border-orange-200/80 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900 mb-0.5">
              Daily Nutrition Adherence (Day 1 – Day {timeline.totalDays})
            </h2>
            <p className="text-xs text-stone-500">
              Chronological daily adherence calculated across your {timeline.totalDays} {timeline.totalDays === 1 ? 'day' : 'days'} on the program (Started {timeline.startDateFormatted})
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-stone-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#46655a]" /> Daily Adherence (%)
            </span>
            <span className="px-2.5 py-1 bg-stone-100 rounded-md font-mono text-stone-800">
              Avg: {timeline.overallAdherence}%
            </span>
          </div>
        </div>
        
        {timeline.loggedDaysCount > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                <Line 
                  type="monotone" 
                  dataKey="adherence" 
                  stroke="#46655a" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#46655a' }}
                  activeDot={{ r: 7, fill: '#f97316' }} 
                />
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  unit="%"
                />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-md text-xs">
                          <p className="font-bold text-stone-900">{data.day} • {data.shortDate}</p>
                          <p className="text-[11px] text-stone-400 mb-1.5">{data.fullDate}</p>
                          <div className="space-y-1">
                            <p className="text-brand-800 font-bold">
                              Adherence: <span className="font-mono">{data.adherence}%</span>
                            </p>
                            <p className="text-stone-600">
                              Intake: <span className="font-mono font-bold text-stone-800">{data.calories}</span> / {data.targetCalories} kcal
                            </p>
                            <p className="text-stone-500">
                              Meals Logged: <strong className="text-stone-700">{data.mealsLogged}</strong>
                            </p>
                          </div>
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
          <div className="py-12 text-center text-stone-400 text-xs">
            Start checking off meals in your Notepad to see your daily adherence curve across your {timeline.totalDays} {timeline.totalDays === 1 ? 'day' : 'days'}.
          </div>
        )}
      </div>

      {/* Patient Profile & Health Details Modal */}
      {profile?.uid && (
        <PatientProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          patientId={profile.uid}
        />
      )}
    </div>
  );
}
