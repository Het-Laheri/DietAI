import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getMealPlans, 
  getPatientWeekPlan, 
  getStoredRecipesFromDB, 
  MealPlan, 
  Meal, 
  ChecklistMealItem, 
  savePatientChecklist, 
  getPatientChecklist,
  logMeal,
  deleteFoodLog,
  PatientWeekPlan, 
  RecipeDBItem, 
  WeekDay 
} from '../../services/db';
import { isPatientSubscribed } from '../../services/subscription';
import SubscriptionPaywall from '../../components/SubscriptionPaywall';
import { 
  CheckSquare, 
  CheckCircle2, 
  Sparkles, 
  Utensils, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  ChefHat, 
  FileText,
  AlertCircle,
  Lock,
  MessageCircle,
  PlusCircle,
  X,
  Flame,
  Trash2,
  Loader2,
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';

interface ExtraFoodEstimate {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function MealNotepad() {
  const { profile } = useAuth();
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [items, setItems] = useState<ChecklistMealItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [patientReflection, setPatientReflection] = useState('');
  const [notesSavedToast, setNotesSavedToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(() => isPatientSubscribed(profile));

  // "Ate Something Extra?" Modal & AI State
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [extraFoodName, setExtraFoodName] = useState('');
  const [extraPortion, setExtraPortion] = useState('');
  const [estimatingExtra, setEstimatingExtra] = useState(false);
  const [extraResult, setExtraResult] = useState<ExtraFoodEstimate | null>(null);
  const [extraError, setExtraError] = useState<string | null>(null);
  const [extraSuccessToast, setExtraSuccessToast] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const storageKey = `nutrisnap_meals_checklist_${profile?.uid}_${todayStr}`;
  const reflectionKey = `nutrisnap_meals_reflection_${profile?.uid}_${todayStr}`;

  useEffect(() => {
    setSubscribed(isPatientSubscribed(profile));
    const handleSubChange = () => setSubscribed(isPatientSubscribed(profile));
    window.addEventListener('nutrisnap:subscription_change', handleSubChange);

    async function loadPlanAndChecklist() {
      if (!profile) return;
      try {
        const [plans, weekPlan, allDbRecipes] = await Promise.all([
          getMealPlans(profile.uid),
          getPatientWeekPlan(profile.uid),
          getStoredRecipesFromDB()
        ]);

        const published = plans.find(p => p.status === 'published');
        setActivePlan(published || null);

        // Load saved checklist state from Firestore & fallback to localStorage
        const savedStateList = await getPatientChecklist(profile.uid, todayStr);
        const savedState: Record<string, ChecklistMealItem> = {};
        savedStateList.forEach(i => savedState[i.id] = i);

        // Load reflection notes
        const savedReflection = localStorage.getItem(reflectionKey);
        if (savedReflection) setPatientReflection(savedReflection);

        let initialList: ChecklistMealItem[] = [];

        // 1. Check published Week Plan assigned by Dietician
        const DAYS_OF_WEEK: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDay = DAYS_OF_WEEK[new Date().getDay()];

        if (weekPlan && weekPlan.status === 'published' && weekPlan.entries && weekPlan.entries.length > 0) {
          const todaysEntries = weekPlan.entries.filter(e => e.day === todayDay);
          const MEAL_SLOT_ORDER = ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime Snack'];
          const sortedEntries = [...todaysEntries].sort(
            (a, b) => MEAL_SLOT_ORDER.indexOf(a.mealSlot) - MEAL_SLOT_ORDER.indexOf(b.mealSlot)
          );

          if (sortedEntries.length > 0) {
            initialList = sortedEntries.map((entry, idx) => {
              const itemId = `wp_${entry.day}_${entry.mealSlot}_${idx}`;
              const detail = allDbRecipes.find(r => r.name.toLowerCase() === entry.recipeName.toLowerCase()) ||
                             allDbRecipes.find(r => r.id === entry.recipeId);
              return {
                id: itemId,
                mealType: entry.mealSlot,
                name: entry.recipeName,
                portion: entry.portion || '1 serving',
                calories: detail?.calories,
                protein: detail?.protein,
                carbs: detail?.carbs,
                fat: detail?.fat,
                notes: entry.notes || detail?.clinicalFocus,
                recipe: detail?.recipe || [],
                ingredients: detail?.ingredients || [],
                completed: savedState[itemId]?.completed || false,
                completedAt: savedState[itemId]?.completedAt,
                isExtra: false
              };
            });
          }
        }

        // 2. If no week entries, check published standard MealPlan assigned by Dietician
        if (initialList.length === 0 && published && published.days && published.days.length > 0) {
          let dayIndex = 0;
          if (published.startDate) {
            const start = new Date(published.startDate).getTime();
            const now = new Date(todayStr).getTime();
            const diffDays = Math.max(0, Math.floor((now - start) / 86400000));
            dayIndex = Math.min(diffDays % published.days.length, published.days.length - 1);
          }
          const dayPlan = published.days[dayIndex] || published.days[0];
          initialList = dayPlan.meals.map((m, idx) => {
            const cleanType = m.type.toLowerCase().replace(/\s+/g, '_');
            const itemId = `plan_meal_${idx}_${cleanType}`;
            // Match against savedState by exact id or normalized id
            const state = savedState[itemId] || 
                          Object.values(savedState).find(s => s.mealType.toLowerCase().replace(/\s+/g, '_') === cleanType && s.name.toLowerCase() === m.name.toLowerCase());
            return {
              id: itemId,
              mealType: m.type,
              name: m.name,
              portion: m.portion || '1 serving',
              calories: Number(m.calories) || 0,
              protein: Number(m.protein) || 0,
              carbs: Number(m.carbs) || 0,
              fat: Number(m.fat) || 0,
              notes: m.notes,
              recipe: Array.isArray(m.recipe) ? m.recipe : (m.recipe ? [m.recipe] : []),
              ingredients: Array.isArray(m.ingredients) ? m.ingredients : (m.ingredients ? [m.ingredients] : []),
              completed: state?.completed || false,
              completedAt: state?.completedAt,
              isExtra: false
            };
          });
        }

        // 3. Append saved extra/custom items from savedStateList
        savedStateList.forEach(item => {
          const cleanItemType = item.mealType.toLowerCase().replace(/\s+/g, '_');
          const match = initialList.find(i => 
            i.id === item.id || 
            (i.id.replace(/\s+/g, '_') === item.id.replace(/\s+/g, '_')) ||
            (!item.isExtra && i.mealType.toLowerCase().replace(/\s+/g, '_') === cleanItemType && i.name.toLowerCase() === item.name.toLowerCase())
          );
          if (match) {
            match.completed = item.completed;
            match.completedAt = item.completedAt;
          } else if (item.isExtra || item.mealType === 'Extra Food') {
            if (!initialList.some(i => i.id === item.id)) {
              initialList.push(item);
            }
          }
        });
        setItems(initialList);
      } catch (err) {
        console.error('Failed to load meal checklist:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPlanAndChecklist();

    return () => window.removeEventListener('nutrisnap:subscription_change', handleSubChange);
  }, [profile, todayStr]);

  const toggleItem = (id: string) => {
    const updated = items.map(item => {
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

    setItems(updated);

    // Save states to localStorage & Firestore
    const stateMap: Record<string, { completed: boolean; completedAt?: string }> = {};
    updated.forEach(it => {
      stateMap[it.id] = { completed: it.completed, completedAt: it.completedAt };
    });
    localStorage.setItem(storageKey, JSON.stringify(stateMap));
    if (profile) {
      savePatientChecklist(profile.uid, todayStr, updated).catch(err => {
        console.warn('savePatientChecklist error:', err);
      });
      window.dispatchEvent(new CustomEvent('nutrisnap:checklist_updated'));
    }
  };

  // AI-Powered Calorie & Macro Calculation
  const handleEstimateExtraFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraFoodName.trim()) {
      setExtraError('Please enter the name of the food item.');
      return;
    }

    setEstimatingExtra(true);
    setExtraError(null);

    try {
      const res = await fetch('/api/ai/estimate-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          foodItem: extraFoodName.trim(),
          portionSize: extraPortion.trim() || '1 serving'
        })
      });

      if (!res.ok) {
        throw new Error('AI estimation service was unavailable.');
      }

      const data: ExtraFoodEstimate = await res.json();
      setExtraResult({
        name: data.name || extraFoodName.trim(),
        portion: data.portion || extraPortion.trim() || '1 serving',
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
      });
    } catch (err: any) {
      console.warn('AI calculation notice:', err);
      // Fallback calculation so the user can still log
      setExtraResult({
        name: extraFoodName.trim(),
        portion: extraPortion.trim() || '1 standard portion',
        calories: 250,
        protein: 5,
        carbs: 35,
        fat: 10
      });
    } finally {
      setEstimatingExtra(false);
    }
  };

  // Confirm and Add Extra Item to Checklist & Permanent Food Log
  const handleConfirmAddExtra = async () => {
    if (!extraResult || !profile) return;

    const completedTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const newItem: ChecklistMealItem = {
      id: 'extra_' + Date.now(),
      mealType: 'Extra Food',
      name: extraResult.name,
      portion: extraResult.portion,
      calories: extraResult.calories,
      protein: extraResult.protein,
      carbs: extraResult.carbs,
      fat: extraResult.fat,
      completed: true,
      completedAt: completedTime,
      isExtra: true
    };

    let updated = [...items, newItem];
    setItems(updated);

    // Add to daily food log history (so dietician and analytics see it)
    try {
      const logId = await logMeal({
        patientId: profile.uid,
        patientName: profile.name,
        date: todayStr,
        mealType: 'Extra Food',
        description: `Extra: ${newItem.name}`,
        userNotes: `Portion: ${newItem.portion}`,
        nutrition: {
          calories: newItem.calories || 0,
          protein: newItem.protein || 0,
          carbs: newItem.carbs || 0,
          fat: newItem.fat || 0
        },
        items: [{
          name: newItem.name,
          portion: newItem.portion,
          calories: newItem.calories || 0,
          protein: newItem.protein || 0,
          carbs: newItem.carbs || 0,
          fat: newItem.fat || 0
        }],
        source: 'quick_log'
      });
      if (logId) {
        newItem.logMealId = logId;
        updated = updated.map(it => it.id === newItem.id ? { ...it, logMealId: logId } : it);
        setItems(updated);
      }
    } catch (e) {
      console.warn('Could not add to logMeal:', e);
    }

    // Save to Firestore checklist (server bridge bypasses patient client restrictions)
    await savePatientChecklist(profile.uid, todayStr, updated);

    // Save state map
    const stateMap: Record<string, { completed: boolean; completedAt?: string }> = {};
    updated.forEach(it => {
      stateMap[it.id] = { completed: it.completed, completedAt: it.completedAt };
    });
    localStorage.setItem(storageKey, JSON.stringify(stateMap));

    // Reset modal state
    setIsExtraModalOpen(false);
    setExtraFoodName('');
    setExtraPortion('');
    setExtraResult(null);

    // Show toast
    setExtraSuccessToast(`Added ${newItem.name} (+${newItem.calories} kcal) to today's log!`);
    setTimeout(() => setExtraSuccessToast(null), 4000);

    window.dispatchEvent(new CustomEvent('nutrisnap:checklist_updated'));
  };

  // Remove Extra Item
  const handleRemoveExtraItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToRemove = items.find(i => i.id === id);
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    if (profile) {
      await savePatientChecklist(profile.uid, todayStr, updated);
      if (itemToRemove?.logMealId) {
        deleteFoodLog(itemToRemove.logMealId).catch(console.warn);
      }
      window.dispatchEvent(new CustomEvent('nutrisnap:checklist_updated'));
    }
  };

  const handleSaveReflection = () => {
    if (!profile) return;
    localStorage.setItem(reflectionKey, patientReflection);
    setNotesSavedToast(true);
    setTimeout(() => setNotesSavedToast(false), 3000);
  };

  if (loading) {
    return <div className="p-8 text-center text-stone-500 font-medium">Loading your meals...</div>;
  }

  if (!subscribed) {
    return (
      <SubscriptionPaywall 
        featureName="Today's Meals & Personalized Clinical Recipes" 
        onUnlocked={() => setSubscribed(true)} 
      />
    );
  }

  // CALORIC & COMPLIANCE CALCULATIONS
  const targetCalories = activePlan?.targets?.calories || 2000;

  // 1. Prescribed / Assigned Meals
  const assignedItems = items.filter(i => !i.isExtra && !i.mealType?.toLowerCase().includes('extra'));
  const completedAssignedItems = assignedItems.filter(i => i.completed);
  const baselineCaloriesLogged = completedAssignedItems.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);
  const baselinePlannedCalories = assignedItems.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);

  // 2. Extra Food Items Logged
  const extraItems = items.filter(i => i.isExtra || i.mealType?.toLowerCase().includes('extra'));
  const completedExtraItems = extraItems.filter(i => i.completed);
  const extraCaloriesLogged = completedExtraItems.reduce((sum, i) => sum + (Number(i.calories) || 0), 0);

  // 3. Total Day's Calories (Baseline Meals Logged + Extra AI-Logged Meals)
  const totalCaloriesTracked = baselineCaloriesLogged + extraCaloriesLogged;

  // Macros Total (All Completed Food Items)
  const completedItems = items.filter(i => i.completed);
  const totalProteinTracked = completedItems.reduce((sum, i) => sum + (Number(i.protein) || 0), 0);
  const totalCarbsTracked = completedItems.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0);
  const totalFatTracked = completedItems.reduce((sum, i) => sum + (Number(i.fat) || 0), 0);

  // Progress Percentages
  const calorieProgressPercent = Math.min(100, Math.round((totalCaloriesTracked / targetCalories) * 100));
  const baselineProgressPercent = Math.min(100, Math.round((baselineCaloriesLogged / targetCalories) * 100));
  const extraProgressPercent = Math.min(100 - baselineProgressPercent, Math.round((extraCaloriesLogged / targetCalories) * 100));

  const completedCount = completedItems.length;
  const isOverTarget = totalCaloriesTracked > targetCalories;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-12 font-sans">
      
      {/* Toast Notifications */}
      {notesSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Notes saved to your daily clinical record!
        </div>
      )}

      {extraSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-emerald-100 px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 border border-emerald-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {extraSuccessToast}
        </div>
      )}

      {/* CLINICAL DAILY MEAL SCHEDULE CONTAINER */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs relative overflow-hidden transition-all">
        
        {/* Header Bar */}
        <div className="bg-stone-900 text-stone-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-wider text-orange-400 uppercase font-semibold">
                  CLINICAL NUTRITION SCHEDULE
                </span>
                <span className="text-stone-500 text-[10px]">•</span>
                <span className="text-stone-300 text-[11px] font-mono">{formattedDate}</span>
              </div>
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight">
                Today's Assigned Meal To-Do Checklist
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-stone-800/90 px-3 py-1.5 rounded-lg border border-stone-700/80">
            <span className="text-xs font-medium text-stone-300">Prescribed:</span>
            <span className="text-xs font-bold text-orange-400 font-mono">
              {completedAssignedItems.length} / {assignedItems.length} Done
            </span>
            {extraItems.length > 0 && (
              <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded ml-1">
                +{extraItems.length} Extra
              </span>
            )}
          </div>
        </div>

        {/* Clinical Dossier Header & Calorie Tracking Dashboard */}
        <div className="p-6 border-b border-stone-200 bg-stone-50/40">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">
                Client: <span className="text-stone-900 font-semibold">{profile?.name}</span>
              </p>
              <p className="text-xs text-stone-500">
                Check off each item as you consume it. Your progress is synced to your clinical record in real-time.
              </p>
            </div>

            {/* Dietician Clinical Directive Callout */}
            <div className="border-l-2 border-orange-500 bg-orange-50/50 rounded-r-lg p-3.5 max-w-md shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-800 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                Dietician Directive
              </div>
              <p className="text-xs leading-relaxed text-stone-700 font-normal">
                {activePlan?.instructions || 'Chew slowly, stay hydrated between meals, and avoid processed refined sugars today.'}
              </p>
            </div>
          </div>

          {/* DYNAMIC CALORIE & MACRO COMPLETION PROGRESS SECTION */}
          <div className="mt-5 p-4 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Total Day's Calories Logged
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-stone-900 font-mono tracking-tight">
                    {totalCaloriesTracked}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    / {targetCalories} kcal target ({calorieProgressPercent}%)
                  </span>
                  {isOverTarget && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full ml-1">
                      +{totalCaloriesTracked - targetCalories} kcal over target
                    </span>
                  )}
                </div>
              </div>

              {/* Baseline vs Extra Breakdown Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Prescribed: <strong className="font-bold">{baselineCaloriesLogged} kcal</strong>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Extra Food: <strong className="font-bold">{extraCaloriesLogged} kcal</strong>
                </span>
              </div>
            </div>

            {/* DUAL-SEGMENT DYNAMIC COMPLETION BAR */}
            <div className="space-y-1">
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden flex p-0.5 border border-stone-200/80">
                {/* Prescribed meals portion (emerald) */}
                <div 
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                  style={{ width: `${baselineProgressPercent}%` }}
                  title={`Prescribed Meals: ${baselineCaloriesLogged} kcal`}
                />
                {/* Extra food items portion (amber/orange) */}
                <div 
                  className={`bg-amber-500 h-full transition-all duration-500 ${baselineProgressPercent === 0 ? 'rounded-l-full' : ''} ${calorieProgressPercent >= 100 ? 'rounded-r-full' : ''}`}
                  style={{ width: `${extraProgressPercent}%` }}
                  title={`Extra Food: ${extraCaloriesLogged} kcal`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-medium text-stone-400">
                <span>0 kcal</span>
                <span>50%</span>
                <span className="font-semibold text-stone-600">{targetCalories} kcal (Target)</span>
              </div>
            </div>

            {/* Macros Breakdown Bar */}
            <div className="pt-2 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-stone-50 rounded-lg border border-stone-150">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Protein</span>
                <span className="font-bold text-stone-800 font-mono">{totalProteinTracked}g</span>
              </div>
              <div className="p-2 bg-stone-50 rounded-lg border border-stone-150">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Carbohydrates</span>
                <span className="font-bold text-stone-800 font-mono">{totalCarbsTracked}g</span>
              </div>
              <div className="p-2 bg-stone-50 rounded-lg border border-stone-150">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Fats</span>
                <span className="font-bold text-stone-800 font-mono">{totalFatTracked}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* TO-DO CHECKLIST ITEMS */}
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-orange-600" />
              Prescribed Meals & Extra Logs ({items.length})
            </h2>
            <span className="text-xs text-stone-400">
              {completedCount} of {items.length} items logged today
            </span>
          </div>

          {items.length === 0 ? (
            <div className="bg-stone-50 rounded-xl border border-dashed border-stone-200 p-8 text-center max-w-lg mx-auto my-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3 border border-orange-100">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-sm mb-1">
                Awaiting Dietician's Meal Plan
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-5">
                Only your clinical dietician can assign and send your daily meal plan. Every meal is prescribed strictly from our approved clinical recipes database.
              </p>
              <Link
                to="/patient/inbox"
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs rounded-lg shadow-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Message Lead Dietician
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 space-y-1">
              {items.map((item) => {
                const isExpanded = expandedId === item.id;
                const isExtra = item.isExtra || item.mealType === 'Extra Food' || item.mealType === 'CUSTOM DIETARY NOTE';

                return (
                  <div 
                    key={item.id}
                    className={`py-3.5 px-3 rounded-xl transition-all ${
                      isExtra 
                        ? 'bg-amber-50/40 border border-amber-200/80 mb-2' 
                        : item.completed 
                          ? 'bg-emerald-50/30 border border-emerald-100/60' 
                          : 'hover:bg-stone-50/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Interactive Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          item.completed 
                            ? isExtra 
                              ? 'bg-amber-500 border-amber-600 text-white' 
                              : 'bg-emerald-500 border-emerald-600 text-white' 
                            : 'border-stone-300 bg-white hover:border-orange-500'
                        }`}
                      >
                        {item.completed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Meal Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isExtra 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1' 
                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}>
                              {isExtra && <Sparkles className="w-2.5 h-2.5 text-amber-600" />}
                              {isExtra ? 'EXTRA FOOD (PATIENT LOGGED)' : item.mealType}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {item.completed && item.completedAt && (
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                                isExtra 
                                  ? 'text-amber-800 bg-amber-100/60 border border-amber-200' 
                                  : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                              }`}>
                                <Clock className="w-3 h-3" /> Checked at {item.completedAt}
                              </span>
                            )}
                            {isExtra && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveExtraItem(item.id, e)}
                                title="Remove extra item"
                                className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className={`text-sm font-semibold transition-all ${
                          item.completed && !isExtra
                            ? 'line-through text-stone-400 font-normal' 
                            : 'text-stone-900'
                        }`}>
                          {item.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                          <span>Portion: <strong className="text-stone-700 font-medium">{item.portion}</strong></span>
                          {item.calories ? (
                            <span>• <span className={`font-semibold ${isExtra ? 'text-amber-700' : 'text-orange-600'}`}>{item.calories}</span> kcal</span>
                          ) : null}
                          {item.protein ? (
                            <span>• <span className="font-medium text-stone-700">{item.protein}g</span> P</span>
                          ) : null}
                          {item.carbs ? (
                            <span>• <span className="font-medium text-stone-700">{item.carbs}g</span> C</span>
                          ) : null}
                          {item.fat ? (
                            <span>• <span className="font-medium text-stone-700">{item.fat}g</span> F</span>
                          ) : null}
                        </div>

                        {/* Expandable Dietician Details / Recipe */}
                        {((item.notes || (item.ingredients && item.ingredients.length > 0) || (item.recipe && item.recipe.length > 0))) && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                            >
                              <ChefHat className="w-3 h-3" />
                              {isExpanded ? 'Hide preparation details' : 'View dietician instructions & recipe'}
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {isExpanded && (
                              <div className="mt-2.5 p-3.5 bg-stone-50 rounded-lg border border-stone-200/80 text-xs space-y-2 shadow-xs">
                                {item.notes && (
                                  <p className="text-stone-700 leading-relaxed">
                                    <span className="font-semibold text-stone-900">Dietician Instructions:</span> {item.notes}
                                  </p>
                                )}

                                {item.ingredients && item.ingredients.length > 0 && (
                                  <div>
                                    <span className="font-semibold text-stone-900">Ingredients:</span>
                                    <ul className="list-disc list-inside mt-1 text-stone-600 space-y-0.5">
                                      {item.ingredients.map((ing, i) => (
                                        <li key={i}>{ing}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {item.recipe && item.recipe.length > 0 && (
                                  <div>
                                    <span className="font-semibold text-stone-900">Preparation:</span>
                                    <ol className="list-decimal list-inside mt-1 text-stone-600 space-y-0.5">
                                      {item.recipe.map((step, i) => (
                                        <li key={i}>{step}</li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* "ATE SOMETHING EXTRA?" INTERACTIVE CALLOUT CARD & BUTTON      */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-stone-50 border border-amber-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  Ate Something Extra?
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    AI Powered
                  </span>
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  Consumed a snack, coffee, or treat not in your prescribed plan? Log it with instant AI calorie & macro estimation.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-ate-something-extra"
              onClick={() => {
                setExtraResult(null);
                setExtraError(null);
                setIsExtraModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Ate Something Extra?
            </button>
          </div>

        </div>

        {/* PATIENT REFLECTION / CLINICAL CONSULTATION NOTES */}
        <div className="p-6 bg-stone-50/50 border-t border-stone-200">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-stone-900 text-xs md:text-sm">
                Patient Notes & Reflections for Dietician
              </h3>
            </div>
            <button
              type="button"
              onClick={handleSaveReflection}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save Notes
            </button>
          </div>

          <textarea
            value={patientReflection}
            onChange={(e) => setPatientReflection(e.target.value)}
            rows={3}
            placeholder="Jot down notes for your dietician here (e.g. Felt energetic after lunch, swapped brown rice for quinoa, experienced mild sweet cravings at 5 PM)..."
            className="w-full p-3 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 placeholder:text-stone-400 resize-y"
          />
          <p className="text-[11px] text-stone-400 mt-1.5">
            Your dietician reviews these notes during clinical consultations.
          </p>
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* "ATE SOMETHING EXTRA?" AI ESTIMATION MODAL                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isExtraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Log Extra Food or Treat</h3>
                  <p className="text-[10px] text-stone-400">AI-Powered Nutrition Estimation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExtraModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-5 space-y-4">
              {extraError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {extraError}
                </div>
              )}

              <form onSubmit={handleEstimateExtraFood} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Food Item(s) <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={extraFoodName}
                    onChange={(e) => setExtraFoodName(e.target.value)}
                    placeholder="e.g. Brownie cake, Bagel with cream cheese, Latte"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                  
                  {/* Quick suggestion tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Brownie cake', '1 Bagel with cream cheese', 'Chocolate chip cookie', 'Vanilla oat latte', 'Handful of almonds'].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setExtraFoodName(suggestion);
                          if (!extraPortion) setExtraPortion('1 serving');
                        }}
                        className="text-[10px] bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 px-2 py-0.5 rounded-md transition-colors"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Quantity / Portion Size
                  </label>
                  <input
                    type="text"
                    value={extraPortion}
                    onChange={(e) => setExtraPortion(e.target.value)}
                    placeholder="e.g. 1 slice, 250g, 2 pieces, 1 cup (Default: 1 serving)"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={estimatingExtra || !extraFoodName.trim()}
                  className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {estimatingExtra ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      Analyzing with AI & Calculating Macros...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Estimate Nutritional Value with AI
                    </>
                  )}
                </button>
              </form>

              {/* ESTIMATED RESULT DISPLAY */}
              {extraResult && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        AI Calculated Nutrition
                      </span>
                      <h4 className="text-sm font-bold text-stone-900">{extraResult.name}</h4>
                      <p className="text-xs text-stone-600 font-medium">Portion: {extraResult.portion}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-amber-900 font-mono">
                        +{extraResult.calories}
                      </span>
                      <span className="text-[10px] text-amber-700 block font-medium">kcal</span>
                    </div>
                  </div>

                  {/* Macronutrient breakdown */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="p-1.5 bg-white/90 rounded-lg border border-amber-200/80">
                      <span className="text-[9px] font-bold text-stone-400 uppercase block">Protein</span>
                      <span className="font-bold text-stone-800 font-mono">{extraResult.protein}g</span>
                    </div>
                    <div className="p-1.5 bg-white/90 rounded-lg border border-amber-200/80">
                      <span className="text-[9px] font-bold text-stone-400 uppercase block">Carbs</span>
                      <span className="font-bold text-stone-800 font-mono">{extraResult.carbs}g</span>
                    </div>
                    <div className="p-1.5 bg-white/90 rounded-lg border border-amber-200/80">
                      <span className="text-[9px] font-bold text-stone-400 uppercase block">Fat</span>
                      <span className="font-bold text-stone-800 font-mono">{extraResult.fat}g</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-500 italic">
                    This extra food will be added to your daily log and will immediately update your day's total calories and progress bar.
                  </p>

                  <button
                    type="button"
                    onClick={handleConfirmAddExtra}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Add to Today's Daily Log
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
