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
  TrendingDown,
  Dumbbell,
  Heart,
  ChevronLeft,
  Play,
  Pause,
  ArrowRight
} from 'lucide-react';
import React from 'react';
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

  // Carousel state
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);

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

  // Carousel auto-rotation timer (must be before any early returns to respect Rules of Hooks)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

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

    // Carousel definition for Today's Intake
  const totalAssignedMeals = assignedPrescribedItems.length;
  const checkedItemsCount = assignedCompleted.length;
  const nextMeal = todayChecklist.find(item => !item.completed && !item.isExtra);

  const carouselSlides = [
    {
      id: 'meals',
      label: 'Meals Protocol',
      tabName: 'Meals',
      icon: Utensils,
      current: checkedItemsCount,
      total: totalAssignedMeals,
      unit: 'meals logged',
      percent: Math.min(100, Math.round((assignedCompleted.length / Math.max(1, totalAssignedMeals)) * 100)),
      gradient: 'from-emerald-50 via-teal-50/70 to-emerald-100/90 border border-emerald-200/90',
      ringColor: '#10b981',
      ringTrack: 'rgba(16, 185, 129, 0.16)',
      titleColor: 'text-emerald-950',
      subColor: 'text-emerald-800/90',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      activeTabBg: 'bg-emerald-600 text-white shadow-emerald-600/20',
      title: extraCompleted.length > 0
        ? `${assignedCompleted.length} of ${totalAssignedMeals} meals done (+${extraCompleted.length} extra)`
        : `${checkedItemsCount} of ${totalAssignedMeals} meals done`,
      subtitle: nextMeal 
        ? `Next up: ${nextMeal.mealType} — ${nextMeal.name}${extraCompleted.length > 0 ? ` (+${extraCompleted.length} extra logged)` : ''}` 
        : (assignedCompleted.length >= totalAssignedMeals && totalAssignedMeals > 0
          ? `All scheduled meals completed!${extraCompleted.length > 0 ? ` Plus ${extraCompleted.length} extra meal logged (+${extraCalories} kcal).` : ' Exceptional clinical discipline today.'}`
          : (extraCompleted.length > 0 ? `${extraCompleted.length} extra meal logged (+${extraCalories} kcal). All macros synced.` : 'Ready to stay consistent with your dietician meal plan today.')),
      ctaText: 'Open Meal Checklist',
      ctaLink: '/patient/meals'
    },
    {
      id: 'calories',
      label: 'Caloric Balance',
      tabName: 'Calories',
      icon: Flame,
      current: todayCalories,
      total: targetCalories,
      unit: 'kcal eaten',
      percent: Math.min(100, Math.round((todayCalories / targetCalories) * 100)),
      gradient: 'from-orange-50 via-amber-50/70 to-rose-100/90 border border-orange-200/90',
      ringColor: '#f97316',
      ringTrack: 'rgba(249, 115, 22, 0.16)',
      titleColor: 'text-stone-900',
      subColor: 'text-stone-700',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
      btnBg: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20',
      activeTabBg: 'bg-orange-600 text-white shadow-orange-600/20',
      title: `${todayCalories.toLocaleString()} of ${targetCalories.toLocaleString()} kcal`,
      subtitle: targetCalories > todayCalories 
        ? `${(targetCalories - todayCalories).toLocaleString()} kcal remaining for dinner & wholesome nourishment.` 
        : 'Daily caloric target fulfilled! Great energy balance today.',
      ctaText: 'View Food Logs',
      ctaLink: '/patient/meals'
    },
    {
      id: 'protein',
      label: 'Daily Protein',
      tabName: 'Protein',
      icon: Dumbbell,
      current: Math.round(todayProtein),
      total: targetProtein,
      unit: 'g Protein',
      percent: Math.min(100, Math.round((todayProtein / targetProtein) * 100)),
      gradient: 'from-purple-50 via-indigo-50/70 to-violet-100/90 border border-purple-200/90',
      ringColor: '#8b5cf6',
      ringTrack: 'rgba(139, 92, 246, 0.16)',
      titleColor: 'text-purple-950',
      subColor: 'text-purple-850',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      btnBg: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20',
      activeTabBg: 'bg-purple-600 text-white shadow-purple-600/20',
      title: `${Math.round(todayProtein)}g of ${targetProtein}g Protein`,
      subtitle: targetProtein > todayProtein
        ? `${Math.max(0, targetProtein - Math.round(todayProtein))}g needed • Essential for cellular repair, lean muscle & satiety.`
        : 'Protein target hit! Optimal satiety and muscle maintenance.',
      ctaText: 'High-Protein Recipes',
      ctaLink: '/patient/meals'
    },
    {
      id: 'carbs',
      label: 'Daily Carbs',
      tabName: 'Carbs',
      icon: Wheat,
      current: Math.round(todayCarbs),
      total: targetCarbs,
      unit: 'g Carbs',
      percent: Math.min(100, Math.round((todayCarbs / targetCarbs) * 100)),
      gradient: 'from-amber-50 via-yellow-50/70 to-orange-100/90 border border-amber-200/90',
      ringColor: '#f59e0b',
      ringTrack: 'rgba(245, 158, 11, 0.16)',
      titleColor: 'text-amber-950',
      subColor: 'text-amber-850',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
      activeTabBg: 'bg-amber-600 text-white shadow-amber-600/20',
      title: `${Math.round(todayCarbs)}g of ${targetCarbs}g Carbs`,
      subtitle: targetCarbs > todayCarbs
        ? `${Math.max(0, targetCarbs - Math.round(todayCarbs))}g remaining • Low-GI complex carbs fuel brain & sustained physical energy.`
        : 'Carbohydrate daily target achieved smoothly.',
      ctaText: 'View Complex Carbs',
      ctaLink: '/patient/meals'
    },
    {
      id: 'fats',
      label: 'Healthy Fats',
      tabName: 'Fats',
      icon: Heart,
      current: Math.round(todayFat),
      total: targetFat,
      unit: 'g Fats',
      percent: Math.min(100, Math.round((todayFat / targetFat) * 100)),
      gradient: 'from-rose-50 via-pink-50/70 to-fuchsia-100/90 border border-rose-200/90',
      ringColor: '#ec4899',
      ringTrack: 'rgba(236, 72, 153, 0.16)',
      titleColor: 'text-rose-950',
      subColor: 'text-rose-850',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
      activeTabBg: 'bg-rose-600 text-white shadow-rose-600/20',
      title: `${Math.round(todayFat)}g of ${targetFat}g Fats`,
      subtitle: targetFat > todayFat
        ? `${Math.max(0, targetFat - Math.round(todayFat))}g remaining • Essential fatty acids for hormones, joints & cellular health.`
        : 'Healthy lipid target satisfied today.',
      ctaText: 'Explore Healthy Fats',
      ctaLink: '/patient/meals'
    }
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      setActiveSlide(prev => (prev + 1) % carouselSlides.length);
    } else if (distance < -minSwipeDistance) {
      setActiveSlide(prev => (prev - 1 + carouselSlides.length) % carouselSlides.length);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentSlide = carouselSlides[activeSlide];
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeOffset = ringCircumference - (ringCircumference * Math.min(100, Math.max(0, currentSlide.percent))) / 100;

  // Weight Change and Inch Loss Calculations
  const startingWeight = Number(patientProfile?.weightManagement?.initialWeightKg || patientProfile?.currentWeightKg || 68);
  const currentWeight = Number(patientProfile?.currentWeightKg || 68);
  const weightChangeKg = Number((currentWeight - startingWeight).toFixed(1));
  const displayedInchLoss = patientProfile?.inchLoss ?? (
    patientProfile?.initialWaistCm && patientProfile?.waistCm 
      ? Number(((patientProfile.initialWaistCm - patientProfile.waistCm) / 2.54).toFixed(1))
      : 0
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Page Title (Scan Meal Button Removed) */}
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
      </div>

      {/* ─── TODAY'S INTAKE MEAL CAROUSEL (REPLACING STATIC CARD) ─────────── */}
      <div 
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 md:p-8 shadow-md mb-8 transition-all duration-700 bg-gradient-to-br select-none touch-pan-y ${currentSlide.gradient}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full border backdrop-blur-md inline-flex items-center gap-1.5 shadow-2xs ${currentSlide.badgeBg}`}>
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveSlide(prev => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white active:scale-95 border border-stone-200/80 flex items-center justify-center text-stone-700 transition-all backdrop-blur-md shadow-xs cursor-pointer"
              title="Previous metric"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-stone-600 min-w-[32px] sm:min-w-[36px] text-center">
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-center relative z-10">
          <div className="md:col-span-4 flex items-center justify-center">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  stroke={currentSlide.ringTrack}
                  strokeWidth="8.5"
                  fill="transparent"
                />
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

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <span className={`text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-tight ${currentSlide.titleColor}`}>
                  {currentSlide.percent}%
                </span>
                <span className="text-[10px] md:text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-0.5">
                  {currentSlide.current} / {currentSlide.total}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col justify-center space-y-2.5 sm:space-y-3">
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-tight ${currentSlide.titleColor} leading-tight`}>
              {currentSlide.title}
            </h2>
            <p className={`text-xs md:text-sm ${currentSlide.subColor} font-medium leading-relaxed max-w-xl`}>
              {currentSlide.subtitle}
            </p>

            <div className="pt-1.5 sm:pt-2 flex flex-wrap items-center gap-3">
              <a
                href={currentSlide.ctaLink}
                className={`w-full sm:w-auto justify-center px-5 py-2.5 ${currentSlide.btnBg} active:scale-95 font-extrabold rounded-xl text-xs md:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer`}
              >
                <span>{currentSlide.ctaText}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Carousel Tabs */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-stone-200/60 relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth -mx-2 px-2">
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
