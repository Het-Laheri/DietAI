import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getMealPlans, 
  getFoodLogs, 
  getQueries, 
  getPatientProfile, 
  getPatientWeekPlan, 
  getPatientChecklist, 
  getOrBuildPatientTodayChecklist,
  savePatientChecklist,
  createNotification,
  calculatePatientProgramTimeline, 
  ChecklistMealItem, 
  MealPlan, 
  FoodLog, 
  Query, 
  PatientProfile, 
  PatientWeekPlan 
} from '../../services/db';
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
  ChevronLeft,
  ClipboardList,
  Target,
  Scale,
  Dumbbell,
  Heart,
  Play,
  Pause,
  Plus,
  Check
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

  const isLocalUpdating = React.useRef(false);

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
          getOrBuildPatientTodayChecklist(profile.uid, todayStr)
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
      if (isLocalUpdating.current) {
        isLocalUpdating.current = false;
        return;
      }
      if (profile) {
        getOrBuildPatientTodayChecklist(profile.uid, todayStr, patientData || profile).then(items => {
          setChecklistItems(items || []);
        });
      }
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
  // Prescribed / Assigned Meals planned for today
  const assignedPrescribed = checklistItems.filter(i => !i.isExtra && !i.mealType?.toLowerCase().includes('extra'));
  const plannedDailyCalories = assignedPrescribed.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const plannedDailyProtein = assignedPrescribed.reduce((sum, i) => sum + (Number(i.protein) || 0), 0);
  const plannedDailyCarbs = assignedPrescribed.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0);
  const plannedDailyFat = assignedPrescribed.reduce((sum, i) => sum + (Number(i.fat) || 0), 0);

  const targetCalories = plannedDailyCalories > 0 ? plannedDailyCalories : (activePlan?.targets?.calories || 2000);
  const targetProtein = plannedDailyProtein > 0 ? plannedDailyProtein : (activePlan?.targets?.protein || 90);
  const targetCarbs = plannedDailyCarbs > 0 ? plannedDailyCarbs : (activePlan?.targets?.carbs || 180);
  const targetFat = plannedDailyFat > 0 ? plannedDailyFat : (activePlan?.targets?.fat || 55);

  const loggedProtein = completedChecklist.reduce((sum, i) => sum + (Number(i.protein) || 0), 0) + scannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.protein) || 0), 0);
  const loggedCarbs = completedChecklist.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0) + scannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.carbs) || 0), 0);
  const loggedFat = completedChecklist.reduce((sum, i) => sum + (Number(i.fat) || 0), 0) + scannedLogs.reduce((sum, l) => sum + (Number(l.nutrition?.fat) || 0), 0);

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
    return checklistItems.filter(i => !i.isExtra).length || 4;
  })();

  // Next up meal
  const nextMeal = React.useMemo(() => {
    if (!checklistItems || checklistItems.length === 0) return null;
    const uncompleted = checklistItems.filter(i => !i.completed);
    return uncompleted.length > 0 ? uncompleted[0] : null;
  }, [checklistItems]);

  // Toggle meal completion directly from dashboard
  const handleToggleMeal = async (id: string) => {
    isLocalUpdating.current = true;
    const updated = checklistItems.map(item => {
      if (item.id === id) {
        const nextState = !item.completed;
        return {
          ...item,
          completed: nextState,
          completedAt: nextState
            ? new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : undefined
        };
      }
      return item;
    });

    setChecklistItems(updated);

    // Save states to localStorage for instant UI updates & cross-component sync
    const storageKey1 = `nutrisnap_meals_checklist_${profile?.uid || 'guest'}_${todayStr}`;
    const storageKey2 = `nutrisnap_checklist_states_${profile?.uid || 'guest'}_${todayStr}`;
    const stateMap: Record<string, { completed: boolean; completedAt?: string }> = {};
    updated.forEach(it => {
      stateMap[it.id] = { completed: it.completed, completedAt: it.completedAt };
    });
    try {
      localStorage.setItem(storageKey1, JSON.stringify(stateMap));
      localStorage.setItem(storageKey2, JSON.stringify(stateMap));
    } catch (e) {
      console.warn('Could not cache checklist locally:', e);
    }

    if (profile) {
      try {
        await savePatientChecklist(profile.uid, todayStr, updated);
        window.dispatchEvent(new CustomEvent('nutrisnap:checklist_updated'));

        const targetItem = updated.find(it => it.id === id);
        if (targetItem && targetItem.completed) {
          createNotification({
            recipientRole: 'dietician',
            type: 'MEAL_LOGGED',
            title: 'Meal Completed',
            patientId: profile.uid,
            patientName: profile.name || 'Patient',
            message: `${profile.name || 'Patient'} completed ${targetItem.mealType}: ${targetItem.name}.`,
            link: `/dietician/patients/${profile.uid}`,
            read: false
          }).catch(console.warn);
        }
      } catch (err) {
        console.warn('Failed to update checklist item:', err);
      }
    }
  };

  // Pastel & Vibrant Carousel Definition
  const carouselSlides = [
    {
      id: 'meals',
      label: 'Meals Protocol',
      tabName: 'Meals',
      icon: Utensils,
      current: checkedItemsCount,
      total: totalAssignedMeals,
      unit: 'meals logged',
      percent: Math.min(100, Math.round((checkedItemsCount / totalAssignedMeals) * 100)),
      gradient: 'from-emerald-50 via-teal-50/70 to-emerald-100/90 border border-emerald-200/90',
      ringColor: '#10b981',
      ringTrack: 'rgba(16, 185, 129, 0.16)',
      titleColor: 'text-emerald-950',
      subColor: 'text-emerald-800/90',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      activeTabBg: 'bg-emerald-600 text-white shadow-emerald-600/20',
      title: `${checkedItemsCount} of ${totalAssignedMeals} meals done`,
      subtitle: nextMeal 
        ? `Next up: ${nextMeal.mealType} — ${nextMeal.name}` 
        : (checkedItemsCount >= totalAssignedMeals && totalAssignedMeals > 0
          ? 'All scheduled meals completed! Exceptional clinical discipline today.'
          : 'Ready to stay consistent with your dietician meal plan today.'),
      ctaText: 'Open Meal Checklist',
      ctaLink: '/patient/meals'
    },
    {
      id: 'calories',
      label: 'Caloric Balance',
      tabName: 'Calories',
      icon: Flame,
      current: totalCalories,
      total: targetCalories,
      unit: 'kcal eaten',
      percent: Math.min(100, Math.round((totalCalories / targetCalories) * 100)),
      gradient: 'from-orange-50 via-amber-50/70 to-rose-100/90 border border-orange-200/90',
      ringColor: '#f97316',
      ringTrack: 'rgba(249, 115, 22, 0.16)',
      titleColor: 'text-stone-900',
      subColor: 'text-stone-700',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
      btnBg: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20',
      activeTabBg: 'bg-orange-600 text-white shadow-orange-600/20',
      title: `${totalCalories.toLocaleString()} of ${targetCalories.toLocaleString()} kcal`,
      subtitle: targetCalories > totalCalories 
        ? `${(targetCalories - totalCalories).toLocaleString()} kcal remaining for dinner & wholesome nourishment.` 
        : 'Daily caloric target fulfilled! Great energy balance today.',
      ctaText: 'Scan Food / Plate',
      ctaLink: '/patient/scanner'
    },
    {
      id: 'protein',
      label: 'Daily Protein',
      tabName: 'Protein',
      icon: Dumbbell,
      current: Math.round(loggedProtein),
      total: targetProtein,
      unit: 'g Protein',
      percent: Math.min(100, Math.round((loggedProtein / targetProtein) * 100)),
      gradient: 'from-purple-50 via-indigo-50/70 to-violet-100/90 border border-purple-200/90',
      ringColor: '#8b5cf6',
      ringTrack: 'rgba(139, 92, 246, 0.16)',
      titleColor: 'text-purple-950',
      subColor: 'text-purple-850',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      btnBg: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20',
      activeTabBg: 'bg-purple-600 text-white shadow-purple-600/20',
      title: `${Math.round(loggedProtein)}g of ${targetProtein}g Protein`,
      subtitle: targetProtein > loggedProtein
        ? `${Math.max(0, targetProtein - Math.round(loggedProtein))}g needed • Essential for cellular repair, lean muscle & satiety.`
        : 'Protein target hit! Optimal satiety and muscle maintenance.',
      ctaText: 'High-Protein Recipes',
      ctaLink: '/patient/meals'
    },
    {
      id: 'carbs',
      label: 'Daily Carbs',
      tabName: 'Carbs',
      icon: Wheat,
      current: Math.round(loggedCarbs),
      total: targetCarbs,
      unit: 'g Carbs',
      percent: Math.min(100, Math.round((loggedCarbs / targetCarbs) * 100)),
      gradient: 'from-amber-50 via-yellow-50/70 to-orange-100/90 border border-amber-200/90',
      ringColor: '#f59e0b',
      ringTrack: 'rgba(245, 158, 11, 0.16)',
      titleColor: 'text-amber-950',
      subColor: 'text-amber-850',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
      activeTabBg: 'bg-amber-600 text-white shadow-amber-600/20',
      title: `${Math.round(loggedCarbs)}g of ${targetCarbs}g Carbs`,
      subtitle: targetCarbs > loggedCarbs
        ? `${Math.max(0, targetCarbs - Math.round(loggedCarbs))}g remaining • Low-GI complex carbs fuel brain & sustained physical energy.`
        : 'Carbohydrate daily target achieved smoothly.',
      ctaText: 'View Complex Carbs',
      ctaLink: '/patient/meals'
    },
    {
      id: 'fats',
      label: 'Healthy Fats',
      tabName: 'Fats',
      icon: Heart,
      current: Math.round(loggedFat),
      total: targetFat,
      unit: 'g Fats',
      percent: Math.min(100, Math.round((loggedFat / targetFat) * 100)),
      gradient: 'from-rose-50 via-pink-50/70 to-fuchsia-100/90 border border-rose-200/90',
      ringColor: '#ec4899',
      ringTrack: 'rgba(236, 72, 153, 0.16)',
      titleColor: 'text-rose-950',
      subColor: 'text-rose-850',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
      activeTabBg: 'bg-rose-600 text-white shadow-rose-600/20',
      title: `${Math.round(loggedFat)}g of ${targetFat}g Fats`,
      subtitle: targetFat > loggedFat
        ? `${Math.max(0, targetFat - Math.round(loggedFat))}g remaining • Essential fatty acids for hormones, joints & cellular health.`
        : 'Healthy lipid target satisfied today.',
      ctaText: 'Explore Healthy Fats',
      ctaLink: '/patient/meals'
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % carouselSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, carouselSlides.length]);

  const currentSlide = carouselSlides[activeSlide];

  // SVG Ring calculation: Radius = 42, Circumference = 2 * PI * 42 ~= 263.89
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeOffset = ringCircumference - (ringCircumference * Math.min(100, Math.max(0, currentSlide.percent))) / 100;

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
            Welcome back, {profile?.name ? profile.name.split(' ')[0] : 'Patient'} 👋
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

      {/* 2. Interactive Circular Progress Meter Carousel - Pastel & Vibrant */}
      <div 
        className={`relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-md transition-all duration-700 bg-gradient-to-br ${currentSlide.gradient}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
      >
        {/* Soft pastel ambient lighting glow */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/40 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header of the Carousel: Badge + Auto-play indicator + Navigation Arrows */}
        <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md inline-flex items-center gap-1.5 shadow-2xs ${currentSlide.badgeBg}`}>
              <currentSlide.icon className="w-3.5 h-3.5" />
              {currentSlide.label}
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-stone-200/60 shadow-2xs">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="hover:text-stone-900 transition-colors flex items-center gap-1 cursor-pointer"
                title={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
              >
                {isPaused ? <Play className="w-3 h-3 text-amber-600" /> : <Pause className="w-3 h-3 text-emerald-600" />}
                <span>{isPaused ? 'Paused' : 'Auto-rotating'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSlide(prev => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white active:scale-95 border border-stone-200/80 flex items-center justify-center text-stone-700 transition-all backdrop-blur-md shadow-xs cursor-pointer"
              title="Previous metric"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-stone-600 min-w-[36px] text-center">
              {activeSlide + 1} / {carouselSlides.length}
            </span>
            <button
              onClick={() => setActiveSlide(prev => (prev + 1) % carouselSlides.length)}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white active:scale-95 border border-stone-200/80 flex items-center justify-center text-stone-700 transition-all backdrop-blur-md shadow-xs cursor-pointer"
              title="Next metric"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Body: Left Circular Meter + Right Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          
          {/* Circular Progress Ring */}
          <div className="md:col-span-4 flex items-center justify-center">
            <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  stroke={currentSlide.ringTrack}
                  strokeWidth="8.5"
                  fill="transparent"
                />
                {/* Active Colored Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  stroke={currentSlide.ringColor}
                  strokeWidth="8.5"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <span className={`text-3xl md:text-4xl font-serif font-black tracking-tight ${currentSlide.titleColor}`}>
                  {currentSlide.percent}%
                </span>
                <span className="text-[10px] md:text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-0.5">
                  {currentSlide.current} / {currentSlide.total}
                </span>
              </div>
            </div>
          </div>

          {/* Right Text and CTA */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-3">
            <h2 className={`text-2xl md:text-3xl font-serif font-black tracking-tight ${currentSlide.titleColor} leading-tight`}>
              {currentSlide.title}
            </h2>
            <p className={`text-xs md:text-sm ${currentSlide.subColor} font-medium leading-relaxed max-w-xl`}>
              {currentSlide.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={currentSlide.ctaLink}
                className={`px-5 py-2.5 ${currentSlide.btnBg} active:scale-95 font-extrabold rounded-xl text-xs md:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer`}
              >
                <span>{currentSlide.ctaText}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Carousel Category Tabs / Navigation Pills */}
        <div className="mt-8 pt-5 border-t border-stone-200/60 relative z-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {carouselSlides.map((slide, index) => {
              const isActive = index === activeSlide;
              const SlideIcon = slide.icon;
              return (
                <button
                  key={slide.id}
                  onClick={() => {
                    setActiveSlide(index);
                    setIsPaused(true);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? `${slide.activeTabBg} shadow-md scale-102 font-black`
                      : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200/80 shadow-2xs'
                  }`}
                >
                  <SlideIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-600'}`} />
                  <span>{slide.tabName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {slide.percent}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2.5 Today's Prescribed Meals Quick Checklist (Full Width) */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-5 md:p-7 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-stone-900 text-base md:text-lg">Today's Meals Checklist</h3>
                <p className="text-[11px] md:text-xs text-stone-500 font-medium">One-tap completion for today's prescribed nutrition schedule</p>
              </div>
            </div>
            <span className="text-xs font-black text-orange-700 bg-orange-50 border border-orange-200/80 px-3 py-1 rounded-full">
              {checkedItemsCount} of {totalAssignedMeals} Eaten
            </span>
          </div>

          {/* Checklist Meal Rows */}
          <div className="space-y-2.5 mt-3">
            {checklistItems.length > 0 ? (
              checklistItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleToggleMeal(item.id)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                    item.completed
                      ? 'bg-emerald-50/70 border-emerald-200/80'
                      : 'bg-stone-50/70 hover:bg-white hover:border-orange-300 border-stone-200/70'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMeal(item.id);
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        item.completed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border-2 border-stone-300 group-hover:border-orange-400 bg-white'
                      }`}
                    >
                      {item.completed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          item.completed 
                            ? 'bg-emerald-200/70 text-emerald-800' 
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {item.mealType}
                        </span>
                        <span className={`text-xs md:text-sm font-bold truncate ${
                          item.completed ? 'text-stone-500 line-through' : 'text-stone-900'
                        }`}>
                          {item.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.portion || '1 serving'}
                        {item.completedAt && (
                          <span className="ml-1.5 text-emerald-700 font-semibold">• Done at {item.completedAt}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-stone-400 shrink-0 font-medium">
                    {item.completed ? '✓ Logged' : 'Tap to complete'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-500 text-xs md:text-sm">
                Your personalized clinical meal schedule will appear here once published by your dietician.
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 mt-5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] text-stone-500 font-medium">
            Real-time synchronization with your lead dietician's clinical station
          </span>
          <Link
            to="/patient/meals"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>View full meal notepad & clinical recipes</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
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
          <Link
            to="/patient/scanner"
            title="Open AI Food Scanner"
            className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-amber-300 flex items-center justify-center shrink-0 shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer group"
          >
            <Camera className="w-6 h-6 text-amber-300 group-hover:text-white transition-colors" />
          </Link>
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
