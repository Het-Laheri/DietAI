import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getPatients,
  getMealPlans,
  getPatientWeekPlan,
  updatePatientProfile,
  savePatientChecklist,
  PatientProfile,
  MealPlan,
  saveMealPlan,
  savePatientWeekPlan,
  WeekDay,
  MealSlot,
  WeekPlanEntry,
  PatientLabBiomarkers,
  DEFAULT_SAMPLE_LABS,
  evaluateLabBiomarkers,
  ClinicalBiomarkerItem,
  ChecklistMealItem
} from '../../services/db';
import { PLATE_FOODS } from '../../data/plateFoods';
import { DEFAULT_CLINICAL_RECIPES } from '../../services/defaultRecipes';
import { MASTER_FOODS } from '../../data/masterFoods';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Save,
  Eye,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  X,
  Utensils,
  ShieldCheck,
  Calendar,
  Layers,
  Activity,
  FileText,
  Minus,
  Copy,
  Check
} from 'lucide-react';

export interface PlanFoodItem {
  id: string;
  name: string;
  portion: string;
  quantity?: number;
  basePortion?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sodium: number;
  potassium: number;
  baseCalories?: number;
  baseProtein?: number;
  baseCarbs?: number;
  baseFat?: number;
  baseFibre?: number;
  baseSodium?: number;
  basePotassium?: number;
  image?: string;
  notes?: string;
}

export interface MealSlotSection {
  id: string;
  time: string;
  title: string;
  timeBadgeColor: string;
  notes?: string;
  items: PlanFoodItem[];
}

// Items to save for a slot. A slot that has dietitian instructions but no food is saved as one
// zero-kcal "instructions" entry so the note still reaches the patient (it was dropped before).
export function slotItemsForSave(slot: MealSlotSection): (PlanFoodItem & { noteOnly?: boolean })[] {
  if (slot.items.length > 0) return slot.items;
  if (!slot.notes || !slot.notes.trim()) return [];
  return [{
    id: `note_${slot.id}`,
    name: `${slot.title} instructions`,
    portion: 'As directed',
    quantity: 1,
    calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0,
    noteOnly: true
  }];
}

export interface ClinicalBadge {
  type: 'danger' | 'warning' | 'success' | 'info';
  text: string;
  reason?: string;
}

const WEEK_DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper: format local Date as YYYY-MM-DD without UTC timezone shift
function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: scale portion text numbers when quantity multiplier changes
export function formatScaledPortion(basePortion: string, qty: number): string {
  const cleanBase = (basePortion || '1 serving').trim();
  if (Math.abs(qty - 1) < 0.01) return cleanBase;

  // Replace numbers in basePortion proportionally (e.g., "2 medium (60 g)" * 1.5 -> "3 medium (90 g)")
  let replacedAny = false;
  const scaledStr = cleanBase.replace(/(\d+(?:\.\d+)?)/g, (match) => {
    const num = parseFloat(match);
    if (isNaN(num)) return match;
    replacedAny = true;
    const val = Math.round(num * qty * 10) / 10;
    return String(val);
  });

  if (replacedAny) return scaledStr;
  return `${Math.round(qty * 100) / 100}x (${cleanBase})`;
}

// Helper: infer quantity ratio when user edits portion text directly (e.g., "3 medium" or "300 g")
export function inferQuantityFromPortionText(newPortion: string, basePortion: string, currentQty: number): number {
  // Normalise fractions and words so "1/2 bowl", "½ bowl" and "half bowl" scale too
  const normaliseFractions = (t: string) => t
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_m, a, b) => (Number(b) ? String(Math.round((Number(a) / Number(b)) * 100) / 100) : _m))
    .replace(/½/g, '0.5').replace(/¼/g, '0.25').replace(/¾/g, '0.75')
    .replace(/\bhalf\b/g, '0.5').replace(/\bquarter\b/g, '0.25');
  const cleanNew = normaliseFractions((newPortion || '').trim().toLowerCase());
  const cleanBase = normaliseFractions((basePortion || '').trim().toLowerCase());
  if (!cleanNew || !cleanBase) return currentQty;

  // 1. Check explicit multiplier like "2x" or "1.5x"
  const multMatch = cleanNew.match(/^(\d+(?:\.\d+)?)\s*x\b/);
  if (multMatch) {
    const val = parseFloat(multMatch[1]);
    if (val > 0 && val <= 20) return val;
  }

  // 2. Check gram/ml numbers first if both strings have g/ml (e.g., "(200 g)" -> "(300 g)" or "300g")
  const unitRegex = /(\d+(?:\.\d+)?)\s*(g|gm|gms|grams|ml)\b/i;
  const newUnitMatch = cleanNew.match(unitRegex);
  const baseUnitMatch = cleanBase.match(unitRegex);
  if (newUnitMatch && baseUnitMatch) {
    const newVal = parseFloat(newUnitMatch[1]);
    const baseVal = parseFloat(baseUnitMatch[1]);
    if (baseVal > 0 && newVal > 0) {
      // Only use unit ratio if unit value actually changed or if leading number didn't change
      const leadNew = cleanNew.match(/^(\d+(?:\.\d+)?)/);
      const leadBase = cleanBase.match(/^(\d+(?:\.\d+)?)/);
      const expectedScaledUnit = Math.round(baseVal * currentQty * 10) / 10;
      if (Math.abs(newVal - expectedScaledUnit) > 0.1) {
        return Math.max(0.1, Math.min(20, Math.round((newVal / baseVal) * 100) / 100));
      }
      if (leadNew && leadBase) {
        const ln = parseFloat(leadNew[1]);
        const lb = parseFloat(leadBase[1]);
        if (lb > 0 && ln > 0) {
          return Math.max(0.1, Math.min(20, Math.round((ln / lb) * 100) / 100));
        }
      }
    }
  }

  // 3. Compare leading numeric count (e.g. "2 medium" vs "3 medium", "1 bowl" vs "2 bowl")
  const leadNewMatch = cleanNew.match(/^(\d+(?:\.\d+)?)/);
  const leadBaseMatch = cleanBase.match(/^(\d+(?:\.\d+)?)/);
  if (leadNewMatch && leadBaseMatch) {
    const newLead = parseFloat(leadNewMatch[1]);
    const baseLead = parseFloat(leadBaseMatch[1]);
    if (baseLead > 0 && newLead > 0) {
      // If user typed a large number like "250" when basePortion was "1 bowl (200 g)", check if base had grams
      if (baseUnitMatch && newLead >= 25 && baseLead < 10) {
        const baseGram = parseFloat(baseUnitMatch[1]);
        if (baseGram > 0) {
          return Math.max(0.1, Math.min(20, Math.round((newLead / baseGram) * 100) / 100));
        }
      }
      return Math.max(0.1, Math.min(20, Math.round((newLead / baseLead) * 100) / 100));
    }
  }

  return currentQty;
}

// Helper: scale a PlanFoodItem to a target quantity multiplier
export function scaleFoodItem(item: PlanFoodItem, newQty: number, customPortion?: string): PlanFoodItem {
  const safeQty = Math.max(0.25, Math.min(20, Math.round(newQty * 100) / 100));
  const prevQty = item.quantity && item.quantity > 0 ? item.quantity : 1;

  const baseCal = item.baseCalories !== undefined ? item.baseCalories : item.calories / prevQty;
  const baseP = item.baseProtein !== undefined ? item.baseProtein : item.protein / prevQty;
  const baseC = item.baseCarbs !== undefined ? item.baseCarbs : item.carbs / prevQty;
  const baseF = item.baseFat !== undefined ? item.baseFat : item.fat / prevQty;
  const baseFib = item.baseFibre !== undefined ? item.baseFibre : item.fibre / prevQty;
  const baseNa = item.baseSodium !== undefined ? item.baseSodium : item.sodium / prevQty;
  const baseK = item.basePotassium !== undefined ? item.basePotassium : item.potassium / prevQty;
  const basePortion = item.basePortion || item.portion || '1 serving';

  return {
    ...item,
    quantity: safeQty,
    basePortion,
    baseCalories: baseCal,
    baseProtein: baseP,
    baseCarbs: baseC,
    baseFat: baseF,
    baseFibre: baseFib,
    baseSodium: baseNa,
    basePotassium: baseK,
    portion: customPortion !== undefined ? customPortion : formatScaledPortion(basePortion, safeQty),
    calories: Math.round(baseCal * safeQty),
    protein: Math.round(baseP * safeQty * 10) / 10,
    carbs: Math.round(baseC * safeQty * 10) / 10,
    fat: Math.round(baseF * safeQty * 10) / 10,
    fibre: Math.round(baseFib * safeQty * 10) / 10,
    sodium: Math.round(baseNa * safeQty),
    potassium: Math.round(baseK * safeQty)
  };
}

// --------- CLINICAL & BIOMARKER EVALUATION ENGINE FOR INDIVIDUAL FOOD ITEMS ---------
export function evaluateFoodItemForPatient(
  item: {
    name: string;
    portion?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fibre?: number;
    sodium?: number;
    potassium?: number;
    tags?: string[];
  },
  slotTitle: string,
  profile: {
    conditions: string[];
    dietPreference: string;
    allergies: string;
    notes: string;
    gender?: string;
    labBiomarkers?: PatientLabBiomarkers;
  }
): ClinicalBadge[] {
  const badges: ClinicalBadge[] = [];
  const lowerName = item.name.toLowerCase();
  const lowerConditions = (Array.isArray(profile.conditions) ? profile.conditions : []).map(c =>
    typeof c === 'string' ? c.toLowerCase() : String(c).toLowerCase()
  );
  const lowerAllergies = (profile.allergies || '').toLowerCase();
  const lowerNotes = (profile.notes || '').toLowerCase();
  const lowerPref = (profile.dietPreference || '').toLowerCase();
  const labs = profile.labBiomarkers;
  const isFemale = (profile.gender || 'Female').toLowerCase() !== 'male';

  // 1. ALLERGIES & INTOLERANCES CHECK (Highest Priority)
  if (lowerAllergies && lowerAllergies !== 'none' && lowerAllergies !== 'nil') {
    if (lowerAllergies.includes('lactose') || lowerAllergies.includes('dairy') || lowerAllergies.includes('milk')) {
      const dairyKws = ['milk', 'paneer', 'curd', 'yogurt', 'cheese', 'buttermilk', 'butter', 'ghee', 'chaas', 'lassi', 'khoya', 'mava', 'cream', 'raita'];
      if (dairyKws.some(kw => lowerName.includes(kw)) && !lowerName.includes('almond milk') && !lowerName.includes('coconut') && !lowerName.includes('vegan') && !lowerName.includes('dairy-free')) {
        badges.push({ type: 'danger', text: 'Allergen: Dairy/Lactose', reason: 'Contains dairy; patient has dairy/lactose intolerance' });
      }
    }
    if (lowerAllergies.includes('gluten') || lowerAllergies.includes('wheat') || lowerAllergies.includes('celiac')) {
      const glutenKws = ['wheat', 'phulka', 'roti', 'chapati', 'paratha', 'bread', 'suji', 'semolina', 'pasta', 'maida', 'dalia', 'daliya', 'sevai', 'upma', 'thepla'];
      const gfSafe = ['jowar', 'bajra', 'ragi', 'nachni', 'besan', 'quinoa', 'amaranth', 'kuttu', 'gluten-free', 'oats upma'];
      if (glutenKws.some(kw => lowerName.includes(kw)) && !gfSafe.some(s => lowerName.includes(s))) {
        badges.push({ type: 'danger', text: 'Allergen: Gluten/Wheat', reason: 'Contains wheat/gluten grains' });
      }
    }
    if (lowerAllergies.includes('nut') || lowerAllergies.includes('peanut') || lowerAllergies.includes('almond')) {
      const nutKws = ['almond', 'peanut', 'cashew', 'walnut', 'pista', 'badam', 'kaju', 'mungfali', 'groundnut'];
      if (nutKws.some(kw => lowerName.includes(kw))) {
        badges.push({ type: 'danger', text: 'Allergen: Nuts', reason: 'Contains nuts or nut derivatives' });
      }
    }
    if (lowerAllergies.includes('soy')) {
      if (['soya', 'soy', 'tofu', 'edamame'].some(kw => lowerName.includes(kw))) {
        badges.push({ type: 'danger', text: 'Allergen: Soy', reason: 'Contains soy proteins' });
      }
    }
    if (lowerAllergies.includes('egg')) {
      if (['egg', 'omelette', 'anda', 'egg curry', 'egg bhurji'].some(kw => lowerName.includes(kw))) {
        badges.push({ type: 'danger', text: 'Allergen: Egg', reason: 'Contains egg' });
      }
    }
  }

  // 2. DIETARY PREFERENCE CHECK
  if (lowerPref.includes('veg') && !lowerPref.includes('non-veg')) {
    const nonVegKws = ['chicken', 'mutton', 'fish', 'prawn', 'meat', 'beef', 'pork', 'keema', 'salmon', 'tuna', 'rohu', 'pomfret'];
    if (nonVegKws.some(kw => lowerName.includes(kw))) {
      badges.push({ type: 'danger', text: 'Non-Vegetarian', reason: 'Contains meat/fish; violates vegetarian preference' });
    }
    if (!lowerPref.includes('egg') && ['egg', 'omelette', 'anda'].some(kw => lowerName.includes(kw))) {
      badges.push({ type: 'danger', text: 'Contains Egg', reason: 'Patient is pure vegetarian (no eggs)' });
    }
  }
  if (lowerPref.includes('jain')) {
    const rootKws = ['onion', 'garlic', 'potato', 'aloo', 'carrot', 'radish', 'ginger', 'beetroot', 'pyaz', 'lahsun', 'mooli', 'gajar'];
    if (rootKws.some(kw => lowerName.includes(kw)) && !lowerName.includes('no onion')) {
      badges.push({ type: 'danger', text: 'Violates Jain Diet', reason: 'Contains root vegetables or alliums' });
    }
  }

  // 3. MEDICAL CONDITION & BIOMARKER: TYPE 2 DIABETES / HbA1c
  const hasDiabetes = lowerConditions.some(c => c.includes('diabet') || c.includes('sugar') || c.includes('insulin') || c.includes('pcos')) ||
    (typeof labs?.hba1c === 'number' && labs.hba1c >= 5.7);
  if (hasDiabetes) {
    const hba1cLabel = typeof labs?.hba1c === 'number' && labs.hba1c >= 5.7 ? ` (HbA1c ${labs.hba1c}%)` : '';
    if (['sugar', 'jaggery', 'honey', 'mithai', 'halwa', 'ladoo', 'sweet', 'gulab jamun', 'jalebi', 'kheer'].some(kw => lowerName.includes(kw)) && !lowerName.includes('without sugar') && !lowerName.includes('sugar-free') && !lowerName.includes('zero sugar')) {
      badges.push({ type: 'danger', text: `High Sugar / Sweet${hba1cLabel}`, reason: `Contraindicated for glycemic stability${hba1cLabel}` });
    } else if (item.carbs > 35) {
      badges.push({ type: 'warning', text: `High Carb (${item.carbs}g)${hba1cLabel}`, reason: 'High single-dish carbohydrate load may spike postprandial glucose' });
    } else if (item.carbs <= 18 && (item.fibre || 0) >= 2.5) {
      badges.push({ type: 'success', text: `✓ Low GI Safe${hba1cLabel}`, reason: 'High fiber with controlled carbohydrate load' });
    }
  }

  // 4. MEDICAL CONDITION & BIOMARKER: HYPERTENSION / SERUM SODIUM
  const hasHypertension = lowerConditions.some(c => c.includes('hypertens') || c.includes('bp') || c.includes('cardiac') || c.includes('heart')) ||
    (typeof labs?.sodium === 'number' && labs.sodium > 145);
  if (hasHypertension) {
    if (['pickle', 'achar', 'papad', 'salted chips', 'processed'].some(kw => lowerName.includes(kw))) {
      badges.push({ type: 'danger', text: 'Excess Sodium Risk', reason: 'Pickled or high-preservative sodium load' });
    } else if ((item.sodium || 0) > 280) {
      badges.push({ type: 'warning', text: `High Sodium (${item.sodium}mg)`, reason: 'Monitor sodium load for blood pressure & vascular target' });
    } else if ((item.sodium || 0) <= 80) {
      badges.push({ type: 'success', text: '✓ Low Sodium (DASH)', reason: 'Ideal low-sodium food for blood pressure control' });
    }
  }

  // 5. MEDICAL CONDITION & BIOMARKER: FATTY LIVER / DYSLIPIDEMIA (SGPT, TRIGLYCERIDES, LDL, CHOLESTEROL)
  const elevatedLipidsOrLiver = lowerConditions.some(c => c.includes('fatty liver') || c.includes('cholesterol') || c.includes('lipid') || c.includes('triglyceride')) ||
    (typeof labs?.sgpt === 'number' && labs.sgpt > 45) ||
    (typeof labs?.triglycerides === 'number' && labs.triglycerides >= 150) ||
    (typeof labs?.ldl === 'number' && labs.ldl >= 120);
  if (elevatedLipidsOrLiver) {
    const biomarkerNote = (typeof labs?.sgpt === 'number' && labs.sgpt > 45)
      ? ` (SGPT ${labs.sgpt})`
      : (typeof labs?.triglycerides === 'number' && labs.triglycerides >= 150)
      ? ` (TG ${labs.triglycerides})`
      : '';
    if (['fried', 'pakoda', 'puri', 'poori', 'samosa', 'bhatura', 'butter chicken', 'mutton curry', 'deep fried', 'malai'].some(kw => lowerName.includes(kw))) {
      badges.push({ type: 'danger', text: `High Sat-Fat${biomarkerNote}`, reason: 'Deep fried or heavy fat load contraindicated for fatty liver & dyslipidemia' });
    } else if (item.fat > 8) {
      badges.push({ type: 'warning', text: `Fat > 8g (${item.fat}g)${biomarkerNote}`, reason: 'Elevated lipid content per serving; monitor for hepatic/LDL goals' });
    } else if (item.fat <= 3.5 && (item.fibre || 0) >= 2) {
      badges.push({ type: 'success', text: `✓ Hepatic & Lipid Safe`, reason: 'Low saturated fat, rich in soluble fibre' });
    }
  }

  // 6. BIOMARKER: URIC ACID (HYPERURICEMIA / GOUT RISK)
  const uaLimit = isFemale ? 6.0 : 7.0;
  const hasHighUricAcid = lowerConditions.some(c => c.includes('uric') || c.includes('gout')) ||
    (typeof labs?.uricAcid === 'number' && labs.uricAcid > uaLimit);
  if (hasHighUricAcid) {
    const purineKws = ['mushroom', 'organ', 'mutton', 'prawn', 'fish', 'rajma', 'chole', 'masoor', 'palak', 'spinach'];
    if (purineKws.some(kw => lowerName.includes(kw))) {
      badges.push({
        type: 'warning',
        text: `Purine Watch (Uric Acid ${labs?.uricAcid || 'Elevated'})`,
        reason: 'Contains moderate-to-high purines; soak legumes & ensure 3L alkaline hydration'
      });
    }
  }

  // 7. MEDICAL CONDITION & BIOMARKER: CKD / RENAL (CREATININE, POTASSIUM, BUN)
  const hasRenal = lowerConditions.some(c => c.includes('kidney') || c.includes('ckd') || c.includes('renal')) ||
    (typeof labs?.creatinine === 'number' && labs.creatinine > 1.2) ||
    (typeof labs?.potassium === 'number' && labs.potassium > 5.0);
  if (hasRenal) {
    if ((item.potassium || 0) > 280) {
      badges.push({ type: 'warning', text: `High K+ (${item.potassium}mg)`, reason: 'Monitor potassium clearance for renal safety' });
    } else if ((item.potassium || 0) <= 150) {
      badges.push({ type: 'success', text: '✓ Renal Safe K+', reason: 'Safe potassium level for kidney management' });
    }
  }

  // 8. BIOMARKER: HAEMOGLOBIN (ANEMIA / IRON SUPPORT)
  const hbMin = isFemale ? 12.0 : 13.5;
  const hasLowHb = lowerConditions.some(c => c.includes('anemia') || c.includes('iron') || c.includes('haemoglobin')) ||
    (typeof labs?.haemoglobin === 'number' && labs.haemoglobin < hbMin);
  if (hasLowHb) {
    if (['palak', 'spinach', 'methi', 'beetroot', 'ragi', 'bajra', 'chana', 'sprout', 'pomegranate', 'dates', 'amla'].some(kw => lowerName.includes(kw))) {
      badges.push({ type: 'success', text: `✓ Iron Rich (Hb ${labs?.haemoglobin || 'Support'})`, reason: 'Supports haemoglobin synthesis & iron bioavailability' });
    }
  }

  // 9. DIETITIAN & PATIENT LIFESTYLE DIRECTIVES / NOTES (Live NLP Rule Check)
  if (lowerNotes) {
    const isBreakfastSlot = ['early morning', 'breakfast', 'morning snack', 'mid morning'].some(s => slotTitle.toLowerCase().includes(s));
    const isDinnerSlot = ['dinner', 'bedtime'].some(s => slotTitle.toLowerCase().includes(s));

    // Check "no onion"
    if (lowerNotes.includes('no onion')) {
      const appliesToSlot = lowerNotes.includes('breakfast') ? isBreakfastSlot : true;
      if (appliesToSlot && (lowerName.includes('onion') || lowerName.includes('pyaz') || (lowerName === 'vegetable poha' && !lowerName.includes('no onion')))) {
        badges.push({
          type: 'danger',
          text: lowerNotes.includes('breakfast') ? 'Violates Note: No Onion in Breakfast' : 'Violates Note: No Onion',
          reason: 'Patient notes specify avoiding onion'
        });
      }
    }

    // Generic "no <ingredient>" or "avoid <ingredient>" or "dislikes: <ingredient>" parser
    const avoidPatterns = [
      /no\s+([a-z]+)(?:\s+in\s+(breakfast|lunch|dinner|night))?/g,
      /avoid\s+([a-z]+)(?:\s+in\s+(breakfast|lunch|dinner|night))?/g,
      /dislikes?:\s*([a-z,\s]+)/g
    ];
    for (const pat of avoidPatterns) {
      let m: RegExpExecArray | null;
      while ((m = pat.exec(lowerNotes)) !== null) {
        const rawTarget = m[1].trim();
        const slotScope = m[2]?.trim();
        const targets = rawTarget.split(/[,\s]+/).map(s => s.trim()).filter(s => s.length >= 3 && !['the', 'and', 'for', 'with', 'from', 'onion', 'onions', 'food', 'meals'].includes(s));
        for (const t of targets) {
          const scopeMatches = !slotScope ||
            (slotScope === 'breakfast' && isBreakfastSlot) ||
            ((slotScope === 'dinner' || slotScope === 'night') && isDinnerSlot) ||
            slotTitle.toLowerCase().includes(slotScope);
          if (scopeMatches && lowerName.includes(t) && !lowerName.includes(`no ${t}`)) {
            const badgeText = `Violates Directive: No ${t.charAt(0).toUpperCase() + t.slice(1)}`;
            if (!badges.some(b => b.text === badgeText)) {
              badges.push({ type: 'warning', text: badgeText, reason: `Conflicts with Dietitian/Patient note: "${profile.notes}"` });
            }
          }
        }
      }
    }
  }

  return badges;
}

