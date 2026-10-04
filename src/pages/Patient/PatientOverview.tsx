import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMealPlans, getFoodLogs, getQueries, getPatientProfile, getPatientWeekPlan, getPatientChecklist, calculatePatientProgramTimeline, ChecklistMealItem, MealPlan, FoodLog, Query, PatientProfile, PatientWeekPlan } from '../../services/db';
import { isPatientSubscribed, getLocalSubscription } from '../../services/subscription';
import YogaPoseCard from '../../components/YogaPoseCard';
import { 
  Home, 
  Utensils, 
  Camera, 
  Activity, 
  MessageCircle, 
  CheckCircle2, 
  Circle, 
  Wheat, 
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
  const plannedDailyCarbs = assignedPrescribed.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0);

  const targetCalories = plannedDailyCalories > 0 ? plannedDailyCalories : (activePlan?.targets?.calories || 2000);
  const targetProtein = plannedDailyProtein > 0 ? plannedDailyProtein : (activePlan?.targets?.protein || 90);
  const targetCarbs = plannedDailyCarbs > 0 ? plannedDailyCarbs : (activePlan?.targets?.carbs || 180);

  const loggedProtein = completedChecklist.reduce((sum, i) => sum + (Number(i.protein) || 0), 0) + scannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.protein) || 0), 0);
  const loggedCarbs = completedChecklist.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0) + scannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.carbs) || 0), 0);

  // Get checked items count
  const checkedItemsCount = completedChecklist.length;

  // Chronological program timeline
  const timeline = calculatePatientProgramTimeline(patientData || profile, activePlan);

  const totalAssignedMeals = (() => {
    const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = DAYS_OF_WEEK[new Date().getDay()];
    if (weekPlan && weekPlan.status === 'published' && weekPlan.entries && weekPlan.entries.length > 0) {
      const todaysEntries = weekPlan.entries.filter(e => e.day === todayDay);
      if (todaysEntries.length > 0) return todaysEntries.length;
    }
    if (activePlan && activePlan.status === 'published' && activePlan.days && activePlan.days.length > 0) {
      const dayIndex = (timeline.totalDays - 1) % activePlan.days.length;
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
      {/* 1. Top Vibrant Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 rounded-3xl p-6 md:p-8 shadow-xl shadow-orange-500/20 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Ambient decorative glowing shapes */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-400/20 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="text-[11px] font-bold text-white/95 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 inline-flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {formattedDate}
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 bg-amber-950/30 backdrop-blur-md px-3 py-1 rounded-full border border-amber-300/30 inline-block shadow-2xs">
              Day {timeline.totalDays} of Care Plan
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-white drop-shadow-xs">
            Welcome back, {profile?.name.split(' ')[0] || 'Patient'} 👋
          </h1>
          <p className="text-orange-50/95 text-xs md:text-sm mt-1.5 max-w-xl font-medium leading-relaxed">
            Your personalized nutrition & wellness command center. Check off prescribed meals, practice daily yoga poses, review macro targets, or consult your lead dietician.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          {subscribed ? (
            <Link
              to="/patient/meals"
              className="px-5 py-3 bg-white hover:bg-orange-50 text-orange-600 font-extrabold rounded-xl text-xs md:text-sm shadow-lg shadow-black/10 hover:scale-102 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-orange-500" />
              Today's Meal Checklist
            </Link>
          ) : (
            <Link
              to="/patient/meals"
              className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-amber-950 font-extrabold rounded-xl text-xs md:text-sm shadow-lg shadow-black/10 hover:scale-102 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Lock className="w-4 h-4 text-amber-800" />
              Unlock Today's Meals
            </Link>
          )}
        </div>
      </div>

      {/* 2. Today's Vibrant Nutrition & Macro Ring Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Calories Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-200/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Calories</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-950">{totalCalories}</span>
            <span className="text-xs text-amber-700 font-semibold">/ {targetCalories} kcal</span>
          </div>
          <div className="w-full bg-amber-100/70 h-2 rounded-full overflow-hidden mt-2.5">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((totalCalories / targetCalories) * 100))}%` }}
            />
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border border-emerald-200/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Protein Target</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
              P
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-950">{Math.round(loggedProtein)}</span>
            <span className="text-xs text-emerald-700 font-semibold">/ {targetProtein} g</span>
          </div>
          <div className="w-full bg-emerald-100/70 h-2 rounded-full overflow-hidden mt-2.5">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((loggedProtein / targetProtein) * 100))}%` }}
            />
          </div>
        </div>

        {/* Meals Eaten Card */}
        <div className="bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-white border border-rose-200/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Meals Eaten</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-950">{checkedItemsCount}</span>
            <span className="text-xs text-rose-700 font-semibold">/ {totalAssignedMeals || 4} logged</span>
          </div>
          <div className="w-full bg-rose-100/70 h-2 rounded-full overflow-hidden mt-2.5">
            <div 
              className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((checkedItemsCount / (totalAssignedMeals || 4)) * 100))}%` }}
            />
          </div>
        </div>

        {/* Carbohydrates Target Card */}
        <div className="bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-white border border-sky-200/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-sky-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Carbs Target</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sky-950">{Math.round(loggedCarbs)}</span>
            <span className="text-xs text-sky-700 font-semibold">/ {targetCarbs} g</span>
          </div>
          <div className="w-full bg-sky-100/70 h-2 rounded-full overflow-hidden mt-2.5">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((loggedCarbs / targetCarbs) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Clinical Assessment & Weight Management Bar */}
      {patientData && (
        <div className="bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/60 rounded-2xl border border-emerald-200/80 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500">
                  Clinical Weight Management Plan
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-2xs">
                  {patientData.weightManagement?.primaryGoal || patientData.goals?.[0] || 'Active Program'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-700 mt-1 font-medium">
                <span>Current: <strong className="text-stone-900 font-bold">{patientData.currentWeightKg || 68} kg</strong> (BMI {patientData.bmi || ((patientData.currentWeightKg || 68) / Math.pow((patientData.heightCm || 165)/100, 2)).toFixed(1)})</span>
                <span>•</span>
                <span>Target: <strong className="text-orange-600 font-bold">{patientData.targetWeightKg || 60} kg</strong></span>
                <span>•</span>
                <span>Broca IBW: <strong className="text-emerald-700 font-bold">~{patientData.idealBodyWeightKg || (patientData.gender === 'Male' ? (patientData.heightCm || 170) - 100 : (patientData.heightCm || 165) - 105)} kg</strong></span>
                {patientData.weightManagement?.targetPace && (
                  <>
                    <span>•</span>
                    <span className="text-stone-600 font-semibold bg-white/80 border border-stone-200 px-2 py-0.5 rounded-md text-[11px]">Pace: {patientData.weightManagement.targetPace}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {patientData.weightManagement?.specificFocus && patientData.weightManagement.specificFocus.length > 0 && (
            <div className="flex flex-wrap gap-1.5 self-center">
              {patientData.weightManagement.specificFocus.slice(0, 3).map((f, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-white text-emerald-800 text-[10px] font-bold border border-emerald-200 shadow-2xs">
                  ✓ {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Grid of 3 Main Feature Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Today's Meals Notepad Checklist Card */}
        <div className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 rounded-2xl border border-amber-200/90 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between relative overflow-hidden group">
          {!subscribed && (
            <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] flex items-center gap-1 shadow-xs">
              <Lock className="w-2.5 h-2.5 text-amber-950" />
              PRO
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
                <Utensils className="w-5 h-5" />
              </div>
              {subscribed ? (
                totalAssignedMeals > 0 ? (
                  <span className="text-xs font-bold text-orange-700 bg-orange-100/70 border border-orange-200 px-2.5 py-0.5 rounded-full">
                    {checkedItemsCount} of {totalAssignedMeals} Eaten
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Awaiting Plan
                  </span>
                )
              ) : (
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            <h3 className="font-serif font-black text-stone-900 text-base mb-1">Dietician's Meal Checklist</h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed font-medium">
              {subscribed 
                ? (totalAssignedMeals > 0 
                    ? "Interactive meal notepad. Check off each prescribed meal as you eat throughout the day."
                    : "Your dietician is preparing your clinical meal plan strictly from approved practice recipes.")
                : "Unlock your personalized dietician meal plan, meal checklists, and clinical recipes."}
            </p>

            {/* Vibrant Progress Bar */}
            <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${subscribed ? (totalAssignedMeals > 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-amber-300') : 'bg-stone-300'}`}
                style={{ width: subscribed ? (totalAssignedMeals > 0 ? `${Math.min(100, (checkedItemsCount / totalAssignedMeals) * 100)}%` : '0%') : '20%' }}
              />
            </div>
          </div>

          {subscribed ? (
            <Link
              to={totalAssignedMeals > 0 ? "/patient/meals" : "/patient/inbox"}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-101"
            >
              {totalAssignedMeals > 0 ? "Open Meal Checklist" : "Ask Dietician for Plan"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/patient/meals"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/25 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Unlock Today's Meals
            </Link>
          )}
        </div>

        {/* Card 2: Yoga Pose of the Day */}
        <YogaPoseCard date={todayStr} />

        {/* Card 3: Lead Dietician Clinical Consultation */}
        <div className="bg-gradient-to-br from-rose-50/60 via-white to-purple-50/40 rounded-2xl border border-rose-200/90 p-5 shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-400 via-pink-500 to-purple-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100/70 border border-purple-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Direct Care
              </span>
            </div>

            <h3 className="font-serif font-black text-stone-900 text-base mb-1">Ask Dietician</h3>
            <p className="text-xs text-stone-600 mb-3 font-medium">
              Need to swap ingredients or have a symptom? Consult your clinical dietician anytime.
            </p>

            {recentQuery ? (
              <div className="bg-white/90 rounded-xl p-3 border border-rose-200/70 mb-4 text-xs shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-stone-800 truncate max-w-[150px]">
                    "{recentQuery.question}"
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    recentQuery.status === 'answered'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {recentQuery.status === 'answered' ? '✓ Answered' : 'Pending'}
                  </span>
                </div>
                {recentQuery.reply && (
                  <p className="text-stone-600 line-clamp-2 italic text-[11px] mt-1 font-medium">
                    "{recentQuery.reply}"
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white/80 rounded-xl p-3 border border-rose-100 mb-4 text-xs text-stone-400 text-center font-medium">
                No active questions. Feel free to message your dietitian!
              </div>
            )}
          </div>

          <Link
            to="/patient/inbox"
            className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-101"
          >
            Open Consultation Inbox
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* 5. AI Food Scanner Feature Highlight Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-500/25 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Glow orb */}
        <div className="absolute top-0 right-1/4 w-60 h-60 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-amber-300 flex items-center justify-center shrink-0 shadow-md">
            <Camera className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif font-black text-white text-base md:text-lg">
                AI Multimodal Food & Label Scanner
              </h3>
              {isSubscribed ? (
                <span className="bg-emerald-400 text-emerald-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                  ★ Unlocked
                </span>
              ) : (
                <span className="bg-amber-400 text-amber-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Premium
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-purple-100 max-w-xl leading-relaxed font-medium">
              Snap a photo of your plate or Nutrition Facts food packaging. Multimodal AI instantly breaks down every ingredient, calories, macros, and clinical feedback.
            </p>
          </div>
        </div>

        <Link
          to="/patient/scanner"
          className="px-6 py-3.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 text-stone-950 font-black rounded-xl text-xs md:text-sm shadow-xl shadow-black/20 transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap self-start md:self-auto cursor-pointer relative z-10"
        >
          {isSubscribed ? 'Open AI Scanner' : 'Explore Scanner & Plans'}
          <ArrowRight className="w-4 h-4 text-stone-900" />
        </Link>
      </div>
    </div>
  );
}
