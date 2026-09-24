import { useState, useEffect } from 'react';
import { getPatients, PatientProfile, MealPlan, saveMealPlan, getStoredRecipesFromDB, RecipeDBItem } from '../../services/db';
import { 
  Loader2, Wand2, Save, BookOpen, Utensils, RefreshCw, 
  Check, Search, Edit3, Trash2, Plus, Copy, 
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MealItem {
  type: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime?: string;
  cookTime?: string;
  ingredients?: string[] | string;
  recipe?: string[] | string;
  notes?: string;
}

interface DayPlan {
  dayNumber: number;
  dayName?: string;
  meals: MealItem[];
}

export default function MealPlanGenerator() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [dbRecipes, setDbRecipes] = useState<RecipeDBItem[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');
  
  const [targets, setTargets] = useState({ calories: 2000, protein: 120, carbs: 200, fat: 60 });
  const [instructions, setInstructions] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<DayPlan[] | null>(null);
  const [activeDayTab, setActiveDayTab] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [assignStatus, setAssignStatus] = useState<'draft' | 'published'>('published');
  
  // Swap Target state
  const [swapTarget, setSwapTarget] = useState<{ dayNumber: number; mealIndex: number } | null>(null);

  // Edit Meal Modal / Inline state
  const [editingMeal, setEditingMeal] = useState<{
    dayNumber: number;
    mealIndex: number;
    meal: MealItem;
  } | null>(null);

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
        
        // Auto-adapt targets if available from clinical profile
        if (patient) {
          const estimatedCals = patient.targetWeightKg ? Math.round(patient.targetWeightKg * 28) : 1900;
          setTargets(prev => ({
            ...prev,
            calories: estimatedCals,
            protein: Math.round((estimatedCals * 0.25) / 4),
            carbs: Math.round((estimatedCals * 0.50) / 4),
            fat: Math.round((estimatedCals * 0.25) / 9),
          }));
        }
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
      setActiveDayTab(1);
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
    const dayIdx = updated.findIndex((d) => d.dayNumber === swapTarget.dayNumber);
    if (dayIdx !== -1) {
      const existingMeal = updated[dayIdx].meals[swapTarget.mealIndex];
      updated[dayIdx].meals[swapTarget.mealIndex] = {
        type: existingMeal?.type || 'Meal',
        name: dbRecipe.name,
        portion: '1 portion',
        calories: Number(dbRecipe.calories) || 350,
        protein: Number(dbRecipe.protein) || 15,
        carbs: Number(dbRecipe.carbs) || 45,
        fat: Number(dbRecipe.fat) || 12,
        prepTime: dbRecipe.prepTime || '10 mins',
        cookTime: dbRecipe.cookTime || '15 mins',
        ingredients: dbRecipe.ingredients || [],
        recipe: dbRecipe.recipe || [],
        notes: `Assigned from Clinical Recipe Database (${dbRecipe.dietaryType || 'Standard'})`
      };
      setGeneratedPlan(updated);
    }
    setSwapTarget(null);
  };

  const handleSaveMealEdit = () => {
    if (!editingMeal || !generatedPlan) return;
    const updated = [...generatedPlan];
    const dayIdx = updated.findIndex(d => d.dayNumber === editingMeal.dayNumber);
    if (dayIdx !== -1) {
      updated[dayIdx].meals[editingMeal.mealIndex] = editingMeal.meal;
      setGeneratedPlan(updated);
    }
    setEditingMeal(null);
  };

  const handleDeleteMeal = (dayNumber: number, mealIndex: number) => {
    if (!generatedPlan) return;
    const updated = [...generatedPlan];
    const dayIdx = updated.findIndex(d => d.dayNumber === dayNumber);
    if (dayIdx !== -1) {
      updated[dayIdx].meals.splice(mealIndex, 1);
      setGeneratedPlan(updated);
    }
  };

  const handleAddMeal = (dayNumber: number) => {
    if (!generatedPlan) return;
    const updated = [...generatedPlan];
    const dayIdx = updated.findIndex(d => d.dayNumber === dayNumber);
    if (dayIdx !== -1) {
      const newMeal: MealItem = {
        type: 'Snack',
        name: 'New Custom Meal',
        portion: '1 serving',
        calories: 200,
        protein: 10,
        carbs: 25,
        fat: 6,
        ingredients: ['Custom ingredient'],
        recipe: ['Prepare as recommended.']
      };
      updated[dayIdx].meals.push(newMeal);
      setGeneratedPlan(updated);
    }
  };

  const handleCloneDay = (fromDayNumber: number) => {
    if (!generatedPlan) return;
    const sourceDay = generatedPlan.find(d => d.dayNumber === fromDayNumber);
    if (!sourceDay) return;

    if (!confirm(`Replicate Day ${fromDayNumber}'s menu across all other days in this plan?`)) return;

    const cloned = generatedPlan.map(d => {
      if (d.dayNumber === fromDayNumber) return d;
      return {
        ...d,
        meals: JSON.parse(JSON.stringify(sourceDay.meals))
      };
    });
    setGeneratedPlan(cloned);
  };

  const handleSave = async () => {
    if (!generatedPlan || !selectedPatientId) return;
    setSaving(true);
    try {
      const newPlan: MealPlan = {
        patientId: selectedPatientId,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: assignStatus,
        targets,
        days: generatedPlan,
        createdAt: new Date()
      };
      await saveMealPlan(newPlan);
      alert(`Meal plan successfully ${assignStatus === 'published' ? 'approved & published to client!' : 'saved as draft!'}`);
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

  // Compute daily macro totals for active day
  const currentDay = generatedPlan?.find(d => d.dayNumber === activeDayTab);
  const dayCalories = currentDay?.meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0) || 0;
  const dayProtein = currentDay?.meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0) || 0;
  const dayCarbs = currentDay?.meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0) || 0;
  const dayFat = currentDay?.meals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0) || 0;

  const calDiff = dayCalories - targets.calories;
  const calStatus = Math.abs(calDiff) <= 100 ? 'optimal' : calDiff > 100 ? 'over' : 'under';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto pb-28 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-stone-900">Meal Plan Studio</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
              Clinical Builder
            </span>
          </div>
          <p className="text-stone-500 text-xs mt-1">
            Construct tailored nutrition plans via AI generation, fine-tune individual meals, and swap verified recipes directly from your practice knowledge base.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client Dossier & Targets (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Step 1: Patient Select */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">1</span>
              Select Client
            </h3>
            <select 
              value={selectedPatientId} 
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">Select client profile...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.dietaryType || 'Standard'}) {p.targetWeightKg ? `• Target: ${p.targetWeightKg}kg` : ''}
                </option>
              ))}
            </select>

            {selectedPatient && (
              <div className="mt-4 p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-[11px]">Dietary Profile:</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-900 text-[10px] uppercase">
                    {selectedPatient.dietaryType || 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-[11px]">Primary Goals:</span>
                  <span className="font-semibold truncate max-w-[180px] text-right">
                    {selectedPatient.goals?.join(', ') || 'Metabolic Wellness'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-[11px]">Conditions & Allergies:</span>
                  <span className={`font-semibold ${selectedPatient.allergies?.length ? 'text-rose-600' : 'text-stone-700'}`}>
                    {selectedPatient.allergies?.join(', ') || selectedPatient.healthInfo?.conditions || 'None flagged'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Macros & Clinical Targets */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">2</span>
              Daily Nutrition Targets
            </h3>
            <div>
              <label className="block text-[11px] uppercase font-bold text-stone-500 mb-1">Total Caloric Ceiling (kcal)</label>
              <input 
                type="number" 
                value={targets.calories} 
                onChange={e => setTargets({...targets, calories: Number(e.target.value)})} 
                className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-orange-400" 
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Protein (g)</label>
                <input 
                  type="number" 
                  value={targets.protein} 
                  onChange={e => setTargets({...targets, protein: Number(e.target.value)})} 
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-400" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Carbs (g)</label>
                <input 
                  type="number" 
                  value={targets.carbs} 
                  onChange={e => setTargets({...targets, carbs: Number(e.target.value)})} 
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-400" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Fat (g)</label>
                <input 
                  type="number" 
                  value={targets.fat} 
                  onChange={e => setTargets({...targets, fat: Number(e.target.value)})} 
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-400" 
                />
              </div>
            </div>
          </div>

          {/* Step 3: Instructions & AI Generation */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">3</span>
              Clinical Prompt Directives
            </h3>
            <textarea 
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="E.g., High fiber focus, easy morning prep, vegetarian protein options, avoid refined sugars..."
              className="w-full border border-stone-300 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-orange-400 h-20 resize-none font-sans"
            />

            <button 
              onClick={handleGenerate}
              disabled={generating || !selectedPatientId}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold tracking-wider uppercase text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {generating ? 'Formulating Plan with Clinical DB...' : 'Synthesize Plan via AI Co-Pilot'}
            </button>
          </div>

          {/* Knowledge Base Recipe Swapper */}
          {selectedPatientId && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  Recipe Knowledge Base ({filteredDbRecipes.length})
                </h3>
                {loadingRecipes && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />}
              </div>

              <div className="mb-3 relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter practice recipes..."
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {swapTarget && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex justify-between items-center">
                  <span>Replacing <strong>Day {swapTarget.dayNumber} Meal {swapTarget.mealIndex + 1}</strong></span>
                  <button onClick={() => setSwapTarget(null)} className="font-bold underline text-amber-700">Cancel</button>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {filteredDbRecipes.map((r, i) => (
                  <div key={r.id || i} className="p-3 border border-stone-200 bg-stone-50 hover:bg-orange-50/40 transition-colors text-xs rounded-xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-stone-900">{r.name}</span>
                      <span className="text-orange-600 font-bold text-[11px]">{r.calories} kcal</span>
                    </div>
                    <p className="text-[10px] text-stone-500 truncate mb-2">
                      P: {r.protein}g • C: {r.carbs}g • F: {r.fat}g
                    </p>
                    
                    {swapTarget ? (
                      <button 
                        onClick={() => handleSwapRecipe(r)}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        Swap Into Day {swapTarget.dayNumber} Meal {swapTarget.mealIndex + 1}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSwapTarget({ dayNumber: activeDayTab, mealIndex: 0 })}
                        className="w-full py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-[10px] uppercase tracking-wider rounded transition-colors"
                      >
                        Select as Swap Candidate
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

        {/* Right Column: Interactive Day-by-Day Workspace (8 cols) */}
        <div className="lg:col-span-8">
          {generating && (
            <div className="h-96 border border-dashed border-stone-300 rounded-2xl flex items-center justify-center text-stone-500 flex-col gap-3 bg-white p-8">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
              <p className="text-sm font-semibold text-stone-800">Reviewing clinical targets and assembling recipes...</p>
              <p className="text-xs text-stone-400">Verifying macro balance against {targets.calories} kcal ceiling</p>
            </div>
          )}

          {!generating && !generatedPlan && (
            <div className="h-96 border border-dashed border-stone-300 rounded-2xl flex items-center justify-center text-stone-400 bg-white p-8 text-center flex-col gap-2">
              <Utensils className="w-10 h-10 text-stone-300 stroke-1" />
              <h3 className="font-bold text-stone-700 text-sm">Meal Plan Studio Ready</h3>
              <p className="text-xs text-stone-400 max-w-md">
                Select a client on the left and click "Synthesize Plan via AI Co-Pilot" to generate an initial 7-day protocol, or configure meals manually.
              </p>
            </div>
          )}

          {!generating && generatedPlan && (
            <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              {/* Studio Header Toolbar */}
              <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-base">Plan for {selectedPatient?.name}</h3>
                    <span className="text-[11px] font-bold text-stone-400">• 7-Day Protocol</span>
                  </div>
                  <p className="text-xs text-stone-500">Fine-tune portion sizes, swap recipes with knowledge base, and verify daily macros.</p>
                </div>

                <div className="flex items-center gap-3">
                  <select 
                    value={assignStatus} 
                    onChange={e => setAssignStatus(e.target.value as any)}
                    className="border border-stone-300 px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none rounded-xl bg-white focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="published">Approve & Publish to Patient</option>
                    <option value="draft">Save as Clinical Draft</option>
                  </select>

                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 rounded-xl shadow-xs"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-orange-400" />}
                    {assignStatus === 'published' ? 'Publish Plan' : 'Save Draft'}
                  </button>
                </div>
              </div>

              {/* Day Tabs */}
              <div className="px-5 pt-3 border-b border-stone-200 bg-white flex items-center justify-between overflow-x-auto gap-2">
                <div className="flex items-center gap-1.5">
                  {generatedPlan.map(d => (
                    <button
                      key={d.dayNumber}
                      onClick={() => setActiveDayTab(d.dayNumber)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                        activeDayTab === d.dayNumber
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      Day {d.dayNumber}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleCloneDay(activeDayTab)}
                  title="Copy this day's meals across all other days"
                  className="text-stone-500 hover:text-stone-900 text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clone Day {activeDayTab} to All</span>
                </button>
              </div>

              {/* Day Macro Diagnostic Bar */}
              <div className="px-6 py-3 bg-stone-50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-stone-700">Day {activeDayTab} Nutrition Balance:</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-900">{dayCalories} kcal</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-600">P: <strong className="text-stone-900">{dayProtein}g</strong></span>
                    <span className="text-stone-600">C: <strong className="text-stone-900">{dayCarbs}g</strong></span>
                    <span className="text-stone-600">F: <strong className="text-stone-900">{dayFat}g</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500">Target: {targets.calories} kcal</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    calStatus === 'optimal' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : calStatus === 'over' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {calStatus === 'optimal' ? 'On Target' : calStatus === 'over' ? `+${calDiff} kcal` : `${calDiff} kcal`}
                  </span>
                </div>
              </div>

              {/* Active Day Meals List */}
              <div className="p-6 space-y-4 max-h-[620px] overflow-y-auto">
                {currentDay?.meals.map((meal, idx) => {
                  const isSwapping = swapTarget?.dayNumber === activeDayTab && swapTarget?.mealIndex === idx;

                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border transition-all ${
                        isSwapping ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                            {meal.type}
                          </span>
                          <h4 className="font-bold text-stone-900 text-sm mt-1">{meal.name}</h4>
                          <span className="text-xs text-stone-500 font-medium">Portion: {meal.portion || '1 serving'}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs">
                            <span className="font-bold text-stone-900">{meal.calories} kcal</span>
                            <div className="text-[10px] text-stone-500">
                              P:{meal.protein}g • C:{meal.carbs}g • F:{meal.fat}g
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingMeal({ dayNumber: activeDayTab, mealIndex: idx, meal: { ...meal } })}
                              title="Edit meal portion and macros"
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button 
                              onClick={() => setSwapTarget({ dayNumber: activeDayTab, mealIndex: idx })}
                              title="Swap with recipe from knowledge base"
                              className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteMeal(activeDayTab, idx)}
                              title="Remove meal"
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Ingredients & Prep */}
                      <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1">
                        <p>
                          <strong className="text-stone-700">Ingredients:</strong>{' '}
                          {Array.isArray(meal.ingredients) ? meal.ingredients.join(', ') : meal.ingredients || 'None specified'}
                        </p>
                        <p>
                          <strong className="text-stone-700">Instructions:</strong>{' '}
                          {Array.isArray(meal.recipe) ? meal.recipe.join(' ') : meal.recipe || 'Standard preparation.'}
                        </p>
                        {meal.notes && (
                          <p className="text-[11px] text-stone-400 italic">Note: {meal.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add Meal to Day Button */}
                <button
                  onClick={() => handleAddMeal(activeDayTab)}
                  className="w-full py-3 border border-dashed border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:border-stone-400 hover:bg-stone-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-orange-500" />
                  Add Custom Meal / Snack to Day {activeDayTab}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Meal Modal */}
      {editingMeal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-stone-900 text-base mb-4 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-orange-500" />
              Edit Meal — Day {editingMeal.dayNumber}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block uppercase font-bold text-stone-500 mb-1">Meal Name</label>
                <input
                  type="text"
                  value={editingMeal.meal.name}
                  onChange={e => setEditingMeal({
                    ...editingMeal,
                    meal: { ...editingMeal.meal, name: e.target.value }
                  })}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-semibold outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold text-stone-500 mb-1">Meal Type</label>
                  <select
                    value={editingMeal.meal.type}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, type: e.target.value }
                    })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Morning Snack">Morning Snack</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Evening Snack">Evening Snack</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Bedtime Snack">Bedtime Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase font-bold text-stone-500 mb-1">Portion Size</label>
                  <input
                    type="text"
                    value={editingMeal.meal.portion}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, portion: e.target.value }
                    })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block uppercase font-bold text-stone-500 mb-1">Calories</label>
                  <input
                    type="number"
                    value={editingMeal.meal.calories}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, calories: Number(e.target.value) }
                    })}
                    className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-stone-500 mb-1">Protein</label>
                  <input
                    type="number"
                    value={editingMeal.meal.protein}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, protein: Number(e.target.value) }
                    })}
                    className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-stone-500 mb-1">Carbs</label>
                  <input
                    type="number"
                    value={editingMeal.meal.carbs}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, carbs: Number(e.target.value) }
                    })}
                    className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-stone-500 mb-1">Fat</label>
                  <input
                    type="number"
                    value={editingMeal.meal.fat}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, fat: Number(e.target.value) }
                    })}
                    className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase font-bold text-stone-500 mb-1">Ingredients (comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editingMeal.meal.ingredients) ? editingMeal.meal.ingredients.join(', ') : editingMeal.meal.ingredients || ''}
                  onChange={e => setEditingMeal({
                    ...editingMeal,
                    meal: { ...editingMeal.meal, ingredients: e.target.value.split(',').map(s => s.trim()) }
                  })}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingMeal(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMealEdit}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