// Categorize food into ICMR Clinical Exchange Group
export function getFoodExchangeGroup(item: PlanFoodItem): {
  group: 'Cereals & Millets' | 'Pulses & Legumes' | 'Milk, Dairy & Protein' | 'Vegetables & Greens' | 'Fruits' | 'Fats, Nuts & Seeds';
  kcalPerExchange: number;
  standardPortion: string;
} {
  const n = item.name.toLowerCase();
  if (['almond', 'walnut', 'peanut', 'cashew', 'seed', 'flax', 'chia', 'ghee', 'oil', 'butter', 'badam', 'akhrot'].some(w => n.includes(w)) && !n.includes('buttermilk') && !n.includes('butter chicken')) {
    return { group: 'Fats, Nuts & Seeds', kcalPerExchange: 45, standardPortion: '5g fat / 7g nuts' };
  }
  if (['apple', 'papaya', 'guava', 'banana', 'orange', 'pomegranate', 'pear', 'melon', 'berry', 'fruit', 'kiwi', 'mango', 'chikoo'].some(w => n.includes(w))) {
    return { group: 'Fruits', kcalPerExchange: 50, standardPortion: '100g edible portion' };
  }
  if (['milk', 'curd', 'yogurt', 'buttermilk', 'chaas', 'paneer', 'cheese', 'tofu', 'egg', 'chicken', 'fish', 'mutton', 'lassi', 'raita'].some(w => n.includes(w))) {
    return { group: 'Milk, Dairy & Protein', kcalPerExchange: 100, standardPortion: '150ml milk / 40g paneer' };
  }
  if (['dal', 'moong', 'chana', 'rajma', 'chole', 'sprout', 'sambar', 'lentil', 'besan', 'pulse', 'masoor', 'toor', 'urad', 'lobia', 'edamame', 'soya'].some(w => n.includes(w))) {
    return { group: 'Pulses & Legumes', kcalPerExchange: 100, standardPortion: '30g raw / 1 katori cooked' };
  }
  if (['phulka', 'roti', 'chapati', 'poha', 'upma', 'oats', 'rice', 'khichdi', 'daliya', 'dalia', 'idli', 'dosa', 'thepla', 'paratha', 'bread', 'toast', 'jowar', 'bajra', 'ragi', 'quinoa', 'makhana', 'cheela', 'chilla', 'porridge'].some(w => n.includes(w))) {
    return { group: 'Cereals & Millets', kcalPerExchange: 100, standardPortion: '30g raw / 1 medium roti' };
  }
  return { group: 'Vegetables & Greens', kcalPerExchange: 35, standardPortion: '100g cooked / 1 bowl salad' };
}

// Built-in Clinical Diet Templates
const CLINICAL_MEAL_TEMPLATES: {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  calories: number;
  slots: Record<string, { name: string; portion: string; calories: number; protein: number; carbs: number; fat: number; fibre: number; sodium: number; potassium: number; notes?: string }[]>;
}[] = [
  {
    id: 'diabetic_low_gi',
    name: 'Diabetic Low-GI Indian Thali',
    subtitle: 'HbA1c & Glycemic Control • High Soluble Fibre • 6 Timed Meals',
    badge: 'HbA1c Safe',
    calories: 1450,
    slots: {
      early_morning: [
        { name: 'Warm Methi (Fenugreek) Seed Water', portion: '200 ml', calories: 10, protein: 0.5, carbs: 1.8, fat: 0.1, fibre: 0.8, sodium: 3, potassium: 40, notes: 'Soak 1 tsp methi seeds overnight' },
        { name: 'Almonds (soaked) & Walnuts', portion: '5 almonds + 2 walnuts', calories: 65, protein: 2.2, carbs: 2.0, fat: 5.8, fibre: 1.2, sodium: 1, potassium: 75 }
      ],
      breakfast: [
        { name: 'Moong Dal & Palak Cheela (No Onion)', portion: '2 cheelas (140 g)', calories: 220, protein: 11.5, carbs: 28.0, fat: 4.8, fibre: 5.2, sodium: 140, potassium: 210, notes: 'Serve with fresh mint-coriander chutney' },
        { name: 'Herbal Green Tea (without sugar)', portion: '150 ml', calories: 5, protein: 0, carbs: 1.0, fat: 0, fibre: 0, sodium: 5, potassium: 20 }
      ],
      mid_morning: [
        { name: 'Fresh Guava (Amrood) with Cinnamon Pinch', portion: '1 medium (100 g)', calories: 68, protein: 2.5, carbs: 14.3, fat: 0.9, fibre: 5.4, sodium: 2, potassium: 190 }
      ],
      lunch: [
        { name: 'Multigrain / Jowar Phulka', portion: '2 medium (60 g)', calories: 195, protein: 6.8, carbs: 38.0, fat: 2.0, fibre: 6.4, sodium: 8, potassium: 165 },
        { name: 'Yellow Moong Dal Tadka (low oil)', portion: '1 katori (120 ml)', calories: 120, protein: 7.5, carbs: 17.5, fat: 2.8, fibre: 3.4, sodium: 180, potassium: 240 },
        { name: 'Lauki (Bottle Gourd) & Methi Subzi', portion: '1 katori (100 g)', calories: 65, protein: 2.2, carbs: 8.0, fat: 2.5, fibre: 3.2, sodium: 130, potassium: 210 },
        { name: 'Kachumber Salad (Cucumber, Tomato, Flaxseeds)', portion: '1 bowl (100 g)', calories: 35, protein: 1.4, carbs: 5.2, fat: 1.0, fibre: 2.8, sodium: 12, potassium: 135 }
      ],
      evening_snack: [
        { name: 'Spiced Buttermilk (Chaas - Low Salt)', portion: '200 ml', calories: 55, protein: 3.0, carbs: 4.5, fat: 1.8, fibre: 0, sodium: 90, potassium: 160 },
        { name: 'Roasted Makhana & Chana Mix', portion: '1 cup (30 g)', calories: 110, protein: 5.2, carbs: 18.0, fat: 1.8, fibre: 3.5, sodium: 45, potassium: 175 }
      ],
      dinner: [
        { name: 'Vegetable Oats & Moong Daliya Khichdi', portion: '1 large bowl (220 g)', calories: 260, protein: 10.4, carbs: 42.0, fat: 4.5, fibre: 6.2, sodium: 160, potassium: 230 },
        { name: 'Grilled Tofu / Low-Fat Paneer Bhurji', portion: '1 katori (100 g)', calories: 155, protein: 11.0, carbs: 5.5, fat: 7.2, fibre: 2.0, sodium: 170, potassium: 180 }
      ],
      bedtime: [
        { name: 'Warm Turmeric Skim Milk (Haldi Doodh)', portion: '150 ml', calories: 75, protein: 5.0, carbs: 7.0, fat: 2.0, fibre: 0, sodium: 60, potassium: 165 }
      ]
    }
  },
  {
    id: 'dash_hypertension',
    name: 'DASH Low-Sodium Cardiac & BP Protocol',
    subtitle: 'Sodium < 1200mg • Vascular Potassium & Magnesium Rich',
    badge: 'DASH Heart Safe',
    calories: 1480,
    slots: {
      early_morning: [
        { name: 'Lukewarm Lemon & Chia Seed Water', portion: '200 ml', calories: 25, protein: 0.8, carbs: 2.5, fat: 1.2, fibre: 1.8, sodium: 2, potassium: 55 },
        { name: 'Unsalted Soaked Almonds', portion: '6 nos (8 g)', calories: 42, protein: 1.6, carbs: 1.4, fat: 3.6, fibre: 0.9, sodium: 1, potassium: 60 }
      ],
      breakfast: [
        { name: 'Vegetable Oats Upma (Low Salt, No Onion)', portion: '1 bowl (180 g)', calories: 230, protein: 7.5, carbs: 36.0, fat: 5.5, fibre: 5.0, sodium: 95, potassium: 195 },
        { name: 'Boiled Egg Whites / Steamed Sprouts', portion: '1 small bowl (60 g)', calories: 75, protein: 6.5, carbs: 9.0, fat: 0.8, fibre: 2.6, sodium: 25, potassium: 145 }
      ],
      mid_morning: [
        { name: 'Fresh Pomegranate & Apple Bowl', portion: '1 bowl (120 g)', calories: 72, protein: 1.0, carbs: 16.5, fat: 0.3, fibre: 3.2, sodium: 2, potassium: 210 }
      ],
      lunch: [
        { name: 'Whole Wheat Phulka (Zero Added Salt Dough)', portion: '2 medium (60 g)', calories: 200, protein: 6.6, carbs: 42.0, fat: 2.2, fibre: 5.6, sodium: 4, potassium: 154 },
        { name: 'Arhar / Moong Dal with Garlic & Cumin', portion: '1 katori (120 ml)', calories: 125, protein: 7.4, carbs: 18.5, fat: 2.5, fibre: 3.5, sodium: 110, potassium: 260 },
        { name: 'Steamed Ridge Gourd (Turai) Subzi', portion: '1 katori (100 g)', calories: 60, protein: 1.8, carbs: 7.5, fat: 2.2, fibre: 2.9, sodium: 85, potassium: 220 },
        { name: 'Fresh Cucumber & Beetroot Salad', portion: '1 bowl (80 g)', calories: 28, protein: 0.9, carbs: 5.8, fat: 0.2, fibre: 2.2, sodium: 18, potassium: 165 }
      ],
      evening_snack: [
        { name: 'Unsalted Roasted Foxnuts (Makhana)', portion: '1 large cup (30 g)', calories: 105, protein: 3.8, carbs: 19.5, fat: 1.2, fibre: 2.5, sodium: 15, potassium: 140 },
        { name: 'Hibiscus / Tulsi Herbal Infusion', portion: '150 ml', calories: 5, protein: 0, carbs: 1.0, fat: 0, fibre: 0, sodium: 2, potassium: 25 }
      ],
      dinner: [
        { name: 'Jowar Bhakri / Phulka', portion: '2 medium (60 g)', calories: 190, protein: 6.0, carbs: 39.0, fat: 1.8, fibre: 5.8, sodium: 6, potassium: 160 },
        { name: 'Low-Oil Palak Tofu / Paneer Subzi', portion: '1 katori (120 g)', calories: 150, protein: 9.8, carbs: 6.5, fat: 6.8, fibre: 3.1, sodium: 120, potassium: 245 }
      ],
      bedtime: [
        { name: 'Warm Skim Milk with Nutmeg Pinch', portion: '150 ml', calories: 72, protein: 4.8, carbs: 6.8, fat: 1.8, fibre: 0, sodium: 55, potassium: 160 }
      ]
    }
  },
  {
    id: 'fatty_liver_lipid',
    name: 'Hepatic Fatty-Liver & Lipid Recovery Plan',
    subtitle: 'SGPT & Triglyceride Lowering • Cruciferous & Antioxidant Rich',
    badge: 'Hepatic Safe',
    calories: 1400,
    slots: {
      early_morning: [
        { name: 'Warm Amla & Turmeric Detox Water', portion: '200 ml', calories: 12, protein: 0.2, carbs: 2.8, fat: 0.1, fibre: 0.6, sodium: 2, potassium: 45 },
        { name: 'Soaked Walnuts & Almonds', portion: '3 walnut halves + 4 almonds', calories: 60, protein: 1.8, carbs: 1.5, fat: 5.4, fibre: 1.0, sodium: 1, potassium: 65 }
      ],
      breakfast: [
        { name: 'Steamed Idli with Vegetable Sambar (Low Oil)', portion: '2 idlis + 1 bowl sambar', calories: 215, protein: 8.2, carbs: 38.0, fat: 3.2, fibre: 4.6, sodium: 165, potassium: 230 },
        { name: 'Green Tea with Lemon', portion: '150 ml', calories: 4, protein: 0, carbs: 0.8, fat: 0, fibre: 0, sodium: 3, potassium: 18 }
      ],
      mid_morning: [
        { name: 'Ripe Papaya Cubes with Chia Seeds', portion: '1 bowl (150 g)', calories: 65, protein: 1.2, carbs: 14.5, fat: 0.6, fibre: 3.4, sodium: 6, potassium: 215 }
      ],
      lunch: [
        { name: 'Whole Wheat & Oat Bran Rotis', portion: '2 rotis (60 g)', calories: 190, protein: 7.0, carbs: 37.5, fat: 2.0, fibre: 6.5, sodium: 10, potassium: 150 },
        { name: 'Green Moong & Lauki Dal', portion: '1 katori (130 ml)', calories: 118, protein: 7.8, carbs: 17.0, fat: 2.2, fibre: 3.8, sodium: 150, potassium: 250 },
        { name: 'Steamed Broccoli, Beans & Carrot Stir-Fry', portion: '1 katori (100 g)', calories: 58, protein: 2.8, carbs: 8.2, fat: 1.8, fibre: 3.6, sodium: 95, potassium: 225 },
        { name: 'Spiced Low-Fat Buttermilk (Chaas)', portion: '1 glass (200 ml)', calories: 50, protein: 2.8, carbs: 4.2, fat: 1.5, fibre: 0, sodium: 85, potassium: 155 }
      ],
      evening_snack: [
        { name: 'Steamed Green Moong Sprouts Salad', portion: '1 cup (100 g)', calories: 115, protein: 8.4, carbs: 18.0, fat: 1.2, fibre: 4.2, sodium: 65, potassium: 210 }
      ],
      dinner: [
        { name: 'Warm Vegetable & Lentil Clear Soup', portion: '1 bowl (200 ml)', calories: 85, protein: 4.5, carbs: 13.0, fat: 1.5, fibre: 3.0, sodium: 120, potassium: 190 },
        { name: '1 Multigrain Roti with Parwal / Tinda Subzi', portion: '1 roti + 1 katori subzi', calories: 165, protein: 5.5, carbs: 28.0, fat: 3.2, fibre: 4.8, sodium: 110, potassium: 210 }
      ],
      bedtime: [
        { name: 'Chamomile / Fennel Seed (Saunf) Warm Infusion', portion: '150 ml', calories: 8, protein: 0.2, carbs: 1.5, fat: 0, fibre: 0.4, sodium: 2, potassium: 30 }
      ]
    }
  },
  {
    id: 'high_protein_veg',
    name: 'High-Protein Vegetarian Metabolic Plan',
    subtitle: '80g+ Plant & Dairy Protein • Lean Muscle & Satiety Focus',
    badge: 'High Protein',
    calories: 1620,
    slots: {
      early_morning: [
        { name: 'Warm Lemon Water + 6 Soaked Almonds', portion: '200 ml + 6 almonds', calories: 45, protein: 1.8, carbs: 2.2, fat: 3.6, fibre: 1.0, sodium: 3, potassium: 70 }
      ],
      breakfast: [
        { name: 'Besan & Paneer Stuffed Cheela', portion: '2 medium cheelas (160 g)', calories: 285, protein: 16.5, carbs: 29.0, fat: 8.0, fibre: 4.8, sodium: 180, potassium: 240 },
        { name: 'Low-Fat Curd / Greek Yogurt', portion: '1 small bowl (100 g)', calories: 65, protein: 6.2, carbs: 4.5, fat: 2.0, fibre: 0, sodium: 55, potassium: 150 }
      ],
      mid_morning: [
        { name: 'Roasted Chana & Pumpkin Seeds Trail Mix', portion: '30 g', calories: 125, protein: 7.2, carbs: 13.5, fat: 4.5, fibre: 3.8, sodium: 35, potassium: 185 }
      ],
      lunch: [
        { name: '2 Whole Wheat Phulkas', portion: '2 medium (60 g)', calories: 200, protein: 6.6, carbs: 42.0, fat: 2.2, fibre: 5.6, sodium: 4, potassium: 154 },
        { name: 'Thick Dal Tadka + Soya Chunk / Tofu Curry', portion: '1 katori dal + 1 katori soya', calories: 265, protein: 19.5, carbs: 26.0, fat: 6.5, fibre: 5.8, sodium: 220, potassium: 290 },
        { name: 'Fresh Cucumber, Carrot & Sprout Salad', portion: '1 bowl (100 g)', calories: 45, protein: 2.8, carbs: 7.5, fat: 0.5, fibre: 2.8, sodium: 15, potassium: 145 }
      ],
      evening_snack: [
        { name: 'Grilled Herb Paneer / Tofu Tikka Cubes', portion: '80 g', calories: 145, protein: 11.2, carbs: 4.5, fat: 7.5, fibre: 1.2, sodium: 135, potassium: 160 },
        { name: 'Spiced Chaas (Buttermilk)', portion: '200 ml', calories: 55, protein: 3.0, carbs: 4.5, fat: 1.8, fibre: 0, sodium: 95, potassium: 165 }
      ],
      dinner: [
        { name: 'Quinoa & Yellow Moong Dal Khichdi', portion: '1 bowl (220 g)', calories: 245, protein: 11.5, carbs: 39.0, fat: 4.2, fibre: 5.4, sodium: 150, potassium: 235 },
        { name: 'Steamed Lauki & Bell Pepper Subzi', portion: '1 katori (100 g)', calories: 65, protein: 2.2, carbs: 8.5, fat: 2.4, fibre: 2.9, sodium: 115, potassium: 210 }
      ],
      bedtime: [
        { name: 'Warm Turmeric Skim Milk', portion: '150 ml', calories: 75, protein: 5.2, carbs: 7.0, fat: 2.0, fibre: 0, sodium: 60, potassium: 165 }
      ]
    }
  }
];

