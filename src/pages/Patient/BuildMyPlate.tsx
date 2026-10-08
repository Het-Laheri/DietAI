import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PLATE_FOODS, PlateFoodItem } from '../../data/plateFoods';
import { DEFAULT_CLINICAL_RECIPES } from '../../services/defaultRecipes';
import { 
  getMealPlans, 
  getOrBuildPatientTodayChecklist, 
  savePatientChecklist, 
  logMeal, 
  ChecklistMealItem, 
  createNotification,
  RecipeDBItem
} from '../../services/db';
import { isPatientSubscribed } from '../../services/subscription';
import SubscriptionPaywall from '../../components/SubscriptionPaywall';
import { 
  Utensils, 
  RotateCcw, 
  Check, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Sparkles, 
  ExternalLink, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Heart, 
  Info, 
  RefreshCw, 
  X,
  ChevronDown,
  ChevronUp,
  Sliders,
  Filter,
  ArrowRight,
  Maximize2
} from 'lucide-react';

export interface UnifiedFood {
  id: string | number;
  dish: string;
  region: string;
  serving: string;
  cal: number;
  protein: number;
  fat: number;
  carb: number;
  sodium: number;
  potassium: number;
  fibre: number;
  diab: string;
  notes?: string;
  dietaryType?: string;
  source: 'plate_database' | 'clinical_exchange';
}

export interface PlateSelection {
  food: UnifiedFood;
  qty: number;
}

const MEAL_SLOTS = ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime Snack'] as const;
type MealSlot = typeof MEAL_SLOTS[number];

const REGIONAL_CATEGORIES = [
  'All Items',
  'Breakfast / Everyday',
  'South India',
  'Maharashtra',
  'Gujarat',
  'North India / Punjab',
  'Uttar Pradesh / Bihar / Jharkhand',
  'Bengal / Odisha / East India',
  'Karnataka / Goa / Konkan',
  'Snacks / Street / Chaat',
  'Complete Thali',
  'Hotel / Restaurant Indian',
  'Desserts / Beverages',
  'Clinical Exchange Recipes'
] as const;

