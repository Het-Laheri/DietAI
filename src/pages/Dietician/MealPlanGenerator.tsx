import { useState, useEffect } from 'react';
import { getPatients, PatientProfile, MealPlan, saveMealPlan, getStoredRecipesFromDB, RecipeDBItem } from '../../services/db';
import { Loader2, Wand2, Save, BookOpen, Utensils, RefreshCw, Check, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MealPlanGenerator() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [dbRecipes, setDbRecipes] = useState<RecipeDBItem[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');
  
  const [targets, setTargets] = useState({ calories: 2000, protein: 120, carbs: 200, fat: 60 });
  const [instructions, setInstructions] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [assignStatus, setAssignStatus] = useState<'draft' | 'published'>('published');
  
  const [swapTarget, setSwapTarget] = useState<{ dayNumber: number; mealIndex: number } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const pts = await getPatients();
      setPatients(pts);
    }
    load();
  }, []);

  // When patient selection changes, fetch relevant recipes from Firestore database
  useEffect(() => {
    async function loadRecipes() {
      if (!selectedPatientId) {
        setDbRecipes([]);
        return;
      }
      const patient = patients.find(p => p.id === selectedPatientId);
      setLoadingRecipes(true);
      try {
        const fetched = await getStoredRecipesFromDB(patient?.dietaryType);
        setDbRecipes(fetched);
      } catch (e) {
        console.error('Error fetching recipes from DB:', e);
      } finally {
        setLoadingRecipes(false);
      }
    }
    loadRecipes();
  }, [selectedPatientId, patients]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleGenerate = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient first.');
      return;
    }

    setGenerating(true);
    setGeneratedPlan(null);
    try {
      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile: selectedPatient,
          targets,
          instructions
        })
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setGeneratedPlan(data);
    } catch (e) {
      console.error(e);
      alert('Failed to generate meal plan. The AI might be overloaded or returning invalid JSON.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSwapRecipe = (dbRecipe: RecipeDBItem) => {
    if (!swapTarget || !generatedPlan) return;

    const updated = [...generatedPlan];
    const dayIdx = updated.findIndex((d: any) => d.dayNumber === swapTarget.dayNumber);
    if (dayIdx !== -1) {
      const existingMeal = updated[dayIdx].meals[swapTarget.mealIndex];
      updated[dayIdx].meals[swapTarget.mealIndex] = {
        type: existingMeal?.type || 'Meal',
        name: dbRecipe.name,
        portion: '1 portion',
        calories: dbRecipe.calories,
        protein: dbRecipe.protein,
        carbs: dbRecipe.carbs,
        fat: dbRecipe.fat,
        prepTime: dbRecipe.prepTime || '10 mins',
        cookTime: dbRecipe.cookTime || '15 mins',
        ingredients: dbRecipe.ingredients || [],
        recipe: dbRecipe.recipe || [],
        notes: `Assigned directly from Excel Database (${dbRecipe.dietaryType})`
      };
      setGeneratedPlan(updated);
    }
    setSwapTarget(null);
  };

  const handleSave = async () => {
    if (!generatedPlan || !selectedPatientId) return;
    setSaving(true);
    try {
      const newPlan: MealPlan = {
        patientId: selectedPatientId,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
        status: assignStatus,
        targets,
        days: generatedPlan,
        createdAt: new Date()
      };
      await saveMealPlan(newPlan);
      alert(`Meal plan successfully ${assignStatus === 'published' ? 'assigned & published to patient' : 'saved as draft'}!`);
      navigate(`/dietician/patients/${selectedPatientId}`);
    } catch (e) {
      console.error(e);
      alert('Failed to save meal plan.');
    } finally {
      setSaving(false);
    }
  };

  const filteredDbRecipes = dbRecipes.filter(r => 
    r.name.toLowerCase().includes(recipeSearch.toLowerCase()) || 
    (r.ingredients || []).join(' ').toLowerCase().includes(recipeSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-stone-900">Meal Plan Generator & Recipe DB Assigner</h1>
        <p className="text-stone-500 text-sm mt-1">Generate AI plans or assign exact Excel recipes from Cloud DB directly to your patient profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Patient & Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Select */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <h3 className="font-bold text-stone-900 mb-2">1. Select Patient</h3>
            <select 
              value={selectedPatientId} 
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900 bg-white"
            >
              <option value="">Select a patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.dietaryType})</option>
              ))}
            </select>

            {selectedPatient && (
              <div className="mt-3 p-3 bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-1">
                <p><strong>Dietary Type:</strong> {selectedPatient.dietaryType}</p>
                <p><strong>Clinical Goals:</strong> {selectedPatient.goals?.join(', ') || 'General Wellness'}</p>
                <p><strong>Conditions:</strong> {selectedPatient.healthInfo?.conditions || 'None'}</p>
              </div>
            )}
          </div>

          {/* Macros & Targets */}
          <div className="bg-white border border-stone-200 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-stone-900">2. Nutrition Targets</h3>
            <div>
              <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Daily Calories (kcal)</label>
              <input type="number" value={targets.calories} onChange={e => setTargets({...targets, calories: Number(e.target.value)})} className="w-full border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Protein (g)</label>
                <input type="number" value={targets.protein} onChange={e => setTargets({...targets, protein: Number(e.target.value)})} className="w-full border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900" />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Carbs (g)</label>
                <input type="number" value={targets.carbs} onChange={e => setTargets({...targets, carbs: Number(e.target.value)})} className="w-full border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900" />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Fat (g)</label>
                <input type="number" value={targets.fat} onChange={e => setTargets({...targets, fat: Number(e.target.value)})} className="w-full border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900" />
              </div>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <h3 className="font-bold text-stone-900 mb-2">3. Instructions & Restrictions</h3>
            <textarea 
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="E.g., High protein, easy prep, preference for rice over wheat..."
              className="w-full border border-stone-300 p-3 text-xs outline-none focus:border-stone-900 h-20 resize-none font-sans"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={generating || !selectedPatientId}
            className="w-full py-3.5 bg-brand-700 text-white font-bold tracking-widest uppercase text-xs rounded hover:bg-brand-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {generating ? 'Assembling from Recipe DB...' : 'Generate Plan via AI'}
          </button>

          {/* Fetched Excel Database Recipes Side Drawer */}
          {selectedPatientId && (
            <div className="bg-white border border-stone-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  Excel DB Recipes ({dbRecipes.length})
                </h3>
                {loadingRecipes && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
              </div>

              <div className="mb-3 relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter recipes in DB..."
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-stone-300 rounded text-xs outline-none focus:border-stone-900"
                />
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredDbRecipes.map((r, i) => (
                  <div key={r.id || i} className="p-3 border border-stone-200 bg-stone-50 hover:bg-emerald-50/40 transition-colors text-xs rounded">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-stone-900">{r.name}</span>
                      <span className="text-emerald-700 font-bold text-[11px]">{r.calories} kcal</span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mb-2">Ingredients: {r.ingredients?.join(', ') || 'N/A'}</p>
                    
                    {swapTarget && (
                      <button 
                        onClick={() => handleSwapRecipe(r)}
                        className="w-full py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Assign to Day {swapTarget.dayNumber} Meal {swapTarget.mealIndex + 1}
                      </button>
                    )}
                  </div>
                ))}
                {filteredDbRecipes.length === 0 && !loadingRecipes && (
                  <div className="text-center text-stone-400 text-xs py-4">No matching recipes in DB.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Generated Plan & Assignment Preview */}
        <div className="lg:col-span-2">
          {generating && (
            <div className="h-64 border border-dashed border-stone-300 flex items-center justify-center text-stone-500 flex-col gap-3 bg-white p-8">
              <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
              <p className="text-sm font-medium">Fetching matching recipes from Cloud DB & building custom plan...</p>
            </div>
          )}

          {!generating && !generatedPlan && (
            <div className="h-64 border border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-white p-8 text-center text-sm">
              Select a patient on the left and click Generate Plan to preview & assign recipes from your Cloud DB.
            </div>
          )}

          {!generating && generatedPlan && (
            <div className="bg-white border border-stone-200 shadow-sm">
              <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Assign Meal Plan — {selectedPatient?.name}</h3>
                  <p className="text-xs text-stone-500">Preview & swap individual meals directly from your Excel DB before publishing.</p>
                </div>

                <div className="flex items-center gap-3">
                  <select 
                    value={assignStatus} 
                    onChange={e => setAssignStatus(e.target.value as any)}
                    className="border border-stone-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-none rounded bg-white"
                  >
                    <option value="published">Publish & Assign Immediately</option>
                    <option value="draft">Save as Draft</option>
                  </select>

                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2 rounded"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save & Assign
                  </button>
                </div>
              </div>

              {swapTarget && (
                <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex justify-between items-center">
                  <span>Replacing <strong>Day {swapTarget.dayNumber} Meal {swapTarget.mealIndex + 1}</strong>. Click "Assign" on any Excel recipe in the left drawer.</span>
                  <button onClick={() => setSwapTarget(null)} className="font-bold underline">Cancel</button>
                </div>
              )}

              <div className="p-6 space-y-8 max-h-[750px] overflow-y-auto">
                {generatedPlan.map((day: any) => (
                  <div key={day.dayNumber} className="border-b border-stone-100 pb-6 last:border-0">
                    <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs">
                        {day.dayNumber}
                      </span>
                      Day {day.dayNumber} Menu
                    </h4>

                    <div className="space-y-4">
                      {day.meals.map((meal: any, idx: number) => {
                        const isSwapping = swapTarget?.dayNumber === day.dayNumber && swapTarget?.mealIndex === idx;

                        return (
                          <div key={idx} className={`p-4 border transition-colors ${isSwapping ? 'bg-amber-50 border-amber-400' : 'bg-stone-50 border-stone-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800 bg-brand-50 px-2 py-0.5 border border-brand-200">
                                  {meal.type}
                                </span>
                                <h5 className="font-bold text-stone-900 text-sm mt-1">{meal.name}</h5>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right text-xs text-stone-500 font-medium">
                                  <span className="font-bold text-stone-900">{meal.calories} kcal</span>
                                  <div className="text-[10px]">P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</div>
                                </div>

                                <button 
                                  onClick={() => setSwapTarget({ dayNumber: day.dayNumber, mealIndex: idx })}
                                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors text-xs font-bold flex items-center gap-1"
                                  title="Swap this meal with an Excel DB recipe"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                                  <span className="hidden sm:inline">Swap Recipe</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-stone-600 mb-1 font-sans">
                              <strong>Ingredients:</strong> {Array.isArray(meal.ingredients) ? meal.ingredients.join(', ') : meal.ingredients}
                            </p>
                            <p className="text-xs text-stone-600 font-sans">
                              <strong>Instructions:</strong> {Array.isArray(meal.recipe) ? meal.recipe.join(' ') : meal.recipe}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