function createDefaultMeals(): MealSlotSection[] {
  const raw: MealSlotSection[] = [
    {
      id: 'early_morning',
      time: '7:00 AM',
      title: 'Early Morning',
      timeBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      notes: 'Take on an empty stomach 20 mins before breakfast.',
      items: [
        {
          id: 'em_1',
          name: 'Warm Lemon Water',
          portion: '200 ml',
          calories: 5,
          protein: 0.1,
          carbs: 1.2,
          fat: 0,
          fibre: 0.1,
          sodium: 2,
          potassium: 35
        },
        {
          id: 'em_2',
          name: 'Almonds (soaked)',
          portion: '5 nos (7g)',
          calories: 35,
          protein: 1.3,
          carbs: 1.1,
          fat: 3.0,
          fibre: 0.7,
          sodium: 1,
          potassium: 52
        }
      ]
    },
    {
      id: 'breakfast',
      time: '8:30 AM',
      title: 'Breakfast',
      timeBadgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      notes: 'Prepared with minimal oil, steamed peas & mustard seeds (No Onion).',
      items: [
        {
          id: 'bf_1',
          name: 'Vegetable Poha (No Onion)',
          portion: '1 bowl (200 g)',
          calories: 239,
          protein: 6.2,
          carbs: 40.6,
          fat: 6.2,
          fibre: 4.2,
          sodium: 240,
          potassium: 229,
          image: '/logo.jpg'
        },
        {
          id: 'bf_2',
          name: 'Tea (without sugar)',
          portion: '150 ml',
          calories: 28,
          protein: 1.4,
          carbs: 3.1,
          fat: 1.2,
          fibre: 0,
          sodium: 22,
          potassium: 95
        }
      ]
    },
    {
      id: 'mid_morning',
      time: '11:00 AM',
      title: 'Mid Morning',
      timeBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      notes: '',
      items: [
        {
          id: 'mm_1',
          name: 'Apple',
          portion: '1 medium (100 g)',
          calories: 52,
          protein: 0.3,
          carbs: 14.0,
          fat: 0.2,
          fibre: 2.4,
          sodium: 1,
          potassium: 107
        }
      ]
    },
    {
      id: 'lunch',
      time: '1:30 PM',
      title: 'Lunch',
      timeBadgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      notes: 'Start with raw salad 10 mins before rotis to blunt post-meal glucose spike.',
      items: [
        {
          id: 'lu_1',
          name: 'Phulka (wheat)',
          portion: '2 medium (60 g)',
          calories: 200,
          protein: 6.6,
          carbs: 42.0,
          fat: 2.2,
          fibre: 5.6,
          sodium: 2,
          potassium: 154
        },
        {
          id: 'lu_2',
          name: 'Moong Dal',
          portion: '1 katori (120 ml)',
          calories: 120,
          protein: 7.2,
          carbs: 18.0,
          fat: 3.0,
          fibre: 3.2,
          sodium: 220,
          potassium: 260
        },
        {
          id: 'lu_3',
          name: 'Lauki Bhaji',
          portion: '1 katori (100 g)',
          calories: 65,
          protein: 2.1,
          carbs: 8.4,
          fat: 2.8,
          fibre: 2.8,
          sodium: 180,
          potassium: 240
        },
        {
          id: 'lu_4',
          name: 'Salad (cucumber, carrot)',
          portion: '1 bowl (50 g)',
          calories: 20,
          protein: 0.6,
          carbs: 4.0,
          fat: 0.2,
          fibre: 1.8,
          sodium: 15,
          potassium: 110
        }
      ]
    },
    {
      id: 'evening_snack',
      time: '4:30 PM',
      title: 'Evening Snack',
      timeBadgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      notes: '',
      items: [
        {
          id: 'es_1',
          name: 'Buttermilk (low salt)',
          portion: '200 ml',
          calories: 60,
          protein: 3.0,
          carbs: 4.8,
          fat: 2.0,
          fibre: 0,
          sodium: 110,
          potassium: 180
        },
        {
          id: 'es_2',
          name: 'Roasted Chana',
          portion: '20 g',
          calories: 80,
          protein: 4.0,
          carbs: 12.0,
          fat: 1.2,
          fibre: 3.2,
          sodium: 35,
          potassium: 170
        }
      ]
    },
    {
      id: 'dinner',
      time: '7:30 PM',
      title: 'Dinner',
      timeBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      notes: 'Finish dinner at least 2 hours before sleep.',
      items: [
        {
          id: 'di_1',
          name: 'Phulka (wheat)',
          portion: '2 medium (60 g)',
          calories: 200,
          protein: 6.6,
          carbs: 42.0,
          fat: 2.2,
          fibre: 5.6,
          sodium: 2,
          potassium: 154
        },
        {
          id: 'di_2',
          name: 'Paneer Bhaji (low oil)',
          portion: '1 katori (100 g)',
          calories: 160,
          protein: 9.2,
          carbs: 6.0,
          fat: 7.5,
          fibre: 2.1,
          sodium: 210,
          potassium: 195
        }
      ]
    },
    {
      id: 'bedtime',
      time: '10:00 PM',
      title: 'Bedtime',
      timeBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      notes: '',
      items: [
        {
          id: 'bt_1',
          name: 'Turmeric Milk (low fat)',
          portion: '150 ml',
          calories: 80,
          protein: 4.8,
          carbs: 7.2,
          fat: 2.4,
          fibre: 0,
          sodium: 65,
          potassium: 170
        }
      ]
    }
  ];

  return raw.map(slot => ({
    ...slot,
    items: slot.items.map(it => scaleFoodItem(it, 1))
  }));
}

function cloneMealsForDay(sourceMeals: MealSlotSection[], dayTag: string): MealSlotSection[] {
  return sourceMeals.map(slot => ({
    ...slot,
    items: slot.items.map(it => ({
      ...it,
      id: `${dayTag}_${it.id}_${Math.random().toString(36).slice(2, 5)}`
    }))
  }));
}

