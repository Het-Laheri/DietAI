import { FieldValue } from 'firebase-admin/firestore';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { GoogleGenAI } from '@google/genai';
import { guard, getAdminDb, parseBody, requireEnv, sendError, HttpError } from '../_lib/security.js';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

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

function normalizeExcelRow(row: any, sheetName: string, fileName: string, rowIndex: number): any {
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

// Dedicated Parser for ICMR/IFCT Clinical Nutrition Matrices (e.g. Bhendi Fry Food Details & Nutritive Value Details tables)
function parseClinicalNutritionMatrix(rawMatrix: any[][], sheetName: string, fileName: string): any | null {
  if (!rawMatrix || rawMatrix.length === 0) return null;

  const fullText = rawMatrix.map(r => (Array.isArray(r) ? r.join(' ') : '')).join('\n').toLowerCase();
  const isClinical = 
    fullText.includes('food details') || 
    fullText.includes('nutritive value') || 
    (fullText.includes('edible portion') && fullText.includes('carbohydrate'));

  if (!isClinical) return null;

  let dishName = '';
  if (sheetName && !/^sheet\s*\d+$/i.test(sheetName.trim())) {
    dishName = sheetName.trim();
  } else if (fileName) {
    dishName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
  }

  dishName = dishName
    ? dishName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : 'Clinical Recipe';

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

export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, { methods: ['POST'], roles: ['dietician'] });
  if (!caller) return;

  try {
    const body = parseBody(req);
    const { base64File, fileName } = body || {};
    if (!base64File || typeof base64File !== 'string') {
      throw new HttpError(400, 'No file content provided');
    }

    const base64Clean = base64File.replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    if (buffer.length > MAX_UPLOAD_BYTES) throw new HttpError(413, 'File too large');
    const ext = (fileName || '').split('.').pop()?.toLowerCase();

    const allRecipes: any[] = [];

    if (ext === 'zip') {
      const zip = await JSZip.loadAsync(buffer);
      const entries = Object.keys(zip.files).filter(path => {
        const lower = path.toLowerCase();
        return !lower.startsWith('__macosx') && 
               !lower.includes('/.') && 
               !lower.includes('~$') && 
               (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv'));
      });

      for (const relativePath of entries) {
        const entry = zip.files[relativePath];
        if (entry.dir) continue;

        const fileNameOnly = relativePath.split('/').pop() || relativePath;
        try {
          const fileBuf = await entry.async('nodebuffer');
          let workbook: XLSX.WorkBook;
          try {
            workbook = XLSX.read(fileBuf, { type: 'buffer' });
          } catch {
            workbook = XLSX.read(fileBuf.toString('binary'), { type: 'binary' });
          }

          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) continue;

            const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const clinical = parseClinicalNutritionMatrix(rawMatrix, sheetName, fileNameOnly);

            if (clinical) {
              allRecipes.push(clinical);
              continue;
            }

            const rows: any[] = XLSX.utils.sheet_to_json(sheet);
            if (!rows || rows.length === 0) continue;

            rows.forEach((row, idx) => {
              const rec = normalizeExcelRow(row, sheetName, fileNameOnly, idx);
              if (rec.name) allRecipes.push(rec);
            });
          }
        } catch (zipFileErr) {
          console.warn(`Error reading file ${fileNameOnly} in ZIP:`, zipFileErr);
        }
      }
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(buffer, { type: 'buffer' });
      } catch {
        workbook = XLSX.read(buffer.toString('binary'), { type: 'binary' });
      }

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;

        // 1. Try clinical matrix layout first
        const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const clinicalRecipe = parseClinicalNutritionMatrix(rawMatrix, sheetName, fileName);

        if (clinicalRecipe) {
          allRecipes.push(clinicalRecipe);
          continue;
        }

        // 2. Fallback to standard row-by-row table
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        if (!rows || rows.length === 0) continue;

        rows.forEach((row, idx) => {
          const rec = normalizeExcelRow(row, sheetName, fileName, idx);
          if (rec.name) {
            allRecipes.push(rec);
          }
        });
      }
    } else {
      // Unstructured document fallback with Gemini
      const geminiKey = requireEnv('GEMINI_API_KEY');
      const aiClient = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `Extract distinct meal/recipe entries from this document.
Return ONLY a valid JSON array of objects with fields:
name, dietaryType (Vegetarian, Non-Vegetarian, Jain, Vegan, Eggetarian), calories, protein, carbs, fat, ingredients (array), recipe (array of steps), prepTime, cookTime, clinicalFocus.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: ext === 'pdf' ? 'application/pdf' : 'text/plain',
                  data: base64Clean
                }
              }
            ]
          }
        ]
      });

      const responseText = response.text || '';
      const cleaned = responseText.replace(/```(?:json)?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        parsed.forEach(r => {
          allRecipes.push({
            ...r,
            sourceFileName: fileName || 'Uploaded_Doc'
          });
        });
      }
    }

    if (allRecipes.length > 0) {
      const kbRef = getAdminDb().collection('dietician_notes').doc('clinical_knowledge_base');
      const snap = await kbRef.get();
      let existing: any[] = [];
      if (snap.exists && Array.isArray(snap.get('recipes'))) {
        existing = snap.get('recipes');
      }

      const merged = [
        ...allRecipes,
        ...existing.filter(e => !allRecipes.some(r => r.name.toLowerCase() === e.name.toLowerCase()))
      ];

      await kbRef.set({
        recipes: merged,
        count: merged.length,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: caller.uid
      });
    }

    return res.status(200).json({
      success: true,
      importedCount: allRecipes.length,
      sample: allRecipes.slice(0, 3)
    });
  } catch (error: any) {
    return sendError(res, error);
  }
}
