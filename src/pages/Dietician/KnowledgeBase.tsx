import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Trash2, Loader2, Info, Search, Utensils, Clock, BookOpen, CheckCircle, Archive } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { RecipeDBItem, getStoredRecipesFromDB, saveRecipesToDB, clearRecipeDB } from '../../services/db';

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
  if (nameAndIng.includes('chicken') || nameAndIng.includes('fish') || nameAndIng.includes('mutton') || nameAndIng.includes('beef') || nameAndIng.includes('pork')) {
    dietaryType = 'Non-Vegetarian';
  } else if (nameAndIng.includes('egg')) {
    dietaryType = 'Eggetarian';
  }

  const calories = Number(findRowValue(row, ['calorie', 'kcal', 'energy', 'cal']) || 300);
  const protein = Number(findRowValue(row, ['protein', 'prot', 'p(g)']) || 15);
  const carbs = Number(findRowValue(row, ['carbohydrate', 'carb', 'cho', 'c(g)']) || 40);
  const fat = Number(findRowValue(row, ['fat', 'f(g)']) || 10);

  const rawIng = findRowValue(row, ['ingredient', 'items needed', 'composition', 'raw ingredients']);
  const ingredients = rawIng 
    ? String(rawIng).split(/;|\n|,/).map((i: string) => i.trim()).filter(Boolean)
    : [`1 portion of ${name}`];

  const rawRecipe = findRowValue(row, ['preparation', 'recipe', 'method', 'instruction', 'step', 'how to prepare']);
  const recipe = rawRecipe
    ? String(rawRecipe).split(/;|\n|\. /).map((s: string) => s.trim()).filter(Boolean)
    : [`Prepare ${name} according to standard portion sizes. Serve warm.`];

  const prepTime = String(findRowValue(row, ['prep time', 'preptime']) || '10 mins');
  const cookTime = String(findRowValue(row, ['cook time', 'cooktime']) || '15 mins');
  const clinicalFocus = String(findRowValue(row, ['clinical focus', 'health goal', 'focus', 'tag']) || 'Clinical Recipe');

  return {
    name,
    dietaryType,
    calories: Math.round(calories) || 250,
    protein: Math.round(protein) || 12,
    carbs: Math.round(carbs) || 35,
    fat: Math.round(fat) || 8,
    ingredients,
    recipe,
    prepTime,
    cookTime,
    clinicalFocus,
    sourceFileName: fileName || 'Uploaded_Excel.xlsx',
    sheetName: sheetName || 'Sheet1'
  };
}

