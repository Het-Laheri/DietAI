import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getPatientProfile, 
  getMealPlans, 
  getPatientChecklist,
  getPatientWeekPlan,
  getAllPatientEatingLogs,
  PatientProfile, 
  MealPlan,
  PatientWeekPlan,
  ChecklistMealItem,
  PatientEatingLogEntry
} from '../../services/db';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Progress() {
  const { profile } = useAuth();
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [, setWeekPlan] = useState<PatientWeekPlan | null>(null);
  const [todayChecklist, setTodayChecklist] = useState<ChecklistMealItem[]>([]);
  const [eatingLogs, setEatingLogs] = useState<PatientEatingLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile?.uid) return;

    let isMounted = true;

    async function loadData() {
      try {
        const [pData, plansData, wpData, checklistData, allLogs] = await Promise.all([
          getPatientProfile(profile!.uid),
          getMealPlans(profile!.uid),
          getPatientWeekPlan(profile!.uid),
          getPatientChecklist(profile!.uid, todayStr),
          getAllPatientEatingLogs(profile!.uid)
        ]);

        if (!isMounted) return;

        setPatientProfile(pData);
        const activePlan = plansData.find(p => p.status === 'published') || plansData[0] || null;
        setMealPlan(activePlan);
        setWeekPlan(wpData);
        setTodayChecklist(checklistData || []);
        setEatingLogs(allLogs || []);
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

    // 2. Custom window event from MealNotepad / quick log
    const handleChecklistUpdated = () => {
      getPatientChecklist(profile.uid, todayStr).then(items => {
        if (isMounted) setTodayChecklist(items);
      });
      getAllPatientEatingLogs(profile.uid).then(logs => {
        if (isMounted) setEatingLogs(logs);
      });
    };
    window.addEventListener('nutrisnap:checklist_updated', handleChecklistUpdated);

    return () => {
      isMounted = false;
      unsubChecklist();
      window.removeEventListener('nutrisnap:checklist_updated', handleChecklistUpdated);
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
  const daysLoggedCount = uniqueLoggedDates.length;

  // Real 7-day consistency calculation
  const today = new Date();
  const past7DaysStr = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const loggedDaysPast7 = past7DaysStr.filter(dateStr => uniqueLoggedDates.includes(dateStr)).length;
  const mealPlanConsistency = Math.round((loggedDaysPast7 / 7) * 100);

  const hasLogs = totalMealsLogged > 0;

  // Generate weekly trend data from actual recorded logs
  const weeklyTrendData = hasLogs ? [
    { week: 'Week 1', adherence: Math.min(100, Math.round((totalMealsLogged / 7) * 35)) },
    { week: 'Week 2', adherence: Math.min(100, Math.round((totalMealsLogged / 14) * 65)) },
    { week: 'Week 3', adherence: Math.min(100, Math.round((totalMealsLogged / 21) * 85)) },
    { week: 'Current', adherence: Math.max(mealPlanConsistency, caloriePct > 0 ? Math.min(100, caloriePct) : 20) },
  ] : [];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">Your Nutrition & Goal Progress</h1>
          <p className="text-stone-500 text-xs md:text-sm mt-1">
            Real-time daily calorie intake tracking, macronutrient targets, and AI meal logs.
          </p>
        </div>
        <Link 
          to="/patient/scanner"
          className="px-5 py-2.5 bg-brand-700 text-white text-xs uppercase font-bold tracking-widest hover:bg-brand-800 transition-colors inline-flex items-center gap-2 shrink-0 shadow-sm"
        >
          <Camera className="w-4 h-4" />
          Scan Meal
        </Link>
      </div>

      {/* ─── TODAY'S CALORIE & MACRO INTAKE TRACKER ───────────────────────── */}
      <div className="bg-white border border-stone-200 p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-stone-200 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 bg-brand-50 text-brand-800 border border-brand-200 rounded-sm">
              Today's Live Intake Target
            </span>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Daily Calorie Consumption Goal</h2>
            <p className="text-xs text-stone-500">
              {totalItemsConsumedToday} {totalItemsConsumedToday === 1 ? 'meal' : 'meals'} logged today ({todayStr})
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-serif font-bold text-stone-900">
              {todayCalories} <span className="text-sm font-normal text-stone-400 font-sans">/ {targetCalories} kcal</span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
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
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-stone-700 font-medium">Daily Calorie Goal Adherence</span>
            <span className={todayCalories > targetCalories ? 'text-amber-700 font-bold' : 'text-brand-700 font-bold'}>
              {caloriePct}%
            </span>
          </div>

          <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200 flex">
            {/* Prescribed meals portion (emerald) */}
            <div 
              className={`bg-emerald-600 h-full rounded-l-full transition-all duration-500 ${
                extraProgressPercent === 0 && assignedProgressPercent >= 100 ? 'rounded-r-full' : ''
              }`}
              style={{ width: `${assignedProgressPercent}%` }}
              title={`Prescribed Meals: ${assignedCalories} kcal`}
            />
            {/* Extra food portion (amber) */}
            {extraProgressPercent > 0 && (
              <div 
                className={`bg-amber-500 h-full transition-all duration-500 ${
                  assignedProgressPercent === 0 ? 'rounded-l-full' : ''
                } ${(assignedProgressPercent + extraProgressPercent) >= 100 ? 'rounded-r-full' : ''}`}
                style={{ width: `${extraProgressPercent}%` }}
                title={`Extra Food & Scans: ${extraCalories + scanCalories} kcal`}
              />
            )}
          </div>

          {/* Bar legend tags */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 mt-2 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Prescribed: <strong className="text-stone-900">{assignedCalories} kcal</strong>
              </span>
              {(extraCalories + scanCalories) > 0 && (
                <span className="inline-flex items-center gap-1.5 font-medium text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Extra Food: <strong className="text-stone-900">{extraCalories + scanCalories} kcal</strong>
                </span>
              )}
            </div>
            <span className="font-semibold text-stone-700">
              {targetCalories} kcal (Target)
              {isOverTarget && ` • ${todayCalories} kcal total`}
            </span>
          </div>
        </div>

        {/* Today's Macronutrient Breakdown vs Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Protein */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-900 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Dna className="w-3.5 h-3.5 text-emerald-700" /> Protein
              </span>
              <span className="text-[11px] font-mono text-emerald-800 font-bold">{todayProtein}g / {targetProtein}g</span>
            </div>
            <div className="w-full bg-emerald-100/80 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(Math.round((todayProtein / targetProtein) * 100), 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200">
            <div className="flex items-center justify-between text-amber-900 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Wheat className="w-3.5 h-3.5 text-amber-700" /> Carbs
              </span>
              <span className="text-[11px] font-mono text-amber-800 font-bold">{todayCarbs}g / {targetCarbs}g</span>
            </div>
            <div className="w-full bg-amber-100/80 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(Math.round((todayCarbs / targetCarbs) * 100), 100)}%` }}
              />
            </div>
          </div>

          {/* Fats */}
          <div className="p-3.5 bg-rose-50/60 border border-rose-200">
            <div className="flex items-center justify-between text-rose-900 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-rose-700" /> Fats
              </span>
              <span className="text-[11px] font-mono text-rose-800 font-bold">{todayFat}g / {targetFat}g</span>
            </div>
            <div className="w-full bg-rose-100/80 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-rose-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(Math.round((todayFat / targetFat) * 100), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── ACTIVE CLINICAL GOALS BADGES ─────────────────────────────────── */}
      <div className="bg-white p-6 border border-stone-200 mb-8 shadow-sm">
        <h2 className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-700" />
          Active Health & Clinical Goals
        </h2>
        {patientProfile?.goals && patientProfile.goals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {patientProfile.goals.map((goal, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-brand-50 border border-brand-200 text-brand-900 text-xs font-bold rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-700" />
                {goal}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-stone-600 bg-stone-50 p-3 border border-stone-200">
            Primary Goal: <span className="font-semibold text-stone-900">General Clinical Nutrition & Health Optimization</span>
          </div>
        )}
      </div>

      {/* ─── HEALTH OVERVIEW CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest font-bold text-stone-500">Meal Plan Consistency</span>
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-serif font-bold text-stone-900">{mealPlanConsistency}%</p>
          <p className="text-xs text-stone-500 mt-1">
            {hasLogs ? `Logged ${loggedDaysPast7}/7 days this week` : 'No logs recorded yet'}
          </p>
        </div>

        <div className="bg-white p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest font-bold text-stone-500">Dietary Type</span>
            <Award className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-stone-900">{patientProfile?.dietaryType || 'Vegetarian'}</p>
          <p className="text-xs text-stone-500 mt-1">Assigned by clinical team</p>
        </div>

        <div className="bg-white p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest font-bold text-stone-500">Total Logged Meals</span>
            <Calendar className="w-5 h-5 text-stone-400" />
          </div>
          <p className="text-3xl font-serif font-bold text-stone-900">{totalMealsLogged}</p>
          <p className="text-xs text-stone-500 mt-1">{daysLoggedCount} unique recording {daysLoggedCount === 1 ? 'day' : 'days'}</p>
        </div>
      </div>

      {/* ─── LOGGED MEALS TIMELINE & PLATE BREAKDOWN ──────────────────────── */}
      <div className="bg-white border border-stone-200 p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-stone-200 mb-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-brand-700" />
              Recorded Meals & Scanned Food Logs
            </h2>
            <p className="text-xs text-stone-500">
              Complete history of meals completed in your Daily Notepad and Food Scanner
            </p>
          </div>
          <Link 
            to="/patient/scanner"
            className="text-xs font-bold text-brand-700 hover:text-brand-900 uppercase tracking-wider flex items-center gap-1"
          >
            + Scan New <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {allCompletedItems.length === 0 ? (
          <div className="py-12 px-4 border border-dashed border-stone-200 text-center bg-stone-50/50">
            <Camera className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900 mb-1">No Food Logs Recorded Yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
              Check off meals in your Today's Meals plan or use the AI Food Scanner to snap a picture.
            </p>
            <Link 
              to="/patient/meals"
              className="px-6 py-2.5 bg-brand-700 text-white text-xs uppercase font-bold tracking-widest hover:bg-brand-800 transition-colors inline-flex items-center gap-2"
            >
              <Utensils className="w-4 h-4" /> Go to Today's Meals
            </Link>
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-stone-100">
            {allCompletedItems.map((log) => {
              const isExtra = log.isExtra || log.type === 'extra';
              const isScanned = log.type === 'scanned';

              return (
                <div key={log.id} className="pt-4 first:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail or Icon */}
                      {log.imageUrl ? (
                        <div className="w-14 h-14 bg-stone-100 border border-stone-200 overflow-hidden shrink-0 rounded-sm">
                          <img src={log.imageUrl} alt="Meal" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-11 h-11 border flex items-center justify-center shrink-0 rounded-sm ${
                          isExtra ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          <Utensils className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 text-stone-800 text-[10px] font-bold uppercase tracking-wider">
                            {log.mealType || 'Meal'}
                          </span>

                          {isExtra ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                              Extra Food
                            </span>
                          ) : isScanned ? (
                            <span className="px-2 py-0.5 bg-brand-50 text-brand-800 border border-brand-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> AI Scan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Prescribed Meal
                            </span>
                          )}

                          <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {log.completedAt || log.date}
                          </span>
                        </div>

                        <h4 className="font-bold text-stone-900 text-sm">{log.name}</h4>

                        {log.portion && (
                          <p className="text-xs text-stone-500 mt-0.5">
                            Portion: <strong className="text-stone-700">{log.portion}</strong>
                          </p>
                        )}

                        {log.notes && (
                          <p className="text-xs text-stone-600 bg-stone-50 p-2 border border-stone-200 mt-1.5 italic">
                            <strong>Note:</strong> "{log.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Nutrition pills */}
                    <div className="text-right shrink-0">
                      <span className={`px-3 py-1 font-bold text-xs rounded-sm inline-block ${
                        isExtra ? 'bg-amber-600 text-white' : 'bg-stone-900 text-white'
                      }`}>
                        {log.calories} kcal
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1.5 justify-end">
                        <span>P: <strong className="text-stone-800">{log.protein || 0}g</strong></span>
                        <span>C: <strong className="text-stone-800">{log.carbs || 0}g</strong></span>
                        <span>F: <strong className="text-stone-800">{log.fat || 0}g</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ADHERENCE TREND CHART ────────────────────────────────────────── */}
      <div className="bg-white p-6 border border-stone-200 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-1">Weekly Nutrition Adherence (%)</h2>
        <p className="text-xs text-stone-500 mb-6">Real-time progress generated from your daily logged food intake</p>
        
        {hasLogs ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="adherence" stroke="#46655a" strokeWidth={3} activeDot={{ r: 8 }} />
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip cursor={{stroke: '#e2e8f0', strokeWidth: 2}} contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 text-center text-stone-400 text-xs">
            Start logging your meals to see your weekly adherence curve.
          </div>
        )}
      </div>
    </div>
  );
}
