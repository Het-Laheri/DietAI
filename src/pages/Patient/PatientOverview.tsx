import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMealPlans, getFoodLogs, getQueries, getPatientProfile, getPatientWeekPlan, getPatientChecklist, ChecklistMealItem, MealPlan, FoodLog, Query, PatientProfile, PatientWeekPlan } from '../../services/db';
import { isPatientSubscribed, getLocalSubscription } from '../../services/subscription';
import { 
  Home, 
  Utensils, 
  Camera, 
  Activity, 
  MessageCircle, 
  CheckCircle2, 
  Circle, 
  Droplet, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Flame, 
  ChevronRight,
  ClipboardList,
  Target,
  Scale
} from 'lucide-react';

export default function PatientOverview() {
  const { profile } = useAuth();
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [patientData, setPatientData] = useState<PatientProfile | null>(null);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistMealItem[]>([]);
  const [recentQuery, setRecentQuery] = useState<Query | null>(null);
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    if (typeof window === 'undefined') return 3;
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`nutrisnap_water_${profile?.uid}_${today}`);
    return saved ? parseInt(saved, 10) : 3;
  });
  const [weekPlan, setWeekPlan] = useState<PatientWeekPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const [subscribed, setSubscribed] = useState(() => isPatientSubscribed(profile));
  const isSubscribed = subscribed;
  const activeSub = getLocalSubscription(profile?.uid);

  useEffect(() => {
    setSubscribed(isPatientSubscribed(profile));
    const handleSubChange = () => setSubscribed(isPatientSubscribed(profile));
    window.addEventListener('nutrisnap:subscription_change', handleSubChange);
    return () => window.removeEventListener('nutrisnap:subscription_change', handleSubChange);
  }, [profile]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!profile) return;
      try {
        const [plans, logs, queries, pData, wp, checklist] = await Promise.all([
          getMealPlans(profile.uid),
          getFoodLogs(profile.uid, todayStr),
          getQueries(undefined, profile.uid),
          getPatientProfile(profile.uid),
          getPatientWeekPlan(profile.uid),
          getPatientChecklist(profile.uid, todayStr)
        ]);

        const published = plans.find(p => p.status === 'published');
        setActivePlan(published || null);
        setTodayLogs(logs);
        setPatientData(pData);
        setWeekPlan(wp);
        setChecklistItems(checklist || []);

        if (queries && queries.length > 0) {
          setRecentQuery(queries[0]);
        }
      } catch (err) {
        console.warn('Dashboard data fetch note:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();

    const handleChecklistUpdated = () => {
      if (profile) getPatientChecklist(profile.uid, todayStr).then(setChecklistItems);
    };
    const handleProfileUpdated = () => {
      if (profile) getPatientProfile(profile.uid).then(setPatientData);
    };
    window.addEventListener('nutrisnap:checklist_updated', handleChecklistUpdated);
    window.addEventListener('nutrisnap:profile_updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('nutrisnap:checklist_updated', handleChecklistUpdated);
      window.removeEventListener('nutrisnap:profile_updated', handleProfileUpdated);
    };
  }, [profile, todayStr]);

  const toggleWater = (index: number) => {
    const newCount = index + 1 === waterGlasses ? index : index + 1;
    setWaterGlasses(newCount);
    if (typeof window !== 'undefined' && profile?.uid) {
      localStorage.setItem(`nutrisnap_water_${profile.uid}_${todayStr}`, newCount.toString());
    }
  };

  const completedChecklist = checklistItems.filter(i => i.completed);
  const assignedCompleted = completedChecklist.filter(i => !i.isExtra && !i.mealType?.toLowerCase().includes('extra'));
  const extraCompleted = completedChecklist.filter(i => i.isExtra || i.mealType?.toLowerCase().includes('extra'));
  const assignedCalories = assignedCompleted.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const extraCalories = extraCompleted.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);

  const scannedLogs = todayLogs.filter(l => {
    if (l.source === 'quick_log' || l.isExtra || l.mealType?.toLowerCase().includes('extra')) {
      return false;
    }
    const cleanLogName = (l.description || l.items?.[0]?.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase();
    return !completedChecklist.some(c => (c.name || '').replace(/^Extra:\s*/i, '').trim().toLowerCase() === cleanLogName);
  });
  const scannedCals = scannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.calories) || 0), 0);
  const totalCalories = assignedCalories + extraCalories + scannedCals;

  // Prescribed / Assigned Meals planned for today
  const assignedPrescribed = checklistItems.filter(i => !i.isExtra && !i.mealType?.toLowerCase().includes('extra'));
  const plannedDailyCalories = assignedPrescribed.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const plannedDailyProtein = assignedPrescribed.reduce((sum, i) => sum + (Number(i.protein) || 0), 0);

  const targetCalories = plannedDailyCalories > 0 ? plannedDailyCalories : (activePlan?.targets?.calories || 2000);
  const targetProtein = plannedDailyProtein > 0 ? plannedDailyProtein : (activePlan?.targets?.protein || 90);
  const loggedProtein = completedChecklist.reduce((sum, i) => sum + (Number(i.protein) || 0), 0) + scannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.protein) || 0), 0);

  // Get checked items count
  const checkedItemsCount = completedChecklist.length;

  const totalAssignedMeals = (() => {
    const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = DAYS_OF_WEEK[new Date().getDay()];
    if (weekPlan && weekPlan.status === 'published' && weekPlan.entries && weekPlan.entries.length > 0) {
      const todaysEntries = weekPlan.entries.filter(e => e.day === todayDay);
      if (todaysEntries.length > 0) return todaysEntries.length;
    }
    if (activePlan && activePlan.status === 'published' && activePlan.days && activePlan.days.length > 0) {
      let dayIndex = 0;
      if (activePlan.startDate) {
        const start = new Date(activePlan.startDate).getTime();
        const now = new Date(todayStr).getTime();
        const diffDays = Math.max(0, Math.floor((now - start) / 86400000));
        dayIndex = Math.min(diffDays % activePlan.days.length, activePlan.days.length - 1);
      }
      return activePlan.days[dayIndex]?.meals?.length || activePlan.days[0]?.meals?.length || 0;
    }
    return 0;
  })();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-6 md:p-7 shadow-xs relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-md inline-block mb-2">
            {formattedDate}
          </span>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Welcome back, {profile?.name.split(' ')[0] || 'Patient'}
          </h1>
          <p className="text-stone-500 text-xs md:text-sm mt-1 max-w-xl">
            Your daily patient portal. Review your dietician's assigned meal checklist, log hydration, track weight progress, or consult your lead nutritionist.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {subscribed ? (
            <Link
              to="/patient/meals"
              className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white font-semibold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <ClipboardList className="w-3.5 h-3.5 text-orange-400" />
              Today's Meal Checklist
            </Link>
          ) : (
            <Link
              to="/patient/meals"
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              Unlock Today's Meals
            </Link>
          )}
        </div>
      </div>

      {/* Clinical Assessment & Weight Management Bar */}
      {patientData && (
        <div className="bg-white rounded-xl border border-stone-200/90 p-4 md:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200/60 text-orange-600 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                  Clinical Weight Management Plan
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200/60">
                  {patientData.weightManagement?.primaryGoal || patientData.goals?.[0] || 'Active Program'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1">
                <span>Current: <strong className="text-stone-900">{patientData.currentWeightKg || 68} kg</strong> (BMI {patientData.bmi || ((patientData.currentWeightKg || 68) / Math.pow((patientData.heightCm || 165)/100, 2)).toFixed(1)})</span>
                <span>•</span>
                <span>Target: <strong className="text-orange-600">{patientData.targetWeightKg || 60} kg</strong></span>
                <span>•</span>
                <span>Broca IBW: <strong className="text-emerald-700">~{patientData.idealBodyWeightKg || (patientData.gender === 'Male' ? (patientData.heightCm || 170) - 100 : (patientData.heightCm || 165) - 105)} kg</strong></span>
                {patientData.weightManagement?.targetPace && (
                  <>
                    <span>•</span>
                    <span className="text-stone-500 font-medium">Pace: {patientData.weightManagement.targetPace}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {patientData.weightManagement?.specificFocus && patientData.weightManagement.specificFocus.length > 0 && (
            <div className="flex flex-wrap gap-1.5 self-center">
              {patientData.weightManagement.specificFocus.slice(0, 3).map((f, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid of Key Actions & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. Today's Meals Notepad Checklist Card */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          {!subscribed && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-amber-700" />
              PRO
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200/60 text-orange-600 flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              {subscribed ? (
                totalAssignedMeals > 0 ? (
                  <span className="text-xs font-semibold text-stone-500">
                    {checkedItemsCount} of {totalAssignedMeals} Completed
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Awaiting Plan
                  </span>
                )
              ) : (
                <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            <h3 className="font-serif font-bold text-stone-900 text-sm mb-1">Dietician's Meal Checklist</h3>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              {subscribed 
                ? (totalAssignedMeals > 0 
                    ? "Interactive meal notepad. Check off each prescribed meal as you eat throughout the day."
                    : "Your dietician is preparing your clinical meal plan strictly from approved practice recipes.")
                : "Unlock your personalized dietician meal plan, meal checklists, and clinical recipes."}
            </p>

            {/* Mini Progress Bar */}
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${subscribed ? (totalAssignedMeals > 0 ? 'bg-orange-500' : 'bg-amber-300') : 'bg-stone-300'}`}
                style={{ width: subscribed ? (totalAssignedMeals > 0 ? `${Math.min(100, (checkedItemsCount / totalAssignedMeals) * 100)}%` : '0%') : '20%' }}
              />
            </div>
          </div>

          {subscribed ? (
            <Link
              to={totalAssignedMeals > 0 ? "/patient/meals" : "/patient/inbox"}
              className="w-full py-2 px-3 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs rounded-lg border border-stone-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              {totalAssignedMeals > 0 ? "Open Meal Checklist" : "Ask Dietician for Plan"}
              <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
            </Link>
          ) : (
            <Link
              to="/patient/meals"
              className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Unlock Today's Meals
            </Link>
          )}
        </div>

        {/* 2. Interactive Water Tracker Card */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200/60 text-sky-600 flex items-center justify-center">
                <Droplet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-sky-700">
                {waterGlasses * 250}ml / 2000ml
              </span>
            </div>

            <h3 className="font-serif font-bold text-stone-900 text-sm mb-1">Daily Hydration</h3>
            <p className="text-xs text-stone-500 mb-4">
              Click glasses to record your fluid intake:
            </p>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleWater(i)}
                  className={`h-8 rounded-lg flex items-center justify-center border transition-all text-xs font-semibold ${
                    i < waterGlasses
                      ? 'bg-sky-500 border-sky-600 text-white shadow-2xs'
                      : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-sky-50 hover:border-sky-300'
                  }`}
                  title={`Glass ${i + 1} (250ml)`}
                >
                  <Droplet className={`w-3.5 h-3.5 ${i < waterGlasses ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-stone-400 font-medium text-center">
            {waterGlasses >= 8 ? '🎉 Daily hydration target reached!' : `${8 - waterGlasses} more glasses to target`}
          </div>
        </div>

        {/* 3. Lead Dietician Clinical Consultation */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-9 h-9 rounded-lg bg-pink-50 border border-pink-200/60 text-pink-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Direct Care
              </span>
            </div>

            <h3 className="font-serif font-bold text-stone-900 text-sm mb-1">Ask Dietician</h3>
            <p className="text-xs text-stone-500 mb-3">
              Need to swap ingredients or have a question? Consult your lead dietician anytime.
            </p>

            {recentQuery ? (
              <div className="bg-stone-50 rounded-lg p-3 border border-stone-200/70 mb-4 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-700 truncate max-w-[150px]">
                    "{recentQuery.question}"
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    recentQuery.status === 'answered'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                      : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                  }`}>
                    {recentQuery.status === 'answered' ? 'Answered' : 'Pending'}
                  </span>
                </div>
                {recentQuery.reply && (
                  <p className="text-stone-600 line-clamp-2 italic text-[11px] mt-1">
                    "{recentQuery.reply}"
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-stone-50 rounded-lg p-3 border border-stone-200/70 mb-4 text-xs text-stone-400 text-center">
                No active questions. Feel free to reach out!
              </div>
            )}
          </div>

          <Link
            to="/patient/inbox"
            className="w-full py-2 px-3 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs rounded-lg border border-stone-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            Open Consultation Inbox
            <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
          </Link>
        </div>

      </div>

      {/* AI Food Scanner Feature Highlight */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 md:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Camera className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif font-bold text-stone-900 text-sm md:text-base">
                AI Multimodal Food Scanner
              </h3>
              {isSubscribed ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Unlocked
                </span>
              ) : (
                <span className="bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Premium
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 max-w-xl leading-relaxed">
              Snap a photo of any meal or grocery item to instantly detect ingredients, portion sizes, calories, macros, and clinical health scores.
            </p>
          </div>
        </div>

        <Link
          to="/patient/scanner"
          className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white font-semibold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
        >
          {isSubscribed ? 'Open AI Scanner' : 'Explore Scanner & Plans'}
          <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
        </Link>
      </div>
    </div>
  );
}