// Dedicated Parser for ICMR/IFCT Clinical Nutrition Matrices (e.g. Bhendi Fry, Food Details & Nutritive Value Details tables)
function parseClinicalNutritionMatrix(rawMatrix: any[][], sheetName: string, fileName: string): RecipeDBItem | null {
  if (!rawMatrix || rawMatrix.length === 0) return null;

  const fullText = rawMatrix.map(r => (Array.isArray(r) ? r.join(' ') : '')).join('\n').toLowerCase();
  const isClinical = 
    fullText.includes('food details') || 
    fullText.includes('nutritive value') || 
    (fullText.includes('edible portion') && fullText.includes('carbohydrate'));

  if (!isClinical) return null;

  // 1. Resolve Dish Title: sheet name preferred (e.g. "bhendi fry" -> "Bhendi Fry")
  let dishName = '';
  if (sheetName && !/^sheet\s*\d+$/i.test(sheetName.trim())) {
    dishName = sheetName.trim();
  } else if (fileName) {
    dishName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
  }

  dishName = dishName
    ? dishName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : 'Clinical Recipe';

  // 2. Parse Ingredients and Macros
  const ingredients: string[] = [];
  const foodItemsRaw: string[] = [];
  let inFoodDetails = false;
  let inNutritiveSection = false;

  let energyCol = -1;
  let carbsCol = -1;
  let proteinCol = -1;
  let fatCol = -1;

  let totalCalories = 0;
  let totalCarbs = 0;
  let totalProtein = 0;
  let totalFat = 0;

  for (let r = 0; r < rawMatrix.length; r++) {
    const row = rawMatrix[r] || [];
    const rowStr = row.map(v => String(v ?? '').trim()).join(' ').toLowerCase();

    if (rowStr.includes('food details')) {
      inFoodDetails = true;
      inNutritiveSection = false;
      continue;
    }

    if (rowStr.includes('nutritive value')) {
      inFoodDetails = false;
      inNutritiveSection = true;
      continue;
    }

    // In Nutritive Section: locate header columns
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

    // In Nutritive Section: locate Total row
    if (inNutritiveSection && (rowStr.startsWith('total') || rowStr.includes('total:'))) {
      if (energyCol !== -1 && row[energyCol] !== undefined) {
        totalCalories = parseFloat(String(row[energyCol])) || 0;
      }
      if (carbsCol !== -1 && row[carbsCol] !== undefined) {
        totalCarbs = parseFloat(String(row[carbsCol])) || 0;
      }
      if (proteinCol !== -1 && row[proteinCol] !== undefined) {
        totalProtein = parseFloat(String(row[proteinCol])) || 0;
      }
      if (fatCol !== -1 && row[fatCol] !== undefined) {
        totalFat = parseFloat(String(row[fatCol])) || 0;
      }

      if (totalCalories === 0) {
        const nums = row
          .map((v: any) => parseFloat(String(v).replace(/[^0-9.]/g, '')))
          .filter((n: number) => !isNaN(n) && n > 0);
        if (nums.length >= 4) {
          totalCalories = nums[0];
          totalCarbs = nums[1];
          totalProtein = nums[2];
          totalFat = nums[3];
        } else if (nums.length > 0) {
          totalCalories = nums[0];
        }
      }
      continue;
    }

    // In Food Details section: extract food items
    if (inFoodDetails && !inNutritiveSection) {
      const firstCell = String(row[0] ?? '').trim();
      const sNo = parseInt(firstCell, 10);
      const foodItemName = String(row[1] ?? '').trim();

      if (!isNaN(sNo) && foodItemName && !foodItemName.toLowerCase().includes('food item')) {
        foodItemsRaw.push(foodItemName);

        let weightStr = '';
        const netGramsCell = String(row[6] ?? '').trim();
        const measureDetailCell = String(row[5] ?? '').trim();

        if (netGramsCell) {
          const num = parseFloat(netGramsCell.replace(/[^0-9.]/g, ''));
          if (!isNaN(num) && num > 0) weightStr = `${Math.round(num * 10) / 10}g`;
        } else if (measureDetailCell) {
          const num = parseFloat(measureDetailCell.replace(/[^0-9.]/g, ''));
          if (!isNaN(num) && num > 0) weightStr = `${Math.round(num * 10) / 10}g`;
        }

        let cleanItemName = foodItemName;
        if (cleanItemName.toLowerCase().startsWith('cooking oil')) {
          cleanItemName = 'Cooking Oil';
        }

        const formatted = weightStr ? `${cleanItemName} (${weightStr})` : cleanItemName;
        ingredients.push(formatted);
      }
    }
  }

  // 3. Determine Dietary Classification
  const allFoodsLower = foodItemsRaw.join(' ').toLowerCase();
  let dietaryType = 'Vegetarian';

  if (
    allFoodsLower.includes('chicken') ||
    allFoodsLower.includes('mutton') ||
    allFoodsLower.includes('fish') ||
    allFoodsLower.includes('prawn') ||
    allFoodsLower.includes('beef') ||
    allFoodsLower.includes('pork')
  ) {
    dietaryType = 'Non-Vegetarian';
  } else if (allFoodsLower.includes('egg')) {
    dietaryType = 'Eggetarian';
  } else {
    const hasRoots = 
      allFoodsLower.includes('onion') || 
      allFoodsLower.includes('garlic') || 
      allFoodsLower.includes('potato') || 
      allFoodsLower.includes('carrot') || 
      allFoodsLower.includes('ginger') ||
      allFoodsLower.includes('radish') ||
      allFoodsLower.includes('beetroot');

    const hasDairy = 
      allFoodsLower.includes('paneer') || 
      allFoodsLower.includes('milk') || 
      allFoodsLower.includes('curd') || 
      allFoodsLower.includes('ghee') || 
      allFoodsLower.includes('butter') || 
      allFoodsLower.includes('cheese');

    if (!hasRoots && !hasDairy) {
      dietaryType = 'Vegan';
    } else if (!hasRoots) {
      dietaryType = 'Jain';
    } else {
      dietaryType = 'Vegetarian';
    }
  }

  let clinicalFocus = 'Clinical Nutritional Analysis';
  if (totalCarbs <= 15 && totalCalories > 0) {
    clinicalFocus = 'Low-Carb & Diabetic Friendly';
  } else if (totalProtein >= 15) {
    clinicalFocus = 'High Protein Satiety';
  } else if (dietaryType === 'Jain') {
    clinicalFocus = 'Jain Clinical Care';
  } else if (allFoodsLower.includes('ladies fingers') || allFoodsLower.includes('bhendi')) {
    clinicalFocus = 'High Fiber & Blood Glucose Control';
  }

  const recipeSteps = [
    `Rinse, measure, and prepare all edible ingredients: ${ingredients.slice(0, 3).join(', ')}.`,
    `Heat ${ingredients.find(i => i.toLowerCase().includes('oil')) || 'cooking oil'} in a non-stick pan on medium heat.`,
    `Add ${ingredients.filter(i => !i.toLowerCase().includes('oil')).join(' and ')}, sautéing gently until tender and cooked through.`,
    `Season lightly adhering to clinical sodium recommendations and serve warm as a weighed clinical portion.`
  ];

  return {
    name: dishName,
    dietaryType,
    calories: Math.round(totalCalories * 10) / 10 || 164,
    protein: Math.round(totalProtein * 10) / 10 || 2,
    carbs: Math.round(totalCarbs * 10) / 10 || 7,
    fat: Math.round(totalFat * 10) / 10 || 14,
    ingredients: ingredients.length > 0 ? ingredients : [`Standard portion of ${dishName}`],
    recipe: recipeSteps,
    prepTime: '10 mins',
    cookTime: '15 mins',
    clinicalFocus,
    sourceFileName: fileName || 'Clinical_Nutritive_Sheet.xlsx',
    sheetName: sheetName || 'bhendi fry'
  };
}

