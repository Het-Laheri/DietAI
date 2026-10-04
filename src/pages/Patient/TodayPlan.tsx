import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMealPlans, getFoodLogs, MealPlan, FoodLog, logMeal,
  getPatientWeekPlan, PatientWeekPlan, getStoredRecipesFromDB,
  RecipeDBItem, filterRecipesForPatient
} from '../../services/db';
import { CheckCircle, Circle, Plus, ChefHat, Clock, ChevronDown, ChevronUp, Utensils, CalendarDays, AlertTriangle } from 'lucide-react';
import { isPatientSubscribed } from '../../services/subscription';
import SubscriptionPaywall from '../../components/SubscriptionPaywall';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_SLOT_ORDER = ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime Snack'];

function getDayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

export default function TodayPlan() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [weekPlan, setWeekPlan] = useState<PatientWeekPlan | null>(null);
  const [allRecipes, setAllRecipes] = useState<RecipeDBItem[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDay = getDayName();

  // Parse patient conditions from profile
  const patientConditions: string[] = (() => {
    const conds: string[] = [];
    const pAny = profile as any;
    if (pAny?.healthInfo?.conditions) {
      conds.push(...pAny.healthInfo.conditions.split(/,|;/).map((s: string) => s.trim()).filter(Boolean));
    }
    if (Array.isArray(pAny?.medicalHistory)) {
      conds.push(...pAny.medicalHistory);
    }
    return conds;
  })();

  useEffect(() => {
    async function load() {
      if (profile) {
        // Load traditional AI meal plans
        const plans = await getMealPlans(profile.uid);
        const active = plans.find(p => p.status === 'published');
        setPlan(active || null);

        // Load recipe-based week plan
        const wp = await getPatientWeekPlan(profile.uid);
        setWeekPlan(wp);

        // Load all recipes for detail lookup, filtered for patient conditions
        const recipes = await getStoredRecipesFromDB();
        const filtered = filterRecipesForPatient(recipes, patientConditions);
        setAllRecipes(filtered);

        const dailyLogs = await getFoodLogs(profile.uid, todayStr);
        setLogs(dailyLogs);
      }
      setSubscribed(isPatientSubscribed(profile));
      setLoading(false);
    }
    load();

    const handleSubChange = () => setSubscribed(isPatientSubscribed(profile));
    window.addEventListener('nutrisnap:subscription_change', handleSubChange);
    return () => window.removeEventListener('nutrisnap:subscription_change', handleSubChange);
  }, [profile, todayStr]);

  const handleQuickLog = async (mealType: string, description: string, nutrition: any) => {
    if (!profile) return;
    await logMeal({ patientId: profile.uid, date: todayStr, mealType, description, nutrition });
    setLogs(await getFoodLogs(profile.uid, todayStr));
  };

  const toggleRecipe = (key: string) => setExpandedMeal(prev => prev === key ? null : key);

  if (loading) return <div className="p-8 text-center text-stone-500 font-medium">Loading your plan...</div>;

  if (!subscribed) {
    return <SubscriptionPaywall featureName="Personalized Meals & Chef Recipes" onUnlocked={() => setSubscribed(true)} />;
  }

  const todayPlanDay = plan?.days[0];
  const totalCaloriesLogged = logs.reduce((sum, l) => sum + l.nutrition.calories, 0);
  const targetCalories = plan?.targets.calories || 2000;

  // Today's recipes from week plan
  const todayWeekEntries = weekPlan?.entries
    .filter(e => e.day === todayDay)
    .sort((a, b) => MEAL_SLOT_ORDER.indexOf(a.mealSlot) - MEAL_SLOT_ORDER.indexOf(b.mealSlot)) || [];

  const getRecipeDetail = (recipeName: string): RecipeDBItem | null =>
    allRecipes.find(r => r.name.toLowerCase() === recipeName.toLowerCase()) || null;

  const hasWeekPlan = weekPlan && weekPlan.entries.length > 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Hello, {profile?.name ? profile.name.split(' ')[0] : 'Patient'} 👋</h1>
      <p className="text-stone-500 mb-6">Your dietician-assigned meal plan and recipes.</p>

      {/* Calorie Ring */}
      <div className="bg-white rounded-none border border-stone-200 p-6 mb-6 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-1">Calories Consumed</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-serif font-bold text-stone-900">{totalCaloriesLogged}</span>
            <span className="text-stone-500 mb-1 font-medium">/ {targetCalories} kcal</span>
          </div>
        </div>
        <div className="w-16 h-16 rounded-full border-4 border-stone-100 relative flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-stone-100" />
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-brand-600 transition-all duration-1000"
              strokeDasharray="175" strokeDashoffset={175 - (175 * Math.min(totalCaloriesLogged / targetCalories, 1))} />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      {hasWeekPlan && (
        <div className="flex gap-2 mb-6 border-b border-stone-200">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${activeTab === 'today' ? 'border-brand-700 text-brand-800' : 'border-transparent text-stone-500 hover:text-stone-900'}`}
          >
            Today's Plan
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${activeTab === 'week' ? 'border-brand-700 text-brand-800' : 'border-transparent text-stone-500 hover:text-stone-900'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Full Week Plan
          </button>
        </div>
      )}

      {/* ─── TODAY TAB ──────────────────────────────────────────────────────── */}
      {(activeTab === 'today' || !hasWeekPlan) && (
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-900">
            {todayDay}'s Meal Guide
          </h2>

          {/* Dietician's Recipe Week Plan for Today */}
          {todayWeekEntries.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                  Dietician Assigned Recipes
                </span>
              </div>
              {todayWeekEntries.map((entry, idx) => {
                const cardKey = `wp-${entry.day}-${entry.mealSlot}-${idx}`;
                const isExpanded = expandedMeal === cardKey;
                const detail = getRecipeDetail(entry.recipeName);
                const isLogged = logs.some(l => l.mealType === entry.mealSlot);

                return (
                  <div key={cardKey} className="bg-white border border-stone-200 shadow-sm transition-all">
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {isLogged ? <CheckCircle className="w-6 h-6 text-brand-700 shrink-0" /> : <Circle className="w-6 h-6 text-stone-300 shrink-0" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-brand-800 bg-brand-50 px-2 py-0.5 border border-brand-200">
                              {entry.mealSlot}
                            </span>
                            {detail && <span className="text-xs text-stone-400 font-medium">{detail.calories} kcal</span>}
                          </div>
                          <h3 className="font-bold text-stone-900 text-base mt-1">{entry.recipeName}</h3>
                          {entry.portion && <p className="text-xs text-stone-500">Portion: {entry.portion}</p>}
                          {entry.notes && (
                            <p className="text-[11px] text-amber-700 italic mt-0.5">💡 {entry.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {detail && (
                          <button onClick={() => toggleRecipe(cardKey)}
                            className="px-3 py-1.5 border border-stone-300 hover:border-stone-500 text-stone-700 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5"
                          >
                            <ChefHat className="w-4 h-4 text-brand-700" />
                            <span className="hidden sm:inline">Recipe</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {!isLogged && detail && (
                          <button
                            onClick={() => handleQuickLog(entry.mealSlot, entry.recipeName, {
                              calories: detail.calories, protein: detail.protein, carbs: detail.carbs, fat: detail.fat
                            })}
                            className="p-2 text-brand-700 hover:bg-brand-50 border border-transparent hover:border-brand-200 rounded transition-colors"
                            title="Log meal"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && detail && (
                      <div className="px-5 pb-5 pt-3 border-t border-stone-100 bg-stone-50/70 space-y-4">
                        <div className="flex flex-wrap gap-4 text-xs font-medium text-stone-600 bg-white p-3 border border-stone-200">
                          <span className="flex items-center gap-1.5 font-bold text-stone-900">
                            <Clock className="w-3.5 h-3.5 text-brand-700" />
                            Prep: {detail.prepTime || '10 mins'} • Cook: {detail.cookTime || '15 mins'}
                          </span>
                          <span>Protein: <strong className="text-stone-900">{detail.protein}g</strong></span>
                          <span>Carbs: <strong className="text-stone-900">{detail.carbs}g</strong></span>
                          <span>Fat: <strong className="text-stone-900">{detail.fat}g</strong></span>
                        </div>
                        <div>
                          <h4 className="text-xs uppercase font-bold tracking-widest text-stone-500 mb-2 flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-brand-700" /> Ingredients
                          </h4>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-800 font-medium">
                            {detail.ingredients.map((ing, i) => (
                              <li key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 border border-stone-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" /> {ing}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs uppercase font-bold tracking-widest text-stone-500 mb-2 flex items-center gap-1.5">
                            <ChefHat className="w-3.5 h-3.5 text-brand-700" /> Preparation Steps
                          </h4>
                          <ol className="space-y-2 text-xs text-stone-800">
                            {detail.recipe.map((step, i) => (
                              <li key={i} className="flex items-start gap-2.5 bg-white p-3 border border-stone-200">
                                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold text-[11px] flex items-center justify-center shrink-0">{i + 1}</span>
                                <span className="leading-relaxed mt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Traditional AI meal plan for today */}
          {todayPlanDay?.meals?.map(m => {
            const cardKey = `ai-${m.type}`;
            const isLogged = logs.some(l => l.mealType === m.type);
            const isExpanded = expandedMeal === cardKey;
            return (
              <div key={cardKey} className="bg-white border border-stone-200 shadow-sm transition-all">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isLogged ? <CheckCircle className="w-6 h-6 text-brand-700 shrink-0" /> : <Circle className="w-6 h-6 text-stone-300 shrink-0" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-brand-800 bg-brand-50 px-2 py-0.5 border border-brand-200">{m.type}</span>
                        <span className="text-xs text-stone-400 font-medium">{m.calories} kcal</span>
                      </div>
                      <h3 className="font-bold text-stone-900 text-base mt-1">{m.name}</h3>
                      <p className="text-xs text-stone-500">Portion: {m.portion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleRecipe(cardKey)}
                      className="px-3 py-1.5 border border-stone-300 hover:border-stone-500 text-stone-700 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5"
                    >
                      <ChefHat className="w-4 h-4 text-brand-700" />
                      <span className="hidden sm:inline">Recipe</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {!isLogged && (
                      <button
                        onClick={() => handleQuickLog(m.type, m.name, { calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat })}
                        className="p-2 text-brand-700 hover:bg-brand-50 border border-transparent hover:border-brand-200 rounded transition-colors"
                        title="Log meal"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-stone-100 bg-stone-50/70 space-y-4">
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-stone-600 bg-white p-3 border border-stone-200">
                      <span className="flex items-center gap-1.5 font-bold text-stone-900">
                        <Clock className="w-3.5 h-3.5 text-brand-700" /> Prep: {m.prepTime || '10 mins'} • Cook: {m.cookTime || '15 mins'}
                      </span>
                      <span>Protein: <strong className="text-stone-900">{m.protein}g</strong></span>
                      <span>Carbs: <strong className="text-stone-900">{m.carbs}g</strong></span>
                      <span>Fat: <strong className="text-stone-900">{m.fat}g</strong></span>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase font-bold tracking-widest text-stone-500 mb-2 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-brand-700" /> Ingredients & Exact Measurements
                      </h4>
                      {m.ingredients && m.ingredients.length > 0 ? (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-800 font-medium">
                          {m.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 border border-stone-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" /> {ing}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-stone-500 italic bg-white p-2.5 border border-stone-200">
                          Main ingredients: {m.name} ({m.portion})
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs uppercase font-bold tracking-widest text-stone-500 mb-2 flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-brand-700" /> Step-by-Step Preparation
                      </h4>
                      {m.recipe && m.recipe.length > 0 ? (
                        <ol className="space-y-2 text-xs text-stone-800">
                          {m.recipe.map((step, stepIdx) => (
                            <li key={stepIdx} className="flex items-start gap-2.5 bg-white p-3 border border-stone-200">
                              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold text-[11px] flex items-center justify-center shrink-0">{stepIdx + 1}</span>
                              <span className="leading-relaxed mt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-xs text-stone-600 bg-white p-3 border border-stone-200 leading-relaxed">
                          Prepare {m.name} according to portion guidelines ({m.portion}). Consume fresh.
                        </p>
                      )}
                    </div>
                    {m.notes && (
                      <div className="text-xs text-stone-600 bg-brand-50/60 p-3 border border-brand-200 italic">
                        💡 <strong>Dietician Note:</strong> {m.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!plan && todayWeekEntries.length === 0 && (
            <div className="p-8 text-center text-stone-500 bg-white border border-stone-200 text-sm">
              No active meal plan assigned yet. Ask your dietician to generate your custom plan!
            </div>
          )}

          {/* Additional Logged Meals */}
          {logs.filter(l => l.source === 'scanner' || !todayPlanDay?.meals?.some(m => m.type === l.mealType)).length > 0 && (
            <div className="mt-8 bg-white border border-stone-200 p-6 shadow-sm">
              <h3 className="text-sm uppercase tracking-widest font-bold text-stone-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-700" /> Additional Meals Logged Today
              </h3>
              <div className="divide-y divide-stone-100">
                {logs.filter(l => l.source === 'scanner' || !todayPlanDay?.meals?.some(m => m.type === l.mealType)).map(log => (
                  <div key={log.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 px-2 py-0.5 border border-stone-200 text-stone-700">{log.mealType}</span>
                        {log.source === 'scanner' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-800 px-2 py-0.5 border border-brand-200">AI Scanned</span>
                        )}
                      </div>
                      <p className="font-bold text-stone-900 text-sm mt-1">{log.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-stone-900 text-sm">{log.nutrition?.calories || 0} kcal</span>
                      <p className="text-[11px] text-stone-400">P: {log.nutrition?.protein || 0}g • C: {log.nutrition?.carbs || 0}g</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── WEEK PLAN TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'week' && hasWeekPlan && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-serif font-bold text-stone-900">Full Week Meal Plan</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-50 text-brand-800 border border-brand-200 rounded">
              Week of {weekPlan!.weekStartDate}
            </span>
          </div>

          {patientConditions.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Recipes incompatible with your conditions (<strong>{patientConditions.join(', ')}</strong>) are automatically hidden.</span>
            </div>
          )}

          {WEEK_DAYS.map(day => {
            const dayEntries = weekPlan!.entries
              .filter(e => e.day === day)
              .sort((a, b) => MEAL_SLOT_ORDER.indexOf(a.mealSlot) - MEAL_SLOT_ORDER.indexOf(b.mealSlot));
            const isToday = day === todayDay;

            return (
              <div key={day} className={`bg-white border shadow-sm ${isToday ? 'border-brand-400 ring-2 ring-brand-200/40' : 'border-stone-200'}`}>
                <div className={`p-4 border-b ${isToday ? 'bg-brand-50/60 border-brand-200' : 'bg-stone-50 border-stone-100'} flex items-center gap-2`}>
                  <CalendarDays className={`w-4 h-4 ${isToday ? 'text-brand-700' : 'text-stone-500'}`} />
                  <h3 className={`font-bold text-sm ${isToday ? 'text-brand-900' : 'text-stone-800'}`}>{day}</h3>
                  {isToday && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-700 text-white rounded-full">Today</span>}
                </div>

                {dayEntries.length === 0 ? (
                  <p className="p-4 text-xs text-stone-400 italic">No meals assigned for this day.</p>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {dayEntries.map((entry, idx) => {
                      const cardKey = `week-${day}-${entry.mealSlot}-${idx}`;
                      const isExpanded = expandedMeal === cardKey;
                      const detail = getRecipeDetail(entry.recipeName);

                      return (
                        <div key={cardKey}>
                          <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50/60"
                            onClick={() => detail && toggleRecipe(cardKey)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200 rounded min-w-[90px] text-center">
                                {entry.mealSlot}
                              </span>
                              <div>
                                <p className="font-bold text-stone-900 text-sm">{entry.recipeName}</p>
                                {entry.portion && <p className="text-[11px] text-stone-400">Portion: {entry.portion}</p>}
                                {entry.notes && <p className="text-[11px] text-amber-600 italic">💡 {entry.notes}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {detail && (
                                <span className="text-xs font-bold text-emerald-700">{detail.calories} kcal</span>
                              )}
                              {detail ? (isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />) : null}
                            </div>
                          </div>

                          {isExpanded && detail && (
                            <div className="px-5 pb-4 pt-2 border-t border-stone-100 bg-stone-50/40">
                              <div className="text-xs text-stone-600 space-y-3">
                                <div className="flex flex-wrap gap-4 bg-white p-3 border border-stone-200">
                                  <span><strong>Prep:</strong> {detail.prepTime}</span>
                                  <span><strong>Cook:</strong> {detail.cookTime}</span>
                                  <span>P: <strong>{detail.protein}g</strong></span>
                                  <span>C: <strong>{detail.carbs}g</strong></span>
                                  <span>F: <strong>{detail.fat}g</strong></span>
                                </div>
                                <div>
                                  <p className="font-bold text-stone-500 uppercase tracking-wider text-[10px] mb-1">Ingredients</p>
                                  <p className="text-stone-700">{detail.ingredients.join(', ')}</p>
                                </div>
                                <div>
                                  <p className="font-bold text-stone-500 uppercase tracking-wider text-[10px] mb-1">Steps</p>
                                  <ol className="space-y-1">
                                    {detail.recipe.map((step, i) => (
                                      <li key={i} className="flex gap-2">
                                        <span className="font-bold text-stone-400 shrink-0">{i + 1}.</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