export default function BuildMyPlate() {
  const { profile } = useAuth();
  const [subscribed, setSubscribed] = useState(() => isPatientSubscribed(profile));
  const [viewMode, setViewMode] = useState<'build' | 'checklist'>('build');
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>('Lunch');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [selectedDietFilter, setSelectedDietFilter] = useState<string>('All');

  // Plate items state
  const [plate, setPlate] = useState<PlateSelection[]>([]);

  // Today's checklist & prescribed meals
  const [checklist, setChecklist] = useState<ChecklistMealItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [swapToast, setSwapToast] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);

  // Check if opened in a dedicated popup window (?window=1)
  const isStandaloneWindow = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('window') === '1';
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Unified dataset combining 457 Indian dishes + 200 clinical exchange recipes
  const allFoods: UnifiedFood[] = useMemo(() => {
    const list: UnifiedFood[] = [];

    // 1. 457 Plate foods
    PLATE_FOODS.forEach(pf => {
      let diet = pf.dietaryType;
      if (!diet) {
        const lower = (pf.dish + ' ' + (pf.notes || '')).toLowerCase();
        if (lower.includes('egg') && !lower.includes('chicken') && !lower.includes('fish') && !lower.includes('mutton')) {
          diet = 'Eggetarian';
        } else if (lower.includes('chicken') || lower.includes('fish') || lower.includes('prawn') || lower.includes('mutton') || lower.includes('meat') || lower.includes('keema')) {
          diet = 'Non-Vegetarian';
        } else {
          diet = 'Vegetarian';
        }
      }
      list.push({
        id: `pf_${pf.id}`,
        dish: pf.dish,
        region: pf.region,
        serving: pf.serving,
        cal: pf.cal,
        protein: pf.protein,
        fat: pf.fat,
        carb: pf.carb,
        sodium: pf.sodium,
        potassium: pf.potassium,
        fibre: pf.fibre,
        diab: pf.diab,
        notes: pf.notes,
        dietaryType: diet,
        source: 'plate_database'
      });
    });

    // 2. 200 Clinical Exchange Recipes
    DEFAULT_CLINICAL_RECIPES.forEach(cr => {
      list.push({
        id: cr.id || `cr_${cr.name}`,
        dish: cr.name,
        region: 'Clinical Exchange Recipes',
        serving: cr.portionSize || '1 serving',
        cal: cr.calories,
        protein: cr.protein,
        fat: cr.fat,
        carb: cr.carbs,
        sodium: cr.sodium || 25,
        potassium: cr.potassium || 180,
        fibre: cr.fiber || 3.5,
        diab: cr.carbs <= 25 ? 'Generally Yes' : 'Portion Controlled',
        notes: cr.notes || cr.clinicalFocus,
        dietaryType: cr.dietaryType,
        source: 'clinical_exchange'
      });
    });

    return list;
  }, []);

  // Filtered food list
  const filteredFoods = useMemo(() => {
    return allFoods.filter(f => {
      // Category filter
      if (selectedCategory !== 'All Items') {
        if (selectedCategory === 'Clinical Exchange Recipes') {
          if (f.source !== 'clinical_exchange') return false;
        } else {
          if (f.region !== selectedCategory) return false;
        }
      }

      // Dietary filter
      if (selectedDietFilter !== 'All') {
        if (f.dietaryType?.toLowerCase() !== selectedDietFilter.toLowerCase()) return false;
      }

      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = f.dish.toLowerCase().includes(q);
        const matchRegion = f.region.toLowerCase().includes(q);
        const matchNotes = f.notes ? f.notes.toLowerCase().includes(q) : false;
        if (!matchName && !matchRegion && !matchNotes) return false;
      }

      return true;
    });
  }, [allFoods, selectedCategory, selectedDietFilter, searchQuery]);

  // Load today's active checklist
  useEffect(() => {
    setSubscribed(isPatientSubscribed(profile));
    const handleSubChange = () => setSubscribed(isPatientSubscribed(profile));
    window.addEventListener('nutrisnap:subscription_change', handleSubChange);

    const loadChecklist = async () => {
      if (!profile?.uid) return;
      try {
        setLoadingChecklist(true);
        const items = await getOrBuildPatientTodayChecklist(profile.uid, todayStr, profile);
        setChecklist(items);
      } catch (e) {
        console.error('Failed to load checklist in BuildMyPlate:', e);
      } finally {
        setLoadingChecklist(false);
      }
    };

    loadChecklist();

    const handleChecklistUpdated = () => {
      if (profile?.uid) {
        getOrBuildPatientTodayChecklist(profile.uid, todayStr, profile).then(setChecklist);
      }
    };
    window.addEventListener('nutrisnap:checklist_updated', handleChecklistUpdated);

    return () => {
      window.removeEventListener('nutrisnap:subscription_change', handleSubChange);
      window.removeEventListener('nutrisnap:checklist_updated', handleChecklistUpdated);
    };
  }, [profile, todayStr]);

  // Prescribed meal for currently selected slot
  const currentPrescribedMeal = useMemo(() => {
    const sLower = selectedSlot.toLowerCase();
    return checklist.find(it => {
      const itSlot = (it.mealType || '').toLowerCase();
      if (itSlot === sLower) return true;
      if (sLower.includes('snack') && itSlot.includes('snack')) {
        return itSlot.includes(sLower.replace('snack', '').trim());
      }
      return false;
    }) || null;
  }, [checklist, selectedSlot]);

  // Totals for current plate
  const plateTotals = useMemo(() => {
    return plate.reduce((acc, item) => {
      const q = item.qty;
      return {
        cal: acc.cal + item.food.cal * q,
        protein: acc.protein + item.food.protein * q,
        fat: acc.fat + item.food.fat * q,
        carb: acc.carb + item.food.carb * q,
        sodium: acc.sodium + item.food.sodium * q,
        potassium: acc.potassium + item.food.potassium * q,
        fibre: acc.fibre + item.food.fibre * q,
        count: acc.count + q
      };
    }, { cal: 0, protein: 0, fat: 0, carb: 0, sodium: 0, potassium: 0, fibre: 0, count: 0 });
  }, [plate]);

  const showToast = (msg: string) => {
    setSwapToast(msg);
    setTimeout(() => setSwapToast(null), 4000);
  };

  // Plate modification helpers
  const handleAddFood = (food: UnifiedFood) => {
    setPlate(prev => {
      const existingIdx = prev.findIndex(p => p.food.id === food.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].qty += 1;
        return copy;
      }
      return [...prev, { food, qty: 1 }];
    });
  };

  const handleChangeQty = (foodId: string | number, delta: number) => {
    setPlate(prev => {
      return prev.map(item => {
        if (item.food.id === foodId) {
          const nextQty = item.qty + delta;
          return nextQty > 0 ? { ...item, qty: nextQty } : null;
        }
        return item;
      }).filter(Boolean) as PlateSelection[];
    });
  };

  const handleRemoveFood = (foodId: string | number) => {
    setPlate(prev => prev.filter(p => p.food.id !== foodId));
  };

  const handleClearPlate = () => {
    setPlate([]);
  };

  // Open in dedicated standalone window
  const handleOpenStandaloneWindow = () => {
    const width = 1200;
    const height = 900;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    window.open(
      '/patient/plate?window=1',
      'BuildMyPlateWindow',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  // Execute Meal Swap with Today's Prescribed Plan
  const handleSwapMeal = async () => {
    if (plate.length === 0) {
      showToast('Your plate is empty! Add foods to swap with your meal.');
      return;
    }
    if (!profile?.uid) {
      showToast('Please log in to swap meals in your profile.');
      return;
    }

    setSwapping(true);
    try {
      const plateName = plate.map(p => `${p.food.dish}${p.qty > 1 ? ` x${p.qty}` : ''}`).join(' + ');
      const plateIngredients = plate.map(p => `${p.food.dish} (${p.food.serving} x${p.qty})`);

      const swapItemId = currentPrescribedMeal?.id || `swapped_${selectedSlot.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      
      const swappedItem: ChecklistMealItem = {
        id: swapItemId,
        mealType: selectedSlot,
        name: plateName,
        portion: `${plateTotals.count} item(s)`,
        calories: Math.round(plateTotals.cal),
        protein: Math.round(plateTotals.protein * 10) / 10,
        carbs: Math.round(plateTotals.carb * 10) / 10,
        fat: Math.round(plateTotals.fat * 10) / 10,
        completed: true,
        completedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        notes: `Custom Swapped Plate • Fiber: ${Math.round(plateTotals.fibre)}g | Sodium: ${Math.round(plateTotals.sodium)}mg`,
        ingredients: plateIngredients,
        recipe: [
          `Custom Plate prepared by ${profile.name || 'Patient'} on ${new Date().toLocaleDateString()}.`,
          `Components: ${plateName}.`
        ]
      };

      // Replace or insert in checklist
      let updated: ChecklistMealItem[];
      const existingIdx = checklist.findIndex(c => c.id === currentPrescribedMeal?.id);
      if (existingIdx >= 0) {
        updated = [...checklist];
        updated[existingIdx] = swappedItem;
      } else {
        updated = [...checklist, swappedItem];
      }

      setChecklist(updated);

      // Save to Firestore and localStorage
      await savePatientChecklist(profile.uid, todayStr, updated);

      const storageKey = `nutrisnap_meals_checklist_${profile.uid}_${todayStr}`;
      const stateMap: Record<string, { completed: boolean; completedAt?: string }> = {};
      updated.forEach(it => {
        stateMap[it.id] = { completed: it.completed, completedAt: it.completedAt };
      });
      try {
        localStorage.setItem(storageKey, JSON.stringify(stateMap));
      } catch {}

      // Log the meal
      await logMeal(profile.uid, {
        date: todayStr,
        mealType: selectedSlot as any,
        name: plateName,
        calories: Math.round(plateTotals.cal),
        protein: Math.round(plateTotals.protein),
        carbs: Math.round(plateTotals.carb),
        fat: Math.round(plateTotals.fat),
        isExtra: false
      });

      // Dispatch event for instant real-time sync with dashboard carousel and progress sparklines
      window.dispatchEvent(new CustomEvent('nutrisnap:checklist_updated'));

      // Send confirmation notification
      createNotification({
        recipientRole: 'patient',
        recipientId: profile.uid,
        patientId: profile.uid,
        type: 'MEAL_LOGGED',
        title: 'Meal Swapped Successfully! 🍽️',
        message: `Your ${selectedSlot} has been swapped with "${plateName}" (${Math.round(plateTotals.cal)} kcal).`,
        link: '/patient/plate',
        read: false
      }).catch(console.warn);

      showToast(`Success! ${selectedSlot} swapped with your custom built plate (${Math.round(plateTotals.cal)} kcal).`);
    } catch (e: any) {
      console.error('Failed to swap meal:', e);
      showToast('Error swapping meal: ' + (e?.message || 'Please try again'));
    } finally {
      setSwapping(false);
    }
  };

  // Toggle checklist item completion
  const handleToggleChecklistItem = async (id: string) => {
    if (!profile?.uid) return;
    const updated = checklist.map(item => {
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

    setChecklist(updated);
    await savePatientChecklist(profile.uid, todayStr, updated).catch(console.warn);
    const storageKey = `nutrisnap_meals_checklist_${profile.uid}_${todayStr}`;
    const stateMap: Record<string, { completed: boolean; completedAt?: string }> = {};
    updated.forEach(it => {
      stateMap[it.id] = { completed: it.completed, completedAt: it.completedAt };
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(stateMap));
    } catch {}
    window.dispatchEvent(new CustomEvent('nutrisnap:checklist_updated'));
  };

  if (!subscribed) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <SubscriptionPaywall 
          featureName="Build My Plate & Meal Swap Studio" 
          description="Design custom regional plates with instant macro calculations, portion control, and 1-click clinical meal swapping."
        />
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto font-sans min-h-screen ${isStandaloneWindow ? 'bg-stone-50' : ''}`}>
      {/* Toast Notification */}
      {swapToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-50 px-5 py-3 rounded-xl shadow-2xl text-xs md:text-sm font-semibold flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {swapToast}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xs">
              Interactive Nutrition Lab
            </span>
            <span className="text-xs font-semibold text-stone-500">
              657 Verified Indian Dishes & Recipes
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-black text-stone-900 mt-1">
            Build My Plate & Meal Swap
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Craft your balanced Indian plate, balance macros in real-time, and swap with today's scheduled meals in one click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Dedicated Window Button */}
          {!isStandaloneWindow && (
            <button
              onClick={handleOpenStandaloneWindow}
              className="px-3.5 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Open plate builder in a focused dedicated window"
            >
              <Maximize2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Open in New Window</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-200/80 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('build')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'build'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Plate Builder & Swap
            </button>
            <button
              onClick={() => setViewMode('checklist')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'checklist'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Today's Prescribed Plan ({checklist.filter(c => c.completed).length}/{checklist.length})
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'checklist' ? (
        /* ─── CHECKLIST VIEW ─── */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">Today's Prescribed Meals & Log</h2>
              <p className="text-xs text-stone-500">Check off completed meals or swap any slot using the Plate Builder.</p>
            </div>
            <button
              onClick={() => setViewMode('build')}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95"
            >
              + Build Plate to Swap
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {checklist.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Utensils className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="text-sm font-semibold">No meals scheduled yet for today.</p>
                <p className="text-xs mt-1">Use the Plate Builder tab to create and log your first meal!</p>
              </div>
            ) : (
              checklist.map(item => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className={`w-6 h-6 mt-0.5 rounded-lg border flex items-center justify-center transition-colors ${
                        item.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-stone-300 hover:border-orange-400 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          {item.mealType}
                        </span>
                        <span className={`text-sm font-bold ${item.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                          {item.name}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {item.portion} • {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                      </p>
                      {item.notes && <p className="text-[11px] text-stone-400 mt-0.5">{item.notes}</p>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlot(item.mealType as MealSlot);
                      setViewMode('build');
                    }}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-600 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                  >
                    Swap this meal →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ─── BUILD MY PLATE & MEAL SWAP STUDIO ─── */
        <div className="space-y-6">
          {/* Step 1: Select Meal Slot */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 md:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600">Step 1</span>
                <h3 className="font-serif font-bold text-stone-900 text-sm">Select Target Meal Slot to Plan or Swap</h3>
              </div>
              {currentPrescribedMeal && (
                <div className="text-xs bg-orange-50 border border-orange-200 text-orange-900 px-3 py-1 rounded-lg">
                  Current: <strong>{currentPrescribedMeal.name}</strong> ({currentPrescribedMeal.calories} kcal)
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {MEAL_SLOTS.map(slot => {
                const isSelected = selectedSlot === slot;
                const hasPrescribed = checklist.some(c => (c.mealType || '').toLowerCase() === slot.toLowerCase());
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-xs scale-102'
                        : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                    }`}
                  >
                    <span>{slot}</span>
                    {hasPrescribed && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-orange-400' : 'bg-orange-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main 2-Column Studio: Left Food Selector, Right Interactive Plate & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Food Finder & Library (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600">Step 2</span>
                  <h3 className="font-serif font-bold text-stone-900 text-base">Select Foods to Place on Your Plate</h3>
                </div>
                <span className="text-xs text-stone-400 font-semibold">
                  {filteredFoods.length} items
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search dishes (e.g. Poha, Idli, Dal Makhani, Paneer Tikka, Daliya Upma)..."
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs md:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Regional Category Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {REGIONAL_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === cat
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Dietary Filter Buttons */}
              <div className="flex items-center gap-1 text-[11px] pt-1 border-t border-stone-100">
                <span className="text-stone-400 font-semibold mr-1">Diet:</span>
                {['All', 'Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan', 'Jain'].map(diet => (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => setSelectedDietFilter(diet)}
                    className={`px-2.5 py-0.5 rounded-md font-semibold transition-colors ${
                      selectedDietFilter === diet
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>

              {/* Food List Container */}
              <div className="max-h-[500px] overflow-y-auto divide-y divide-stone-100 pr-1">
                {filteredFoods.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Search className="w-6 h-6 mx-auto mb-2 text-stone-300" />
                    <p className="text-xs font-semibold">No foods matched your search and filter criteria.</p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCategory('All Items'); setSelectedDietFilter('All'); }}
                      className="mt-2 text-xs font-bold text-orange-600 underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  filteredFoods.slice(0, 45).map(f => {
                    const diabColor = f.diab === 'Generally Yes'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : f.diab === 'Portion Controlled'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200';

                    return (
                      <div key={f.id} className="py-3 flex items-center justify-between gap-3 hover:bg-stone-50/60 px-2 rounded-lg transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs md:text-sm text-stone-900 truncate">{f.dish}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                              {f.region}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${diabColor}`}>
                              {f.diab}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {f.serving} • <strong className="text-stone-800">{Math.round(f.cal)} kcal</strong> • P: {f.protein}g • C: {f.carb}g • F: {f.fat}g • Fib: {f.fibre}g
                          </p>
                          {f.notes && (
                            <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">{f.notes}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddFood(f)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: Visual Plate, Macro Breakdown & Swap Action (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Ceramic Visual Plate Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600">
                    Your {selectedSlot} Plate
                  </span>
                  {plate.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearPlate}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {/* Circular Ceramic Plate Visualizer */}
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-white border-[16px] border-stone-100 shadow-[inset_0_4px_16px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)] flex items-center justify-center relative overflow-hidden transition-all duration-300">
                  {/* Subtle inner concentric plate ring */}
                  <div className="absolute inset-4 rounded-full border border-stone-200/80 pointer-events-none" />

                  {plate.length === 0 ? (
                    <div className="text-center p-6 text-stone-400">
                      <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-500" />
                      <strong className="block text-2xl font-serif text-stone-300">0 kcal</strong>
                      <span className="text-xs mt-1 block">Your plate is empty.<br />Add dishes to build your meal.</span>
                    </div>
                  ) : (
                    <div className="text-center p-4 relative z-10">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">Total Plate Energy</span>
                      <strong className="text-3xl sm:text-4xl font-serif font-black text-stone-900 block leading-tight">
                        {Math.round(plateTotals.cal)}
                      </strong>
                      <span className="text-xs font-bold text-stone-500">kcal</span>
                      <div className="mt-2 text-[11px] font-semibold text-stone-600 bg-stone-100/90 px-3 py-1 rounded-full border border-stone-200/60 inline-block">
                        {plateTotals.count} portion(s) • P: {Math.round(plateTotals.protein)}g
                      </div>
                    </div>
                  )}
                </div>

                {/* Items on Plate List */}
                {plate.length > 0 && (
                  <div className="w-full mt-5 divide-y divide-stone-100 border-t border-stone-100 pt-3 max-h-48 overflow-y-auto">
                    {plate.map(item => (
                      <div key={item.food.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs text-stone-900 block truncate">{item.food.dish}</span>
                          <span className="text-[11px] text-stone-500">
                            {Math.round(item.food.cal * item.qty)} kcal • P: {Math.round(item.food.protein * item.qty)}g
                          </span>
                        </div>

                        {/* Quantity Adjuster */}
                        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => handleChangeQty(item.food.id, -1)}
                            className="w-6 h-6 rounded bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-stone-800">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleChangeQty(item.food.id, 1)}
                            className="w-6 h-6 rounded bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFood(item.food.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Macro & Micronutrient Breakdown Cards */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                <h4 className="font-serif font-bold text-stone-900 text-sm">Nutritional Matrix for this Plate</h4>

                {/* Primary 4 Macros */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-orange-50/60 border border-orange-200/60 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-orange-700 block">Calories</span>
                    <strong className="text-lg font-bold text-orange-950">{Math.round(plateTotals.cal)}</strong>
                    <span className="text-[10px] text-orange-600 block">kcal</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Protein</span>
                    <strong className="text-lg font-bold text-emerald-950">{Math.round(plateTotals.protein * 10) / 10}</strong>
                    <span className="text-[10px] text-emerald-600 block">g</span>
                  </div>
                  <div className="p-2.5 bg-sky-50/60 border border-sky-200/60 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-sky-700 block">Carbs</span>
                    <strong className="text-lg font-bold text-sky-950">{Math.round(plateTotals.carb * 10) / 10}</strong>
                    <span className="text-[10px] text-sky-600 block">g</span>
                  </div>
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Fat</span>
                    <strong className="text-lg font-bold text-amber-950">{Math.round(plateTotals.fat * 10) / 10}</strong>
                    <span className="text-[10px] text-amber-600 block">g</span>
                  </div>
                </div>

                {/* Secondary 3 Micronutrients */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-stone-50 border border-stone-200/70 rounded-xl">
                    <span className="text-[10px] text-stone-500 block">Dietary Fibre</span>
                    <strong className="text-stone-900 font-bold">{Math.round(plateTotals.fibre * 10) / 10}g</strong>
                  </div>
                  <div className="p-2 bg-stone-50 border border-stone-200/70 rounded-xl">
                    <span className="text-[10px] text-stone-500 block">Sodium</span>
                    <strong className="text-stone-900 font-bold">{Math.round(plateTotals.sodium)}mg</strong>
                  </div>
                  <div className="p-2 bg-stone-50 border border-stone-200/70 rounded-xl">
                    <span className="text-[10px] text-stone-500 block">Potassium</span>
                    <strong className="text-stone-900 font-bold">{Math.round(plateTotals.potassium)}mg</strong>
                  </div>
                </div>

                {/* Clinical Notice & Safety Alerts */}
                {plate.some(p => p.food.diab === 'Limit / No') && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Diabetes Advisory:</strong> This plate includes items marked <em>Limit / No</em> (high glycemic index or deep-fried). Consider reducing portion or swapping with a low-GI grain alternative.
                    </div>
                  </div>
                )}
                {plateTotals.sodium > 650 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Sodium Advisory:</strong> Total plate sodium ({Math.round(plateTotals.sodium)}mg) is elevated. Drink extra water and avoid adding extra table salt.
                    </div>
                  </div>
                )}
              </div>

              {/* Meal Swap Action & Comparison Banner */}
              <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                      🔄
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-white">Meal Swap Engine</h4>
                      <p className="text-[11px] text-stone-400">Apply this custom plate as today's {selectedSlot}</p>
                    </div>
                  </div>
                </div>

                {/* Current vs Built Comparison */}
                {currentPrescribedMeal ? (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-center text-stone-300">
                      <span>Prescribed {selectedSlot}:</span>
                      <strong className="text-white">{currentPrescribedMeal.calories} kcal</strong>
                    </div>
                    <div className="flex justify-between items-center text-stone-300">
                      <span>Your Custom Plate:</span>
                      <strong className="text-orange-400">{Math.round(plateTotals.cal)} kcal</strong>
                    </div>
                    <div className="pt-1 border-t border-white/10 flex justify-between items-center text-[11px]">
                      <span className="text-stone-400">Calorie Variance:</span>
                      <span className={`font-bold ${
                        Math.abs(plateTotals.cal - currentPrescribedMeal.calories) <= 60 
                          ? 'text-emerald-400' 
                          : plateTotals.cal > currentPrescribedMeal.calories 
                          ? 'text-amber-400' 
                          : 'text-sky-400'
                      }`}>
                        {plateTotals.cal >= currentPrescribedMeal.calories ? '+' : ''}
                        {Math.round(plateTotals.cal - currentPrescribedMeal.calories)} kcal
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400">
                    No scheduled meal currently set for {selectedSlot}. Swapping will log this plate as your active meal!
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSwapMeal}
                  disabled={swapping || plate.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 active:scale-98 cursor-pointer"
                >
                  {swapping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{currentPrescribedMeal ? `Swap ${selectedSlot} with This Plate` : `Log ${selectedSlot} Plate`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