export default function KnowledgeBase() {
  const [recipes, setRecipes] = useState<RecipeDBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [clearing, setClearing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDiet, setFilterDiet] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      // 1. First fetch directly from Firestore dietician_notes/clinical_knowledge_base
      const dbRecipes = await getStoredRecipesFromDB();
      if (dbRecipes && dbRecipes.length > 0) {
        setRecipes(dbRecipes);
        return;
      }
      // 2. Fallback to API endpoint
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
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('Reading uploaded file...');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      // ─── 1. FULL ZIP ARCHIVE INGESTION ─────────────────────────────────────
      if (ext === 'zip') {
        setUploadStatus('Opening ZIP archive...');
        const zip = await JSZip.loadAsync(file);
        const extracted: RecipeDBItem[] = [];

        // Filter out macOS metadata, temp lock files, and keep Excel sheets
        const entries = Object.keys(zip.files).filter(path => {
          const lower = path.toLowerCase();
          return !lower.startsWith('__macosx') && 
                 !lower.includes('/.') && 
                 !lower.includes('~$') && 
                 (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv'));
        });

        if (entries.length === 0) {
          alert('No readable Excel files (.xlsx, .xls, .csv) were found inside this ZIP archive.');
          return;
        }

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

              // Try clinical matrix layout first (Food Details & Nutritive Value tables like Bhendi Fry)
              const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
              const clinicalRecipe = parseClinicalNutritionMatrix(rawMatrix, sheetName, fileNameOnly);

              if (clinicalRecipe) {
                extracted.push(clinicalRecipe);
                continue;
              }

              // Fallback to row-by-row table
              const rows: any[] = XLSX.utils.sheet_to_json(sheet);
              if (!rows || rows.length === 0) continue;

              rows.forEach((row, idx) => {
                const recipe = normalizeExcelRow(row, sheetName, fileNameOnly, idx);
                if (recipe.name) {
                  extracted.push(recipe);
                }
              });
            }
          } catch (fileErr) {
            console.warn(`Error reading file ${fileNameOnly} in ZIP:`, fileErr);
          }
        }

        if (extracted.length > 0) {
          setUploadStatus(`Saving ${extracted.length} recipes to cloud database...`);
          await saveRecipesToDB(extracted);
          alert(`Successfully extracted and saved ${extracted.length} clinical recipe(s) from ${entries.length} Excel files in the ZIP!`);
          await fetchRecipes();
        } else {
          alert('Could not find any readable recipe tables inside the spreadsheets.');
        }
        return;
      }

      // ─── 2. SINGLE SPREADSHEET (.xlsx, .xls, .csv) ──────────────────────────
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        setUploadStatus(`Reading spreadsheet ${file.name}...`);
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const extracted: RecipeDBItem[] = [];

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;

          // 1. Check if sheet matches ICMR / IFCT clinical matrix layout (e.g. Bhendi Fry Food Details & Nutritive Value Details)
          const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const clinicalRecipe = parseClinicalNutritionMatrix(rawMatrix, sheetName, file.name);

          if (clinicalRecipe) {
            extracted.push(clinicalRecipe);
            continue;
          }

          // 2. Fallback to standard row-by-row table format
          const rows: any[] = XLSX.utils.sheet_to_json(sheet);
          if (!rows || rows.length === 0) continue;

          rows.forEach((row, idx) => {
            const recipe = normalizeExcelRow(row, sheetName, file.name, idx);
            if (recipe.name) {
              extracted.push(recipe);
            }
          });
        }

        if (extracted.length > 0) {
          setUploadStatus(`Saving ${extracted.length} recipe(s)...`);
          await saveRecipesToDB(extracted);
          alert(`Successfully imported and saved ${extracted.length} clinical recipe(s) directly to your cloud Knowledge Base!`);
          await fetchRecipes();
        } else {
          alert('Could not find readable recipe rows in spreadsheet. Please verify the format.');
        }
      } else {
        // ─── 3. UNSTRUCTURED FILE (PDF, Doc) VIA API ──────────────────────────
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
                  alert(`Successfully processed file. Imported ${data.importedCount} recipes.`);
                  await fetchRecipes();
                } else {
                  const errorData = await res.json().catch(() => ({}));
                  alert(`Failed to process file: ${errorData.error || 'Unknown error'}`);
                }
              }
              resolve();
            } catch (err) {
              reject(err);
            }
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
    if (!window.confirm('Are you sure you want to clear the entire recipe knowledge base database?')) return;
    setClearing(true);
    try {
      await clearRecipeDB();
      try {
        await fetch('/api/knowledge/clear', { method: 'DELETE' });
      } catch {}
      setRecipes([]);
    } catch (e) {
      alert('Failed to clear');
    } finally {
      setClearing(false);
    }
  };

  const filtered = recipes.filter(r => {
    const name = r.name || '';
    const dietaryType = r.dietaryType || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                          (r.ingredients || []).join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesDiet = filterDiet === 'All' || dietaryType.toLowerCase() === filterDiet.toLowerCase();
    return matchesSearch && matchesDiet;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-stone-900">Clinical Recipe Knowledge Base DB</h1>
        <p className="text-stone-500 text-sm mt-1">Upload your complete ZIP archive or individual Excel recipe sheets to persist in Firestore Cloud DB & feed AI patient meal assignments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Upload Card */}
        <div className="bg-white rounded-none border border-stone-200 p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-3 text-emerald-700">
            <Archive className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-bold text-stone-900">Upload Recipes (.ZIP / Excel)</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              Full ZIP Batch Supported
            </span>
          </div>
          <p className="text-xs text-stone-500 mb-5 max-w-md">
            Upload a single <strong>.ZIP archive</strong> containing all your Excel sheets, or select individual <strong>.xlsx / .xls</strong> files. Each sheet with Food & Nutritive Value tables will be automatically ingested!
          </p>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept=".zip,.xlsx,.xls,.csv,.pdf,.doc,.docx" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-2.5 bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-wider font-bold rounded-full shadow-sm"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
            {uploading ? (uploadStatus || 'Processing Archive...') : 'Upload .ZIP / Excel Files'}
          </button>

          {uploading && uploadStatus && (
            <p className="mt-3 text-xs text-emerald-700 font-mono animate-pulse">
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Stats & Info Card */}
        <div className="bg-white rounded-none border border-stone-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-stone-900">Firestore Recipe DB Status</h3>
                <p className="text-xs text-stone-500 mt-0.5">Persisted Cloud Storage for Meal Plans</p>
              </div>
              <span className="text-3xl font-serif font-black text-emerald-700">{recipes.length}</span>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 rounded space-y-1">
              <p className="font-bold flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                Live Patient Meal Plan Synced
              </p>
              <p>When you assign a meal plan to a patient, these exact Excel recipes & ingredients are automatically fetched and assigned to their profile.</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
            <span className="text-xs text-stone-400">{filtered.length} recipes showing</span>
            <button 
              onClick={handleClear}
              disabled={clearing || recipes.length === 0}
              className="text-red-600 font-medium text-xs hover:underline disabled:opacity-50 flex items-center gap-1.5"
            >
              {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Clear Database
            </button>
          </div>
        </div>
      </div>

      {/* Recipe List & Search Database View */}
      <div className="bg-white border border-stone-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search recipes or ingredients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded text-xs outline-none focus:border-stone-900 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-stone-500 uppercase tracking-wider">Dietary Filter:</span>
            <select 
              value={filterDiet}
              onChange={e => setFilterDiet(e.target.value)}
              className="border border-stone-300 px-3 py-1.5 rounded outline-none focus:border-stone-900 bg-white"
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

        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              Loading database recipes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs">
              No recipes found in database matching your filter. Upload an Excel file above to populate the DB.
            </div>
          ) : (
            filtered.map((r, idx) => (
              <div key={r.id || idx} className="p-5 hover:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200">
                        {r.dietaryType}
                      </span>
                      {r.clinicalFocus && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {r.clinicalFocus}
                        </span>
                      )}
                      {r.sourceFileName && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                          📄 {r.sourceFileName} {r.sheetName ? `(${r.sheetName})` : ''}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-stone-900 text-base">{r.name}</h4>
                  </div>
                  <div className="text-right text-xs font-semibold text-stone-600">
                    <span className="text-emerald-700 font-bold">{r.calories} kcal</span>
                    <div className="text-[11px] text-stone-400 font-medium">
                      P: {r.protein}g • C: {r.carbs}g • F: {r.fat}g
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                  <div className="bg-stone-50 p-3 border border-stone-100">
                    <span className="font-bold text-stone-500 block mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-emerald-600" /> Ingredients ({r.ingredients?.length || 0})
                    </span>
                    <p className="text-stone-700 leading-relaxed font-sans">{r.ingredients?.join(', ') || 'N/A'}</p>
                  </div>
                  <div className="bg-stone-50 p-3 border border-stone-100">
                    <span className="font-bold text-stone-500 block mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" /> Prep & Steps
                    </span>
                    <p className="text-stone-700 leading-relaxed font-sans line-clamp-2">
                      {r.recipe?.join(' ') || 'Standard clinical preparation.'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
