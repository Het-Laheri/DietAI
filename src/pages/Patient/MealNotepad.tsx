import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {  getMealPlans, getPatientWeekPlan, getStoredRecipesFromDB, MealPlan, Meal, ChecklistMealItem, savePatientChecklist, getPatientChecklist , PatientWeekPlan, RecipeDBItem, WeekDay } from '../../services/db';
import { isPatientSubscribed } from '../../services/subscription';
import SubscriptionPaywall from '../../components/SubscriptionPaywall';
import { 
  CheckSquare, 
  Square, 
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
  MessageCircle
} from 'lucide-react';


export default function MealNotepad() {
  const { profile } = useAuth();
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [items, setItems] = useState<ChecklistMealItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [patientReflection, setPatientReflection] = useState('');
  const [customFoodText, setCustomFoodText] = useState('');
  const [addingCustomFood, setAddingCustomFood] = useState(false);
  const [notesSavedToast, setNotesSavedToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(() => isPatientSubscribed(profile));

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

        // Load saved checklist state from localStorage
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
                completedAt: savedState[itemId]?.completedAt
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
            const itemId = `plan_meal_${idx}_${m.type.toLowerCase()}`;
            return {
              id: itemId,
              mealType: m.type,
              name: m.name,
              portion: m.portion || '1 serving',
              calories: m.calories,
              protein: m.protein,
              carbs: m.carbs,
              fat: m.fat,
              notes: m.notes,
              recipe: Array.isArray(m.recipe) ? m.recipe : (m.recipe ? [m.recipe] : []),
              ingredients: Array.isArray(m.ingredients) ? m.ingredients : (m.ingredients ? [m.ingredients] : []),
              completed: savedState[itemId]?.completed || false,
              completedAt: savedState[itemId]?.completedAt
            };
          });
        }

        // NOTE: No mock or random fallback meals outside of pre-provided recipes.
        // NOTE: Patients cannot add meals; only dietician can prescribe and send meals.
        // Add any custom items from savedState that aren't in initialList
        const planItemIds = new Set(initialList.map(i => i.id));
        savedStateList.forEach(item => {
          if (!planItemIds.has(item.id)) {
            initialList.push(item);
          } else {
            // Update initialList with saved completed info
            const match = initialList.find(i => i.id === item.id);
            if (match) {
              match.completed = item.completed;
              match.completedAt = item.completedAt;
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

    // Save states
    const stateMap: Record<string, { completed: boolean; completedAt?: string }> = {};
    updated.forEach(it => {
      stateMap[it.id] = { completed: it.completed, completedAt: it.completedAt };
    });
    localStorage.setItem(storageKey, JSON.stringify(stateMap));
    if (profile) savePatientChecklist(profile.uid, todayStr, updated);
  };



  
  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodText.trim() || !profile) return;
    setAddingCustomFood(true);
    try {
      const res = await fetch('/api/ai/estimate-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodDesc: customFoodText })
      });
      let est = { name: customFoodText, portion: 'As consumed', calories: 0, protein: 0, carbs: 0, fat: 0 };
      if (res.ok) {
        est = await res.json();
      }
      const newItem: ChecklistMealItem = {
        id: 'custom_' + Date.now(),
        mealType: 'CUSTOM DIETARY NOTE',
        name: est.name || customFoodText,
        portion: est.portion || 'As consumed',
        calories: est.calories || 0,
        protein: est.protein || 0,
        carbs: est.carbs || 0,
        fat: est.fat || 0,
        completed: true,
        completedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      };
      const updated = [...items, newItem];
      setItems(updated);
      setCustomFoodText('');
      await savePatientChecklist(profile.uid, todayStr, updated);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCustomFood(false);
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

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const totalCaloriesTracked = items
    .filter(i => i.completed && i.calories)
    .reduce((sum, i) => sum + (i.calories || 0), 0);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-12 font-sans">
      
      {/* Toast */}
      {notesSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Notes saved to your daily clinical record!
        </div>
      )}

      {/* NOTEPAD CONTAINER WITH CLIPBOARD BINDING STYLING */}
      <div className="bg-[#FFFDF9] rounded-3xl border-2 border-stone-300/80 shadow-2xl relative overflow-hidden transition-all">
        
        {/* Realistic Notepad Top Clip & Binding Bar */}
        <div className="bg-stone-800 text-stone-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-4 border-orange-500 shadow-inner">
          <div className="flex items-center gap-3">
            {/* Brass Clip Simulation */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-900 font-black shadow-md flex-shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-black">
                  CLINICAL NUTRITION NOTEPAD
                </span>
                <span className="text-stone-400 text-[10px]">•</span>
                <span className="text-stone-300 text-[11px] font-mono">{formattedDate}</span>
              </div>
              <h1 className="text-lg md:text-xl font-serif font-black text-white tracking-tight">
                Today's Assigned Meal To-Do Checklist
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-stone-700">
            <span className="text-xs font-bold text-stone-300">Progress:</span>
            <span className="text-xs font-extrabold text-orange-400 font-mono">
              {completedCount} / {items.length} Done ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Lined Paper Header & Dietician Sticky Note */}
        <div className="p-6 md:p-8 border-b border-dashed border-stone-200 bg-gradient-to-b from-amber-50/40 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
                Patient: <span className="text-stone-900 font-extrabold">{profile?.name}</span>
              </p>
              <p className="text-xs text-stone-500">
                Check off each item as you consume it. Your progress is recorded in real-time.
              </p>
            </div>

            {/* Sticky Note Box */}
            <div className="bg-[#FEF9C3] text-yellow-900 border border-yellow-300/80 rounded-2xl p-4 shadow-sm max-w-sm rotate-[-1deg] hover:rotate-0 transition-transform">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-yellow-800 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                Dietician's Daily Note:
              </div>
              <p className="text-xs leading-relaxed font-sans text-yellow-900 font-medium">
                {activePlan?.instructions || 'Chew slowly, stay hydrated between meals, and avoid processed refined sugars today.'}
              </p>
            </div>
          </div>

          {/* Progress Bar on Notepad */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1.5">
              <span>Today's Completion Rate</span>
              <span>{totalCaloriesTracked > 0 && `${totalCaloriesTracked} kcal checked off`}</span>
            </div>
            <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-orange-500 via-pink-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* TO-DO CHECKLIST ITEMS (RULED NOTEPAD PAPER STYLE) */}
        <div className="p-4 md:p-8">
          {items.length === 0 ? (
            <div className="bg-amber-50/60 rounded-3xl border-2 border-dashed border-amber-300/80 p-8 text-center max-w-lg mx-auto my-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <ChefHat className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1">
                Awaiting Dietician's Meal Plan
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-5">
                Only your clinical dietician can assign and send your daily meal plan. Every meal is prescribed strictly from our approved clinical recipes database. Once sent, your recipes and checklist will appear here.
              </p>
              <Link
                to="/patient/inbox"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Message Lead Dietician
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-200/70">
              {items.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div 
                    key={item.id}
                    className={`py-4 px-3 rounded-2xl transition-all ${
                      item.completed 
                        ? 'bg-emerald-50/40 border border-emerald-100/60 my-1' 
                        : 'hover:bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Interactive Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                          item.completed 
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm scale-105' 
                            : 'border-stone-400 bg-white hover:border-orange-500 hover:scale-105'
                        }`}
                      >
                        {item.completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                      </button>

                      {/* Meal Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                            {item.mealType}
                          </span>
                          
                          {item.completed && item.completedAt && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Checked at {item.completedAt}
                            </span>
                          )}
                        </div>

                        <h3 className={`text-sm md:text-base font-bold transition-all ${
                          item.completed 
                            ? 'line-through text-stone-400 font-medium' 
                            : 'text-stone-900 font-bold'
                        }`}>
                          {item.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                          <span className="font-semibold text-stone-600">Portion: {item.portion}</span>
                          {item.calories && (
                            <span>• <span className="font-semibold text-orange-600">{item.calories}</span> kcal</span>
                          )}
                          {item.protein && (
                            <span>• <span className="font-semibold text-stone-700">{item.protein}g</span> Protein</span>
                          )}
                          {item.carbs && (
                            <span>• <span className="font-semibold text-stone-700">{item.carbs}g</span> Carbs</span>
                          )}
                        </div>

                        {/* Expandable Dietician Details / Recipe */}
                        {(item.notes || (item.ingredients && item.ingredients.length > 0) || (item.recipe && item.recipe.length > 0)) && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                            >
                              <ChefHat className="w-3 h-3" />
                              {isExpanded ? 'Hide chef recipe & notes' : 'View dietician instructions & recipe'}
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 p-4 bg-white rounded-xl border border-stone-200 text-xs space-y-2.5 shadow-sm animate-in fade-in">
                                {item.notes && (
                                  <p className="text-stone-700 font-medium leading-relaxed">
                                    <span className="font-bold text-stone-900">Dietician Instructions:</span> {item.notes}
                                  </p>
                                )}

                                {item.ingredients && item.ingredients.length > 0 && (
                                  <div>
                                    <span className="font-bold text-stone-900">Ingredients:</span>
                                    <ul className="list-disc list-inside mt-1 text-stone-600 space-y-0.5">
                                      {item.ingredients.map((ing, i) => (
                                        <li key={i}>{ing}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {item.recipe && item.recipe.length > 0 && (
                                  <div>
                                    <span className="font-bold text-stone-900">Preparation:</span>
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
        </div>

        {/* PATIENT REFLECTION / NOTEPAD SCRATCHPAD SECTION */}
        <div className="p-6 md:p-8 bg-amber-50/50 border-t-2 border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-stone-900 text-sm">
                Patient Notes & Reflections for Dietician
              </h3>
            </div>
            <button
              type="button"
              onClick={handleSaveReflection}
              className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save Notes
            </button>
          </div>

          <textarea
            value={patientReflection}
            onChange={(e) => setPatientReflection(e.target.value)}
            rows={3}
            placeholder="Jot down notes for your dietician here (e.g. Felt great after lunch, swapped brown rice for quinoa, experienced mild sweet cravings at 5 PM)..."
            className="w-full p-4 bg-white border border-stone-300 rounded-2xl text-xs md:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-stone-400 shadow-inner resize-y font-sans"
          />
          <p className="text-[11px] text-stone-400 mt-1.5">
            Your dietician can review these notes during clinical consultations.
          </p>
        </div>

      </div>
    </div>
  );
}
