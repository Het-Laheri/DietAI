import { useState, useEffect } from 'react';
import { getPatients, PatientProfile, MealPlan, saveMealPlan, getStoredRecipesFromDB, RecipeDBItem,
  savePatientWeekPlan, getAllDraftWeekPlans, PatientWeekPlan, WeekDay, MealSlot, WeekPlanEntry,
  buildClinicalMealPlanFromRecipes, filterRecipesForPatient
} from '../../services/db';
import { 
  Loader2, Wand2, Save, BookOpen, Utensils, RefreshCw, 
  Check, Search, Edit3, Trash2, Plus, Copy, Calendar,
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, ChevronDown, ChevronUp,
  ShieldAlert, Activity, Flame
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

export type KbSlotItem = { recipe: RecipeDBItem; portion: string; notes: string };

export default function MealPlanGenerator() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [dbRecipes, setDbRecipes] = useState<RecipeDBItem[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeDietFilter, setRecipeDietFilter] = useState<string>('All');
  
  const [targets, setTargets] = useState({ calories: 2000, protein: 120, carbs: 200, fat: 60 });
  const [instructions, setInstructions] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<DayPlan[] | null>(null);
  const [activeDayTab, setActiveDayTab] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [assignStatus, setAssignStatus] = useState<'draft' | 'published'>('published');
  
  // Swap Target state: allows swapping a specific dish or adding a new dish to a specific slot
  const [swapTarget, setSwapTarget] = useState<{ dayNumber: number; mealIndex: number; mealSlot?: string } | null>(null);

  // Edit Meal Modal / Inline state
  const [editingMeal, setEditingMeal] = useState<{
    dayNumber: number;
    mealIndex: number;
    meal: MealItem;
  } | null>(null);

  // Studio tab: 'ai' | 'kb'
  const [studioTab, setStudioTab] = useState<'ai' | 'kb'>('ai');

  // KB Week Planner state — supports multiple dishes per meal slot
  const WEEK_DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime Snack'];
  const [kbWeekPlan, setKbWeekPlan] = useState<Record<string, Record<string, KbSlotItem[]>>>({});
  const [kbSaving, setKbSaving] = useState(false);
  const [kbExpandedRecipe, setKbExpandedRecipe] = useState<string | null>(null);
  const [kbAssigning, setKbAssigning] = useState<{ day: WeekDay; slot: MealSlot } | null>(null);

  const initKbWeekPlan = () => {
    const empty: Record<string, Record<string, KbSlotItem[]>> = {};
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
      empty[day] = {};
      for (const slot of ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime Snack']) {
        empty[day][slot] = [];
      }
    }
    return empty;
  };

  useEffect(() => { setKbWeekPlan(initKbWeekPlan()); }, []);

  const assignKbRecipe = (recipe: RecipeDBItem) => {
    if (!kbAssigning) return;
    setKbWeekPlan(prev => {
      const daySlots = prev[kbAssigning.day] || {};
      const currentItems = Array.isArray(daySlots[kbAssigning.slot]) ? daySlots[kbAssigning.slot] : [];
      return {
        ...prev,
        [kbAssigning.day]: {
          ...daySlots,
          [kbAssigning.slot]: [
            ...currentItems,
            { recipe, portion: recipe.portionSize || '1 serving', notes: '' }
          ]
        }
      };
    });
    setKbAssigning(null);
  };

  const removeKbEntry = (day: string, slot: string, itemIdx: number) => {
    setKbWeekPlan(prev => {
      const daySlots = prev[day] || {};
      const currentItems = Array.isArray(daySlots[slot]) ? [...daySlots[slot]] : [];
      currentItems.splice(itemIdx, 1);
      return {
        ...prev,
        [day]: { ...daySlots, [slot]: currentItems }
      };
    });
  };

  const saveKbWeekPlan = async (status: 'draft' | 'published') => {
    if (!selectedPatientId) { alert('Select a patient first.'); return; }
    setKbSaving(true);
    try {
      const entries: WeekPlanEntry[] = [];
      for (const [day, slots] of Object.entries(kbWeekPlan)) {
        for (const [slot, items] of Object.entries(slots)) {
          if (Array.isArray(items)) {
            items.forEach(val => {
              if (val && val.recipe) {
                entries.push({
                  day: day as WeekDay,
                  mealSlot: slot as MealSlot,
                  recipeId: val.recipe.id || val.recipe.name,
                  recipeName: val.recipe.name,
                  portion: val.portion || '1 serving',
                  notes: val.notes || ''
                });
              }
            });
          }
        }
      }
      if (entries.length === 0) { alert('No meals added to the plan yet.'); setKbSaving(false); return; }

      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const weekStart = monday.toISOString().split('T')[0];

      const existingPlans = await getAllDraftWeekPlans(selectedPatientId);
      const existing = existingPlans.find(p => p.weekStartDate === weekStart);

      const plan: PatientWeekPlan = {
        ...(existing || {}),
        patientId: selectedPatientId,
        weekStartDate: weekStart,
        entries,
        status
      };
      await savePatientWeekPlan(plan, 'dietician');

      // Also synchronize published MealPlan so all patient endpoints match
      if (status === 'published') {
        const daysMap: Record<number, MealItem[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
        const dayNames: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        dayNames.forEach((dName, dIdx) => {
          const dayNum = dIdx + 1;
          const daySlots = kbWeekPlan[dName] || {};
          Object.entries(daySlots).forEach(([slot, items]: [string, any]) => {
            if (Array.isArray(items)) {
              items.forEach(val => {
                if (val && val.recipe) {
                  daysMap[dayNum].push({
                    type: slot,
                    name: val.recipe.name,
                    portion: val.portion || '1 serving',
                    calories: Number(val.recipe.calories) || 300,
                    protein: Number(val.recipe.protein) || 15,
                    carbs: Number(val.recipe.carbs) || 35,
                    fat: Number(val.recipe.fat) || 8,
                    prepTime: val.recipe.prepTime || '10 mins',
                    cookTime: val.recipe.cookTime || '10 mins',
                    ingredients: val.recipe.ingredients || [],
                    recipe: val.recipe.recipe || [],
                    notes: val.notes || val.recipe.clinicalFocus
                  });
                }
              });
            }
          });
        });
        const syncedDays = Object.entries(daysMap).map(([dNum, mList]) => ({
          dayNumber: parseInt(dNum, 10),
          meals: mList
        }));
        const syncMealPlan: MealPlan = {
          patientId: selectedPatientId,
          startDate: weekStart,
          endDate: new Date(new Date(weekStart).getTime() + 7 * 86400000).toISOString().split('T')[0],
          status: 'published',
          targets,
          days: syncedDays as any,
          createdAt: new Date()
        };
        await saveMealPlan(syncMealPlan, 'dietician');
      }

      alert(`Week plan ${status === 'published' ? 'published to patient!' : 'saved as draft!'}`);
      if (status === 'published') navigate(`/dietician/patients/${selectedPatientId}`);
    } catch (e) {
      console.error(e);
      alert('Failed to save week plan.');
    } finally {
      setKbSaving(false);
    }
  };

  const navigate = useNavigate();


  useEffect(() => {
    async function load() {
      const pts = await getPatients();
      setPatients(pts);
    }
    load();
  }, []);

  // When patient selection changes, fetch relevant recipes from Firestore database and load existing draft plan
  useEffect(() => {
    async function loadRecipes() {
      if (!selectedPatientId) {
        setDbRecipes([]);
        setKbWeekPlan(initKbWeekPlan());
        return;
      }
      const patient = patients.find(p => p.id === selectedPatientId);
      if (!patient) return;
      setLoadingRecipes(true);
      try {
        const fetched = await getStoredRecipesFromDB(patient.dietaryType);
        
        const conds = [
          ...(patient.medicalHistory || []),
          ...(patient.healthInfo?.conditions && patient.healthInfo.conditions.toLowerCase() !== 'none'
            ? patient.healthInfo.conditions.split(',').map(c => c.trim())
            : []),
          ...(patient.diagnosisOrProcedure ? [patient.diagnosisOrProcedure] : [])
        ].filter((v, i, a) => v && v.toLowerCase() !== 'none' && v.toLowerCase() !== 'nil' && a.indexOf(v) === i);

        const allgs = [
          ...(Array.isArray(patient.allergies) ? patient.allergies : []),
          ...(patient.healthInfo?.allergies && patient.healthInfo.allergies.toLowerCase() !== 'none'
            ? patient.healthInfo.allergies.split(',').map(a => a.trim())
            : [])
        ].filter((v, i, a) => v && v.toLowerCase() !== 'none' && v.toLowerCase() !== 'nil' && a.indexOf(v) === i);

        const safeRecipes = filterRecipesForPatient(fetched, conds, allgs);
        setDbRecipes(safeRecipes);
        
        // Auto-adapt targets from clinical profile
        const estimatedCals = patient.targetWeightKg ? Math.round(patient.targetWeightKg * 28) : 1900;
        setTargets(prev => ({
          ...prev,
          calories: estimatedCals,
          protein: Math.round((estimatedCals * 0.25) / 4),
          carbs: Math.round((estimatedCals * 0.50) / 4),
          fat: Math.round((estimatedCals * 0.25) / 9),
        }));

        // Populate clinical instructions with patient's conditions and allergies
        const directiveParts = [];
        if (conds.length > 0) directiveParts.push(`Medical Conditions: ${conds.join(', ')}`);
        if (allgs.length > 0) directiveParts.push(`Strict Allergies: ${allgs.join(', ')} (ZERO allergen exposure)`);
        if (patient.preferences?.dislikes && patient.preferences.dislikes.toLowerCase() !== 'none') {
          directiveParts.push(`Dislikes: ${patient.preferences.dislikes}`);
        }
        if (directiveParts.length > 0) {
          setInstructions(directiveParts.join(' • '));
        }

        // Load existing draft week plan if present
        const existingPlans = await getAllDraftWeekPlans(patient.id);
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const weekStart = monday.toISOString().split('T')[0];
        const draft = existingPlans.find(p => p.weekStartDate === weekStart);

        const freshState = initKbWeekPlan();
        if (draft && Array.isArray(draft.entries)) {
          draft.entries.forEach(entry => {
            const r = fetched.find(rec => rec.name.toLowerCase() === entry.recipeName.toLowerCase()) || {
              name: entry.recipeName,
              dietaryType: patient.dietaryType || 'Vegetarian',
              calories: 300,
              protein: 15,
              carbs: 35,
              fat: 8,
              ingredients: [],
              recipe: []
            };
            if (freshState[entry.day] && Array.isArray(freshState[entry.day][entry.mealSlot])) {
              freshState[entry.day][entry.mealSlot].push({
                recipe: r,
                portion: entry.portion || '1 serving',
                notes: entry.notes || ''
              });
            }
          });
        }
        setKbWeekPlan(freshState);
      } catch (e) {
        console.error('Error fetching recipes from DB:', e);
      } finally {
        setLoadingRecipes(false);
      }
    }
    loadRecipes();
  }, [selectedPatientId, patients]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Clean deduplicated conditions, allergies, and dislikes for selected patient
  const patientConditions = selectedPatient ? [
    ...(selectedPatient.medicalHistory || []),
    ...(selectedPatient.healthInfo?.conditions && selectedPatient.healthInfo.conditions.toLowerCase() !== 'none'
      ? selectedPatient.healthInfo.conditions.split(',').map(c => c.trim())
      : []),
    ...(selectedPatient.diagnosisOrProcedure ? [selectedPatient.diagnosisOrProcedure] : [])
  ].filter((v, i, a) => v && v.toLowerCase() !== 'none' && v.toLowerCase() !== 'nil' && a.indexOf(v) === i) : [];

  const patientAllergies = selectedPatient ? [
    ...(Array.isArray(selectedPatient.allergies) ? selectedPatient.allergies : []),
    ...(selectedPatient.healthInfo?.allergies && selectedPatient.healthInfo.allergies.toLowerCase() !== 'none'
      ? selectedPatient.healthInfo.allergies.split(',').map(a => a.trim())
      : [])
  ].filter((v, i, a) => v && v.toLowerCase() !== 'none' && v.toLowerCase() !== 'nil' && a.indexOf(v) === i) : [];

  const patientDislikes = selectedPatient?.preferences?.dislikes && selectedPatient.preferences.dislikes.toLowerCase() !== 'none'
    ? selectedPatient.preferences.dislikes.split(',').map(d => d.trim()).filter(Boolean)
    : [];

  const handleGenerate = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient first.');
      return;
    }

    setGenerating(true);
    setGeneratedPlan(null);
    try {
      // 1. Fetch pre-provided recipes database with both conditions and allergies filtered
      const pool = dbRecipes.length > 0 
        ? dbRecipes 
        : filterRecipesForPatient(await getStoredRecipesFromDB(selectedPatient?.dietaryType), patientConditions, patientAllergies);

      // Attempt AI generation with strict instruction to select only from pre-provided recipes
      let planGenerated: DayPlan[] | null = null;
      try {
        const res = await fetch('/api/ai/meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientProfile: selectedPatient,
            targets,
            instructions,
            availableRecipes: pool
          })
        });
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length === 7) {
            // Verify every meal exists in pre-provided recipes
            const allValid = raw.every((d: any) =>
              Array.isArray(d.meals) &&
              d.meals.length > 0 &&
              d.meals.every((m: any) => pool.some(r => r.name.toLowerCase() === m.name.toLowerCase()))
            );
            if (allValid) {
              planGenerated = raw;
            }
          }
        }
      } catch (aiErr) {
        console.warn('AI endpoint note; utilizing clinical recipe matching:', aiErr);
      }

      // If AI didn't return or hallucinated items outside pre-provided recipes, assemble directly from pre-provided recipes
      if (!planGenerated) {
        planGenerated = buildClinicalMealPlanFromRecipes(pool, selectedPatient, targets) as DayPlan[];
      }

      setGeneratedPlan(planGenerated);
      setActiveDayTab(1);
    } catch (e) {
      console.error(e);
      alert('Failed to generate meal plan.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSwapRecipe = (dbRecipe: RecipeDBItem) => {
    if (!swapTarget || !generatedPlan) return;

    const updated = [...generatedPlan];
    const dayIdx = updated.findIndex((d) => d.dayNumber === swapTarget.dayNumber);
    if (dayIdx !== -1) {
      const existingMeal = swapTarget.mealIndex >= 0 ? updated[dayIdx].meals[swapTarget.mealIndex] : null;
      const targetSlot = swapTarget.mealSlot || existingMeal?.type || 'Lunch';

      const newMealObj: MealItem = {
        type: targetSlot,
        name: dbRecipe.name,
        portion: dbRecipe.portionSize || '1 serving',
        calories: Number(dbRecipe.calories) || 300,
        protein: Number(dbRecipe.protein) || 15,
        carbs: Number(dbRecipe.carbs) || 35,
        fat: Number(dbRecipe.fat) || 8,
        prepTime: dbRecipe.prepTime || '10 mins',
        cookTime: dbRecipe.cookTime || '15 mins',
        ingredients: dbRecipe.ingredients || [],
        recipe: dbRecipe.recipe || [],
        notes: `Clinical Approved Recipe (${dbRecipe.dietaryType || 'Standard'}) — ${dbRecipe.clinicalFocus || 'Balanced Nutrition'}`
      };

      if (swapTarget.mealIndex >= 0) {
        updated[dayIdx].meals[swapTarget.mealIndex] = newMealObj;
      } else {
        updated[dayIdx].meals.push(newMealObj);
      }
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
    // Open recipe selector to only allow pre-provided recipes
    setSwapTarget({ dayNumber, mealIndex: -1 });
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
        days: generatedPlan as any,
        createdAt: new Date()
      };
      await saveMealPlan(newPlan, 'dietician');
      alert(`Meal plan successfully ${assignStatus === 'published' ? 'approved & published to client!' : 'saved as draft!'}`);
      navigate(`/dietician/patients/${selectedPatientId}`);
    } catch (e) {
      console.error(e);
      alert('Failed to save meal plan.');
    } finally {
      setSaving(false);
    }
  };

  const filteredDbRecipes = dbRecipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(recipeSearch.toLowerCase()) || 
      (r.ingredients || []).join(' ').toLowerCase().includes(recipeSearch.toLowerCase());
    const matchesDiet = recipeDietFilter === 'All' || (r.dietaryType || '').toLowerCase() === recipeDietFilter.toLowerCase();
    return matchesSearch && matchesDiet;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-900">Meal Plan Studio</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200/60">
              Clinical Builder
            </span>
          </div>
          <p className="text-stone-500 text-xs mt-1">
            Build AI-generated plans or manually assign recipes from your Knowledge Base to a patient's full week.
          </p>
        </div>
      </div>

      {/* Clinical Safeguards Alert Banner */}
      {selectedPatient && (patientConditions.length > 0 || patientAllergies.length > 0) && (
        <div className="mb-5 p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-950 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                Clinical Safeguards Active for {selectedPatient.name}
              </span>
              <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                ✓ {dbRecipes.length} safe recipes available
              </span>
            </div>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              {patientConditions.length > 0 && <><strong>Medical Conditions:</strong> {patientConditions.join(', ')} • </>}
              {patientAllergies.length > 0 && <><strong>Strict Allergies:</strong> <span className="text-rose-700 font-bold">{patientAllergies.join(', ')}</span> (zero allergen exposure) • </>}
              All recipes containing contraindicated ingredients or client allergens are safely excluded from generation and assignment.
            </p>
          </div>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex items-center gap-1.5 mb-6 border-b border-stone-200">
        <button
          onClick={() => setStudioTab('ai')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${studioTab === 'ai' ? 'border-orange-500 text-orange-700 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Generator
        </button>
        <button
          onClick={() => setStudioTab('kb')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${studioTab === 'kb' ? 'border-orange-500 text-orange-700 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Build from Knowledge Base
        </button>
      </div>

      {/* ═════════════ KB WEEK PLANNER TAB ════════════════════════════════════ */}
      {studioTab === 'kb' && (
        <div className="space-y-5">
          {/* Patient selector */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-xs">
            <h3 className="font-serif font-bold text-stone-900 text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Select Patient
            </h3>
            <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-orange-500 bg-white"
            >
              <option value="">Select patient profile...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.dietaryType || 'Standard'})</option>
              ))}
            </select>

            {selectedPatient && (
              <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2.5 text-xs">
                <span className="text-stone-500 font-medium">Dietary Type:</span>
                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold uppercase">
                  {selectedPatient.dietaryType || 'Standard'}
                </span>
                {patientConditions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-stone-500 text-[11px] font-medium flex items-center gap-0.5">
                      <Activity className="w-3 h-3 text-blue-600" /> Conditions:
                    </span>
                    {patientConditions.map((c, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                {patientAllergies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-stone-500 text-[11px] font-medium flex items-center gap-0.5">
                      <ShieldAlert className="w-3 h-3 text-rose-600" /> Allergies:
                    </span>
                    {patientAllergies.map((a, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> {a}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-auto font-semibold">
                  ✓ {dbRecipes.length} safe recipes
                </span>
              </div>
            )}
          </div>

          {/* KB Recipe Picker */}
          {kbAssigning && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-amber-900 text-xs flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  Choose a recipe for <strong>{kbAssigning.day} — {kbAssigning.slot}</strong>
                </h3>
                <button onClick={() => setKbAssigning(null)} className="text-amber-700 text-xs font-semibold underline">Cancel</button>
              </div>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search practice recipes..." value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-amber-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                />
              </div>
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-[10px]">
                {['All', 'Non-Vegetarian', 'Vegetarian', 'Jain', 'Eggetarian', 'Vegan'].map(diet => (
                  <button
                    key={diet}
                    onClick={() => setRecipeDietFilter(diet)}
                    className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                      recipeDietFilter === diet
                        ? 'bg-amber-900 text-white'
                        : 'bg-white border border-amber-200 text-stone-600 hover:bg-amber-100/50'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto">
                {filteredDbRecipes.map((r, i) => (
                  <button key={r.id || i} onClick={() => assignKbRecipe(r)}
                    className="p-3 border border-stone-200 bg-white hover:bg-emerald-50/50 hover:border-emerald-300 text-left rounded-lg transition-colors shadow-2xs"
                  >
                    <p className="font-bold text-stone-900 text-xs leading-tight">{r.name}</p>
                    <p className="text-[10px] text-stone-500 mt-1">{r.calories} kcal · {r.dietaryType}</p>
                    <p className="text-[10px] text-stone-400">P:{r.protein}g C:{r.carbs}g F:{r.fat}g</p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">→ Assign to {kbAssigning.slot}</p>
                  </button>
                ))}
                {filteredDbRecipes.length === 0 && <p className="text-xs text-stone-400 py-4 col-span-3 text-center">No recipes found.</p>}
              </div>
            </div>
          )}

          {/* Week Grid */}
          <div className="bg-white border border-stone-200/90 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 bg-stone-50/70 flex justify-between items-center">
              <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" /> Weekly Meal Assignment Grid
              </h3>
              {loadingRecipes && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600">
                    <th className="p-3 text-left font-bold uppercase tracking-wider w-32">Meal Slot</th>
                    {WEEK_DAYS.map(day => (
                      <th key={day} className="p-3 text-center font-bold uppercase tracking-wider min-w-[120px]">{day.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEAL_SLOTS.map(slot => (
                    <tr key={slot} className="border-b border-stone-100 hover:bg-stone-50/40">
                      <td className="p-3 font-semibold text-stone-700 bg-stone-50/60 border-r border-stone-200">
                        {slot}
                      </td>
                      {WEEK_DAYS.map(day => {
                        const items = kbWeekPlan[day]?.[slot] || [];
                        const slotCalories = items.reduce((sum, item) => sum + (Number(item.recipe.calories) || 0), 0);
                        return (
                          <td key={day} className="p-2 border-r border-stone-100 align-top min-w-[140px]">
                            <div className="space-y-1.5">
                              {items.map((item, itemIdx) => (
                                <div key={itemIdx} className="bg-emerald-50/80 border border-emerald-200/90 rounded-lg p-2 relative shadow-2xs group">
                                  <button onClick={() => removeKbEntry(day, slot, itemIdx)}
                                    className="absolute top-1 right-1 text-stone-400 hover:text-rose-600 transition-colors"
                                    title="Remove this dish"
                                  >×</button>
                                  <p className="font-bold text-emerald-950 pr-3 leading-tight text-[11px]">{item.recipe.name}</p>
                                  <p className="text-emerald-700 text-[10px] mt-0.5">{item.recipe.calories} kcal • {item.portion}</p>
                                </div>
                              ))}

                              {items.length > 0 && (
                                <div className="text-[9px] text-stone-500 font-semibold px-1 flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>{slotCalories} kcal</span>
                                </div>
                              )}

                              <button
                                onClick={() => { if (!selectedPatientId) { alert('Select a patient first'); return; } setKbAssigning({ day, slot }); }}
                                className={`w-full py-1.5 border border-dashed rounded-lg text-stone-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/40 transition-all flex items-center justify-center gap-1 text-[10px] font-semibold ${
                                  items.length === 0 ? 'h-12 border-stone-200 text-stone-400' : 'border-stone-200/80 bg-white/70'
                                }`}
                                title={`Add dish to ${day} ${slot}`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>{items.length === 0 ? 'Add Dish' : '+ Add Another'}</span>
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save buttons */}
            <div className="p-4 border-t border-stone-100 bg-stone-50/70 flex justify-end gap-2.5">
              <button onClick={() => saveKbWeekPlan('draft')} disabled={kbSaving || !selectedPatientId}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {kbSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-stone-500" />}
                Save Draft
              </button>
              <button onClick={() => saveKbWeekPlan('published')} disabled={kbSaving || !selectedPatientId}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {kbSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Publish to Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════ AI GENERATOR TAB ════════════════════════════════════════ */}
      {studioTab === 'ai' && (<>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client Dossier & Targets (4 cols) */}
        <div className="lg:col-span-4 space-y-5">

          {/* Step 1: Patient Select */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-xs">
            <h3 className="font-serif font-bold text-stone-900 text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Select Client
            </h3>
            <select 
              value={selectedPatientId} 
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-orange-500 bg-white"
            >
              <option value="">Select client profile...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.dietaryType || 'Standard'}) {p.targetWeightKg ? `• Target: ${p.targetWeightKg}kg` : ''}
                </option>
              ))}
            </select>

            {selectedPatient && (
              <div className="mt-3.5 p-3.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs text-stone-700 space-y-2.5 shadow-2xs">
                {/* Dietary Profile */}
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-[11px] font-medium">Dietary Type:</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200/60 text-[10px] uppercase">
                    {selectedPatient.dietaryType || 'Standard'}
                  </span>
                </div>

                {/* Primary Goals */}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-stone-500 text-[11px] font-medium shrink-0">Goals:</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {(selectedPatient.goals?.length ? selectedPatient.goals : ['Metabolic Wellness']).map((g, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-stone-200/70 text-stone-800 text-[10px] font-semibold">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pre-existing Medical Conditions */}
                <div className="pt-2 border-t border-stone-200/70">
                  <span className="text-stone-500 text-[11px] font-semibold block mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-600" /> Pre-existing Conditions:
                  </span>
                  {patientConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patientConditions.map((cond, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                          {cond}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-stone-400 text-[11px] italic">None flagged</span>
                  )}
                </div>

                {/* Allergies & Intolerances */}
                <div className="pt-2 border-t border-stone-200/70">
                  <span className="text-stone-500 text-[11px] font-semibold block mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600" /> Allergies & Intolerances:
                  </span>
                  {patientAllergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patientAllergies.map((allg, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> {allg}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-stone-400 text-[11px] italic">None reported (Zero allergies)</span>
                  )}
                </div>

                {/* Food Dislikes */}
                {patientDislikes.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/70 flex justify-between items-start gap-2">
                    <span className="text-stone-500 text-[11px] font-semibold shrink-0">Dislikes:</span>
                    <span className="text-[10px] font-medium text-stone-600 text-right">
                      {patientDislikes.join(', ')}
                    </span>
                  </div>
                )}

                {/* Safe Recipe Pool Indicator */}
                <div className="pt-2 border-t border-stone-200/70 flex justify-between items-center text-[10px]">
                  <span className="text-stone-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Clinical Pool:
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {dbRecipes.length} safe recipes active
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Macros & Clinical Targets */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              Daily Nutrition Targets
            </h3>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Total Caloric Ceiling (kcal)</label>
              <input 
                type="number" 
                value={targets.calories} 
                onChange={e => setTargets({...targets, calories: Number(e.target.value)})} 
                className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-orange-500" 
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Protein (g)</label>
                <input 
                  type="number" 
                  value={targets.protein} 
                  onChange={e => setTargets({...targets, protein: Number(e.target.value)})} 
                  className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-orange-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Carbs (g)</label>
                <input 
                  type="number" 
                  value={targets.carbs} 
                  onChange={e => setTargets({...targets, carbs: Number(e.target.value)})} 
                  className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-orange-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Fat (g)</label>
                <input 
                  type="number" 
                  value={targets.fat} 
                  onChange={e => setTargets({...targets, fat: Number(e.target.value)})} 
                  className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-orange-500" 
                />
              </div>
            </div>
          </div>

          {/* Step 3: Instructions & AI Generation */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold">3</span>
              Clinical Prompt Directives
            </h3>
            <textarea 
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="E.g., High fiber focus, easy morning prep, vegetarian protein options, avoid refined sugars..."
              className="w-full border border-stone-200 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-orange-500 h-20 resize-none font-sans"
            />

            <button 
              onClick={handleGenerate}
              disabled={generating || !selectedPatientId}
              className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-semibold tracking-wider uppercase text-xs rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-orange-400" />}
              {generating ? 'Formulating Plan with Clinical DB...' : 'Synthesize Plan via AI Co-Pilot'}
            </button>
          </div>

          {/* Knowledge Base Recipe Swapper */}
          {selectedPatientId && (
            <div className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-serif font-bold text-stone-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                  Recipe Knowledge Base ({filteredDbRecipes.length})
                </h3>
                {loadingRecipes && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />}
              </div>

              <div className="mb-2 relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter practice recipes..."
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-[10px]">
                {['All', 'Non-Vegetarian', 'Vegetarian', 'Jain', 'Eggetarian', 'Vegan'].map(diet => (
                  <button
                    key={diet}
                    onClick={() => setRecipeDietFilter(diet)}
                    className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                      recipeDietFilter === diet
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>

              {swapTarget && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex justify-between items-center shadow-2xs">
                  <span>
                    {swapTarget.mealIndex >= 0 
                      ? <>Replacing <strong>Day {swapTarget.dayNumber} {swapTarget.mealSlot || 'Dish'}</strong></> 
                      : <>Adding dish to <strong>Day {swapTarget.dayNumber} • {swapTarget.mealSlot || 'Course'}</strong></>}
                  </span>
                  <button onClick={() => setSwapTarget(null)} className="font-bold underline text-amber-700">Cancel</button>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {filteredDbRecipes.map((r, i) => (
                  <div key={r.id || i} className="p-3 border border-stone-200/80 bg-stone-50/70 hover:bg-orange-50/30 transition-colors text-xs rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-stone-900">{r.name}</span>
                      <span className="text-orange-600 font-bold text-[11px]">{r.calories} kcal</span>
                    </div>
                    <p className="text-[10px] text-stone-500 truncate mb-1">
                      P: {r.protein}g • C: {r.carbs}g • F: {r.fat}g
                    </p>
                    {r.tags && r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {r.tags.slice(0, 3).map((t, tIdx) => (
                          <span key={tIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {swapTarget ? (
                      <button 
                        onClick={() => handleSwapRecipe(r)}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        {swapTarget.mealIndex >= 0 
                          ? `Swap Into Day ${swapTarget.dayNumber} ${swapTarget.mealSlot || ''}`
                          : `Add to Day ${swapTarget.dayNumber} • ${swapTarget.mealSlot || 'Dish'}`}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSwapTarget({ dayNumber: activeDayTab, mealIndex: 0 })}
                        className="w-full py-1 bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-semibold text-[10px] uppercase tracking-wider rounded transition-colors"
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
            <div className="h-96 border border-dashed border-stone-200 rounded-xl flex items-center justify-center text-stone-500 flex-col gap-3 bg-white p-8 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-sm font-semibold text-stone-800">Reviewing clinical targets and assembling recipes...</p>
              <p className="text-xs text-stone-400">Verifying macro balance against {targets.calories} kcal ceiling</p>
            </div>
          )}

          {!generating && !generatedPlan && (
            <div className="h-96 border border-dashed border-stone-200 rounded-xl flex items-center justify-center text-stone-400 bg-white p-8 text-center flex-col gap-2 shadow-xs">
              <Utensils className="w-8 h-8 text-stone-300 stroke-1" />
              <h3 className="font-serif font-bold text-stone-800 text-sm">Meal Plan Studio Ready</h3>
              <p className="text-xs text-stone-400 max-w-md">
                Select a client on the left and click "Synthesize Plan via AI Co-Pilot" to generate an initial 7-day protocol, or configure meals manually.
              </p>
            </div>
          )}

          {!generating && generatedPlan && (
            <div className="bg-white border border-stone-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col">
              {/* Studio Header Toolbar */}
              <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-stone-900 text-base">Plan for {selectedPatient?.name}</h3>
                    <span className="text-[11px] font-semibold text-stone-400">• 7-Day Protocol</span>
                  </div>
                  <p className="text-xs text-stone-500">Fine-tune portion sizes, swap recipes with knowledge base, and verify daily macros.</p>
                </div>

                <div className="flex items-center gap-2.5">
                  <select 
                    value={assignStatus} 
                    onChange={e => setAssignStatus(e.target.value as any)}
                    className="border border-stone-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider outline-none rounded-lg bg-white focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="published">Approve & Publish to Patient</option>
                    <option value="draft">Save as Clinical Draft</option>
                  </select>

                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 rounded-lg shadow-xs"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-orange-400" />}
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
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        activeDayTab === d.dayNumber
                          ? 'bg-stone-900 text-white shadow-2xs'
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
                  className="text-stone-500 hover:text-stone-900 text-xs font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-stone-200 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clone Day {activeDayTab} to All</span>
                </button>
              </div>

              {/* Day Macro Diagnostic Bar */}
              <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-stone-700">Day {activeDayTab} Balance:</span>
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
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    calStatus === 'optimal' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' 
                      : calStatus === 'over' 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200/60' 
                      : 'bg-blue-50 text-blue-800 border border-blue-200/60'
                  }`}>
                    {calStatus === 'optimal' ? 'On Target' : calStatus === 'over' ? `+${calDiff} kcal` : `${calDiff} kcal`}
                  </span>
                </div>
              </div>

              {/* Active Day Meals List organized by clinical meal slots */}
              <div className="p-5 space-y-4 max-h-[660px] overflow-y-auto">
                {(() => {
                  const dayMeals = currentDay?.meals || [];
                  const STANDARD_SLOTS = ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime Snack'];
                  
                  // Group indexed meals by standard slot
                  const bySlot: Record<string, { meal: MealItem; globalIndex: number }[]> = {};
                  STANDARD_SLOTS.forEach(s => { bySlot[s] = []; });
                  const customMeals: { meal: MealItem; globalIndex: number }[] = [];

                  dayMeals.forEach((m, idx) => {
                    const match = STANDARD_SLOTS.find(s => s.toLowerCase() === (m.type || '').toLowerCase());
                    if (match) {
                      bySlot[match].push({ meal: m, globalIndex: idx });
                    } else {
                      customMeals.push({ meal: m, globalIndex: idx });
                    }
                  });

                  return (<>
                    {STANDARD_SLOTS.map(slot => {
                      const items = bySlot[slot] || [];
                      const slotKcal = items.reduce((sum, item) => sum + (Number(item.meal.calories) || 0), 0);
                      const slotProtein = items.reduce((sum, item) => sum + (Number(item.meal.protein) || 0), 0);

                      return (
                        <div key={slot} className="bg-stone-50/60 border border-stone-200/90 rounded-xl p-3.5 space-y-2.5">
                          {/* Slot Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-stone-900 text-white shadow-2xs">
                                {slot}
                              </span>
                              <span className="text-[11px] text-stone-500 font-medium">
                                {items.length} {items.length === 1 ? 'dish' : 'dishes'}
                              </span>
                              {items.length > 0 && (
                                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
                                  {slotKcal} kcal • {slotProtein}g P
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => setSwapTarget({ dayNumber: activeDayTab, mealIndex: -1, mealSlot: slot })}
                              className="px-2.5 py-1 bg-white hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 border border-stone-200 text-stone-700 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1 shadow-2xs"
                              title={`Add another dish to ${slot}`}
                            >
                              <Plus className="w-3 h-3 text-orange-600" />
                              Add Dish to {slot}
                            </button>
                          </div>

                          {/* Items in this slot */}
                          {items.length === 0 ? (
                            <div className="py-2.5 px-3 border border-dashed border-stone-200 rounded-lg text-stone-400 text-xs flex justify-between items-center bg-white/50">
                              <span className="text-[11px] italic">No dishes in {slot} yet.</span>
                              <button
                                onClick={() => setSwapTarget({ dayNumber: activeDayTab, mealIndex: -1, mealSlot: slot })}
                                className="text-orange-600 hover:text-orange-700 text-[10px] font-bold flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add First Dish
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {items.map(({ meal, globalIndex }) => {
                                const isSwapping = swapTarget?.dayNumber === activeDayTab && swapTarget?.mealIndex === globalIndex;
                                return (
                                  <div
                                    key={globalIndex}
                                    className={`p-3.5 rounded-lg border transition-all ${
                                      isSwapping ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/40' : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                                    }`}
                                  >
                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-1.5">
                                      <div>
                                        <h4 className="font-bold text-stone-900 text-xs sm:text-sm">{meal.name}</h4>
                                        <span className="text-[11px] text-stone-500 font-medium">Portion: {meal.portion || '1 serving'}</span>
                                      </div>

                                      <div className="flex items-center gap-2.5">
                                        <div className="text-right text-xs">
                                          <span className="font-bold text-stone-900">{meal.calories} kcal</span>
                                          <div className="text-[10px] text-stone-500">
                                            P:{meal.protein}g • C:{meal.carbs}g • F:{meal.fat}g
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => setEditingMeal({ dayNumber: activeDayTab, mealIndex: globalIndex, meal: { ...meal } })}
                                            title="Edit portion and macros"
                                            className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => setSwapTarget({ dayNumber: activeDayTab, mealIndex: globalIndex, mealSlot: slot })}
                                            title="Swap with recipe from knowledge base"
                                            className="p-1 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                          >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteMeal(activeDayTab, globalIndex)}
                                            title="Remove dish"
                                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Ingredients & Prep */}
                                    <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-600 space-y-0.5">
                                      <p>
                                        <strong className="text-stone-700">Ingredients:</strong>{' '}
                                        {Array.isArray(meal.ingredients) ? meal.ingredients.join(', ') : meal.ingredients || 'None specified'}
                                      </p>
                                      {meal.notes && (
                                        <p className="text-[10px] text-stone-400 italic">Note: {meal.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom Meals if any */}
                    {customMeals.length > 0 && (
                      <div className="bg-stone-50/60 border border-stone-200/90 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-stone-700 text-white">
                            Custom / Additional Courses
                          </span>
                        </div>
                        <div className="space-y-2">
                          {customMeals.map(({ meal, globalIndex }) => (
                            <div key={globalIndex} className="p-3 bg-white border border-stone-200 rounded-lg text-xs">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] font-bold text-stone-500 uppercase">{meal.type}</span>
                                  <h4 className="font-bold text-stone-900">{meal.name}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{meal.calories} kcal</span>
                                  <button onClick={() => handleDeleteMeal(activeDayTab, globalIndex)} className="text-stone-400 hover:text-rose-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>);
                })()}

                {/* Add Meal to Day Button */}
                <button
                  onClick={() => setSwapTarget({ dayNumber: activeDayTab, mealIndex: -1, mealSlot: 'Lunch' })}
                  className="w-full py-2.5 border border-dashed border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 hover:border-stone-400 hover:bg-stone-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-stone-500" />
                  Add Another Dish to Day {activeDayTab}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Meal Modal */}
      {editingMeal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="font-serif font-bold text-stone-900 text-sm mb-4 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-orange-600" />
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
                  className="w-full border border-stone-300 rounded-lg px-3 py-1.5 text-stone-900 font-semibold outline-none focus:ring-1 focus:ring-orange-500"
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
                    className="w-full border border-stone-300 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-orange-500 bg-white"
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
                    className="w-full border border-stone-300 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-orange-500"
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
                    className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-orange-500 font-bold"
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
                    className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-orange-500 font-bold"
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
                    className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-orange-500 font-bold"
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
                    className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-orange-500 font-bold"
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
                  className="w-full border border-stone-300 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingMeal(null)}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMealEdit}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )} {/* end editingMeal modal */}
      </>)} {/* end studioTab === 'ai' */}
    </div>
  );
}
