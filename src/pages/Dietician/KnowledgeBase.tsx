import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, FileSpreadsheet, Trash2, Loader2, Search, Utensils, Clock,
  BookOpen, Archive, ChevronDown, ChevronUp, Tag, Calendar, Check,
  AlertTriangle, ShieldCheck, Plus, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  RecipeDBItem, getStoredRecipesFromDB, saveRecipesToDB, clearRecipeDB,
  updateRecipeTags, savePatientWeekPlan, getPatients, PatientProfile,
  WeekDay, MealSlot, WeekPlanEntry, PatientWeekPlan, getAllDraftWeekPlans
} from '../../services/db';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const WEEK_DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime Snack'];

const PREDEFINED_TAGS = [
  { id: 'diabetes_safe', label: 'Diabetes Safe', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'low_glycemic', label: 'Low GI', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { id: 'high_fiber', label: 'High Fiber', color: 'bg-green-100 text-green-800 border-green-300' },
  { id: 'low_sodium', label: 'Low Sodium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'cardiac_safe', label: 'Cardiac Safe', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'renal_safe', label: 'Renal Safe', color: 'bg-violet-100 text-violet-800 border-violet-300' },
  { id: 'low_purine', label: 'Low Purine (Gout)', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'high_protein', label: 'High Protein', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'weight_loss', label: 'Weight Loss', color: 'bg-pink-100 text-pink-800 border-pink-300' },
  { id: 'thyroid_safe', label: 'Thyroid Safe', color: 'bg-amber-100 text-amber-800 border-amber-300' },
];

const CONDITION_RESTRICTIONS = [
  { id: 'diabetes', label: 'Diabetes', desc: 'High sugar/carb dishes' },
  { id: 'hypertension', label: 'Hypertension', desc: 'High sodium dishes' },
  { id: 'renal_disease', label: 'Renal Disease', desc: 'High potassium / phosphorus' },
  { id: 'gout', label: 'Gout', desc: 'High purine ingredients' },
  { id: 'cardiac', label: 'Cardiac', desc: 'High fat / cholesterol' },
  { id: 'celiac', label: 'Celiac', desc: 'Contains gluten' },
  { id: 'lactose', label: 'Lactose Intolerance', desc: 'Contains dairy' },
  { id: 'thyroid', label: 'Thyroid Disorder', desc: 'Goitrogenic foods' },
];

// ─── EXCEL PARSER HELPERS ────────────────────────────────────────────────────
function findRowValue(row: any, keywords: string[]): any {
  if (!row || typeof row !== 'object') return null;
  const keys = Object.keys(row);
  for (const kw of keywords) {
    const matchedKey = keys.find(k => k.toLowerCase().trim().includes(kw.toLowerCase()));
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
      return row[matchedKey];
    }
  }
  return null;
}

function normalizeExcelRow(row: any, sheetName: string, fileName: string, rowIndex: number): RecipeDBItem {
  let rawName = findRowValue(row, [
    'meal name', 'recipe name', 'dish name', 'food item', 'item name',
    'dish', 'recipe', 'meal', 'item', 'food', 'name', 'title', 'menu'
  ]);
  if (!rawName) {
    for (const [key, val] of Object.entries(row)) {
      if (typeof val === 'string' && val.trim().length > 2 && !['day', 'time', 'type', 'sn'].includes(key.toLowerCase())) {
        rawName = val.trim();
        break;
      }
    }
  }
  const name = rawName ? String(rawName).trim() : `${sheetName} Recipe #${rowIndex + 1}`;
  let dietaryType = findRowValue(row, ['dietary type', 'diet type', 'diet', 'veg/non-veg', 'category', 'type']) || 'Vegetarian';
  const nameAndIng = (name + ' ' + (row['Ingredients'] || '')).toLowerCase();
  if (nameAndIng.includes('chicken') || nameAndIng.includes('fish') || nameAndIng.includes('mutton') || nameAndIng.includes('beef') || nameAndIng.includes('pork')) dietaryType = 'Non-Vegetarian';
  else if (nameAndIng.includes('egg')) dietaryType = 'Eggetarian';
  const calories = Number(findRowValue(row, ['calorie', 'kcal', 'energy', 'cal']) || 300);
  const protein = Number(findRowValue(row, ['protein', 'prot', 'p(g)']) || 15);
  const carbs = Number(findRowValue(row, ['carbohydrate', 'carb', 'cho', 'c(g)']) || 40);
  const fat = Number(findRowValue(row, ['fat', 'f(g)']) || 10);
  const rawIng = findRowValue(row, ['ingredient', 'items needed', 'composition', 'raw ingredients']);
  const ingredients = rawIng ? String(rawIng).split(/;|\n|,/).map((i: string) => i.trim()).filter(Boolean) : [`1 portion of ${name}`];
  const rawRecipe = findRowValue(row, ['preparation', 'recipe', 'method', 'instruction', 'step', 'how to prepare']);
  const recipe = rawRecipe ? String(rawRecipe).split(/;|\n|\. /).map((s: string) => s.trim()).filter(Boolean) : [`Prepare ${name} according to standard portion sizes. Serve warm.`];
  return {
    name, dietaryType,
    calories: Math.round(calories) || 250, protein: Math.round(protein) || 12,
    carbs: Math.round(carbs) || 35, fat: Math.round(fat) || 8,
    ingredients, recipe,
    prepTime: String(findRowValue(row, ['prep time', 'preptime']) || '10 mins'),
    cookTime: String(findRowValue(row, ['cook time', 'cooktime']) || '15 mins'),
    clinicalFocus: String(findRowValue(row, ['clinical focus', 'health goal', 'focus', 'tag']) || 'Clinical Recipe'),
    sourceFileName: fileName || 'Uploaded_Excel.xlsx',
    sheetName: sheetName || 'Sheet1',
    tags: [], restrictedConditions: [], mealTypes: []
  };
}

function parseClinicalNutritionMatrix(rawMatrix: any[][], sheetName: string, fileName: string): RecipeDBItem | null {
  if (!rawMatrix || rawMatrix.length === 0) return null;
  const fullText = rawMatrix.map(r => (Array.isArray(r) ? r.join(' ') : '')).join('\n').toLowerCase();
  const isClinical = fullText.includes('food details') || fullText.includes('nutritive value') || (fullText.includes('edible portion') && fullText.includes('carbohydrate'));
  if (!isClinical) return null;
  let dishName = '';
  if (sheetName && !/^sheet\s*\d+$/i.test(sheetName.trim())) {
    dishName = sheetName.trim();
  } else if (fileName) {
    dishName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
  }
  dishName = dishName ? dishName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Clinical Recipe';

  const ingredients: string[] = [];
  const foodItemsRaw: string[] = [];
  let inFoodDetails = false, inNutritiveSection = false;
  let energyCol = -1, carbsCol = -1, proteinCol = -1, fatCol = -1;
  let totalCalories = 0, totalCarbs = 0, totalProtein = 0, totalFat = 0;

  for (let r = 0; r < rawMatrix.length; r++) {
    const row = rawMatrix[r] || [];
    const rowStr = row.map(v => String(v ?? '').trim()).join(' ').toLowerCase();
    if (rowStr.includes('food details')) { inFoodDetails = true; inNutritiveSection = false; continue; }
    if (rowStr.includes('nutritive value')) { inFoodDetails = false; inNutritiveSection = true; continue; }
    if (inNutritiveSection && (rowStr.includes('energy') || rowStr.includes('carbohydrate'))) {
      row.forEach((cell: any, idx: number) => {
        const cStr = String(cell || '').toLowerCase();
        if (cStr.includes('energy') || cStr.includes('kcal')) energyCol = idx;
        if (cStr.includes('carbohydrate') || cStr.includes('carb')) carbsCol = idx;
        if (cStr.includes('protein')) proteinCol = idx;
        if (cStr.includes('fat')) fatCol = idx;
      });
      continue;
    }
    if (inNutritiveSection && (rowStr.startsWith('total') || rowStr.includes('total:'))) {
      if (energyCol !== -1 && row[energyCol] !== undefined) totalCalories = parseFloat(String(row[energyCol])) || 0;
      if (carbsCol !== -1 && row[carbsCol] !== undefined) totalCarbs = parseFloat(String(row[carbsCol])) || 0;
      if (proteinCol !== -1 && row[proteinCol] !== undefined) totalProtein = parseFloat(String(row[proteinCol])) || 0;
      if (fatCol !== -1 && row[fatCol] !== undefined) totalFat = parseFloat(String(row[fatCol])) || 0;
      if (totalCalories === 0) {
        const nums = row.map((v: any) => parseFloat(String(v).replace(/[^0-9.]/g, ''))).filter((n: number) => !isNaN(n) && n > 0);
        if (nums.length >= 4) { totalCalories = nums[0]; totalCarbs = nums[1]; totalProtein = nums[2]; totalFat = nums[3]; }
        else if (nums.length > 0) totalCalories = nums[0];
      }
      continue;
    }
    if (inFoodDetails && !inNutritiveSection) {
      const firstCell = String(row[0] ?? '').trim();
      const sNo = parseInt(firstCell, 10);
      const foodItemName = String(row[1] ?? '').trim();
      if (!isNaN(sNo) && foodItemName && !foodItemName.toLowerCase().includes('food item')) {
        foodItemsRaw.push(foodItemName);
        let weightStr = '';
        const netGramsCell = String(row[6] ?? '').trim();
        const measureDetailCell = String(row[5] ?? '').trim();
        if (netGramsCell) { const num = parseFloat(netGramsCell.replace(/[^0-9.]/g, '')); if (!isNaN(num) && num > 0) weightStr = `${Math.round(num * 10) / 10}g`; }
        else if (measureDetailCell) { const num = parseFloat(measureDetailCell.replace(/[^0-9.]/g, '')); if (!isNaN(num) && num > 0) weightStr = `${Math.round(num * 10) / 10}g`; }
        let cleanItemName = foodItemName;
        if (cleanItemName.toLowerCase().startsWith('cooking oil')) cleanItemName = 'Cooking Oil';
        ingredients.push(weightStr ? `${cleanItemName} (${weightStr})` : cleanItemName);
      }
    }
  }

  const allFoodsLower = foodItemsRaw.join(' ').toLowerCase();
  let dietaryType = 'Vegetarian';
  if (allFoodsLower.includes('chicken') || allFoodsLower.includes('mutton') || allFoodsLower.includes('fish') || allFoodsLower.includes('prawn') || allFoodsLower.includes('beef') || allFoodsLower.includes('pork')) {
    dietaryType = 'Non-Vegetarian';
  } else if (allFoodsLower.includes('egg')) {
    dietaryType = 'Eggetarian';
  } else {
    const hasRoots = allFoodsLower.includes('onion') || allFoodsLower.includes('garlic') || allFoodsLower.includes('potato') || allFoodsLower.includes('carrot') || allFoodsLower.includes('ginger') || allFoodsLower.includes('radish') || allFoodsLower.includes('beetroot');
    const hasDairy = allFoodsLower.includes('paneer') || allFoodsLower.includes('milk') || allFoodsLower.includes('curd') || allFoodsLower.includes('ghee') || allFoodsLower.includes('butter') || allFoodsLower.includes('cheese');
    if (!hasRoots && !hasDairy) dietaryType = 'Vegan';
    else if (!hasRoots) dietaryType = 'Jain';
  }

  let clinicalFocus = 'Clinical Nutritional Analysis';
  if (totalCarbs <= 15 && totalCalories > 0) clinicalFocus = 'Low-Carb & Diabetic Friendly';
  else if (totalProtein >= 15) clinicalFocus = 'High Protein Satiety';
  else if (dietaryType === 'Jain') clinicalFocus = 'Jain Clinical Care';
  else if (allFoodsLower.includes('ladies fingers') || allFoodsLower.includes('bhendi')) clinicalFocus = 'High Fiber & Blood Glucose Control';

  const recipeSteps = [
    `Rinse, measure, and prepare all edible ingredients: ${ingredients.slice(0, 3).join(', ')}.`,
    `Heat ${ingredients.find(i => i.toLowerCase().includes('oil')) || 'cooking oil'} in a non-stick pan on medium heat.`,
    `Add ${ingredients.filter(i => !i.toLowerCase().includes('oil')).join(' and ')}, sautéing gently until tender and cooked through.`,
    `Season lightly adhering to clinical sodium recommendations and serve warm as a weighed clinical portion.`
  ];

  return {
    name: dishName, dietaryType,
    calories: Math.round(totalCalories * 10) / 10 || 164,
    protein: Math.round(totalProtein * 10) / 10 || 2,
    carbs: Math.round(totalCarbs * 10) / 10 || 7,
    fat: Math.round(totalFat * 10) / 10 || 14,
    ingredients: ingredients.length > 0 ? ingredients : [`Standard portion of ${dishName}`],
    recipe: recipeSteps,
    prepTime: '10 mins', cookTime: '15 mins', clinicalFocus,
    sourceFileName: fileName || 'Clinical_Nutritive_Sheet.xlsx',
    sheetName: sheetName || 'bhendi fry',
    tags: [], restrictedConditions: [], mealTypes: []
  };
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function KnowledgeBase() {
  const [recipes, setRecipes] = useState<RecipeDBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [clearing, setClearing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDiet, setFilterDiet] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expand/collapse per recipe card
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  // Tags editor modal
  const [tagsModal, setTagsModal] = useState<{ recipe: RecipeDBItem } | null>(null);
  const [tagsSaving, setTagsSaving] = useState(false);
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [localRestricted, setLocalRestricted] = useState<string[]>([]);
  const [localMealTypes, setLocalMealTypes] = useState<string[]>([]);

  // Assign to week plan modal
  const [assignModal, setAssignModal] = useState<{ recipe: RecipeDBItem } | null>(null);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [assignPatientId, setAssignPatientId] = useState('');
  const [assignDay, setAssignDay] = useState<WeekDay>('Monday');
  const [assignSlot, setAssignSlot] = useState<MealSlot>('Lunch');
  const [assignPortion, setAssignPortion] = useState('1 serving');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const dbRecipes = await getStoredRecipesFromDB();
      if (dbRecipes && dbRecipes.length > 0) {
        setRecipes(dbRecipes);
        return;
      }
      const res = await fetch('/api/knowledge/list');
      const data = await res.json();
      setRecipes(data.recipes || data.sample || []);
    } catch (e) {
      console.error('Failed to fetch recipes', e);
      try {
        const res = await fetch('/api/knowledge/list');
        const data = await res.json();
        setRecipes(data.recipes || data.sample || []);
      } catch (apiErr) {
        console.error('Fallback API also failed:', apiErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
    getPatients().then(setPatients).catch(console.error);
  }, []);

  // ─── UPLOAD HANDLER ────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadStatus('Reading uploaded file...');
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'zip') {
        setUploadStatus('Opening ZIP archive...');
        const zip = await JSZip.loadAsync(file);
        const extracted: RecipeDBItem[] = [];
        const entries = Object.keys(zip.files).filter(path => {
          const lower = path.toLowerCase();
          return !lower.startsWith('__macosx') && !lower.includes('/.') && !lower.includes('~$') &&
            (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv'));
        });
        if (entries.length === 0) { alert('No readable Excel files found in ZIP.'); return; }
        setUploadStatus(`Found ${entries.length} Excel file(s). Extracting recipes...`);
        let processedCount = 0;
        for (const relativePath of entries) {
          processedCount++;
          const zipEntry = zip.files[relativePath];
          if (zipEntry.dir) continue;
          const fileNameOnly = relativePath.split('/').pop() || relativePath;
          setUploadStatus(`Processing (${processedCount}/${entries.length}): ${fileNameOnly}...`);
          try {
            const buffer = await zipEntry.async('arraybuffer');
            const workbook = XLSX.read(buffer, { type: 'array' });
            for (const sheetName of workbook.SheetNames) {
              const sheet = workbook.Sheets[sheetName];
              if (!sheet) continue;
              const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
              const clinicalRecipe = parseClinicalNutritionMatrix(rawMatrix, sheetName, fileNameOnly);
              if (clinicalRecipe) { extracted.push(clinicalRecipe); continue; }
              const rows: any[] = XLSX.utils.sheet_to_json(sheet);
              if (!rows || rows.length === 0) continue;
              rows.forEach((row, idx) => {
                const recipe = normalizeExcelRow(row, sheetName, fileNameOnly, idx);
                if (recipe.name) extracted.push(recipe);
              });
            }
          } catch (fileErr) {
            console.warn(`Error reading ${fileNameOnly}:`, fileErr);
          }
        }
        if (extracted.length > 0) {
          setUploadStatus(`Saving ${extracted.length} recipes to cloud database...`);
          await saveRecipesToDB(extracted);
          alert(`Successfully extracted and saved ${extracted.length} recipe(s) from ${entries.length} Excel files!`);
          await fetchRecipes();
        } else {
          alert('Could not find readable recipe tables inside the spreadsheets.');
        }
        return;
      }
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        setUploadStatus(`Reading spreadsheet ${file.name}...`);
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const extracted: RecipeDBItem[] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;
          const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const clinicalRecipe = parseClinicalNutritionMatrix(rawMatrix, sheetName, file.name);
          if (clinicalRecipe) { extracted.push(clinicalRecipe); continue; }
          const rows: any[] = XLSX.utils.sheet_to_json(sheet);
          if (!rows || rows.length === 0) continue;
          rows.forEach((row, idx) => {
            const recipe = normalizeExcelRow(row, sheetName, file.name, idx);
            if (recipe.name) extracted.push(recipe);
          });
        }
        if (extracted.length > 0) {
          setUploadStatus(`Saving ${extracted.length} recipe(s)...`);
          await saveRecipesToDB(extracted);
          alert(`Successfully imported ${extracted.length} recipe(s) to your cloud Knowledge Base!`);
          await fetchRecipes();
        } else {
          alert('Could not find readable recipe rows in spreadsheet.');
        }
      } else {
        setUploadStatus(`Sending ${file.name} to AI parser...`);
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = async (event) => {
            try {
              const base64 = event.target?.result;
              if (typeof base64 === 'string') {
                const res = await fetch('/api/knowledge/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ base64File: base64, fileName: file.name })
                });
                if (res.ok) {
                  const data = await res.json();
                  alert(`Imported ${data.importedCount} recipes.`);
                  await fetchRecipes();
                } else {
                  const errorData = await res.json().catch(() => ({}));
                  alert(`Failed: ${errorData.error || 'Unknown error'}`);
                }
              }
              resolve();
            } catch (err) { reject(err); }
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload error: ${error.message || 'Failed to process file'}`);
    } finally {
      setUploading(false);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear the entire recipe knowledge base?')) return;
    setClearing(true);
    try {
      await clearRecipeDB();
      try { await fetch('/api/knowledge/clear', { method: 'DELETE' }); } catch {}
      setRecipes([]);
    } catch { alert('Failed to clear'); } finally { setClearing(false); }
  };

  // ─── TAGS MODAL HANDLERS ───────────────────────────────────────────────────
  const openTagsModal = (recipe: RecipeDBItem) => {
    setTagsModal({ recipe });
    setLocalTags(recipe.tags || []);
    setLocalRestricted(recipe.restrictedConditions || []);
    setLocalMealTypes(recipe.mealTypes || []);
  };

  const toggleLocalTag = (id: string) =>
    setLocalTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  const toggleLocalRestriction = (id: string) =>
    setLocalRestricted(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  const toggleLocalMealType = (slot: string) =>
    setLocalMealTypes(prev => prev.includes(slot) ? prev.filter(t => t !== slot) : [...prev, slot]);

  const saveTagsModal = async () => {
    if (!tagsModal) return;
    setTagsSaving(true);
    try {
      await updateRecipeTags(tagsModal.recipe.name, localTags, localRestricted, localMealTypes);
      await fetchRecipes();
      setTagsModal(null);
    } catch (e) {
      alert('Failed to save tags.');
    } finally {
      setTagsSaving(false);
    }
  };

  // ─── ASSIGN WEEK PLAN HANDLERS ─────────────────────────────────────────────
  const openAssignModal = (recipe: RecipeDBItem) => {
    setAssignModal({ recipe });
    setAssignPatientId('');
    setAssignDay('Monday');
    setAssignSlot((recipe.mealTypes?.[0] as MealSlot) || 'Lunch');
    setAssignPortion('1 serving');
    setAssignNotes('');
    setAssignSuccess(false);
  };

  const handleAssignToWeek = async () => {
    if (!assignModal || !assignPatientId) { alert('Please select a patient.'); return; }
    setAssignSaving(true);
    try {
      // Load existing draft plan or create new
      const existingPlans = await getAllDraftWeekPlans(assignPatientId);
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const weekStart = monday.toISOString().split('T')[0];

      let plan: PatientWeekPlan | undefined = existingPlans.find(p => p.weekStartDate === weekStart && p.status === 'draft');

      const newEntry: WeekPlanEntry = {
        day: assignDay,
        mealSlot: assignSlot,
        recipeId: assignModal.recipe.id || assignModal.recipe.name,
        recipeName: assignModal.recipe.name,
        portion: assignPortion,
        notes: assignNotes
      };

      if (plan) {
        // Deduplicate same day+slot, replace
        const filtered = plan.entries.filter(e => !(e.day === assignDay && e.mealSlot === assignSlot));
        plan = { ...plan, entries: [...filtered, newEntry] };
      } else {
        plan = {
          patientId: assignPatientId,
          weekStartDate: weekStart,
          entries: [newEntry],
          status: 'draft'
        };
      }

      await savePatientWeekPlan(plan);
      setAssignSuccess(true);
    } catch (e) {
      alert('Failed to assign recipe to week plan.');
    } finally {
      setAssignSaving(false);
    }
  };

  const publishWeekPlan = async () => {
    if (!assignPatientId) return;
    setAssignSaving(true);
    try {
      const existingPlans = await getAllDraftWeekPlans(assignPatientId);
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const weekStart = monday.toISOString().split('T')[0];
      const draft = existingPlans.find(p => p.weekStartDate === weekStart && p.status === 'draft');
      if (draft) {
        await savePatientWeekPlan({ ...draft, status: 'published' });
        alert(`Week plan published to patient! They can now view their recipe assignments.`);
        setAssignModal(null);
      } else {
        alert('No draft plan found for this week. Add recipes first.');
      }
    } catch (e) {
      alert('Failed to publish.');
    } finally {
      setAssignSaving(false);
    }
  };

  // ─── FILTER ────────────────────────────────────────────────────────────────
  const filtered = recipes.filter(r => {
    const name = r.name || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      (r.ingredients || []).join(' ').toLowerCase().includes(search.toLowerCase()) ||
      (r.tags || []).join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesDiet = filterDiet === 'All' || (r.dietaryType || '').toLowerCase() === filterDiet.toLowerCase();
    return matchesSearch && matchesDiet;
  });

  const tagColor = (id: string) => PREDEFINED_TAGS.find(t => t.id === id)?.color || 'bg-stone-100 text-stone-700 border-stone-200';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-serif font-bold text-stone-900">Clinical Recipe Knowledge Base</h1>
        <p className="text-stone-500 text-xs mt-1">Upload recipes, tag them for medical conditions, and assign them to patient weekly meal plans.</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Upload */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 md:p-6 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 text-emerald-700 border border-emerald-100">
            <Archive className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-serif font-bold text-stone-900 text-sm">Upload Recipes (.ZIP / Excel)</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-md">Batch ZIP</span>
          </div>
          <p className="text-xs text-stone-500 mb-4 max-w-md">
            Upload a <strong>.ZIP archive</strong> containing your practice recipes, or individual <strong>.xlsx / .xls</strong> files. ICMR/IFCT format auto-detected.
          </p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".zip,.xlsx,.xls,.csv,.pdf,.doc,.docx" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-5 py-2.5 bg-stone-900 text-white font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-wider rounded-lg shadow-xs"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
            {uploading ? (uploadStatus || 'Processing...') : 'Upload .ZIP / Excel Files'}
          </button>
          {uploading && uploadStatus && <p className="mt-2.5 text-xs text-emerald-700 font-mono animate-pulse">{uploadStatus}</p>}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 md:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">Firestore Recipe DB</h3>
                <p className="text-[11px] text-stone-500 mt-0.5">Cloud-persisted clinical repository</p>
              </div>
              <span className="text-2xl md:text-3xl font-serif font-bold text-emerald-700">{recipes.length}</span>
            </div>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 text-xs text-emerald-900 rounded-lg space-y-1">
              <p className="font-bold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" /> Assign Recipes to Weekly Plans
              </p>
              <p className="text-[11px] text-emerald-800">Click <strong>Assign to Week Plan</strong> on any recipe card to schedule it for a patient's specific day and meal slot.</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
            <span className="text-xs text-stone-400">{filtered.length} recipes showing</span>
            <button
              onClick={handleClear}
              disabled={clearing || recipes.length === 0}
              className="text-rose-600 font-medium text-xs hover:underline disabled:opacity-50 flex items-center gap-1.5"
            >
              {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Clear Database
            </button>
          </div>
        </div>
      </div>

      {/* Recipe List */}
      <div className="bg-white border border-stone-200/90 rounded-xl shadow-xs flex-1 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-stone-100 bg-stone-50/70 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search recipes, ingredients, tags..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px]">Diet:</span>
            <select value={filterDiet} onChange={e => setFilterDiet(e.target.value)}
              className="border border-stone-300 px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-orange-500 bg-white text-xs font-medium"
            >
              <option value="All">All Diets</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Eggetarian">Eggetarian</option>
              <option value="Jain">Jain</option>
            </select>
          </div>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Loading database recipes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs">
              No recipes found. Upload an Excel or ZIP file above to populate the DB.
            </div>
          ) : (
            filtered.map((r, idx) => {
              const cardKey = r.id || r.name || String(idx);
              const isExpanded = expandedRecipe === cardKey;
              return (
                <div key={cardKey} className="transition-colors hover:bg-stone-50/60">
                  {/* Collapsed Header — click to expand */}
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => setExpandedRecipe(isExpanded ? null : cardKey)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200">
                            {r.dietaryType}
                          </span>
                          {r.clinicalFocus && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {r.clinicalFocus}
                            </span>
                          )}
                          {r.sourceFileName && (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                              📄 {r.sourceFileName}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-stone-900 text-base">{r.name}</h4>

                        {/* Macro row */}
                        <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                          <span className="font-bold text-emerald-700">{r.calories} kcal</span>
                          <span>P: {r.protein}g</span>
                          <span>C: {r.carbs}g</span>
                          <span>F: {r.fat}g</span>
                          {r.prepTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.prepTime}</span>}
                        </div>

                        {/* Medical tags row */}
                        {(r.tags && r.tags.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.tags.map(t => (
                              <span key={t} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColor(t)}`}>
                                {PREDEFINED_TAGS.find(pt => pt.id === t)?.label || t}
                              </span>
                            ))}
                          </div>
                        )}
                        {(r.restrictedConditions && r.restrictedConditions.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[10px] text-rose-700 font-bold flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Restricted for:</span>
                            {r.restrictedConditions.map(c => (
                              <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-800 border-rose-300">
                                {CONDITION_RESTRICTIONS.find(cr => cr.id === c)?.label || c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right side: action buttons + chevron */}
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); openTagsModal(r); }}
                          title="Edit medical tags"
                          className="p-1.5 rounded border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-stone-500 hover:text-amber-700 transition-colors"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); openAssignModal(r); }}
                          title="Assign to patient week plan"
                          className="px-3 py-1.5 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" /> Assign
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail — only visible on click */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-stone-100 bg-stone-50/40">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                        <div className="bg-white p-3 border border-stone-100 rounded">
                          <span className="font-bold text-stone-500 block mb-2 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <Utensils className="w-3 h-3 text-emerald-600" /> Ingredients ({r.ingredients?.length || 0})
                          </span>
                          <ul className="space-y-1">
                            {(r.ingredients || []).map((ing, i) => (
                              <li key={i} className="flex items-center gap-2 text-stone-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                {ing}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white p-3 border border-stone-100 rounded">
                          <span className="font-bold text-stone-500 block mb-2 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" /> Prep: {r.prepTime} • Cook: {r.cookTime}
                          </span>
                          <ol className="space-y-1.5">
                            {(r.recipe || []).map((step, i) => (
                              <li key={i} className="flex items-start gap-2 text-stone-700">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">{i + 1}</span>
                                <span className="leading-relaxed mt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                      {r.mealTypes && r.mealTypes.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                          <span className="font-bold uppercase tracking-wider text-[10px]">Suitable for:</span>
                          {r.mealTypes.map(mt => (
                            <span key={mt} className="px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200 rounded text-[10px] font-bold uppercase">{mt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ TAGS MODAL ═══════════════════════════════════════════════════════ */}
      {tagsModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-600" /> Edit Recipe Tags
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">{tagsModal.recipe.name}</p>
              </div>
              <button onClick={() => setTagsModal(null)} className="text-stone-400 hover:text-stone-700"><X className="w-5 h-5" /></button>
            </div>

            {/* Positive tags */}
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Positive Tags (safe / suitable for)
              </p>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map(t => (
                  <button key={t.id} onClick={() => toggleLocalTag(t.id)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${localTags.includes(t.id) ? t.color + ' ring-2 ring-offset-1 ring-emerald-400' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'}`}
                  >
                    {localTags.includes(t.id) && <Check className="w-3 h-3 inline mr-0.5" />}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Restricted conditions */}
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Restrict from Patients with Conditions
              </p>
              <div className="flex flex-wrap gap-2">
                {CONDITION_RESTRICTIONS.map(c => (
                  <button key={c.id} onClick={() => toggleLocalRestriction(c.id)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${localRestricted.includes(c.id) ? 'bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-offset-1 ring-rose-400' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-rose-300'}`}
                    title={c.desc}
                  >
                    {localRestricted.includes(c.id) && <Check className="w-3 h-3 inline mr-0.5" />}
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal type slots */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-orange-600" /> Suitable Meal Slots
              </p>
              <div className="flex flex-wrap gap-2">
                {MEAL_SLOTS.map(slot => (
                  <button key={slot} onClick={() => toggleLocalMealType(slot)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${localMealTypes.includes(slot) ? 'bg-orange-100 text-orange-800 border-orange-300 ring-2 ring-offset-1 ring-orange-400' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-orange-300'}`}
                  >
                    {localMealTypes.includes(slot) && <Check className="w-3 h-3 inline mr-0.5" />}
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setTagsModal(null)} className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50">
                Cancel
              </button>
              <button onClick={saveTagsModal} disabled={tagsSaving}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
              >
                {tagsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ASSIGN WEEK PLAN MODAL ════════════════════════════════════════════ */}
      {assignModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" /> Assign to Weekly Meal Plan
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 font-semibold">{assignModal.recipe.name}</p>
                <p className="text-[10px] text-stone-400">{assignModal.recipe.calories} kcal · {assignModal.recipe.dietaryType}</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="text-stone-400 hover:text-stone-700"><X className="w-5 h-5" /></button>
            </div>

            {assignSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="font-bold text-stone-900">Recipe Added to Draft Plan!</p>
                <p className="text-xs text-stone-500">
                  <strong>{assignModal.recipe.name}</strong> assigned to <strong>{assignDay} {assignSlot}</strong> for this patient.
                  Add more or publish when ready.
                </p>
                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={() => { setAssignSuccess(false); setAssignDay('Monday'); }}
                    className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
                  >
                    + Add Another Day
                  </button>
                  <button
                    onClick={publishWeekPlan}
                    disabled={assignSaving}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
                  >
                    {assignSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    Publish to Patient
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Patient select */}
                <div>
                  <label className="block uppercase font-bold text-stone-500 mb-1">Patient</label>
                  <select value={assignPatientId} onChange={e => setAssignPatientId(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    <option value="">Select patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.dietaryType || 'Standard'})</option>
                    ))}
                  </select>
                </div>

                {/* Day + Slot */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase font-bold text-stone-500 mb-1">Day of Week</label>
                    <select value={assignDay} onChange={e => setAssignDay(e.target.value as WeekDay)}
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                    >
                      {WEEK_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block uppercase font-bold text-stone-500 mb-1">Meal Slot</label>
                    <select value={assignSlot} onChange={e => setAssignSlot(e.target.value as MealSlot)}
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                    >
                      {MEAL_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Portion + Notes */}
                <div>
                  <label className="block uppercase font-bold text-stone-500 mb-1">Portion Size</label>
                  <input type="text" value={assignPortion} onChange={e => setAssignPortion(e.target.value)}
                    placeholder="e.g. 1 serving, 200g, 1 bowl"
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-stone-500 mb-1">Dietician Notes (optional)</label>
                  <input type="text" value={assignNotes} onChange={e => setAssignNotes(e.target.value)}
                    placeholder="e.g. Eat warm, avoid adding salt"
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setAssignModal(null)} className="px-4 py-2 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-50">Cancel</button>
                  <button onClick={handleAssignToWeek} disabled={assignSaving || !assignPatientId}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
                  >
                    {assignSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add to Week Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
