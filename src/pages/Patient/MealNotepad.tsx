import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMealPlans, MealPlan, Meal } from '../../services/db';
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
  Plus, 
  Trash2, 
  Save, 
  ChefHat, 
  FileText,
  AlertCircle,
  Lock
} from 'lucide-react';

interface ChecklistMealItem {
  id: string;
  mealType: string;
  name: string;
  portion: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  recipe?: string[];
  ingredients?: string[];
  completed: boolean;
  completedAt?: string;
}

export default function MealNotepad() {
  const { profile } = useAuth();
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [items, setItems] = useState<ChecklistMealItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [patientReflection, setPatientReflection] = useState('');
  const [notesSavedToast, setNotesSavedToast] = useState(false);
  const [customItemText, setCustomItemText] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
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
        const plans = await getMealPlans(profile.uid);
        const published = plans.find(p => p.status === 'published');
        setActivePlan(published || null);

        // Load saved checklist state from localStorage
        const savedRaw = localStorage.getItem(storageKey);
        const savedState: Record<string, { completed: boolean; completedAt?: string }> = savedRaw
          ? JSON.parse(savedRaw)
          : {};

        // Load reflection notes
        const savedReflection = localStorage.getItem(reflectionKey);
        if (savedReflection) setPatientReflection(savedReflection);

        let initialList: ChecklistMealItem[] = [];

        if (published && published.days && published.days.length > 0) {
          const dayPlan = published.days[0];
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
              recipe: m.recipe,
              ingredients: m.ingredients,
              completed: savedState[itemId]?.completed || false,
              completedAt: savedState[itemId]?.completedAt
            };
          });
        } else {
          // Baseline structured clinical checklist if dietician hasn't generated a plan yet
          initialList = [
            {
              id: 'base_1_water',
              mealType: 'Morning Routine',
              name: 'Warm Detox Water with Lemon & Chia Seeds',
              portion: '500ml',
              calories: 25,
              protein: 1,
              carbs: 3,
              fat: 1,
              notes: 'Drink slowly on an empty stomach to stimulate digestion and metabolic rate.',
              completed: savedState['base_1_water']?.completed || false,
              completedAt: savedState['base_1_water']?.completedAt
            },
            {
              id: 'base_2_breakfast',
              mealType: 'Breakfast',
              name: 'High Protein Oats Bowl or 2 Egg Omelette with Greens',
              portion: '1 medium bowl (approx. 200g)',
              calories: 360,
              protein: 24,
              carbs: 42,
              fat: 10,
              notes: 'Focus on high protein to stabilize blood sugar and prevent mid-morning energy dips.',
              completed: savedState['base_2_breakfast']?.completed || false,
              completedAt: savedState['base_2_breakfast']?.completedAt
            },
            {
              id: 'base_3_lunch',
              mealType: 'Lunch',
              name: 'Balanced Whole Grain Thali (Dal/Paneer/Chicken + Salad + 2 Rotis)',
              portion: '1 cup dal + 1 cup sabzi + 2 phulkas',
              calories: 480,
              protein: 28,
              carbs: 65,
              fat: 12,
              notes: 'Eat salad first, followed by protein, and finish with carbohydrates for optimal glucose control.',
              completed: savedState['base_3_lunch']?.completed || false,
              completedAt: savedState['base_3_lunch']?.completedAt
            },
            {
              id: 'base_4_snack',
              mealType: '4 PM Snack',
              name: 'Roasted Makhana / Chana + Green Tea',
              portion: '30g roasted chana + 1 cup green tea',
              calories: 140,
              protein: 6,
              carbs: 22,
              fat: 3,
              notes: 'Avoid refined sugars; choose complex fiber to stay energized until dinner.',
              completed: savedState['base_4_snack']?.completed || false,
              completedAt: savedState['base_4_snack']?.completedAt
            },
            {
              id: 'base_5_dinner',
              mealType: 'Dinner',
              name: 'Light Vegetable Clear Soup + Grilled Tofu/Fish/Stir-Fry',
              portion: '1 bowl soup + 150g grilled protein',
              calories: 340,
              protein: 26,
              carbs: 28,
              fat: 8,
              notes: 'Finish dinner at least 2.5 hours prior to sleeping for deep restful sleep.',
              completed: savedState['base_5_dinner']?.completed || false,
              completedAt: savedState['base_5_dinner']?.completedAt
            }
          ];
        }

        // Restore custom items added by user
        const customSaved = localStorage.getItem(`nutrisnap_custom_meals_${profile.uid}_${todayStr}`);
        if (customSaved) {
          try {
            const customItems: ChecklistMealItem[] = JSON.parse(customSaved);
            initialList = [...initialList, ...customItems];
          } catch (e) {
            console.warn(e);
          }
        }

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
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemText.trim() || !profile) return;

    const newItem: ChecklistMealItem = {
      id: `custom_${Date.now()}`,
      mealType: 'Custom Dietary Note',
      name: customItemText.trim(),
      portion: 'As consumed',
      completed: true,
      completedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };

    const updated = [...items, newItem];
    setItems(updated);

    // Save custom items
    const customOnly = updated.filter(i => i.id.startsWith('custom_'));
    localStorage.setItem(`nutrisnap_custom_meals_${profile.uid}_${todayStr}`, JSON.stringify(customOnly));

    const stateMap: Record<string, { completed: boolean; completedAt?: string }> = {};
    updated.forEach(it => {
      stateMap[it.id] = { completed: it.completed, completedAt: it.completedAt };
    });
    localStorage.setItem(storageKey, JSON.stringify(stateMap));

    setCustomItemText('');
    setShowAddCustom(false);
  };

  const handleRemoveCustomItem = (id: string) => {
    if (!profile) return;
    const updated = items.filter(it => it.id !== id);
    setItems(updated);

    const customOnly = updated.filter(i => i.id.startsWith('custom_'));
    localStorage.setItem(`nutrisnap_custom_meals_${profile.uid}_${todayStr}`, JSON.stringify(customOnly));

    const stateMap: Record<string, { completed: boolean; completedAt?: string }> = {};
    updated.forEach(it => {
      stateMap[it.id] = { completed: it.completed, completedAt: it.completedAt };
    });
    localStorage.setItem(storageKey, JSON.stringify(stateMap));
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
        <div className="divide-y divide-stone-200/70 p-4 md:p-8">
          {items.map((item, idx) => {
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
                    {(item.notes || item.ingredients || item.recipe) && (
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

                  {/* Delete button if custom item */}
                  {item.id.startsWith('custom_') && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomItem(item.id)}
                      className="text-stone-400 hover:text-red-500 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Quick Add Custom Food Item Form */}
          <div className="pt-4">
            {showAddCustom ? (
              <form onSubmit={handleAddCustomItem} className="p-4 bg-white rounded-2xl border border-stone-300 shadow-sm space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Add Additional Food or Custom Snack:
                </label>
                <input
                  type="text"
                  value={customItemText}
                  onChange={(e) => setCustomItemText(e.target.value)}
                  placeholder="e.g., Handful of almonds & walnuts (30g)"
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  autoFocus
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm"
                  >
                    Add to Checklist
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddCustom(true)}
                className="w-full py-3 border-2 border-dashed border-stone-300 hover:border-orange-400 text-stone-500 hover:text-orange-600 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-orange-50/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add an extra meal or snack you ate today
              </button>
            )}
          </div>
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
