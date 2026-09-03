import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMealPlans, getFoodLogs, MealPlan, FoodLog, logMeal, Meal } from '../../services/db';
import { CheckCircle, Circle, Plus, ChefHat, Clock, ChevronDown, ChevronUp, Utensils } from 'lucide-react';

export default function TodayPlan() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function load() {
      if (profile) {
        const plans = await getMealPlans(profile.uid);
        const active = plans.find(p => p.status === 'published');
        setPlan(active || null);
        const dailyLogs = await getFoodLogs(profile.uid, todayStr);
        setLogs(dailyLogs);
      }
      setLoading(false);
    }
    load();
  }, [profile, todayStr]);

  const handleQuickLog = async (mealType: string, description: string, nutrition: any) => {
    if (!profile) return;
    await logMeal({
      patientId: profile.uid,
      date: todayStr,
      mealType,
      description,
      nutrition
    });
    setLogs(await getFoodLogs(profile.uid, todayStr));
  };

  const toggleRecipe = (mealType: string) => {
    setExpandedMeal(prev => prev === mealType ? null : mealType);
  };

  if (loading) return <div className="p-8">Loading your plan...</div>;

  const todayDay = plan?.days[0]; // Active day plan
  const totalCaloriesLogged = logs.reduce((sum, l) => sum + l.nutrition.calories, 0);
  const targetCalories = plan?.targets.calories || 2000;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Hello, {profile?.name.split(' ')[0]}</h1>
      <p className="text-stone-500 mb-8">Here is your daily meal plan & chef recipes provided by your dietician.</p>

      {/* Calorie Ring Summary */}
      <div className="bg-white rounded-none border border-stone-200 p-6 mb-8 flex justify-between items-center shadow-sm">
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
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-brand-600 transition-all duration-1000" strokeDasharray="175" strokeDashoffset={175 - (175 * Math.min(totalCaloriesLogged/targetCalories, 1))} />
          </svg>
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-4">Today's Meals & Preparation Guides</h2>
        
        {todayDay?.meals.map(m => {
          const isLogged = logs.some(l => l.mealType === m.type);
          const isExpanded = expandedMeal === m.type;

          return (
            <div key={m.type} className="bg-white border border-stone-200 shadow-sm transition-all">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isLogged ? (
                    <CheckCircle className="w-6 h-6 text-brand-700 shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-stone-300 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-brand-800 bg-brand-50 px-2 py-0.5 border border-brand-200">
                        {m.type}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">{m.calories} kcal</span>
                    </div>
                    <h3 className="font-bold text-stone-900 text-base mt-1">{m.name}</h3>
                    <p className="text-xs text-stone-500">Portion: {m.portion}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleRecipe(m.type)}
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

              {/* EXPANDABLE RECIPE & INGREDIENTS SECTION */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-stone-100 bg-stone-50/70 space-y-4">
                  {/* Preparation Time & Macros */}
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-stone-600 bg-white p-3 border border-stone-200">
                    <span className="flex items-center gap-1.5 font-bold text-stone-900">
                      <Clock className="w-3.5 h-3.5 text-brand-700" />
                      Prep: {m.prepTime || '10 mins'} • Cook: {m.cookTime || '15 mins'}
                    </span>
                    <span>Protein: <strong className="text-stone-900">{m.protein}g</strong></span>
                    <span>Carbs: <strong className="text-stone-900">{m.carbs}g</strong></span>
                    <span>Fat: <strong className="text-stone-900">{m.fat}g</strong></span>
                  </div>

                  {/* Ingredients List */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-widest text-stone-500 mb-2 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-brand-700" />
                      Ingredients & Exact Measurements
                    </h4>
                    {m.ingredients && m.ingredients.length > 0 ? (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-800 font-medium">
                        {m.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 border border-stone-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-stone-500 italic bg-white p-2.5 border border-stone-200">
                        Main ingredients: {m.name} ({m.portion})
                      </p>
                    )}
                  </div>

                  {/* Step-by-Step Cooking Recipe */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-widest text-stone-500 mb-2 flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-brand-700" />
                      Step-by-Step Preparation Instructions
                    </h4>
                    {m.recipe && m.recipe.length > 0 ? (
                      <ol className="space-y-2 text-xs text-stone-800">
                        {m.recipe.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex items-start gap-2.5 bg-white p-3 border border-stone-200">
                            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                              {stepIdx + 1}
                            </span>
                            <span className="leading-relaxed mt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-xs text-stone-600 bg-white p-3 border border-stone-200 leading-relaxed">
                        Prepare {m.name} according to portion guidelines ({m.portion}). Consume fresh with water.
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

        {/* Additional Scanned / Logged Meals Today */}
        {logs.filter(l => l.source === 'scanner' || !todayDay?.meals.some(m => m.type === l.mealType)).length > 0 && (
          <div className="mt-8 bg-white border border-stone-200 p-6 shadow-sm">
            <h3 className="text-sm uppercase tracking-widest font-bold text-stone-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-700" />
              Additional Meals Logged Today
            </h3>
            <div className="divide-y divide-stone-100">
              {logs
                .filter(l => l.source === 'scanner' || !todayDay?.meals.some(m => m.type === l.mealType))
                .map(log => (
                  <div key={log.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 px-2 py-0.5 border border-stone-200 text-stone-700">
                          {log.mealType}
                        </span>
                        {log.source === 'scanner' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-800 px-2 py-0.5 border border-brand-200">
                            AI Scanned
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-stone-900 text-sm mt-1">{log.description}</p>
                      {log.userNotes && (
                        <p className="text-xs text-stone-500 italic mt-0.5">Note: "{log.userNotes}"</p>
                      )}
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

        {!plan && (
          <div className="p-8 text-center text-stone-500 bg-white border border-stone-200 text-sm">
            No active meal plan assigned yet. Ask your dietician to generate your custom plan!
          </div>
        )}
      </div>
    </div>
  );
}
