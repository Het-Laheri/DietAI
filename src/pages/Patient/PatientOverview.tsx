import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMealPlans, getFoodLogs, getQueries, getPatientProfile, getPatientWeekPlan, MealPlan, FoodLog, Query, PatientProfile, PatientWeekPlan } from '../../services/db';
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
        const [plans, logs, queries, pData, wp] = await Promise.all([
          getMealPlans(profile.uid),
          getFoodLogs(profile.uid, todayStr),
          getQueries(undefined, profile.uid),
          getPatientProfile(profile.uid),
          getPatientWeekPlan(profile.uid)
        ]);

        const published = plans.find(p => p.status === 'published');
        setActivePlan(published || null);
        setTodayLogs(logs);
        setPatientData(pData);
        setWeekPlan(wp);

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
  }, [profile, todayStr]);

  const toggleWater = (index: number) => {
    const newCount = index + 1 === waterGlasses ? index : index + 1;
    setWaterGlasses(newCount);
    if (typeof window !== 'undefined' && profile?.uid) {
      localStorage.setItem(`nutrisnap_water_${profile.uid}_${todayStr}`, newCount.toString());
    }
  };

  const totalCalories = todayLogs.reduce((sum, l) => sum + (l.nutrition?.calories || 0), 0);
  const targetCalories = activePlan?.targets?.calories || 2000;
  const targetProtein = activePlan?.targets?.protein || 100;
  const loggedProtein = todayLogs.reduce((sum, l) => sum + (l.nutrition?.protein || 0), 0);

  // Get checked items count from localStorage
  const checkedItemsCount = (() => {
    if (typeof window === 'undefined' || !profile?.uid) return 0;
    try {
      const raw = localStorage.getItem(`nutrisnap_meals_checklist_${profile.uid}_${todayStr}`);
      if (!raw) return 0;
      const checkedMap = JSON.parse(raw);
      return Object.values(checkedMap).filter(Boolean).length;
    } catch {
      return 0;
    }
  })();

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
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-500 via-orange-600 to-pink-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-black text-orange-100 bg-white/15 px-3 py-1 rounded-full inline-block mb-3">
            {formattedDate}
          </span>
          <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight">
            Welcome back, {profile?.name.split(' ')[0] || 'Patient'}! 👋
          </h1>
          <p className="text-orange-100 text-sm mt-1 max-w-xl">
            Your daily health portal. Check your assigned meal checklist, log water, track progress, or chat with your dietician.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {subscribed ? (
            <Link
              to="/patient/meals"
              className="px-5 py-3 bg-white text-orange-600 hover:bg-orange-50 font-black rounded-xl text-xs md:text-sm shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <ClipboardList className="w-4 h-4" />
              Today's Meal Checklist
            </Link>
          ) : (
            <Link
              to="/patient/meals"
              className="px-5 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-stone-950 font-black rounded-xl text-xs md:text-sm shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Lock className="w-4 h-4" />
              Unlock Today's Meals
            </Link>
          )}
        </div>
      </div>

      {/* Clinical Assessment & Weight Management Bar */}
      {patientData && (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">
                  Clinical Weight Management Plan
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
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
                <span key={i} className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid of Key Actions & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Today's Meals Notepad Checklist Card */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          {!subscribed && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-700" />
              PRO
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                <Utensils className="w-5 h-5" />
              </div>
              {subscribed ? (
                totalAssignedMeals > 0 ? (
                  <span className="text-xs font-bold text-stone-500">
                    {checkedItemsCount} of {totalAssignedMeals} Completed
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Awaiting Plan
                  </span>
                )
              ) : (
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            <h3 className="font-bold text-stone-900 text-base mb-1">Dietician's Meal Checklist</h3>
            <p className="text-xs text-stone-500 mb-4">
              {subscribed 
                ? (totalAssignedMeals > 0 
                    ? "Your daily meals formatted like an interactive notepad. Check off each item as you eat."
                    : "Your dietician is preparing your clinical meal plan strictly from approved recipes.")
                : "Unlock your personalized dietician meal plan, meal checklists, and clinical recipes."}
            </p>

            {/* Mini Progress Bar */}
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${subscribed ? (totalAssignedMeals > 0 ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-amber-300') : 'bg-stone-300'}`}
                style={{ width: subscribed ? (totalAssignedMeals > 0 ? `${Math.min(100, (checkedItemsCount / totalAssignedMeals) * 100)}%` : '0%') : '20%' }}
              />
            </div>
          </div>

          {subscribed ? (
            <Link
              to={totalAssignedMeals > 0 ? "/patient/meals" : "/patient/inbox"}
              className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {totalAssignedMeals > 0 ? "Open Meal Notepad" : "Ask Dietician for Plan"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/patient/meals"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Unlock Today's Meals
            </Link>
          )}
        </div>

        {/* 2. Interactive Water Tracker Card */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-inner">
                <Droplet className="w-5 h-5" />
              </div>
              <span className="text-xs font-extrabold text-sky-600">
                {waterGlasses * 250}ml / 2000ml
              </span>
            </div>

            <h3 className="font-bold text-stone-900 text-base mb-1">Daily Hydration</h3>
            <p className="text-xs text-stone-500 mb-4">
              Click glasses to track your water intake today:
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleWater(i)}
                  className={`h-9 rounded-xl flex items-center justify-center border transition-all text-xs font-bold ${
                    i < waterGlasses
                      ? 'bg-sky-500 border-sky-600 text-white shadow-sm scale-105'
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
            {waterGlasses >= 8 ? '🎉 Hydration target reached!' : `${8 - waterGlasses} more glasses to reach daily target`}
          </div>
        </div>

        {/* 3. Lead Dietician Clinical Consultation */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-inner">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Direct Care
              </span>
            </div>

            <h3 className="font-bold text-stone-900 text-base mb-1">Ask Dietician</h3>
            <p className="text-xs text-stone-500 mb-3">
              Need to swap ingredients or have a digestion question? Consult your lead dietician anytime.
            </p>

            {recentQuery ? (
              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 mb-4 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-700 truncate max-w-[150px]">
                    "{recentQuery.question}"
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    recentQuery.status === 'answered'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
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
              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 mb-4 text-xs text-stone-400 text-center">
                No active questions. Feel free to reach out!
              </div>
            )}
          </div>

          <Link
            to="/patient/inbox"
            className="w-full py-2.5 px-4 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Open Consultation Inbox
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* AI Food Scanner Feature Highlight / Paywall Link */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-stone-900 text-base md:text-lg">
                AI Multimodal Food Scanner
              </h3>
              {isSubscribed ? (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Unlocked
                </span>
              ) : (
                <span className="bg-stone-100 text-stone-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Premium
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-stone-500 max-w-xl leading-relaxed">
              Snap a photo of any meal or grocery item to instantly detect ingredients, portion sizes, calories, macros, and clinical health scores.
            </p>
          </div>
        </div>

        <Link
          to="/patient/scanner"
          className={`px-6 py-3.5 rounded-xl font-bold text-xs md:text-sm shadow-md transition-all flex items-center gap-2 whitespace-nowrap ${
            isSubscribed
              ? 'bg-stone-900 hover:bg-black text-white'
              : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:brightness-110 text-white shadow-orange-500/20'
          }`}
        >
          {isSubscribed ? 'Open AI Scanner' : 'Explore Scanner & Plans'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