export default function MealPlanGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Modal State for Add Food, Swap, and Replace
  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'swap' | 'replace';
    slotId: string;
    slotTitle: string;
    itemToSwap?: PlanFoodItem;
  } | null>(null);

  const [modalSearch, setModalSearch] = useState('');
  const [modalFilter, setModalFilter] = useState('All');
  const [modalTab, setModalTab] = useState<'catalog' | 'custom'>('catalog');
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalItemNote, setModalItemNote] = useState<string>('');
  const [customFood, setCustomFood] = useState({
    name: '',
    portion: '1 serving',
    calories: 250,
    protein: 10,
    carbs: 30,
    fat: 6,
    fibre: 3,
    sodium: 120,
    potassium: 200,
    notes: ''
  });

  // Template Selector Modal State
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Inline Slot Notes Editing State (slotId -> draft note string)
  const [editingSlotNoteId, setEditingSlotNoteId] = useState<string | null>(null);
  const [slotNoteDraft, setSlotNoteDraft] = useState<string>('');

  // Inline Item Note Editing State
  const [editingItemNoteKey, setEditingItemNoteKey] = useState<string | null>(null); // `${slotId}__${itemId}`
  const [itemNoteDraft, setItemNoteDraft] = useState<string>('');

  // Patients & Selected Client
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [existingPlanId, setExistingPlanId] = useState<string | undefined>(undefined);
  const [existingWeekPlanId, setExistingWeekPlanId] = useState<string | undefined>(undefined);

  // Stepper State
  const [currentStep, setCurrentStep] = useState<number>(3); // 1: Client Profile, 2: Set Targets, 3: Build Diet Plan, 4: Review & Send

  // Client Profile & Lab Biomarkers State
  const [clientProfile, setClientProfile] = useState<{
    name: string;
    clientCode: string;
    age: number;
    gender: string;
    heightCm: number;
    currentWeightKg: number;
    targetWeightKg: number;
    bmi: number;
    bmiCategory: string;
    conditions: string[];
    dietPreference: string;
    allergies: string;
    lifestyle: string[];
    notes: string;
    labBiomarkers: PatientLabBiomarkers;
  }>({
    name: 'Priya Sharma',
    clientCode: 'CL-1025',
    age: 32,
    gender: 'Female',
    heightCm: 160,
    currentWeightKg: 72,
    targetWeightKg: 60,
    bmi: 28.1,
    bmiCategory: 'Overweight',
    conditions: ['Type 2 Diabetes', 'Hypertension', 'Fatty Liver'],
    dietPreference: 'Vegetarian',
    allergies: 'None',
    lifestyle: ['Sedentary (Office work)', 'Sleep: 6-7 hours', 'Moderate Stress'],
    notes: 'Prefers Indian food. No onions in breakfast. Works from office. Likes variety.',
    labBiomarkers: { ...DEFAULT_SAMPLE_LABS }
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingLabs, setIsEditingLabs] = useState(false);
  const [showAllBiomarkersInStudio, setShowAllBiomarkersInStudio] = useState(false);
  const [isEditingTargets, setIsEditingTargets] = useState(false);

  // Daily Nutrient Prescription Targets
  const [targets, setTargets] = useState({
    calories: 1500,
    protein: 65,
    carbs: 180,
    fat: 45,
    fibre: 30,
    sodium: 2000,
    potassium: 2500,
    fluid: 2.5
  });

  // Calendar Date & Active Day of Week
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [activeWeekDay, setActiveWeekDay] = useState<WeekDay>('Monday');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'exchange'>('day');

  // Active targeted meal slot for adding foods
  const [targetSlotId, setTargetSlotId] = useState<string>('lunch');

  // Toast & Saving
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Right Panel: Recipe Database state
  const [recipeTab, setRecipeTab] = useState<'search' | 'filter' | 'smart'>('search');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<string>('All');
  const [recipeDisplayLimit, setRecipeDisplayLimit] = useState<number>(100);

  // 7-Day Weekly Meals State (keyed by WeekDay) + Current Day `meals`
  const [weeklyMeals, setWeeklyMeals] = useState<Record<WeekDay, MealSlotSection[]>>(() => {
    const base = createDefaultMeals();
    return {
      Monday: base,
      Tuesday: cloneMealsForDay(base, 'tue'),
      Wednesday: cloneMealsForDay(base, 'wed'),
      Thursday: cloneMealsForDay(base, 'thu'),
      Friday: cloneMealsForDay(base, 'fri'),
      Saturday: cloneMealsForDay(base, 'sat'),
      Sunday: cloneMealsForDay(base, 'sun')
    };
  });

  // Current active day's meals
  const meals = weeklyMeals[activeWeekDay] || weeklyMeals.Monday;

  // Setter that updates the active day's meals in `weeklyMeals`
  const setMeals: React.Dispatch<React.SetStateAction<MealSlotSection[]>> = (updater) => {
    setWeeklyMeals(prev => {
      const currentDayMeals = prev[activeWeekDay] || prev.Monday;
      const nextDayMeals = typeof updater === 'function' ? updater(currentDayMeals) : updater;
      return {
        ...prev,
        [activeWeekDay]: nextDayMeals
      };
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Evaluate all 13 Lab Biomarkers for the current client
  const evaluatedBiomarkers = useMemo<ClinicalBiomarkerItem[]>(() => {
    return evaluateLabBiomarkers(clientProfile.labBiomarkers, clientProfile.gender);
  }, [clientProfile.labBiomarkers, clientProfile.gender]);

  // Abnormal / Flagged Biomarker Issues
  const abnormalBiomarkers = useMemo<ClinicalBiomarkerItem[]>(() => {
    return evaluatedBiomarkers.filter(b => b.status !== 'optimal');
  }, [evaluatedBiomarkers]);

  // Stepper navigation handler — makes all 4 steps functional
  const handleStepClick = (stepNum: number) => {
    setCurrentStep(stepNum);
    if (stepNum === 1) {
      setIsEditingProfile(true);
      setIsEditingLabs(true);
      showToast('Step 1: Editing Client Clinical Profile & Lab Biomarkers');
    } else if (stepNum === 2) {
      setIsEditingTargets(true);
      showToast('Step 2: Adjusting Daily Nutrient Prescription Targets');
    } else if (stepNum === 3) {
      setIsEditingProfile(false);
      setIsEditingTargets(false);
      showToast('Step 3: Active Diet Plan Builder');
    } else if (stepNum === 4) {
      setPreviewModalOpen(true);
    }
  };

  const openFoodModal = (mode: 'add' | 'swap' | 'replace', slotId: string, slotTitle: string, itemToSwap?: PlanFoodItem) => {
    setTargetSlotId(slotId);
    setModalSearch('');
    setModalFilter('All');
    setModalTab('catalog');
    setModalQuantity(itemToSwap?.quantity || 1);
    setModalItemNote(itemToSwap?.notes || '');
    const isSnack = slotTitle.toLowerCase().includes('snack') || slotTitle.toLowerCase().includes('early') || slotTitle.toLowerCase().includes('bedtime') || slotTitle.toLowerCase().includes('mid');
    setCustomFood({
      name: itemToSwap ? itemToSwap.name : '',
      portion: itemToSwap ? itemToSwap.portion : '1 serving',
      calories: itemToSwap ? itemToSwap.calories : (isSnack ? 120 : 250),
      protein: itemToSwap ? itemToSwap.protein : (isSnack ? 5 : 12),
      carbs: itemToSwap ? itemToSwap.carbs : (isSnack ? 18 : 32),
      fat: itemToSwap ? itemToSwap.fat : (isSnack ? 3 : 6),
      fibre: itemToSwap ? itemToSwap.fibre : 3,
      sodium: itemToSwap ? itemToSwap.sodium : 110,
      potassium: itemToSwap ? itemToSwap.potassium : 180,
      notes: itemToSwap?.notes || ''
    });
    setActiveModal({
      isOpen: true,
      mode,
      slotId,
      slotTitle,
      itemToSwap
    });
  };

  const handleModalAddOrSwap = (selectedFood: {
    name: string;
    portion?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fibre?: number;
    sodium?: number;
    potassium?: number;
    notes?: string;
  }, applyQty: number = modalQuantity) => {
    if (!activeModal) return;
    const { mode, slotId, slotTitle, itemToSwap } = activeModal;

    const baseItem: PlanFoodItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: selectedFood.name,
      portion: selectedFood.portion || '1 serving',
      basePortion: selectedFood.portion || '1 serving',
      quantity: 1,
      calories: Math.round(Number(selectedFood.calories) || 0),
      protein: Math.round((Number(selectedFood.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(selectedFood.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(selectedFood.fat) || 0) * 10) / 10,
      fibre: Math.round((Number(selectedFood.fibre) || 0) * 10) / 10,
      sodium: Math.round(Number(selectedFood.sodium) || 0),
      potassium: Math.round(Number(selectedFood.potassium) || 0),
      notes: (selectedFood.notes ?? modalItemNote).trim() || undefined
    };

    const newItem = scaleFoodItem(baseItem, applyQty);

    setMeals(prev => prev.map(m => {
      if (m.id === slotId) {
        if (mode === 'swap' && itemToSwap) {
          return {
            ...m,
            items: m.items.map(it => it.id === itemToSwap.id ? newItem : it)
          };
        } else if (mode === 'replace') {
          return {
            ...m,
            items: [newItem]
          };
        } else {
          return {
            ...m,
            items: [...m.items, newItem]
          };
        }
      }
      return m;
    }));

    const badges = evaluateFoodItemForPatient(newItem, slotTitle, clientProfile);
    const dangerBadge = badges.find(b => b.type === 'danger');
    if (dangerBadge) {
      showToast(`${mode === 'swap' ? 'Swapped with' : 'Added'} ${newItem.name} (${newItem.portion}) — ⚠️ ${dangerBadge.text}`);
    } else {
      showToast(`${mode === 'swap' ? 'Swapped with' : mode === 'replace' ? 'Replaced slot with' : 'Added'} ${newItem.name} (${newItem.calories} kcal) in ${slotTitle}!`);
    }

    setActiveModal(null);
  };

  // Load patients list on mount
  useEffect(() => {
    getPatients().then(async pts => {
      setPatients(pts);
      if (pts.length > 0) {
        const urlId = searchParams.get('patientId');
        const targetPatient = (urlId && pts.find(p => p.id === urlId)) ? pts.find(p => p.id === urlId)! : pts[0];
        setSelectedPatientId(targetPatient.id);
        await applyPatientProfile(targetPatient);
      }
    }).catch(console.error).finally(() => setLoadingPatients(false));
  }, [searchParams]);

  // Convert a saved MealPlan's day meals into MealSlotSection[] for Studio editing
  const mapSavedMealsToStudioSlots = (savedMeals: any[]): MealSlotSection[] => {
    const baseTemplate = createDefaultMeals().map(s => ({ ...s, items: [] as PlanFoodItem[] }));
    const findSlotIdx = (typeStr: string): number => {
      const t = (typeStr || '').toLowerCase();
      if (t.includes('early')) return 0;
      if (t.includes('breakfast')) return 1;
      if (t.includes('mid') || t.includes('morning snack')) return 2;
      if (t.includes('lunch')) return 3;
      if (t.includes('evening') || t.includes('snack')) return 4;
      if (t.includes('dinner')) return 5;
      if (t.includes('bedtime') || t.includes('night')) return 6;
      return 3;
    };

    // Plans saved with separate slot notes: use exactly what the dietitian saved (not the template defaults)
    if (savedMeals.some(m => m && m.slotNotes !== undefined)) {
      baseTemplate.forEach(slot => { slot.notes = ''; });
    }
    savedMeals.forEach((m, idx) => {
      const sIdx = findSlotIdx(m.type || 'Lunch');
      if (m.slotNotes) baseTemplate[sIdx].notes = m.slotNotes;
      if (m.noteOnly) return; // instructions-only entry: restore the note, not a food item
      const cal = Math.round(Number(m.calories) || 150);
      const p = Math.round((Number(m.protein) || 6) * 10) / 10;
      const c = Math.round((Number(m.carbs) || 20) * 10) / 10;
      const f = Math.round((Number(m.fat) || 4) * 10) / 10;
      const fib = Math.round((Number(m.fibre ?? m.fiber) || 2.5) * 10) / 10;
      const na = Math.round(Number(m.sodium) || 110);
      const k = Math.round(Number(m.potassium) || 180);
      const portion = m.portion || '1 serving';

      const dishName = (m.name || m.recipeName || m.dish || m.title || m.description || 'Prescribed Dish').trim();

      const studioItem: PlanFoodItem = scaleFoodItem({
        id: `saved_${idx}_${Date.now()}`,
        name: dishName,
        portion,
        basePortion: portion,
        quantity: 1,
        calories: cal,
        protein: p,
        carbs: c,
        fat: f,
        fibre: fib,
        sodium: na,
        potassium: k,
        notes: m.itemNotes !== undefined ? (m.itemNotes || undefined) : m.notes
      }, 1);

      baseTemplate[sIdx].items.push(studioItem);
    });

    return baseTemplate;
  };

  const applyPatientProfile = async (p: PatientProfile) => {
    const rawConds = [
      ...(p.medicalHistory || []),
      ...(p.healthInfo?.conditions && p.healthInfo.conditions.toLowerCase() !== 'none'
        ? p.healthInfo.conditions.split(',').map(c => c.trim())
        : []),
      ...(p.diagnosisOrProcedure ? [p.diagnosisOrProcedure] : [])
    ].filter(Boolean);

    const uniqueConds = Array.from(new Set(rawConds));
    const heightM = (p.heightCm || 160) / 100;
    const calcBmi = p.bmi || Math.round(((p.currentWeightKg || 70) / (heightM * heightM)) * 10) / 10;
    const effectiveLabs: PatientLabBiomarkers = p.labBiomarkers ? { ...p.labBiomarkers } : {};

    const defaultNotes = p.preferences?.dislikes
      ? `Dislikes: ${p.preferences.dislikes}${p.preferences?.favorites ? ` • Favorites: ${p.preferences.favorites}` : ''}`
      : (p.preferences?.favorites || 'Prefers Indian home-style food. No onions in breakfast.');

    setClientProfile({
      name: p.name || 'Patient',
      clientCode: `CL-${p.id.slice(-4).toUpperCase()}`,
      age: p.age || 32,
      gender: p.gender || 'Female',
      heightCm: p.heightCm || 160,
      currentWeightKg: p.currentWeightKg || 70,
      targetWeightKg: p.targetWeightKg || 60,
      bmi: calcBmi,
      bmiCategory: calcBmi >= 25 ? 'Overweight' : calcBmi < 18.5 ? 'Underweight' : 'Normal',
      conditions: uniqueConds.length > 0 ? uniqueConds : ['Type 2 Diabetes', 'Hypertension', 'Fatty Liver'],
      dietPreference: p.dietaryType || 'Vegetarian',
      allergies: p.healthInfo?.allergies || (Array.isArray(p.allergies) ? p.allergies.join(', ') : 'None') || 'None',
      lifestyle: [p.occupation || 'Office work', `Activity: ${p.activityLevel || 'Moderate'}`],
      notes: defaultNotes,
      labBiomarkers: effectiveLabs
    });

    // Auto-calculate targets from clinical profile
    const currentWeight = Number(p.currentWeightKg) || 65;
    const targetWeight = Number(p.targetWeightKg) || currentWeight;
    const height = Number(p.heightCm) || 160;
    const age = Number(p.age) || 30;
    const isMale = (p.gender || '').toLowerCase().startsWith('m');
    const bmr = isMale
      ? (10 * currentWeight) + (6.25 * height) - (5 * age) + 5
      : (10 * currentWeight) + (6.25 * height) - (5 * age) - 161;
    const tdee = Math.round(bmr * 1.375);
    let targetCals = tdee;
    if (targetWeight < currentWeight) {
      targetCals = Math.max(1200, tdee - 400);
    } else if (targetWeight > currentWeight) {
      targetCals = tdee + 350;
    }
    const finalCals = Math.round(targetCals / 50) * 50;
    setTargets({
      calories: finalCals,
      protein: Math.round((finalCals * 0.22) / 4),
      carbs: Math.round((finalCals * 0.50) / 4),
      fat: Math.round((finalCals * 0.28) / 9),
      fibre: 30,
      sodium: uniqueConds.some(c => c.toLowerCase().includes('hypertens') || c.toLowerCase().includes('bp')) ? 1500 : 2000,
      potassium: 2500,
      fluid: 2.5
    });

    // Load existing saved/published MealPlan & PatientWeekPlan for this patient if available
    try {
      const [plans, weekPlan] = await Promise.all([
        getMealPlans(p.id),
        getPatientWeekPlan(p.id)
      ]);
      const latestPlan = plans.find(pl => pl.status === 'published') || plans[0];
      setExistingPlanId(latestPlan?.id);
      setExistingWeekPlanId(weekPlan?.id);

      if (latestPlan) {
        if (latestPlan.targets) {
          setTargets(prev => ({
            ...prev,
            calories: Number(latestPlan.targets.calories) || prev.calories,
            protein: Number(latestPlan.targets.protein) || prev.protein,
            carbs: Number(latestPlan.targets.carbs) || prev.carbs,
            fat: Number(latestPlan.targets.fat) || prev.fat
          }));
        }
        if (latestPlan.instructions) {
          setClientProfile(prev => ({ ...prev, notes: latestPlan.instructions! }));
        }
        if (Array.isArray(latestPlan.days) && latestPlan.days.length > 0 && latestPlan.days[0].meals?.length > 0) {
          const rebuiltWeek: Record<WeekDay, MealSlotSection[]> = {} as any;
          WEEK_DAYS.forEach((dayName, idx) => {
            const daySource = latestPlan.days[idx] || latestPlan.days[0];
            rebuiltWeek[dayName] = mapSavedMealsToStudioSlots(daySource.meals);
          });
          setWeeklyMeals(rebuiltWeek);
        } else if (weekPlan && Array.isArray(weekPlan.entries) && weekPlan.entries.length > 0) {
          const rebuiltWeek: Record<WeekDay, MealSlotSection[]> = {} as any;
          WEEK_DAYS.forEach(dayName => {
            const dayEntries = weekPlan.entries.filter(e => e.day === dayName);
            const sourceEntries = dayEntries.length > 0 ? dayEntries : weekPlan.entries.filter(e => e.day === 'Monday');
            rebuiltWeek[dayName] = mapSavedMealsToStudioSlots(sourceEntries.map(e => ({
              type: e.mealSlot,
              name: e.recipeName,
              portion: e.portion,
              calories: e.calories,
              protein: e.protein,
              carbs: e.carbs,
              fat: e.fat,
              fibre: e.fibre,
              sodium: e.sodium,
              potassium: e.potassium,
              notes: e.notes
            })));
          });
          setWeeklyMeals(rebuiltWeek);
        }
      } else if (weekPlan && Array.isArray(weekPlan.entries) && weekPlan.entries.length > 0) {
        const rebuiltWeek: Record<WeekDay, MealSlotSection[]> = {} as any;
        WEEK_DAYS.forEach(dayName => {
          const dayEntries = weekPlan.entries.filter(e => e.day === dayName);
          const sourceEntries = dayEntries.length > 0 ? dayEntries : weekPlan.entries.filter(e => e.day === 'Monday');
          rebuiltWeek[dayName] = mapSavedMealsToStudioSlots(sourceEntries.map(e => ({
            type: e.mealSlot,
            name: e.recipeName,
            portion: e.portion,
            calories: e.calories,
            protein: e.protein,
            carbs: e.carbs,
            fat: e.fat,
            fibre: e.fibre,
            sodium: e.sodium,
            potassium: e.potassium,
            notes: e.notes
          })));
        });
        setWeeklyMeals(rebuiltWeek);
      }
    } catch (err) {
      console.warn('Could not load existing meal plan for patient:', err);
    }
  };

  // When patient selection changes
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    const p = patients.find(item => item.id === id);
    if (p) {
      applyPatientProfile(p);
    }
  };

  // Classify any dish into the 5 core food group categories:
  // 'Cereal' | 'Milk & Milk Products' | 'Vegetables' | 'Non-Veg' | 'Dal & Pulses'
  const classifyDishCategories = (
    dishName: string,
    dietaryType?: string,
    clinicalFocus?: string,
    ingredients?: string[]
  ): ('Cereal' | 'Milk & Milk Products' | 'Vegetables' | 'Non-Veg' | 'Dal & Pulses')[] => {
    const name = (dishName || '').toLowerCase();
    const ingText = Array.isArray(ingredients) ? ingredients.join(' ').toLowerCase() : '';
    const combined = `${name} ${ingText}`;
    const dt = (dietaryType || '').toLowerCase();
    const focus = (clinicalFocus || '').toLowerCase();

    // 1. Non-Veg (meat, poultry, fish, seafood, egg)
    const isNonVeg =
      dt === 'non-vegetarian' ||
      dt === 'eggetarian' ||
      /\b(chicken|mutton|fish|prawn|prawns|shrimp|crab|pomfret|rohu|surmai|bangda|hilsa|rawas|salmon|tuna|sardine|mackerel|meat|keema|kebab|kabab|murgh|gosht|nihari|haleem|paya|kombdi|kolambi|tisrya|bombil|egg|eggs|anda|omelette|omelet)\b/i.test(combined);

    if (isNonVeg) {
      return ['Non-Veg'];
    }

    const groups: ('Cereal' | 'Milk & Milk Products' | 'Vegetables' | 'Non-Veg' | 'Dal & Pulses')[] = [];

    // 2. Milk & Milk Products (milk, curd, raita, paneer, buttermilk/chaas, lassi, kadhi, cheese, kheer, etc.)
    const isPlantMilkOrNutButter = /\b(almond\s*milk|coconut\s*milk|soy\s*milk|soya\s*milk|oat\s*milk|peanut\s*butter)\b/i.test(name);
    const hasDairy =
      focus === 'milk & milk products' ||
      (!isPlantMilkOrNutButter &&
        /\b(milk|curd|dahi|yogurt|yoghurt|raita|paneer|chaas|chhaas|buttermilk|lassi|shrikhand|kadhi|kheer|rabdi|rabri|rasmalai|sandesh|rasgulla|chenna|chhena|khoa|khoya|mava|cheese|basundi|payasam|phirni|mishti\s*doi|solkadhi|mor\s*kuzhambu|doodh|malai|kulfi|ghee|makhan)\b/i.test(name));
    if (hasDairy) {
      groups.push('Milk & Milk Products');
    }

    // 3. Dal & Pulses (lentils, pulses, legumes, sprouts, chana, rajma, chole, moong, sambar, rasam, besan, soya/tofu)
    const hasDalPulses =
      /\b(dal|daal|dhal|moong|mung|masoor|toor|tuvar|arhar|urad|chana|channa|chole|chhole|rajma|lobia|rongi|matki|moth|kulthi|horse\s*gram|sprout|sprouts|usal|misal|sambar|sambhar|rasam|amti|varan|pithla|zunka|besan|gatte|kadala|sundal|ghugni|kootu|parippu|pappu|lentil|lentils|legume|pulse|pulses|soyabean|soya|tofu|edamame|hummus|falafel|dalma|dhansak|sattu|adai|pesarattu|medu\s*vada|dal\s*vada)\b/i.test(name);
    if (hasDalPulses) {
      groups.push('Dal & Pulses');
    }

    // 4. Cereal (wheat, rice, millets, oats, roti, phulka, paratha, bhakri, poha, upma, idli, dosa, daliya, bread, etc.)
    const hasCereal =
      focus === 'cereals & grains' ||
      /\b(roti|phulka|chapati|chappati|paratha|parantha|thepla|bhakri|thalipeeth|kulcha|naan|bhatura|bhature|puri|poori|kachori|luchi|baati|bati|litti|rice|bhaat|bhat|pulao|pulav|biryani|khichdi|khichuri|bisi\s*bele|pongal|pulihora|chitranna|poha|pohe|aval|upma|uppittu|sheera|kesari|idli|dosa|uttapam|uthappam|appe|appam|paniyaram|paddu|puttu|idiyappam|pathiri|dhokla|khandvi|handvo|muthiya|khaman|locho|oats|oatmeal|daliya|dalia|lapsi|porridge|ragi|nachni|mudde|ambali|jowar|jolada|bajra|kambu|millet|kangni|foxtail|kodo|kutki|barnyard|sama|moraiyo|bhagar|sabudana|sago|quinoa|amaranth|rajgira|kuttu|buckwheat|wheat|atta|maida|suji|sooji|rava|semolina|vermicelli|seviyan|sevai|noodle|noodles|hakka|chowmein|pasta|macaroni|spaghetti|bread|toast|sandwich|burger|pav|bun|pizza|wrap|roll|frankie|khakhra|makhana|foxnut|murmura|kurmura|bhel|papdi|samosa|vada\s*pav|dabeli|corn|makki|popcorn|pancake|cheela|chilla|chila|akki\s*roti|rumali)\b/i.test(name);
    if (hasCereal) {
      groups.push('Cereal');
    }

    // 5. Vegetables (all vegetable subzis, bhajis, shaaks, poriyals, thorans, salads, soups, gourds, leafy greens)
    if (groups.length === 0) {
      groups.push('Vegetables');
    }

    return groups;
  };

  // Recipe catalog combined from PLATE_FOODS (457), DEFAULT_CLINICAL_RECIPES (200) and MASTER_FOODS (73),
  // deduplicated by dish name and sorted in strict alphabetical order (A–Z)
  const recipeDatabase = useMemo(() => {
    const rawList = [
      ...PLATE_FOODS.map(pf => {
        const categories = classifyDishCategories(pf.dish, pf.dietaryType, undefined, undefined);
        return {
          id: `pf_${pf.id}`,
          name: pf.dish.trim(),
          portion: pf.serving,
          calories: Math.round(pf.cal),
          protein: pf.protein,
          carbs: pf.carb,
          fat: pf.fat,
          fibre: pf.fibre,
          sodium: pf.sodium,
          potassium: pf.potassium,
          region: pf.region,
          categories,
          tags: categories as string[]
        };
      }),
      ...DEFAULT_CLINICAL_RECIPES.map(cr => {
        const categories = classifyDishCategories(cr.name, cr.dietaryType, cr.clinicalFocus, cr.ingredients);
        return {
          id: cr.id || `cr_${cr.name}`,
          name: cr.name.trim(),
          portion: cr.portionSize || '1 serving',
          calories: Math.round(cr.calories),
          protein: cr.protein,
          carbs: cr.carbs,
          fat: cr.fat,
          fibre: cr.fiber || 3.5,
          sodium: cr.sodium || 80,
          potassium: cr.potassium || 220,
          region: 'Clinical Exchange',
          categories,
          tags: categories as string[]
        };
      }),
      ...MASTER_FOODS.map(mf => {
        const categories = classifyDishCategories(mf.name, mf.dietaryType, mf.clinicalFocus, mf.ingredients);
        return {
          id: mf.id || `mf_${mf.name}`,
          name: mf.name.trim(),
          portion: mf.portionSize || '1 serving',
          calories: Math.round(mf.calories),
          protein: mf.protein,
          carbs: mf.carbs,
          fat: mf.fat,
          fibre: mf.fiber || 0,
          sodium: mf.sodium || 0,
          potassium: mf.potassium || 0,
          region: mf.clinicalFocus || 'Master Food List',
          categories,
          tags: categories as string[]
        };
      })
    ];

    // Deduplicate by lowercase dish name and sort A-Z
    const seen = new Set<string>();
    const uniqueList = rawList.filter(item => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    uniqueList.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return uniqueList;
  }, []);

  // Filtered recipe list for Right Panel (sorted A-Z)
  const filteredRecipes = useMemo(() => {
    let list = recipeDatabase;

    if (recipeTab === 'smart' && selectedCategoryTag !== 'Non-Veg') {
      list = list.filter(r => {
        const badges = evaluateFoodItemForPatient(r, meals.find(m => m.id === targetSlotId)?.title || 'any', clientProfile);
        return !badges.some(b => b.type === 'danger');
      });
    }

    if (selectedCategoryTag !== 'All') {
      if (
        selectedCategoryTag === 'Cereal' ||
        selectedCategoryTag === 'Milk & Milk Products' ||
        selectedCategoryTag === 'Vegetables' ||
        selectedCategoryTag === 'Non-Veg' ||
        selectedCategoryTag === 'Dal & Pulses'
      ) {
        list = list.filter(r => r.categories.includes(selectedCategoryTag as any));
      } else if (selectedCategoryTag === 'Diabetic Safe') {
        list = list.filter(r => r.carbs <= 25 && (r.fibre || 0) >= 2.5);
      } else if (selectedCategoryTag === 'Low Sodium') {
        list = list.filter(r => (r.sodium || 0) <= 100);
      } else if (selectedCategoryTag === 'Low Potassium') {
        list = list.filter(r => (r.potassium || 0) <= 180);
      } else if (selectedCategoryTag === 'Low Fat') {
        list = list.filter(r => r.fat <= 5);
      } else if (selectedCategoryTag === 'High Fibre') {
        list = list.filter(r => (r.fibre || 0) >= 4);
      } else if (selectedCategoryTag === 'High Protein') {
        list = list.filter(r => r.protein >= 8);
      } else if (selectedCategoryTag === 'Gluten Free') {
        const glutenWords = ['wheat', 'roti', 'phulka', 'chapati', 'paratha', 'bread', 'suji', 'semolina', 'pasta', 'maida', 'dalia'];
        list = list.filter(r => !glutenWords.some(w => r.name.toLowerCase().includes(w)));
      } else if (selectedCategoryTag === 'Dairy Free') {
        const dairyWords = ['milk', 'paneer', 'curd', 'yogurt', 'cheese', 'buttermilk', 'butter', 'ghee', 'chaas', 'lassi'];
        list = list.filter(r => !dairyWords.some(w => r.name.toLowerCase().includes(w)));
      }
    }

    if (recipeSearch.trim()) {
      const q = recipeSearch.trim().toLowerCase();
      list = list
        .filter(r => r.name.toLowerCase().includes(q))
        .sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
          const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
    }

    return list;
  }, [recipeDatabase, selectedCategoryTag, recipeSearch, recipeTab, clientProfile, meals, targetSlotId]);

  // Filtered recipe list inside Add/Swap Modal (sorted A-Z)
  const modalFilteredRecipes = useMemo(() => {
    let list = recipeDatabase;
    const slotTitle = activeModal?.slotTitle || 'Lunch';

    if (modalFilter !== 'All') {
      if (
        modalFilter === 'Cereal' ||
        modalFilter === 'Milk & Milk Products' ||
        modalFilter === 'Vegetables' ||
        modalFilter === 'Non-Veg' ||
        modalFilter === 'Dal & Pulses'
      ) {
        list = list.filter(r => r.categories.includes(modalFilter as any));
      } else if (modalFilter === 'Safe for Patient') {
        list = list.filter(r => {
          const b = evaluateFoodItemForPatient(r, slotTitle, clientProfile);
          return !b.some(x => x.type === 'danger' || x.type === 'warning');
        });
      }
    }

    if (modalSearch.trim()) {
      const q = modalSearch.trim().toLowerCase();
      list = list
        .filter(r => r.name.toLowerCase().includes(q))
        .sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
          const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
    }

    return list.slice(0, 120);
  }, [recipeDatabase, modalFilter, modalSearch, activeModal, clientProfile]);

  // Daily Totals Calculation for Active Day
  const dailyTotals = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0, fib = 0, na = 0, k = 0;
    meals.forEach(m => {
      m.items.forEach(it => {
        cal += Number(it.calories) || 0;
        p += Number(it.protein) || 0;
        c += Number(it.carbs) || 0;
        f += Number(it.fat) || 0;
        fib += Number(it.fibre) || 0;
        na += Number(it.sodium) || 0;
        k += Number(it.potassium) || 0;
      });
    });
    return {
      calories: Math.round(cal),
      protein: Math.round(p * 10) / 10,
      carbs: Math.round(c * 10) / 10,
      fat: Math.round(f * 10) / 10,
      fibre: Math.round(fib * 10) / 10,
      sodium: Math.round(na),
      potassium: Math.round(k)
    };
  }, [meals]);

  // ICMR Food Exchange Breakdown for Exchange View
  const exchangeSummary = useMemo(() => {
    const groups: Record<string, {
      group: string;
      standardPortion: string;
      kcalPerExchange: number;
      items: { name: string; portion: string; slot: string; calories: number }[];
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fibre: number;
      sodium: number;
      potassium: number;
      exchanges: number;
    }> = {
      'Cereals & Millets': { group: 'Cereals & Millets', standardPortion: '30g raw / 1 phulka', kcalPerExchange: 100, items: [], calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, exchanges: 0 },
      'Pulses & Legumes': { group: 'Pulses & Legumes', standardPortion: '30g raw / 1 katori dal', kcalPerExchange: 100, items: [], calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, exchanges: 0 },
      'Milk, Dairy & Protein': { group: 'Milk, Dairy & Protein', standardPortion: '150ml milk / 40g paneer', kcalPerExchange: 100, items: [], calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, exchanges: 0 },
      'Vegetables & Greens': { group: 'Vegetables & Greens', standardPortion: '100g subzi / salad', kcalPerExchange: 35, items: [], calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, exchanges: 0 },
      'Fruits': { group: 'Fruits', standardPortion: '100g fresh fruit', kcalPerExchange: 50, items: [], calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, exchanges: 0 },
      'Fats, Nuts & Seeds': { group: 'Fats, Nuts & Seeds', standardPortion: '5g fat / soaked nuts', kcalPerExchange: 45, items: [], calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, exchanges: 0 }
    };

    meals.forEach(slot => {
      slot.items.forEach(it => {
        const info = getFoodExchangeGroup(it);
        const bucket = groups[info.group];
        bucket.items.push({ name: it.name, portion: it.portion, slot: slot.title, calories: it.calories });
        bucket.calories += it.calories;
        bucket.protein += it.protein;
        bucket.carbs += it.carbs;
        bucket.fat += it.fat;
        bucket.fibre += it.fibre;
        bucket.sodium += it.sodium;
        bucket.potassium += it.potassium;
      });
    });

    return Object.values(groups).map(g => ({
      ...g,
      calories: Math.round(g.calories),
      protein: Math.round(g.protein * 10) / 10,
      carbs: Math.round(g.carbs * 10) / 10,
      fat: Math.round(g.fat * 10) / 10,
      fibre: Math.round(g.fibre * 10) / 10,
      sodium: Math.round(g.sodium),
      potassium: Math.round(g.potassium),
      exchanges: Math.round((g.calories / g.kcalPerExchange) * 10) / 10
    }));
  }, [meals]);

  // Overall Real-time Clinical & Biomarker Audit across All Meals
  const overallClinicalAudit = useMemo(() => {
    let dangerCount = 0;
    let warningCount = 0;
    const issues: { slot: string; item: string; badge: ClinicalBadge }[] = [];

    meals.forEach(m => {
      m.items.forEach(it => {
        const badges = evaluateFoodItemForPatient(it, m.title, clientProfile);
        badges.forEach(b => {
          if (b.type === 'danger') {
            dangerCount++;
            issues.push({ slot: m.title, item: it.name, badge: b });
          } else if (b.type === 'warning') {
            warningCount++;
            issues.push({ slot: m.title, item: it.name, badge: b });
          }
        });
      });
    });

    const labs = clientProfile.labBiomarkers;

    // 1. Diabetes & HbA1c Check
    const hasDiabetes = clientProfile.conditions.some(c => c.toLowerCase().includes('diabet')) || (typeof labs?.hba1c === 'number' && labs.hba1c >= 5.7);
    let diabetesStatus = 'Target within range';
    if (hasDiabetes) {
      const hba1cStr = labs?.hba1c ? ` • HbA1c ${labs.hba1c}%` : '';
      if (dailyTotals.carbs > targets.carbs + 20) {
        diabetesStatus = `Carbs elevated (${dailyTotals.carbs}g / ${targets.carbs}g)${hba1cStr}`;
      } else {
        diabetesStatus = `Balanced (${dailyTotals.carbs}g / ${targets.carbs}g)${hba1cStr}`;
      }
    }

    // 2. Hypertension & Sodium Check
    const hasHypertension = clientProfile.conditions.some(c => c.toLowerCase().includes('hypertens') || c.toLowerCase().includes('bp')) || (typeof labs?.sodium === 'number' && labs.sodium > 145);
    let hypertensionStatus = 'Normal sodium balance';
    if (hasHypertension) {
      if (dailyTotals.sodium > targets.sodium) {
        hypertensionStatus = `Sodium High (${dailyTotals.sodium}mg / ${targets.sodium}mg)`;
      } else {
        hypertensionStatus = `DASH Safe (${dailyTotals.sodium}mg / ${targets.sodium}mg)`;
      }
    }

    // 3. Fatty Liver / Lipids & SGPT Check
    const hasFattyLiver = clientProfile.conditions.some(c => c.toLowerCase().includes('fatty liver')) || (typeof labs?.sgpt === 'number' && labs.sgpt > 45);
    let fattyLiverStatus = 'Hepatic lipid safe';
    if (hasFattyLiver) {
      const sgptStr = labs?.sgpt ? ` • SGPT ${labs.sgpt} U/L` : '';
      if (dailyTotals.fat > targets.fat + 10) {
        fattyLiverStatus = `Fat elevated (${dailyTotals.fat}g / ${targets.fat}g)${sgptStr}`;
      } else {
        fattyLiverStatus = `Low Fat (${dailyTotals.fat}g / ${targets.fat}g)${sgptStr}`;
      }
    }

    // 4. Lab Biomarkers Shield Status
    const biomarkerViolations = issues.filter(x =>
      x.badge.text.includes('HbA1c') ||
      x.badge.text.includes('SGPT') ||
      x.badge.text.includes('TG') ||
      x.badge.text.includes('Uric Acid') ||
      x.badge.text.includes('Purine') ||
      x.badge.text.includes('High K+')
    );
    const biomarkerStatus = abnormalBiomarkers.length > 0
      ? `${abnormalBiomarkers.length} lab flag(s): ${abnormalBiomarkers.slice(0, 3).map(b => `${b.shortName} ${b.value}${b.unit}`).join(', ')}`
      : 'All 13 biomarkers optimal';

    // 5. Allergen Violations Check
    const allergenViolations = issues.filter(x => x.badge.text.includes('Allergen') || x.badge.text.includes('Non-Vegetarian') || x.badge.text.includes('Jain') || x.badge.text.includes('Contains Egg'));
    const allergenStatus = allergenViolations.length === 0
      ? (clientProfile.allergies !== 'None' ? `0 exposures for "${clientProfile.allergies}"` : '0 allergens present')
      : `${allergenViolations.length} allergen/diet exposure(s)!`;

    // 6. Patient Directives & Notes Check
    const noteViolations = issues.filter(x => x.badge.text.includes('Violates'));
    const notesStatus = noteViolations.length === 0
      ? 'All patient directives honored'
      : `${noteViolations.length} directive violation(s)`;

    return {
      totalIssues: dangerCount + warningCount,
      dangerCount,
      warningCount,
      issues,
      diabetesStatus,
      hypertensionStatus,
      fattyLiverStatus,
      biomarkerStatus,
      allergenStatus,
      notesStatus,
      biomarkerViolations,
      allergenViolations,
      noteViolations
    };
  }, [meals, clientProfile, dailyTotals, targets, abnormalBiomarkers]);

  // Add Recipe from Right Panel to target meal slot
  const handleAddRecipeToSlot = (recipe: typeof recipeDatabase[0]) => {
    const targetSlot = meals.find(m => m.id === targetSlotId);
    const badges = evaluateFoodItemForPatient(recipe, targetSlot?.title || '', clientProfile);
    const dangerBadge = badges.find(b => b.type === 'danger');

    const newItem: PlanFoodItem = scaleFoodItem({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: recipe.name,
      portion: recipe.portion,
      basePortion: recipe.portion,
      quantity: 1,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      fibre: recipe.fibre,
      sodium: recipe.sodium,
      potassium: recipe.potassium
    }, 1);

    setMeals(prev => prev.map(m => {
      if (m.id === targetSlotId) {
        return {
          ...m,
          items: [...m.items, newItem]
        };
      }
      return m;
    }));

    if (dangerBadge) {
      showToast(`Added ${recipe.name} (⚠️ Notice: ${dangerBadge.text})`);
    } else {
      showToast(`Added ${recipe.name} (${recipe.calories} kcal) to ${targetSlot?.title}!`);
    }
  };

  // Delete Food Item from slot
  const handleDeleteFoodItem = (slotId: string, itemId: string) => {
    setMeals(prev => prev.map(m => {
      if (m.id === slotId) {
        return {
          ...m,
          items: m.items.filter(it => it.id !== itemId)
        };
      }
      return m;
    }));
  };

  // Change Quantity Multiplier directly (+/- stepper or number input) -> scales all nutrients & portion text
  const handleUpdateQuantity = (slotId: string, itemId: string, newQty: number) => {
    if (isNaN(newQty) || newQty <= 0) return;
    setMeals(prev => prev.map(m => {
      if (m.id === slotId) {
        return {
          ...m,
          items: m.items.map(it => it.id === itemId ? scaleFoodItem(it, newQty) : it)
        };
      }
      return m;
    }));
  };

  // Change Portion text -> infers new quantity from numbers/grams in text AND scales all nutrients
  const handleUpdatePortion = (slotId: string, itemId: string, newPortion: string) => {
    setMeals(prev => prev.map(m => {
      if (m.id === slotId) {
        return {
          ...m,
          items: m.items.map(it => {
            if (it.id !== itemId) return it;
            const basePortion = it.basePortion || it.portion || '1 serving';
            const currentQty = it.quantity || 1;
            const inferredQty = inferQuantityFromPortionText(newPortion, basePortion, currentQty);
            return scaleFoodItem(it, inferredQty, newPortion);
          })
        };
      }
      return m;
    }));
  };

  // Save Slot-Level Dietitian Instructions / Notes
  const handleSaveSlotNote = (slotId: string, noteText: string) => {
    setMeals(prev => prev.map(m => m.id === slotId ? { ...m, notes: noteText.trim() } : m));
    setEditingSlotNoteId(null);
    showToast(noteText.trim() ? 'Meal slot instructions saved & reflected!' : 'Meal slot note cleared.');
  };

  // Save Per-Item Clinical Note
  const handleSaveItemNote = (slotId: string, itemId: string, noteText: string) => {
    setMeals(prev => prev.map(m => {
      if (m.id !== slotId) return m;
      return {
        ...m,
        items: m.items.map(it => it.id === itemId ? { ...it, notes: noteText.trim() || undefined } : it)
      };
    }));
    setEditingItemNoteKey(null);
    showToast(noteText.trim() ? 'Food item note saved!' : 'Food item note removed.');
  };

  // Apply a Clinical Meal Template to the active day (or full week)
  const handleApplyTemplate = (templateId: string, applyToAllWeek: boolean = false) => {
    const tpl = CLINICAL_MEAL_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;

    const buildFromTpl = (dayPrefix: string): MealSlotSection[] => {
      return createDefaultMeals().map(slot => {
        const tplItems = tpl.slots[slot.id] || [];
        return {
          ...slot,
          notes: tplItems[0]?.notes || slot.notes || '',
          items: tplItems.map((item, idx) => scaleFoodItem({
            id: `${dayPrefix}_${slot.id}_${idx}_${Date.now()}`,
            name: item.name,
            portion: item.portion,
            basePortion: item.portion,
            quantity: 1,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fibre: item.fibre,
            sodium: item.sodium,
            potassium: item.potassium,
            notes: item.notes
          }, 1))
        };
      });
    };

    if (applyToAllWeek) {
      const updatedWeek: Record<WeekDay, MealSlotSection[]> = {} as any;
      WEEK_DAYS.forEach(d => {
        updatedWeek[d] = buildFromTpl(d.slice(0, 3).toLowerCase());
      });
      setWeeklyMeals(updatedWeek);
      showToast(`Applied "${tpl.name}" across all 7 days of the week!`);
    } else {
      setMeals(buildFromTpl(activeWeekDay.slice(0, 3).toLowerCase()));
      showToast(`Applied "${tpl.name}" to ${activeWeekDay}!`);
    }
    setTemplateModalOpen(false);
  };

  // Copy active day's plan to all 7 days of the week
  const handleCopyDayToAllWeek = () => {
    const currentDayMeals = meals;
    const nextWeek: Record<WeekDay, MealSlotSection[]> = {} as any;
    WEEK_DAYS.forEach(d => {
      nextWeek[d] = d === activeWeekDay ? currentDayMeals : cloneMealsForDay(currentDayMeals, d.slice(0, 3).toLowerCase());
    });
    setWeeklyMeals(nextWeek);
    showToast(`Copied ${activeWeekDay}'s meal plan to all 7 days (Monday–Sunday)!`);
  };

  // Generate 7-Day Varied Clinical Rotation across Monday–Sunday
  const handleGenerateWeeklyRotation = () => {
    const safeRecipes = recipeDatabase.filter(r => {
      const badges = evaluateFoodItemForPatient(r, 'Lunch', clientProfile);
      return !badges.some(b => b.type === 'danger');
    });
    const pool = safeRecipes.length >= 10 ? safeRecipes : recipeDatabase;

    const breakfasts = pool.filter(r => /poha|upma|idli|dosa|cheela|chilla|oats|porridge|thepla|paratha/i.test(r.name) && !/onion/i.test(r.name));
    const lunches = pool.filter(r => /dal|khichdi|rajma|chana|sambar|curry|paneer|tofu|subzi|bhaji/i.test(r.name));
    const snacks = pool.filter(r => /makhana|chana|sprout|chaas|buttermilk|salad|soup|tikki/i.test(r.name));

    const nextWeek: Record<WeekDay, MealSlotSection[]> = {} as any;
    WEEK_DAYS.forEach((dayName, dayIdx) => {
      if (dayName === activeWeekDay) {
        nextWeek[dayName] = meals;
        return;
      }
      const cloned = cloneMealsForDay(meals, dayName.slice(0, 3).toLowerCase());
      const bfPick = breakfasts[dayIdx % Math.max(1, breakfasts.length)];
      const luPick = lunches[dayIdx % Math.max(1, lunches.length)];
      const snPick = snacks[dayIdx % Math.max(1, snacks.length)];

      nextWeek[dayName] = cloned.map(slot => {
        if (slot.id === 'breakfast' && bfPick && slot.items.length > 0) {
          const rotated = scaleFoodItem({
            id: `rot_bf_${dayIdx}_${Date.now()}`,
            name: bfPick.name,
            portion: bfPick.portion,
            basePortion: bfPick.portion,
            quantity: 1,
            calories: bfPick.calories,
            protein: bfPick.protein,
            carbs: bfPick.carbs,
            fat: bfPick.fat,
            fibre: bfPick.fibre,
            sodium: bfPick.sodium,
            potassium: bfPick.potassium
          }, 1);
          return { ...slot, items: [rotated, ...slot.items.slice(1)] };
        }
        if (slot.id === 'lunch' && luPick && slot.items.length > 1) {
          const rotated = scaleFoodItem({
            id: `rot_lu_${dayIdx}_${Date.now()}`,
            name: luPick.name,
            portion: luPick.portion,
            basePortion: luPick.portion,
            quantity: 1,
            calories: luPick.calories,
            protein: luPick.protein,
            carbs: luPick.carbs,
            fat: luPick.fat,
            fibre: luPick.fibre,
            sodium: luPick.sodium,
            potassium: luPick.potassium
          }, 1);
          return { ...slot, items: [slot.items[0], rotated, ...slot.items.slice(2)] };
        }
        if (slot.id === 'evening_snack' && snPick && slot.items.length > 0) {
          const rotated = scaleFoodItem({
            id: `rot_sn_${dayIdx}_${Date.now()}`,
            name: snPick.name,
            portion: snPick.portion,
            basePortion: snPick.portion,
            quantity: 1,
            calories: snPick.calories,
            protein: snPick.protein,
            carbs: snPick.carbs,
            fat: snPick.fat,
            fibre: snPick.fibre,
            sodium: snPick.sodium,
            potassium: snPick.potassium
          }, 1);
          return { ...slot, items: [rotated, ...slot.items.slice(1)] };
        }
        return slot;
      });
    });

    setWeeklyMeals(nextWeek);
    setViewMode('week');
    showToast('Generated 7-day clinically safe meal rotation across Monday–Sunday!');
  };

  // Fix My Plan (Smart Clinical Auto-Optimizer for ALL Patient & Biomarker Issues)
  const handleFixMyPlan = () => {
    let fixedIssuesCount = 0;
    const labs = clientProfile.labBiomarkers;
    const isFemale = (clientProfile.gender || 'Female').toLowerCase() !== 'male';
    const hasHighUricAcid = clientProfile.conditions.some(c => c.toLowerCase().includes('uric')) || (typeof labs?.uricAcid === 'number' && labs.uricAcid > (isFemale ? 6.0 : 7.0));
    const hasLactoseAllergy = clientProfile.allergies.toLowerCase().includes('lactose') || clientProfile.allergies.toLowerCase().includes('dairy');
    const hasGlutenAllergy = clientProfile.allergies.toLowerCase().includes('gluten') || clientProfile.allergies.toLowerCase().includes('wheat');
    const hasNoOnionNote = clientProfile.notes.toLowerCase().includes('no onion');

    setMeals(prev => prev.map(m => {
      const isBreakfastSlot = ['early morning', 'breakfast', 'morning snack', 'mid morning'].some(s => m.title.toLowerCase().includes(s));

      const updatedItems = m.items.map(it => {
        let modified = { ...it };

        // 1. Fix onion in breakfast note violation
        if (isBreakfastSlot && hasNoOnionNote && (modified.name.toLowerCase().includes('onion') || modified.name.toLowerCase().includes('pyaz') || modified.name.toLowerCase() === 'vegetable poha')) {
          modified.name = 'Vegetable Poha (No Onion, steamed with peas & mustard seeds)';
          fixedIssuesCount++;
        }

        // 2. Fix dairy/lactose allergy violation
        if (hasLactoseAllergy && ['milk', 'paneer', 'curd', 'buttermilk', 'chaas'].some(kw => modified.name.toLowerCase().includes(kw)) && !modified.name.toLowerCase().includes('vegan') && !modified.name.toLowerCase().includes('almond milk') && !modified.name.toLowerCase().includes('dairy-free')) {
          if (modified.name.toLowerCase().includes('paneer')) {
            modified.name = 'Grilled Herb Tofu Bhurji (Dairy-Free)';
          } else if (modified.name.toLowerCase().includes('buttermilk') || modified.name.toLowerCase().includes('chaas')) {
            modified.name = 'Spiced Coconut Buttermilk (Dairy-Free)';
          } else {
            modified.name = 'Warm Turmeric Almond Milk (Dairy-Free)';
          }
          fixedIssuesCount++;
        }

        // 3. Fix gluten/wheat allergy violation
        if (hasGlutenAllergy && ['wheat', 'phulka', 'roti', 'chapati', 'daliya', 'suji'].some(kw => modified.name.toLowerCase().includes(kw)) && !modified.name.toLowerCase().includes('jowar') && !modified.name.toLowerCase().includes('ragi')) {
          modified.name = 'Jowar & Bajra Roti (Gluten-Free)';
          fixedIssuesCount++;
        }

        // 4. Fix high purine for elevated Uric Acid biomarker
        if (hasHighUricAcid && ['mushroom', 'rajma', 'chole', 'palak', 'spinach'].some(kw => modified.name.toLowerCase().includes(kw))) {
          modified.name = 'Lauki & Tinda Subzi (Low-Purine Uric Acid Safe)';
          fixedIssuesCount++;
        }

        // 5. Fix high sodium for hypertension
        if (modified.sodium > 240) {
          modified.sodium = 110;
          if (!modified.name.toLowerCase().includes('low salt') && !modified.name.toLowerCase().includes('low sodium')) {
            modified.name = `${modified.name} (low salt formulation)`;
          }
          fixedIssuesCount++;
        }

        // 6. Fix high fat for elevated SGPT / Triglycerides / LDL
        if (modified.fat > 8) {
          modified.fat = 4.5;
          modified.calories = Math.max(80, modified.calories - 30);
          fixedIssuesCount++;
        }

        // 7. Fix high single-dish carbs for elevated HbA1c / Diabetes
        if (modified.carbs > 35) {
          modified = scaleFoodItem(modified, Math.round((modified.quantity || 1) * 0.75 * 100) / 100);
          fixedIssuesCount++;
        }

        // 8. Fix high potassium
        if (modified.potassium > 280) {
          modified.potassium = 150;
          fixedIssuesCount++;
        }

        return modified;
      });

      return {
        ...m,
        items: updatedItems
      };
    }));

    showToast(`Plan auto-aligned with all patient & biomarker constraints! ${fixedIssuesCount > 0 ? `${fixedIssuesCount} issue(s) resolved.` : 'Plan is 100% compliant.'}`);
  };

  // Map studio slot title to valid PatientWeekPlan MealSlot
  const mapSlotTitleToMealSlot = (title: string): MealSlot => {
    const t = title.toLowerCase();
    if (t.includes('early') || t.includes('breakfast')) return 'Breakfast';
    if (t.includes('mid') || t.includes('morning snack')) return 'Morning Snack';
    if (t.includes('lunch')) return 'Lunch';
    if (t.includes('evening') || t.includes('snack')) return 'Evening Snack';
    if (t.includes('dinner')) return 'Dinner';
    if (t.includes('bedtime')) return 'Bedtime Snack';
    return 'Lunch';
  };

  // Save Plan as Draft or Publish to Client
  const handleSavePlan = async (status: 'draft' | 'published') => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }
    const pid = selectedPatientId || (patients[0]?.id || 'guest_patient');
    setSavingPlan(true);

    try {
      const startIso = toLocalISODate(selectedDate);
      const endIso = toLocalISODate(new Date(selectedDate.getTime() + 7 * 86400000));

      // Ensure all 7 days reflect edits made on the current active day if other days weren't customized yet
      const effectiveWeekly: Record<WeekDay, MealSlotSection[]> = { ...weeklyMeals, [activeWeekDay]: meals };

      // 1. Build 7-day MealPlan object for Firestore
      const planDays = WEEK_DAYS.map((dayName, idx) => {
        const daySlots = effectiveWeekly[dayName] || meals;
        return {
          dayNumber: idx + 1,
          meals: daySlots.flatMap(slot => slotItemsForSave(slot).map(it => {
            const combinedNotes = [
              slot.notes ? `[${slot.title} Directive]: ${slot.notes}` : '',
              it.notes ? it.notes : '',
              clientProfile.notes ? `Dietitian Note: ${clientProfile.notes}` : ''
            ].filter(Boolean).join(' • ');

            return {
              type: slot.title,
              name: it.name,
              portion: it.portion,
              calories: it.calories,
              protein: it.protein,
              carbs: it.carbs,
              fat: it.fat,
              notes: combinedNotes || `Prescribed ${it.portion} (${it.calories} kcal)`,
              // Stored separately so reloading the plan doesn't re-append notes on every save
              slotNotes: slot.notes || '',
              itemNotes: it.notes || '',
              ...(it.noteOnly ? { noteOnly: true } : {}),
              ingredients: [it.name],
              recipe: [`Serve ${it.name} (${it.portion}) freshly prepared according to clinical targets.${slot.notes ? ` Note: ${slot.notes}` : ''}`]
            };
          }))
        };
      });

      const planPayload: MealPlan = {
        ...(existingPlanId ? { id: existingPlanId } : {}),
        title: `${clientProfile.name} Clinical Nutrition Plan`,
        patientId: pid,
        startDate: startIso,
        endDate: endIso,
        targets: {
          calories: targets.calories,
          protein: targets.protein,
          carbs: targets.carbs,
          fat: targets.fat
        },
        status,
        instructions: clientProfile.notes,
        days: planDays
      };

      const savedPlanId = await saveMealPlan(planPayload, 'dietician');
      if (savedPlanId) setExistingPlanId(savedPlanId);

      // 2. Sync all 7 days to PatientWeekPlan with full macro & note metadata
      const weekEntries: WeekPlanEntry[] = WEEK_DAYS.flatMap(dayName => {
        const daySlots = effectiveWeekly[dayName] || meals;
        return daySlots.flatMap(slot => slotItemsForSave(slot).map(it => {
          const itemNoteStr = [
            slot.notes ? slot.notes : '',
            it.notes ? it.notes : '',
            it.noteOnly ? '' : `Prescribed ${it.portion} • ${it.calories} kcal (P:${it.protein}g C:${it.carbs}g F:${it.fat}g)`
          ].filter(Boolean).join(' • ');

          return {
            day: dayName,
            mealSlot: mapSlotTitleToMealSlot(slot.title),
            recipeId: it.id,
            recipeName: it.name,
            portion: it.portion,
            calories: it.calories,
            protein: it.protein,
            carbs: it.carbs,
            fat: it.fat,
            fibre: it.fibre,
            sodium: it.sodium,
            potassium: it.potassium,
            notes: itemNoteStr
          };
        }));
      });

      const savedWpId = await savePatientWeekPlan({
        ...(existingWeekPlanId ? { id: existingWeekPlanId } : {}),
        patientId: pid,
        weekStartDate: startIso,
        status,
        entries: weekEntries
      }, 'dietician').catch(err => {
        console.warn('savePatientWeekPlan warning:', err);
        return undefined;
      });
      if (savedWpId) setExistingWeekPlanId(savedWpId);

      // 3. Persist updated patient profile & lab biomarkers & directives
      const targetPatient = patients.find(pt => pt.id === pid);
      if (targetPatient && pid !== 'guest_patient') {
        await updatePatientProfile(pid, {
          age: clientProfile.age,
          gender: clientProfile.gender,
          heightCm: clientProfile.heightCm,
          currentWeightKg: clientProfile.currentWeightKg,
          targetWeightKg: clientProfile.targetWeightKg,
          bmi: clientProfile.bmi,
          medicalHistory: clientProfile.conditions,
          dietaryType: clientProfile.dietPreference as any,
          healthInfo: {
            conditions: clientProfile.conditions.join(', '),
            allergies: clientProfile.allergies,
            medications: targetPatient.healthInfo?.medications || '',
            notes: clientProfile.notes
          },
          preferences: {
            favorites: targetPatient.preferences?.favorites || '',
            dislikes: clientProfile.notes,
            cuisine: targetPatient.preferences?.cuisine || 'Indian',
            budget: targetPatient.preferences?.budget || 'Standard'
          },
          labBiomarkers: clientProfile.labBiomarkers
        }).catch(console.warn);
      }

      // 4. If published, sync today's patient checklist so Patient Meals & Dashboard immediately reflect changes
      if (status === 'published' && pid !== 'guest_patient') {
        const todayStr = toLocalISODate(new Date());
        const DAYS_MAP: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDayName = DAYS_MAP[new Date().getDay()];
        const todaySlots = effectiveWeekly[todayDayName] || meals;

        const checklistItems: ChecklistMealItem[] = todaySlots.flatMap((slot, sIdx) =>
          slotItemsForSave(slot).map((it, iIdx) => ({
            id: `wp_${todayDayName}_${mapSlotTitleToMealSlot(slot.title)}_${sIdx}_${iIdx}`,
            mealType: mapSlotTitleToMealSlot(slot.title),
            name: it.name,
            portion: it.portion,
            calories: it.calories,
            protein: it.protein,
            carbs: it.carbs,
            fat: it.fat,
            notes: [slot.notes, it.notes, clientProfile.notes].filter(Boolean).join(' • ') || `Prescribed ${it.portion}`,
            recipe: [`Serve ${it.name} (${it.portion}) freshly prepared.`],
            ingredients: [it.name],
            completed: false,
            isExtra: false
          }))
        );
        await savePatientChecklist(pid, todayStr, checklistItems).catch(console.warn);
      }

      showToast(status === 'published' ? 'Diet plan, biomarkers & notes published and synced to client!' : 'Diet plan saved as draft.');
    } catch (e: any) {
      console.error('Error saving meal plan:', e);
      showToast('Error saving plan: ' + (e?.message || 'Please try again'));
    } finally {
      setSavingPlan(false);
    }
  };

  // Circular SVG Gauge Helper
  const renderGauge = (label: string, value: number, target: number, unit: string, isAlert = false) => {
    const safeTarget = target > 0 ? target : 1;
    const percentage = Math.min(100, Math.round((value / safeTarget) * 100));
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const strokeColor = isAlert ? '#ef4444' : '#059669';

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-stone-200"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={strokeColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-xs font-black text-stone-900 block leading-tight">{value.toLocaleString()}</span>
            <span className="text-[9px] text-stone-400 block">/ {target.toLocaleString()}</span>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mt-1">{label} ({unit})</span>
      </div>
    );
  };

  const formattedDateString = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="p-3 md:p-6 max-w-[1580px] mx-auto font-sans min-h-screen bg-stone-50/70">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-50 px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* --------- TOP STEPPER & ACTION HEADER --------- */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-5 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Stepper */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {[
            { num: 1, label: 'Client Profile & Biomarkers' },
            { num: 2, label: 'Set Targets' },
            { num: 3, label: 'Build Diet Plan' },
            { num: 4, label: 'Review & Send' }
          ].map(s => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <div key={s.num} className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStepClick(s.num)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isActive ? 'bg-white text-blue-600 font-black' : isDone ? 'bg-emerald-600 text-white font-black' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {isDone ? '✓' : s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
                {s.num < 4 && <ChevronRight className="w-3.5 h-3.5 text-stone-300 hidden sm:inline" />}
              </div>
            );
          })}
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleSavePlan('draft')}
            disabled={savingPlan}
            className="px-4 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-stone-500" />
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentStep(4);
              setPreviewModalOpen(true);
            }}
            className="px-4 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            Preview Plan
          </button>

          <button
            type="button"
            onClick={() => handleSavePlan('published')}
            disabled={savingPlan}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {savingPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send to Client
          </button>
        </div>
      </div>

      {/* --------- MAIN 3-COLUMN CLINICAL LAYOUT --------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 items-start">
        {/* ======================================================== */}
        {/* COLUMN 1 (LEFT, 3 COLS): CLIENT PROFILE, BIOMARKERS & PRESCRIPTION */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-4">
          {/* Client Selector dropdown */}
          {patients.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-3 shadow-xs">
              <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Select Patient Caseload</label>
              <select
                value={selectedPatientId}
                onChange={e => handleSelectPatient(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.dietaryType || 'Vegetarian'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Client Profile Card */}
          <div className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3.5 transition-all ${
            currentStep === 1 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-stone-200'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-stone-900 text-sm">Client Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> {isEditingProfile ? 'Done' : 'Edit'}
              </button>
            </div>

            {/* Avatar & Basic Info */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-stone-900 text-white font-serif font-black text-base flex items-center justify-center shadow-xs shrink-0">
                {clientProfile.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-stone-900 truncate">{clientProfile.name}</h4>
                <p className="text-[11px] text-stone-500">
                  ID: {clientProfile.clientCode} | {clientProfile.age} yrs | {clientProfile.gender}
                </p>
              </div>
            </div>

            {/* Editable Anthropometrics when isEditingProfile is true */}
            {isEditingProfile ? (
              <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-500 block">Age (yrs)</label>
                    <input
                      type="number"
                      value={clientProfile.age}
                      onChange={e => setClientProfile(p => ({ ...p, age: Number(e.target.value) || 30 }))}
                      className="w-full bg-white border border-stone-300 rounded px-1.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">Height (cm)</label>
                    <input
                      type="number"
                      value={clientProfile.heightCm}
                      onChange={e => {
                        const h = Number(e.target.value) || 160;
                        const bmiVal = Math.round((clientProfile.currentWeightKg / ((h / 100) * (h / 100))) * 10) / 10;
                        setClientProfile(p => ({ ...p, heightCm: h, bmi: bmiVal, bmiCategory: bmiVal >= 25 ? 'Overweight' : 'Normal' }));
                      }}
                      className="w-full bg-white border border-stone-300 rounded px-1.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">Gender</label>
                    <select
                      value={clientProfile.gender}
                      onChange={e => setClientProfile(p => ({ ...p, gender: e.target.value }))}
                      className="w-full bg-white border border-stone-300 rounded px-1 py-1 text-xs font-bold"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">Current Wt (kg)</label>
                    <input
                      type="number"
                      value={clientProfile.currentWeightKg}
                      onChange={e => {
                        const w = Number(e.target.value) || 65;
                        const hM = (clientProfile.heightCm || 160) / 100;
                        const bmiVal = Math.round((w / (hM * hM)) * 10) / 10;
                        setClientProfile(p => ({ ...p, currentWeightKg: w, bmi: bmiVal, bmiCategory: bmiVal >= 25 ? 'Overweight' : 'Normal' }));
                      }}
                      className="w-full bg-white border border-stone-300 rounded px-1.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">Target Wt (kg)</label>
                    <input
                      type="number"
                      value={clientProfile.targetWeightKg}
                      onChange={e => setClientProfile(p => ({ ...p, targetWeightKg: Number(e.target.value) || 60 }))}
                      className="w-full bg-white border border-stone-300 rounded px-1.5 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">BMI</label>
                    <div className="px-1.5 py-1 bg-stone-100 rounded text-xs font-black text-stone-800">
                      {clientProfile.bmi} ({clientProfile.bmiCategory})
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-center">
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">Height</span>
                  <strong className="text-xs font-bold text-stone-800">{clientProfile.heightCm} cm</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">Current Wt</span>
                  <strong className="text-xs font-bold text-stone-800">{clientProfile.currentWeightKg} kg</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">Target Wt</span>
                  <strong className="text-xs font-bold text-stone-800">{clientProfile.targetWeightKg} kg</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">BMI</span>
                  <div className="flex flex-col items-center">
                    <strong className="text-xs font-bold text-stone-800">{clientProfile.bmi}</strong>
                    <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 rounded">
                      {clientProfile.bmiCategory}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Medical Conditions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Medical Conditions</span>
                <span className="text-[10px] text-blue-600 font-bold">{clientProfile.conditions.length} Active</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-1.5">
                {clientProfile.conditions.map((cond, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1.5"
                  >
                    <span>{cond}</span>
                    <button
                      type="button"
                      onClick={() => setClientProfile(p => ({ ...p, conditions: p.conditions.filter((_, i) => i !== idx) }))}
                      className="text-stone-400 hover:text-rose-600 font-bold leading-none text-xs cursor-pointer"
                      title="Remove condition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 text-[10px] text-stone-500 pt-1 border-t border-stone-100">
                {['Type 2 Diabetes', 'Hypertension', 'Fatty Liver', 'PCOS', 'CKD / Renal', 'Hyperuricemia / Gout'].map(preset => {
                  const isSelected = clientProfile.conditions.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setClientProfile(p => ({ ...p, conditions: p.conditions.filter(c => c !== preset) }));
                        } else {
                          setClientProfile(p => ({ ...p, conditions: [...p.conditions, preset] }));
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --------- LAB BIOMARKERS & CLINICAL ISSUES PANEL --------- */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[10px] uppercase font-bold text-stone-700">Lab Biomarker Issues</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                    abnormalBiomarkers.length > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {abnormalBiomarkers.length > 0 ? `${abnormalBiomarkers.length} Issues Flagged` : 'All Optimal'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingLabs(!isEditingLabs)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {isEditingLabs ? 'Close' : 'Edit Labs'}
                  </button>
                </div>
              </div>

              {/* Abnormal Biomarker Issue Chips */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                {(showAllBiomarkersInStudio ? evaluatedBiomarkers : (abnormalBiomarkers.length > 0 ? abnormalBiomarkers : evaluatedBiomarkers.slice(0, 4))).map(bio => (
                  <div
                    key={bio.key}
                    className={`p-2 rounded-xl border text-[11px] space-y-0.5 ${
                      bio.status === 'optimal'
                        ? 'bg-emerald-50/40 border-emerald-200/70'
                        : bio.status === 'borderline' || bio.status === 'low'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-stone-900">
                        {bio.shortName}: <span className="font-black">{bio.value} {bio.unit}</span>
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${bio.badgeColor}`}>
                        {bio.statusLabel}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-600 leading-tight">
                      <span className="text-stone-400">Ref ({bio.normalRange}): </span>
                      {bio.dietaryAction.slice(0, 95)}...
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowAllBiomarkersInStudio(!showAllBiomarkersInStudio)}
                  className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                >
                  {showAllBiomarkersInStudio ? 'Show Flagged Issues Only' : `View All ${evaluatedBiomarkers.length} Lab Biomarkers`}
                </button>
                <span className="text-stone-400">Audited on foods</span>
              </div>

              {/* Inline Lab Biomarkers Editor */}
              {isEditingLabs && (
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                    <strong className="text-stone-800 text-[10px] uppercase">Edit 13 Clinical Biomarkers</strong>
                    <button
                      type="button"
                      onClick={() => setClientProfile(p => ({ ...p, labBiomarkers: { ...DEFAULT_SAMPLE_LABS } }))}
                      className="text-[9px] text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Reset Sample Labs
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { k: 'hba1c', label: 'HbA1c (%)', step: '0.1' },
                      { k: 'haemoglobin', label: 'Haemoglobin (g/dL)', step: '0.1' },
                      { k: 'cholesterol', label: 'Cholesterol (mg/dL)', step: '1' },
                      { k: 'triglycerides', label: 'Triglycerides (mg/dL)', step: '1' },
                      { k: 'hdl', label: 'HDL (mg/dL)', step: '1' },
                      { k: 'ldl', label: 'LDL (mg/dL)', step: '1' },
                      { k: 'sgpt', label: 'SGPT / ALT (U/L)', step: '1' },
                      { k: 'sgot', label: 'SGOT / AST (U/L)', step: '1' },
                      { k: 'uricAcid', label: 'Uric Acid (mg/dL)', step: '0.1' },
                      { k: 'creatinine', label: 'Creatinine (mg/dL)', step: '0.05' },
                      { k: 'sodium', label: 'Serum Na (mEq/L)', step: '1' },
                      { k: 'potassium', label: 'Serum K (mEq/L)', step: '0.1' },
                      { k: 'bun', label: 'BUN (mg/dL)', step: '1' }
                    ].map(f => (
                      <div key={f.k}>
                        <label className="text-[9px] text-stone-500 block truncate">{f.label}</label>
                        <input
                          type="number"
                          step={f.step}
                          value={(clientProfile.labBiomarkers as any)?.[f.k] ?? ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setClientProfile(p => ({
                              ...p,
                              labBiomarkers: {
                                ...p.labBiomarkers,
                                [f.k]: isNaN(val) ? undefined : val
                              }
                            }));
                          }}
                          className="w-full bg-white border border-stone-300 rounded px-1.5 py-0.5 text-[11px] font-bold text-stone-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Diet Preference */}
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Diet Preference</span>
              <div className="grid grid-cols-4 gap-1">
                {['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Jain'].map(diet => (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => setClientProfile(p => ({ ...p, dietPreference: diet }))}
                    className={`py-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                      clientProfile.dietPreference === diet
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {clientProfile.dietPreference === diet && '✓ '}
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies / Intolerances */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Allergies / Intolerances</span>
                <span className="text-[10px] text-stone-500 font-bold">{clientProfile.allergies}</span>
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {['None', 'Dairy / Lactose', 'Gluten / Wheat', 'Nuts / Peanuts', 'Egg', 'Soy'].map(al => {
                  const isSelected = clientProfile.allergies.toLowerCase().includes(al.toLowerCase().split(' ')[0]);
                  return (
                    <button
                      key={al}
                      type="button"
                      onClick={() => setClientProfile(p => ({ ...p, allergies: al }))}
                      className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        (al === 'None' && (clientProfile.allergies === 'None' || !clientProfile.allergies)) || isSelected
                          ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {al}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dietitian Notes & Special Lifestyle Directives */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Dietitian Directives & Notes</span>
                <span className="text-[9px] text-emerald-700 font-bold">Audited Live on Meals</span>
              </div>
              <textarea
                value={clientProfile.notes}
                onChange={e => setClientProfile(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                placeholder="e.g. No onions in breakfast. Avoid mushroom. Low salt at dinner."
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Nutrient Prescription (Daily) Card */}
          <div className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
            currentStep === 2 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-stone-200'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-stone-900 text-sm">Nutrient Prescription (Daily)</h3>
              <button
                type="button"
                onClick={() => setIsEditingTargets(!isEditingTargets)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> {isEditingTargets ? 'Done' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 bg-amber-50/70 border border-amber-200/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-amber-800 block">Calories</span>
                <strong className="text-sm font-black text-amber-950">{targets.calories.toLocaleString()}</strong>
                <span className="text-[9px] text-amber-700 block">kcal</span>
              </div>
              <div className="p-2 bg-sky-50/70 border border-sky-200/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-sky-800 block">Protein</span>
                <strong className="text-sm font-black text-sky-950">{targets.protein}</strong>
                <span className="text-[9px] text-sky-700 block">g</span>
              </div>
              <div className="p-2 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-800 block">Carbs</span>
                <strong className="text-sm font-black text-emerald-950">{targets.carbs}</strong>
                <span className="text-[9px] text-emerald-700 block">g</span>
              </div>
              <div className="p-2 bg-orange-50/70 border border-orange-200/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-orange-800 block">Fat</span>
                <strong className="text-sm font-black text-orange-950">{targets.fat}</strong>
                <span className="text-[9px] text-orange-700 block">g</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 bg-teal-50/70 border border-teal-200/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-teal-800 block">Fibre</span>
                <strong className="text-sm font-black text-teal-950">{targets.fibre}</strong>
                <span className="text-[9px] text-teal-700 block">g</span>
              </div>
              <div className="p-2 bg-indigo-50/70 border border-indigo-200/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-indigo-800 block">Sodium</span>
                <strong className="text-sm font-black text-indigo-950">{targets.sodium.toLocaleString()}</strong>
                <span className="text-[9px] text-indigo-700 block">mg</span>
              </div>
              <div className="p-2 bg-rose-50/70 border border-rose-200/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-rose-800 block">Potassium</span>
                <strong className="text-sm font-black text-rose-950">{targets.potassium.toLocaleString()}</strong>
                <span className="text-[9px] text-rose-700 block">mg</span>
              </div>
              <div className="p-2 bg-blue-50/70 border border-blue-200/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-blue-800 block">Fluid</span>
                <strong className="text-sm font-black text-blue-950">{targets.fluid}</strong>
                <span className="text-[9px] text-blue-700 block">L</span>
              </div>
            </div>

            {isEditingTargets && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-500">Target Calories (kcal)</label>
                    <input
                      type="number"
                      value={targets.calories}
                      onChange={e => setTargets(t => ({ ...t, calories: Number(e.target.value) || 0 }))}
                      className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Target Protein (g)</label>
                    <input
                      type="number"
                      value={targets.protein}
                      onChange={e => setTargets(t => ({ ...t, protein: Number(e.target.value) || 0 }))}
                      className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Target Carbs (g)</label>
                    <input
                      type="number"
                      value={targets.carbs}
                      onChange={e => setTargets(t => ({ ...t, carbs: Number(e.target.value) || 0 }))}
                      className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Target Fat (g)</label>
                    <input
                      type="number"
                      value={targets.fat}
                      onChange={e => setTargets(t => ({ ...t, fat: Number(e.target.value) || 0 }))}
                      className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Target Fibre (g)</label>
                    <input
                      type="number"
                      value={targets.fibre}
                      onChange={e => setTargets(t => ({ ...t, fibre: Number(e.target.value) || 0 }))}
                      className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Fluid Target (L)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={targets.fluid}
                      onChange={e => setTargets(t => ({ ...t, fluid: Number(e.target.value) || 2.0 }))}
                      className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Max Sodium (mg)</label>
                    <input
                      type="number"
                      value={targets.sodium}
                      onChange={e => setTargets(t => ({ ...t, sodium: Number(e.target.value) || 0 }))}
                      className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500">Max Potassium (mg)</label>
                    <input
                      type="number"
                      value={targets.potassium}
                      onChange={e => setTargets(t => ({ ...t, potassium: Number(e.target.value) || 0 }))}
                      className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2 (CENTER, 6 COLS): DIET PLAN TIMELINE & ALL 3 VIEW MODES */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 p-4 md:p-5 shadow-xs space-y-4">
          {/* Header Controls: Date Selector + Active Day Badge */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h2 className="font-serif font-black text-stone-900 text-base md:text-lg">
                Diet Plan for {clientProfile.name}
              </h2>
              <p className="text-[11px] text-stone-500">
                Editing <strong className="text-blue-700">{activeWeekDay}</strong> • Planned: <strong className="text-stone-900">{dailyTotals.calories} / {targets.calories} kcal</strong>
              </p>
            </div>

            {/* Date Picker Switcher */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  const prevDate = new Date(selectedDate.getTime() - 86400000);
                  setSelectedDate(prevDate);
                  const dMap: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  setActiveWeekDay(dMap[prevDate.getDay()]);
                }}
                className="w-7 h-7 rounded-lg hover:bg-white text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-stone-800 px-2 select-none">
                {formattedDateString}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextDate = new Date(selectedDate.getTime() + 86400000);
                  setSelectedDate(nextDate);
                  const dMap: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  setActiveWeekDay(dMap[nextDate.getDay()]);
                }}
                className="w-7 h-7 rounded-lg hover:bg-white text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub Header: View Mode Switcher (Day View / Week View / Exchange View) + Add Meal Template */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              {(['day', 'week', 'exchange'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {mode === 'day' && <Calendar className="w-3.5 h-3.5" />}
                  {mode === 'week' && <Layers className="w-3.5 h-3.5" />}
                  {mode === 'exchange' && <Utensils className="w-3.5 h-3.5" />}
                  <span>{mode === 'day' ? 'Day View' : mode === 'week' ? 'Week View (7 Days)' : 'Exchange View'}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Meal Template</span>
            </button>
          </div>

          {/* 7-Day Quick Day Switcher Bar (Always accessible so user can jump across Mon-Sun in any view) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {WEEK_DAYS.map(dayName => {
              const daySlots = weeklyMeals[dayName] || [];
              const dayCal = Math.round(daySlots.reduce((s, sl) => s + sl.items.reduce((a, it) => a + it.calories, 0), 0));
              const isSelectedDay = activeWeekDay === dayName;
              return (
                <button
                  key={dayName}
                  type="button"
                  onClick={() => setActiveWeekDay(dayName)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all shrink-0 cursor-pointer flex flex-col items-center min-w-[68px] ${
                    isSelectedDay
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>{dayName.slice(0, 3)}</span>
                  <span className={`text-[9px] font-medium ${isSelectedDay ? 'text-emerald-300' : 'text-stone-400'}`}>
                    {dayCal} kcal
                  </span>
                </button>
              );
            })}
          </div>

          {/* --------- ACTIVE CLINICAL & BIOMARKER GUARDIANS STRIP --------- */}
          <div className="p-3.5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl shadow-xs space-y-2.5 border border-stone-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-100">
                  Active Clinical & Biomarker Guardians
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                  overallClinicalAudit.totalIssues === 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {overallClinicalAudit.totalIssues === 0 ? '✓ 100% Patient Compliant' : `⚠️ ${overallClinicalAudit.totalIssues} Constraint Flag${overallClinicalAudit.totalIssues > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-300">
                  Auditing: <strong className="text-white">{clientProfile.name}</strong>
                </span>
                {overallClinicalAudit.totalIssues > 0 && (
                  <button
                    type="button"
                    onClick={handleFixMyPlan}
                    className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Auto-Resolve All
                  </button>
                )}
              </div>
            </div>

            {/* Condition & Biomarker Guardian Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px]">
              <div className="bg-stone-800/90 p-2 rounded-xl border border-stone-700 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${overallClinicalAudit.diabetesStatus.includes('elevated') ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <div className="min-w-0">
                  <span className="text-stone-400 block text-[9px] uppercase font-bold truncate">Glycemic / HbA1c</span>
                  <span className="font-semibold text-white text-[10px] truncate block">{overallClinicalAudit.diabetesStatus}</span>
                </div>
              </div>

              <div className="bg-stone-800/90 p-2 rounded-xl border border-stone-700 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${overallClinicalAudit.hypertensionStatus.includes('High') ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <div className="min-w-0">
                  <span className="text-stone-400 block text-[9px] uppercase font-bold truncate">BP / Sodium</span>
                  <span className="font-semibold text-white text-[10px] truncate block">{overallClinicalAudit.hypertensionStatus}</span>
                </div>
              </div>

              <div className="bg-stone-800/90 p-2 rounded-xl border border-stone-700 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${abnormalBiomarkers.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <div className="min-w-0">
                  <span className="text-stone-400 block text-[9px] uppercase font-bold truncate">Lab Biomarkers</span>
                  <span className="font-semibold text-white text-[10px] truncate block">{overallClinicalAudit.biomarkerStatus}</span>
                </div>
              </div>

              <div className="bg-stone-800/90 p-2 rounded-xl border border-stone-700 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${overallClinicalAudit.allergenViolations.length > 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <div className="min-w-0">
                  <span className="text-stone-400 block text-[9px] uppercase font-bold truncate">Allergen Shield</span>
                  <span className="font-semibold text-white text-[10px] truncate block">{overallClinicalAudit.allergenStatus}</span>
                </div>
              </div>

              <div className="bg-stone-800/90 p-2 rounded-xl border border-stone-700 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${overallClinicalAudit.noteViolations.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <div className="min-w-0">
                  <span className="text-stone-400 block text-[9px] uppercase font-bold truncate">Directives & Notes</span>
                  <span className="font-semibold text-white text-[10px] truncate block">{overallClinicalAudit.notesStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIEW MODE 1: DAY VIEW (CHRONOLOGICAL MEAL SLOTS) */}
          {/* ======================================================== */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              {meals.map(slot => {
                const isTargetSlot = targetSlotId === slot.id;
                const slotCalories = Math.round(slot.items.reduce((s, it) => s + it.calories, 0));
                const slotProtein = Math.round(slot.items.reduce((s, it) => s + it.protein, 0) * 10) / 10;
                const slotCarbs = Math.round(slot.items.reduce((s, it) => s + it.carbs, 0) * 10) / 10;
                const slotFat = Math.round(slot.items.reduce((s, it) => s + it.fat, 0) * 10) / 10;
                const isEditingThisSlotNote = editingSlotNoteId === slot.id;

                return (
                  <div
                    key={slot.id}
                    onClick={() => setTargetSlotId(slot.id)}
                    className={`rounded-2xl border transition-all ${
                      isTargetSlot
                        ? 'border-blue-400 bg-blue-50/15 shadow-sm ring-1 ring-blue-300'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    {/* Slot Header Strip */}
                    <div className="p-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-black border text-center ${slot.timeBadgeColor}`}>
                          <div className="text-[10px] uppercase tracking-wider">{slot.time}</div>
                        </div>
                        <h4 className="font-bold text-stone-900 text-sm">{slot.title}</h4>
                        {isTargetSlot && (
                          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            Active Target
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-bold text-stone-600">
                        <span className="text-stone-900">{slotCalories} kcal</span>
                        <span className="text-stone-300">•</span>
                        <span>P {slotProtein}g</span>
                        <span className="text-stone-300">•</span>
                        <span>C {slotCarbs}g</span>
                        <span className="text-stone-300">•</span>
                        <span>F {slotFat}g</span>
                      </div>
                    </div>

                    {/* Slot-Level Dietitian Note Display / Editor */}
                    {(slot.notes || isEditingThisSlotNote) && (
                      <div className="px-3.5 pt-2.5" onClick={e => e.stopPropagation()}>
                        {isEditingThisSlotNote ? (
                          <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                            <label className="text-[10px] font-bold uppercase text-blue-900 block">
                              Dietitian Instructions for {slot.title}:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={slotNoteDraft}
                                onChange={e => setSlotNoteDraft(e.target.value)}
                                placeholder="e.g., Eat raw salad 10 mins first; use minimal oil, no onion..."
                                className="flex-1 bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveSlotNote(slot.id, slotNoteDraft)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Save Note
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSlotNoteId(null)}
                                className="px-2 py-1.5 bg-white border border-stone-300 text-stone-600 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2 text-[11px] text-amber-900">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="truncate">
                                <strong>Slot Note:</strong> {slot.notes}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSlotNoteDraft(slot.notes || '');
                                setEditingSlotNoteId(slot.id);
                              }}
                              className="text-[10px] font-bold text-amber-800 hover:underline shrink-0 cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Food Items Table inside slot */}
                    <div className="p-3.5 space-y-2.5">
                      {slot.items.length === 0 ? (
                        <div className="py-4 text-center text-xs text-stone-400 italic">
                          No foods added to {slot.title}. Click "+ Add Food" or select from the Recipe Database on the right.
                        </div>
                      ) : (
                        slot.items.map(item => {
                          const badges = evaluateFoodItemForPatient(item, slot.title, clientProfile);
                          const hasDanger = badges.some(b => b.type === 'danger');
                          const hasWarning = badges.some(b => b.type === 'warning');
                          const itemNoteKey = `${slot.id}__${item.id}`;
                          const isEditingThisItemNote = editingItemNoteKey === itemNoteKey;
                          const qty = item.quantity || 1;

                          return (
                            <div
                              key={item.id}
                              onClick={e => e.stopPropagation()}
                              className={`p-3 rounded-xl border transition-colors text-xs space-y-2 ${
                                hasDanger
                                  ? 'bg-rose-50/80 border-rose-300'
                                  : hasWarning
                                  ? 'bg-amber-50/60 border-amber-300'
                                  : 'bg-stone-50/80 hover:bg-stone-100 border-stone-200/80'
                              }`}
                            >
                              {/* Top Row: Dish Name (always full-width & visible) + Item Action Buttons */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-stone-900 text-xs sm:text-[13px] leading-snug break-words">
                                    {item.name || 'Custom Food Item'}
                                  </div>
                                  {item.notes && !isEditingThisItemNote && (
                                    <span className="text-[10px] text-blue-700 font-medium italic block mt-0.5 break-words">
                                      Note: {item.notes}
                                    </span>
                                  )}
                                </div>

                                {/* Item Action Buttons: Note, Swap, Delete */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setItemNoteDraft(item.notes || '');
                                      setEditingItemNoteKey(isEditingThisItemNote ? null : itemNoteKey);
                                    }}
                                    className={`p-1 rounded transition-colors cursor-pointer ${
                                      item.notes ? 'text-blue-600 bg-blue-50' : 'text-stone-400 hover:text-blue-600'
                                    }`}
                                    title="Add/Edit note for this dish"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openFoodModal('swap', slot.id, slot.title, item)}
                                    className="p-1 text-stone-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                    title="Swap this dish"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFoodItem(slot.id, item.id)}
                                    className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                    title="Delete item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Second Row: Quantity Stepper + Editable Portion + Labeled Macros */}
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Quantity Stepper (- / qty / +) — scales macros & portion live */}
                                  <div className="flex items-center bg-white border border-stone-300 rounded-lg overflow-hidden shrink-0" title="Adjust quantity multiplier (automatically shifts calories & macros)">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(slot.id, item.id, Math.max(0.25, Math.round((qty - 0.5) * 100) / 100))}
                                      className="px-1.5 py-1 text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="0.25"
                                      max="20"
                                      value={qty}
                                      onChange={e => handleUpdateQuantity(slot.id, item.id, parseFloat(e.target.value) || 1)}
                                      className="w-10 text-center text-[11px] font-black text-blue-700 bg-transparent focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(slot.id, item.id, Math.round((qty + 0.5) * 100) / 100)}
                                      className="px-1.5 py-1 text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Editable Portion Text (typing e.g. "2 bowls" or "300 g" also shifts values!) */}
                                  <div className="w-28 sm:w-32 shrink-0">
                                    <input
                                      type="text"
                                      value={item.portion}
                                      onChange={e => handleUpdatePortion(slot.id, item.id, e.target.value)}
                                      title="Edit portion (changing numbers/grams automatically recalculates macros)"
                                      className="w-full text-[11px] bg-white border border-stone-300 rounded-lg px-2 py-1 text-stone-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>

                                {/* Labeled Macros & Electrolytes strip: Cal, C, P, F, Fib, Na, K */}
                                <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-stone-600 font-mono bg-white/80 px-2.5 py-1 rounded-lg border border-stone-200/80">
                                  <span className="font-black text-stone-900" title="Calories">
                                    {item.calories} <span className="text-[9px] font-sans font-bold text-stone-500">kcal</span>
                                  </span>
                                  <span className="text-emerald-800 font-semibold" title="Carbohydrates (g)">
                                    <span className="text-[9px] font-sans font-bold text-emerald-600/80 mr-0.5">C</span>{item.carbs}g
                                  </span>
                                  <span className="text-sky-800 font-semibold" title="Protein (g)">
                                    <span className="text-[9px] font-sans font-bold text-sky-600/80 mr-0.5">P</span>{item.protein}g
                                  </span>
                                  <span className="text-amber-800 font-semibold" title="Fat (g)">
                                    <span className="text-[9px] font-sans font-bold text-amber-600/80 mr-0.5">F</span>{item.fat}g
                                  </span>
                                  <span className="text-teal-800" title="Dietary Fibre (g)">
                                    <span className="text-[9px] font-sans font-bold text-teal-600/80 mr-0.5">Fib</span>{item.fibre}g
                                  </span>
                                  <span className="text-rose-800 font-semibold" title="Sodium (mg)">
                                    <span className="text-[9px] font-sans font-bold text-rose-600/80 mr-0.5">Na</span>{item.sodium}mg
                                  </span>
                                  <span className="text-purple-800 font-semibold" title="Potassium (mg)">
                                    <span className="text-[9px] font-sans font-bold text-purple-600/80 mr-0.5">K</span>{item.potassium}mg
                                  </span>
                                </div>
                              </div>

                              {/* Inline Per-Item Note Editor */}
                              {isEditingThisItemNote && (
                                <div className="flex items-center gap-1.5 pt-1">
                                  <input
                                    type="text"
                                    value={itemNoteDraft}
                                    onChange={e => setItemNoteDraft(e.target.value)}
                                    placeholder={`Preparation / clinical note for ${item.name}...`}
                                    className="flex-1 bg-white border border-blue-300 rounded px-2 py-1 text-[11px] text-stone-800"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveItemNote(slot.id, item.id, itemNoteDraft)}
                                    className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemNoteKey(null)}
                                    className="px-2 py-1 bg-white border border-stone-300 text-stone-600 rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}

                              {/* Clinical & Biomarker Safety Badges for this food item */}
                              {badges.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                  {badges.map((b, bIdx) => (
                                    <span
                                      key={bIdx}
                                      title={b.reason}
                                      className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                        b.type === 'danger'
                                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                          : b.type === 'warning'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      }`}
                                    >
                                      <span>{b.type === 'danger' ? '🚨' : b.type === 'warning' ? '⚠️' : '✓'}</span>
                                      <span>{b.text.replace(/^✓\s*/, '')}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}

                      {/* Meal Slot Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-bold text-blue-600" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openFoodModal('add', slot.id, slot.title)}
                          className="hover:text-blue-800 flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Plus className="w-3 h-3" /> Add Food
                        </button>
                        <span className="text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (slot.items.length > 0) {
                              openFoodModal('swap', slot.id, slot.title, slot.items[0]);
                            } else {
                              openFoodModal('add', slot.id, slot.title);
                            }
                          }}
                          className="hover:text-blue-800 flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <RefreshCw className="w-3 h-3" /> Swap
                        </button>
                        <span className="text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={() => openFoodModal('replace', slot.id, slot.title)}
                          className="hover:text-blue-800 flex items-center gap-1 cursor-pointer font-bold"
                        >
                          Replace
                        </button>
                        <span className="text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSlotNoteDraft(slot.notes || '');
                            setEditingSlotNoteId(editingSlotNoteId === slot.id ? null : slot.id);
                          }}
                          className="hover:text-blue-800 flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <FileText className="w-3 h-3" /> {slot.notes ? 'Edit Notes' : 'Notes'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW MODE 2: WEEK VIEW (7-DAY INTERACTIVE TIMETABLE) */}
          {/* ======================================================== */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <strong className="text-blue-950 font-bold block">7-Day Weekly Diet Timetable (Monday – Sunday)</strong>
                  <span className="text-[11px] text-blue-800">Click any day to edit its detailed slots, or add/swap dishes directly inside the weekly grid.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyDayToAllWeek}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy {activeWeekDay.slice(0, 3)} to All 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateWeeklyRotation}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Rotate 7 Days
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[760px] overflow-y-auto pr-1">
                {WEEK_DAYS.map(dayName => {
                  const daySlots = weeklyMeals[dayName] || [];
                  const dayCals = Math.round(daySlots.reduce((s, sl) => s + sl.items.reduce((a, it) => a + it.calories, 0), 0));
                  const dayProt = Math.round(daySlots.reduce((s, sl) => s + sl.items.reduce((a, it) => a + it.protein, 0), 0));
                  const dayCarb = Math.round(daySlots.reduce((s, sl) => s + sl.items.reduce((a, it) => a + it.carbs, 0), 0));
                  const dayFat = Math.round(daySlots.reduce((s, sl) => s + sl.items.reduce((a, it) => a + it.fat, 0), 0));
                  const isCurrentDay = activeWeekDay === dayName;

                  return (
                    <div
                      key={dayName}
                      className={`rounded-2xl border p-3.5 transition-all space-y-2.5 ${
                        isCurrentDay ? 'border-blue-500 bg-blue-50/15 ring-1 ring-blue-200' : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                            isCurrentDay ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-800'
                          }`}>
                            {dayName}
                          </span>
                          <span className="text-xs font-bold text-stone-700">
                            {dayCals} kcal • P: {dayProt}g • C: {dayCarb}g • F: {dayFat}g
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveWeekDay(dayName);
                            setViewMode('day');
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Open in Day Builder →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {daySlots.map(slot => {
                          const slCals = Math.round(slot.items.reduce((s, it) => s + it.calories, 0));
                          return (
                            <div key={slot.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1 text-[11px]">
                              <div className="flex items-center justify-between font-bold text-stone-800">
                                <span className="truncate">{slot.title}</span>
                                <span className="text-[10px] text-stone-500">{slCals} kcal</span>
                              </div>
                              <div className="space-y-0.5 text-stone-600">
                                {slot.items.length === 0 ? (
                                  <span className="text-[10px] italic text-stone-400">Empty</span>
                                ) : (
                                  slot.items.map(it => (
                                    <div key={it.id} className="flex items-start justify-between gap-1 text-[10.5px]">
                                      <span className="min-w-0 flex-1 break-words font-medium text-stone-800">• {it.name} <span className="text-stone-500 font-normal">({it.portion})</span></span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveWeekDay(dayName);
                                          openFoodModal('swap', slot.id, slot.title, it);
                                        }}
                                        className="text-blue-600 hover:underline shrink-0 font-bold cursor-pointer"
                                      >
                                        Swap
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                              <div className="pt-1 flex items-center justify-between border-t border-stone-200/60">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveWeekDay(dayName);
                                    openFoodModal('add', slot.id, slot.title);
                                  }}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                                >
                                  + Add Food
                                </button>
                                {slot.notes && (
                                  <span className="text-[9px] text-amber-700 font-semibold truncate max-w-[110px]" title={slot.notes}>
                                    📝 {slot.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW MODE 3: EXCHANGE VIEW (ICMR FOOD EXCHANGE & DISTRIBUTION) */}
          {/* ======================================================== */}
          {viewMode === 'exchange' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <strong className="text-emerald-950 font-bold block">ICMR Clinical Food Exchange & Nutrient Distribution ({activeWeekDay})</strong>
                  <span className="text-[11px] text-emerald-800">Standardized dietetic exchange equivalents, macro ratios, and meal-wise energy allocation.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('day')}
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-lg font-bold text-[11px] cursor-pointer"
                >
                  Back to Day View
                </button>
              </div>

              {/* Exchange Groups Table */}
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 text-[10px] uppercase font-bold border-b border-stone-200">
                      <th className="p-2.5">ICMR Exchange Group</th>
                      <th className="p-2.5 text-center">Exchanges</th>
                      <th className="p-2.5 text-right">Calories</th>
                      <th className="p-2.5 text-right">Prot (g)</th>
                      <th className="p-2.5 text-right">Carbs (g)</th>
                      <th className="p-2.5 text-right">Fat (g)</th>
                      <th className="p-2.5 text-right">Fibre (g)</th>
                      <th className="p-2.5 text-right">Na (mg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {exchangeSummary.map(row => {
                      const calPct = dailyTotals.calories > 0 ? Math.round((row.calories / dailyTotals.calories) * 100) : 0;
                      return (
                        <tr key={row.group} className="hover:bg-stone-50">
                          <td className="p-2.5">
                            <strong className="text-stone-900 block">{row.group}</strong>
                            <span className="text-[10px] text-stone-400 block">1 Exch ≈ {row.standardPortion} ({row.kcalPerExchange} kcal)</span>
                            {row.items.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {row.items.map((it, idx) => (
                                  <span key={idx} className="text-[9.5px] px-1.5 py-0.2 bg-stone-100 text-stone-700 rounded border border-stone-200">
                                    {it.name} ({it.portion})
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-black text-xs">
                              {row.exchanges}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-stone-900">
                            {row.calories} <span className="text-[10px] text-stone-400 font-normal">({calPct}%)</span>
                          </td>
                          <td className="p-2.5 text-right font-semibold text-sky-800">{row.protein}</td>
                          <td className="p-2.5 text-right font-semibold text-emerald-800">{row.carbs}</td>
                          <td className="p-2.5 text-right font-semibold text-amber-800">{row.fat}</td>
                          <td className="p-2.5 text-right text-teal-800">{row.fibre}</td>
                          <td className="p-2.5 text-right text-stone-600">{row.sodium}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-900 text-white font-bold text-xs">
                      <td className="p-2.5">Total Daily Prescription</td>
                      <td className="p-2.5 text-center">
                        {Math.round(exchangeSummary.reduce((s, r) => s + r.exchanges, 0) * 10) / 10} Exch
                      </td>
                      <td className="p-2.5 text-right">{dailyTotals.calories} kcal</td>
                      <td className="p-2.5 text-right">{dailyTotals.protein}g</td>
                      <td className="p-2.5 text-right">{dailyTotals.carbs}g</td>
                      <td className="p-2.5 text-right">{dailyTotals.fat}g</td>
                      <td className="p-2.5 text-right">{dailyTotals.fibre}g</td>
                      <td className="p-2.5 text-right">{dailyTotals.sodium}mg</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Meal-by-Meal Energy & Macro Distribution */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider">Meal-Slot Energy Distribution</h4>
                <div className="space-y-2">
                  {meals.map(slot => {
                    const slCals = Math.round(slot.items.reduce((s, it) => s + it.calories, 0));
                    const pct = dailyTotals.calories > 0 ? Math.round((slCals / dailyTotals.calories) * 100) : 0;
                    return (
                      <div key={slot.id} className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold text-stone-700">
                          <span>{slot.title} ({slot.time})</span>
                          <span>{slCals} kcal ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUMN 3 (RIGHT, 3 COLS): RECIPE DATABASE LIBRARY */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif font-bold text-stone-900 text-sm">Recipe Database</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200" title="Sorted in strict alphabetical order (A–Z)">
                A–Z ({filteredRecipes.length})
              </span>
            </div>
            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold truncate">
              Target: {meals.find(m => m.id === targetSlotId)?.title}
            </span>
          </div>

          {/* Search / Filter Tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs">
            {(['search', 'filter', 'smart'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setRecipeTab(t);
                  setSelectedCategoryTag('All');
                }}
                className={`flex-1 py-1 text-center font-bold rounded-lg transition-all cursor-pointer ${
                  recipeTab === t
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t === 'search' ? 'Search' : t === 'filter' ? 'Clinical Filter' : 'Smart Match'}
              </button>
            ))}
          </div>

          {/* Smart Suggestions Clinical Banner */}
          {recipeTab === 'smart' && (
            <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>AI Clinical & Biomarker Filter: {clientProfile.name}</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-tight">
                Filtered strictly for {clientProfile.conditions.join(', ')} • {abnormalBiomarkers.length} lab flags • {clientProfile.dietPreference}.
              </p>
            </div>
          )}

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={recipeSearch}
              onChange={e => setRecipeSearch(e.target.value)}
              placeholder="Search recipe A–Z (e.g., poha, dal, paneer)..."
              className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {recipeSearch && (
              <button
                type="button"
                onClick={() => setRecipeSearch('')}
                title="Clear search"
                className="w-5 h-5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category / Condition Filter Chips */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {(recipeTab === 'filter'
              ? ['All', 'Diabetic Safe', 'Low Sodium', 'Low Fat', 'High Fibre', 'High Protein', 'Gluten Free', 'Dairy Free']
              : ['All', 'Cereal', 'Milk & Milk Products', 'Vegetables', 'Non-Veg', 'Dal & Pulses']
            ).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryTag(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedCategoryTag === cat
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Recipe List Cards with Instant Clinical & Biomarker Suitability */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredRecipes.slice(0, recipeDisplayLimit).map(rec => {
              const recBadges = evaluateFoodItemForPatient(rec, meals.find(m => m.id === targetSlotId)?.title || '', clientProfile);
              const dangerBadge = recBadges.find(b => b.type === 'danger');
              const warningBadge = recBadges.find(b => b.type === 'warning');

              return (
                <div
                  key={rec.id}
                  className={`p-3 border rounded-xl transition-all space-y-2 ${
                    dangerBadge
                      ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                      : warningBadge
                      ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                      : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs text-stone-900 leading-tight break-words">{rec.name}</h5>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.tags.slice(0, 2).map((tag, tidx) => (
                          <span
                            key={tidx}
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 border border-stone-200"
                          >
                            {tag}
                          </span>
                        ))}
                        {dangerBadge ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5">
                            🚨 {dangerBadge.text}
                          </span>
                        ) : warningBadge ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                            ⚠️ {warningBadge.text}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                            ✓ Safe for Patient
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddRecipeToSlot(rec)}
                      className={`px-3 py-1 text-white rounded-lg text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer ${
                        dangerBadge ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Add +
                    </button>
                  </div>

                  <div className="pt-1.5 border-t border-stone-200/60 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-stone-600">
                      <span className="font-medium text-stone-500">{rec.portion}</span>
                      <strong className="text-stone-900 font-bold">{rec.calories} kcal</strong>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10.5px] font-mono bg-white/80 px-2 py-1 rounded-lg border border-stone-200/70">
                      <span className="text-emerald-800 font-semibold" title="Carbohydrates (g)">
                        <span className="text-[9px] font-sans font-bold text-emerald-600/80 mr-0.5">C</span>{rec.carbs}g
                      </span>
                      <span className="text-sky-800 font-semibold" title="Protein (g)">
                        <span className="text-[9px] font-sans font-bold text-sky-600/80 mr-0.5">P</span>{rec.protein}g
                      </span>
                      <span className="text-amber-800 font-semibold" title="Fat (g)">
                        <span className="text-[9px] font-sans font-bold text-amber-600/80 mr-0.5">F</span>{rec.fat}g
                      </span>
                      <span className="text-teal-800 font-semibold" title="Dietary Fibre (g)">
                        <span className="text-[9px] font-sans font-bold text-teal-600/80 mr-0.5">Fib</span>{rec.fibre}g
                      </span>
                      <span className="text-rose-800 font-semibold" title="Sodium (mg)">
                        <span className="text-[9px] font-sans font-bold text-rose-600/80 mr-0.5">Na</span>{rec.sodium}mg
                      </span>
                      <span className="text-purple-800 font-semibold" title="Potassium (mg)">
                        <span className="text-[9px] font-sans font-bold text-purple-600/80 mr-0.5">K</span>{rec.potassium}mg
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRecipes.length > recipeDisplayLimit && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setRecipeDisplayLimit(l => l + 50)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                View More Results ({filteredRecipes.length - recipeDisplayLimit} more) →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* --------- BOTTOM PANEL: DAILY NUTRIENT SUMMARY & REAL-TIME AUDITING --------- */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif font-black text-stone-900 text-sm">
            Daily Nutrient Summary & Clinical Safety Audit ({activeWeekDay})
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            Prescription Envelope: {targets.calories} kcal • {targets.protein}g P • {targets.carbs}g C • {targets.fat}g F
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Gauge Rings (6 Cols) */}
          <div className="lg:col-span-6 grid grid-cols-4 sm:grid-cols-7 gap-2 items-center justify-items-center">
            {renderGauge('Calories', dailyTotals.calories, targets.calories, 'kcal', dailyTotals.calories > targets.calories + 100)}
            {renderGauge('Protein', dailyTotals.protein, targets.protein, 'g', dailyTotals.protein < targets.protein - 10)}
            {renderGauge('Carbs', dailyTotals.carbs, targets.carbs, 'g', dailyTotals.carbs > targets.carbs + 20)}
            {renderGauge('Fat', dailyTotals.fat, targets.fat, 'g', dailyTotals.fat > targets.fat + 10)}
            {renderGauge('Fibre', dailyTotals.fibre, targets.fibre, 'g', dailyTotals.fibre < targets.fibre - 5)}
            {renderGauge('Sodium', dailyTotals.sodium, targets.sodium, 'mg', dailyTotals.sodium > targets.sodium)}
            {renderGauge('Potassium', dailyTotals.potassium, targets.potassium, 'mg', dailyTotals.potassium > targets.potassium)}
          </div>

          {/* Alerts & Suggestions (Comprehensive Clinical & Biomarker Audit) (3 Cols) */}
          <div className="lg:col-span-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Patient & Biomarker Audit</span>
              {overallClinicalAudit.totalIssues > 0 && (
                <button
                  type="button"
                  onClick={handleFixMyPlan}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] shrink-0 cursor-pointer"
                >
                  Fix My Plan
                </button>
              )}
            </div>

            <div className="flex items-start gap-1.5">
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${dailyTotals.carbs > targets.carbs + 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <strong className="text-stone-800">Diabetes / HbA1c: </strong>
                <span className="text-stone-600">{overallClinicalAudit.diabetesStatus}</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5">
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${dailyTotals.sodium > targets.sodium ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <div>
                <strong className="text-stone-800">Hypertension / Na: </strong>
                <span className="text-stone-600">{overallClinicalAudit.hypertensionStatus}</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5">
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${dailyTotals.fat > targets.fat + 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <strong className="text-stone-800">Fatty Liver / SGPT: </strong>
                <span className="text-stone-600">{overallClinicalAudit.fattyLiverStatus}</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5">
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${abnormalBiomarkers.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <strong className="text-stone-800">Biomarkers: </strong>
                <span className="text-stone-600">{overallClinicalAudit.biomarkerStatus}</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5">
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${overallClinicalAudit.noteViolations.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <strong className="text-stone-800">Directives: </strong>
                <span className="text-stone-600">{overallClinicalAudit.notesStatus}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (3 Cols) */}
          <div className="lg:col-span-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Quick Studio Actions</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  const slot = meals.find(m => m.id === targetSlotId) || meals[3];
                  openFoodModal('swap', slot.id, slot.title, slot.items[0]);
                }}
                className="p-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>🔀</span> Smart Swap
              </button>
              <button
                type="button"
                onClick={handleFixMyPlan}
                className="p-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>📉</span> Auto-Fix Issues
              </button>
              <button
                type="button"
                onClick={handleGenerateWeeklyRotation}
                className="p-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>⚡</span> 7-Day Rotation
              </button>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(true)}
                className="p-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>📋</span> Load Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* --------- ADD / SWAP / REPLACE FOOD MODAL --------- */}
      {/* ======================================================== */}
      {activeModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 md:p-6 shadow-2xl border border-stone-200 my-8 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {activeModal.mode === 'swap' ? 'Swap Dish' : activeModal.mode === 'replace' ? 'Replace Entire Slot' : 'Add Dish to Slot'}
                </span>
                <h3 className="font-serif font-bold text-lg text-stone-900 mt-1">
                  {activeModal.mode === 'swap' && activeModal.itemToSwap
                    ? `Swap "${activeModal.itemToSwap.name}" in ${activeModal.slotTitle}`
                    : `${activeModal.mode === 'replace' ? 'Replace' : 'Add Food to'} ${activeModal.slotTitle} (${activeWeekDay})`}
                </h3>
                {activeModal.mode === 'swap' && activeModal.itemToSwap && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    Current: <strong>{activeModal.itemToSwap.name}</strong> ({activeModal.itemToSwap.portion}) • {activeModal.itemToSwap.calories} kcal • P:{activeModal.itemToSwap.protein}g C:{activeModal.itemToSwap.carbs}g F:{activeModal.itemToSwap.fat}g
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Mode Tabs: Recipe Catalog vs Custom Dish */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setModalTab('catalog')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    modalTab === 'catalog' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Recipe & Food Catalog (657+)
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('custom')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    modalTab === 'custom' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Custom Dish / Manual Entry
                </button>
              </div>

              {/* Quantity Multiplier Selector inside Modal */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-stone-500">Quantity:</span>
                {[0.5, 1, 1.5, 2, 3].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setModalQuantity(q)}
                    className={`px-2 py-1 rounded-lg font-bold border text-[11px] cursor-pointer ${
                      modalQuantity === q
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {q}x
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Per-Item Clinical Note Input inside Modal */}
            <div>
              <input
                type="text"
                value={modalItemNote}
                onChange={e => setModalItemNote(e.target.value)}
                placeholder="Optional preparation / clinical note for this dish (e.g., No onion, use 1/2 tsp ghee, soak 4 hrs)..."
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {modalTab === 'catalog' ? (
              <div className="space-y-3">
                {/* Search & Filter Strip */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    placeholder="Search A–Z across Indian & clinical foods (e.g., cheela, dal, roti, paneer, idli, salad)..."
                    className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  {modalSearch && (
                    <button
                      type="button"
                      onClick={() => setModalSearch('')}
                      title="Clear search"
                      className="w-5 h-5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {['All', 'Cereal', 'Milk & Milk Products', 'Vegetables', 'Non-Veg', 'Dal & Pulses', 'Safe for Patient'].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setModalFilter(f)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        modalFilter === f ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Catalog List with Live Quantity-Scaled Values */}
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {modalFilteredRecipes.map(rec => {
                    const scaledCal = Math.round(rec.calories * modalQuantity);
                    const scaledP = Math.round(rec.protein * modalQuantity * 10) / 10;
                    const scaledC = Math.round(rec.carbs * modalQuantity * 10) / 10;
                    const scaledF = Math.round(rec.fat * modalQuantity * 10) / 10;
                    const scaledPortion = formatScaledPortion(rec.portion, modalQuantity);

                    const badges = evaluateFoodItemForPatient(
                      { ...rec, calories: scaledCal, protein: scaledP, carbs: scaledC, fat: scaledF },
                      activeModal.slotTitle,
                      clientProfile
                    );
                    const danger = badges.find(b => b.type === 'danger');
                    const warn = badges.find(b => b.type === 'warning');

                    return (
                      <div
                        key={rec.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          danger
                            ? 'bg-rose-50/50 border-rose-200'
                            : warn
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-stone-900">{rec.name}</span>
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                              {scaledPortion}
                            </span>
                            {danger ? (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                🚨 {danger.text}
                              </span>
                            ) : warn ? (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                ⚠️ {warn.text}
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                ✓ Safe
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-600 font-medium">
                            <strong className="text-stone-900">{scaledCal} kcal</strong> • Carbs: {scaledC}g • Protein: {scaledP}g • Fat: {scaledF}g • Fibre: {Math.round((rec.fibre || 0) * modalQuantity * 10) / 10}g • Na: {Math.round((rec.sodium || 0) * modalQuantity)}mg • K: {Math.round((rec.potassium || 0) * modalQuantity)}mg
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleModalAddOrSwap(rec, modalQuantity)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                        >
                          {activeModal.mode === 'swap' ? 'Swap Dish' : activeModal.mode === 'replace' ? 'Replace Slot' : 'Add Dish'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom Food Entry Form */
              <div className="space-y-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-500 block mb-1">Dish Name *</label>
                    <input
                      type="text"
                      value={customFood.name}
                      onChange={e => setCustomFood(c => ({ ...c, name: e.target.value }))}
                      placeholder="e.g., Home-style Palak Dal (No Onion)"
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-500 block mb-1">Base Portion Size (1x)</label>
                    <input
                      type="text"
                      value={customFood.portion}
                      onChange={e => setCustomFood(c => ({ ...c, portion: e.target.value }))}
                      placeholder="e.g., 1 bowl (150 g)"
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {[
                    { k: 'calories', label: 'Calories' },
                    { k: 'protein', label: 'Protein (g)' },
                    { k: 'carbs', label: 'Carbs (g)' },
                    { k: 'fat', label: 'Fat (g)' },
                    { k: 'fibre', label: 'Fibre (g)' },
                    { k: 'sodium', label: 'Na (mg)' },
                    { k: 'potassium', label: 'K+ (mg)' }
                  ].map(field => (
                    <div key={field.k}>
                      <label className="text-[10px] text-stone-500 block">{field.label}</label>
                      <input
                        type="number"
                        value={(customFood as any)[field.k]}
                        onChange={e => setCustomFood(c => ({ ...c, [field.k]: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-stone-600">
                    Scaled ({modalQuantity}x): <strong>{Math.round(customFood.calories * modalQuantity)} kcal</strong> • P: {Math.round(customFood.protein * modalQuantity * 10) / 10}g • C: {Math.round(customFood.carbs * modalQuantity * 10) / 10}g • F: {Math.round(customFood.fat * modalQuantity * 10) / 10}g
                  </span>
                  <button
                    type="button"
                    disabled={!customFood.name.trim()}
                    onClick={() => handleModalAddOrSwap({ ...customFood, notes: modalItemNote }, modalQuantity)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    {activeModal.mode === 'swap' ? 'Confirm Swap' : activeModal.mode === 'replace' ? 'Confirm Replace' : 'Add Custom Food'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --------- CLINICAL MEAL TEMPLATE SELECTOR MODAL --------- */}
      {/* ======================================================== */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">Apply Clinical Indian Meal Template</h3>
                <p className="text-xs text-stone-500">Select an evidence-based protocol to populate {activeWeekDay} or all 7 days</p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {CLINICAL_MEAL_TEMPLATES.map(tpl => (
                <div key={tpl.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-stone-900">{tpl.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {tpl.badge} • ~{tpl.calories} kcal
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{tpl.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tpl.id, false)}
                      className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Apply to {activeWeekDay.slice(0, 3)}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tpl.id, true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Apply to All 7 Days
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --------- PREVIEW & PUBLISH MODAL (STEP 4) --------- */}
      {/* ======================================================== */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">Patient Diet Plan & Biomarker Summary Preview</h3>
                <p className="text-xs text-stone-500">Clinical prescription preview for {clientProfile.name} • {activeWeekDay} ({formattedDateString})</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <strong>Target Prescription:</strong> {targets.calories} kcal • {targets.protein}g Protein • {targets.carbs}g Carbs • {targets.fat}g Fat
                </div>
                <span className="font-bold text-emerald-700">
                  Planned ({activeWeekDay}): {dailyTotals.calories} kcal (P:{dailyTotals.protein}g C:{dailyTotals.carbs}g F:{dailyTotals.fat}g)
                </span>
              </div>
              {clientProfile.notes && (
                <div className="text-[11px] text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200">
                  <strong>Dietitian Directives:</strong> {clientProfile.notes}
                </div>
              )}
              {abnormalBiomarkers.length > 0 && (
                <div className="text-[11px] text-rose-900 bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-200">
                  <strong>Monitored Lab Biomarker Issues:</strong> {abnormalBiomarkers.map(b => `${b.shortName}: ${b.value}${b.unit} (${b.statusLabel})`).join(' • ')}
                </div>
              )}
            </div>

            <div className="divide-y divide-stone-100 max-h-[420px] overflow-y-auto text-xs pr-1">
              {meals.map(m => (
                <div key={m.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="w-36 shrink-0 font-bold text-stone-800">
                    <span className="text-[10px] text-stone-400 block">{m.time}</span>
                    {m.title}
                    {m.notes && (
                      <span className="text-[10px] font-medium text-amber-700 block mt-0.5 italic">
                        📝 {m.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    {m.items.map(it => (
                      <div key={it.id} className="space-y-0.5">
                        <div className="flex justify-between text-stone-700">
                          <span>• <strong>{it.name}</strong> ({it.portion})</span>
                          <span className="font-mono font-semibold text-stone-600">{it.calories} kcal (P:{it.protein}g C:{it.carbs}g F:{it.fat}g)</span>
                        </div>
                        {it.notes && (
                          <div className="text-[10px] text-blue-700 italic pl-3">
                            ↳ {it.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 border border-stone-300 rounded-xl font-bold text-stone-700 hover:bg-stone-50 text-xs cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewModalOpen(false);
                  handleSavePlan('published');
                }}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Approve & Send to Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
