import 'dotenv/config';
import express from 'express';
import path from 'path';
import http from 'http';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  healthCheck, 
  sendTextMessage, 
  sendTemplateMessage, 
  sendImageMessage, 
  downloadMedia, 
  normalizeWhatsAppNumber,
  getWhatsAppConfig
} from './whatsapp-service';
import { 
  findPatientByWhatsAppNumber, 
  createOrUpdateWhatsAppConversation, 
  saveWhatsAppMessage, 
  submitQuery, 
  createNotification,
  getPatientProfile,
  getMealPlans,
  getAllFoodLogsForPatient,
  saveRecipesToDB,
  getStoredRecipesFromDB,
  clearRecipeDB
} from './src/services/db';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'knowledge_base.json');

function getStoredKnowledge(): any[] {
  try {
    if (fs.existsSync(KNOWLEDGE_BASE_PATH)) {
      const data = fs.readFileSync(KNOWLEDGE_BASE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading knowledge base:', err);
  }
  return [];
}

function saveStoredKnowledge(recipes: any[]) {
  try {
    fs.writeFileSync(KNOWLEDGE_BASE_PATH, JSON.stringify(recipes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving knowledge base:', err);
  }
}

// Unified AI Completion Handler (Supports Open WebUI, Ollama, OpenAI API & Gemini)
async function generateAIResponse(params: {
  systemInstruction?: string;
  userPrompt: string;
  jsonMode?: boolean;
}): Promise<string> {
  const openWebUIUrl = process.env.OPEN_WEBUI_URL || process.env.OPENAI_API_BASE;
  const openWebUIKey = process.env.OPEN_WEBUI_API_KEY || process.env.OPENAI_API_KEY || '';
  const modelName = process.env.OPEN_WEBUI_MODEL || 'llama3:latest';

  // 1. If Open WebUI / Self-Hosted OpenAI-Compatible API is configured
  if (openWebUIUrl) {
    try {
      const endpoint = openWebUIUrl.endsWith('/chat/completions') 
        ? openWebUIUrl 
        : `${openWebUIUrl.replace(/\/$/, '')}/chat/completions`;

      const messages = [];
      if (params.systemInstruction) {
        messages.push({ role: 'system', content: params.systemInstruction });
      }
      messages.push({ role: 'user', content: params.userPrompt });

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (openWebUIKey) {
        headers['Authorization'] = `Bearer ${openWebUIKey}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.7,
          ...(params.jsonMode ? { response_format: { type: 'json_object' } } : {})
        })
      });

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      console.error('Open WebUI API request error, falling back:', err);
    }
  }

  // 2. Fallback to Gemini API if configured
  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  const aiClient = new GoogleGenAI({ apiKey: geminiKey });
  const modelsToTry = [
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview',
    'gemini-2.5-flash'
  ].filter(Boolean) as string[];

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: params.userPrompt,
        config: {
          systemInstruction: params.systemInstruction,
          ...(params.jsonMode ? { responseMimeType: 'application/json' } : {})
        }
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (error: any) {
      console.warn(`Gemini text generation with model "${modelName}" failed:`, error.message || error);
      lastError = error;
    }
  }

  throw lastError || new Error('All Gemini text models failed to generate response');
}

// Multimodal Gemini AI Vision Analysis Handler (Image + User Prompt + Context)
async function generateMultimodalAIResponse(params: {
  systemInstruction?: string;
  userPrompt: string;
  base64Data?: string;
  mimeType?: string;
}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  const aiClient = new GoogleGenAI({ apiKey: geminiKey });
  const modelsToTry = [
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview',
    'gemini-2.5-flash'
  ].filter(Boolean) as string[];

  const contents: any[] = [];

  if (params.base64Data) {
    // Strip data URL metadata prefix (e.g. data:image/jpeg;base64,)
    const cleanBase64 = params.base64Data.replace(/^data:[^;]+;base64,/, '');
    contents.push({
      inlineData: {
        mimeType: params.mimeType || 'image/jpeg',
        data: cleanBase64
      }
    });
  }

  contents.push(params.userPrompt);

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json'
        }
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Gemini multimodal attempt with model "${modelName}" failed:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini multimodal models failed to process image');
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // AI Meal Plan Generator
  app.post('/api/ai/meal-plan', async (req, res) => {
    try {
      const { patientProfile, instructions, targets } = req.body;
      
      // Fetch knowledge base recipes from Firestore DB matching patient preferences
      let knowledgeBase = await getStoredRecipesFromDB(patientProfile?.dietaryType);
      if (knowledgeBase.length === 0) {
        knowledgeBase = getStoredKnowledge();
      }

      const knowledgeContext = knowledgeBase.length > 0 
        ? `\n\nIMPORTED EXCEL CLINICAL RECIPE KNOWLEDGE BASE DATABASE (STRICTLY PREFER & ADAPT THESE EXACT RECIPES AND INGREDIENTS):\n${JSON.stringify(knowledgeBase.slice(0, 50))}`
        : '';

      const prompt = `You are an expert clinical dietician. Generate a 7-day meal plan for a patient with the following profile:
Profile: ${JSON.stringify(patientProfile)}
Calorie & Macro Targets: ${JSON.stringify(targets)}
Additional Instructions: ${instructions || 'None'}
${knowledgeContext}

Return ONLY a valid JSON array of 7 objects. Each meal MUST include complete ingredients list with exact measurements, step-by-step preparation recipe instructions, prepTime, and cookTime.

JSON Schema format:
[
  {
    "dayNumber": 1,
    "meals": [
      {
        "type": "Breakfast",
        "name": "Food Name",
        "portion": "1 bowl",
        "calories": 300,
        "protein": 15,
        "carbs": 40,
        "fat": 10,
        "prepTime": "10 mins",
        "cookTime": "15 mins",
        "ingredients": [
          "1 cup Oats",
          "200ml Skimmed Milk",
          "1 tbsp Chia Seeds",
          "1/2 sliced Banana"
        ],
        "recipe": [
          "Boil milk in a small saucepan over medium heat.",
          "Add oats and chia seeds, stirring continuously for 5 minutes.",
          "Pour into a bowl and top with fresh banana slices."
        ],
        "notes": "Rich in soluble fiber and sustained energy"
      }
    ]
  }
]`;

      const text = await generateAIResponse({
        systemInstruction: 'You are an expert clinical dietician. Respond with valid JSON array only.',
        userPrompt: prompt,
        jsonMode: true
      });

      // Clean JSON formatting if model wraps in codeblocks
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      res.json(JSON.parse(cleaned));
    } catch (error) {
      console.error('Error generating meal plan:', error);
      res.status(500).json({ error: 'Failed to generate meal plan' });
    }
  });

  // AI Assistant (Dietician & Patient)
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { messages, context, role } = req.body;
      const systemInstruction = role === 'dietician' 
        ? `You are an AI assistant for a clinical dietician. Use the provided patient context to answer questions accurately. Context: ${JSON.stringify(context)}`
        : `You are an AI nutrition assistant for a patient. Provide helpful guidance based on their current plan and logs. Do NOT prescribe medical advice or change their plan; direct them to their dietician for major changes. Context: ${JSON.stringify(context)}`;

      const userText = Array.isArray(messages) 
        ? messages.map(m => {
            if (typeof m === 'string') return m;
            if (m.parts && Array.isArray(m.parts) && m.parts[0]?.text) return `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.parts[0].text}`;
            if (m.text) return `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`;
            if (m.content) return `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`;
            return JSON.stringify(m);
          }).join('\n')
        : String(messages);

      const text = await generateAIResponse({
        systemInstruction,
        userPrompt: userText
      });

      res.json({ text });
    } catch (error: any) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ error: error.message || 'Failed to process chat' });
    }
  });

  // Gemini Multimodal AI Food Scanner
  app.post('/api/ai/scan-food', async (req, res) => {
    try {
      const { image, mimeType, userNotes, patientProfile } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      const patientContext = patientProfile ? `
Patient Clinical Profile:
- Name: ${patientProfile.name || 'Patient'}
- Dietary Type: ${patientProfile.dietaryType || 'Standard'}
- Health Goals: ${patientProfile.goals?.join(', ') || 'General Health'}
- Health Conditions: ${patientProfile.healthInfo?.conditions || 'None'}
- Allergies: ${patientProfile.healthInfo?.allergies || 'None'}
` : '';

      const userNotesText = userNotes && typeof userNotes === 'string' && userNotes.trim()
        ? `\nPatient's Extra Preparation Notes & Context:\n"${userNotes.trim()}"\n(CRITICAL REQUIREMENT: Strictly incorporate any cooking oils, butter, extra ingredients, specific quantities, or protein powders described in these notes into your calculation.)`
        : '';

      const prompt = `You are an expert clinical dietician and precision nutrition analyst.
Carefully examine the uploaded food image to recognize all food and drink items on the plate.
${patientContext}${userNotesText}

Requirements:
1. Identify all distinct food items visible or specified in the notes.
2. If the user provided additional notes (e.g. "cooked in 1 tbsp olive oil", "2 rotis", "home made dal", "added 1 scoop whey"), calculate portions and macros accordingly.
3. For EACH detected food item, provide:
   - name: Clear descriptive item name (e.g. "Whole Wheat Roti", "Yellow Moong Dal", "Paneer Sabzi", "Steamed Basmati Rice")
   - portion: Estimated portion / quantity with weight or volume (e.g. "2 medium rotis (80g)", "1 medium bowl (180g)", "1 cup (150g)")
   - calories: Estimated calories in kcal (integer)
   - protein: Estimated protein in grams (number)
   - carbs: Estimated carbs in grams (number)
   - fat: Estimated total fat in grams (number)
   - fiber: Estimated dietary fiber in grams (number)
   - notes: Short dietary observation (e.g. "Good source of complex carbs", "Cooked with light oil")
4. Sum all items accurately for the meal totals:
   - total calories, total protein, total carbs, total fat, total fiber.
5. Suggest the meal type: "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Evening Snack".
6. Provide a concise, clinical, supportive 2-sentence feedback insight on the nutritional quality, balance, and satiety of this meal.

Return ONLY a valid JSON object matching this exact structure:
{
  "detectedFoods": ["Roti", "Moong Dal", "Mixed Veg Sabzi"],
  "items": [
    {
      "name": "Whole Wheat Roti",
      "portion": "2 pieces (80g)",
      "calories": 160,
      "protein": 6,
      "carbs": 32,
      "fat": 1,
      "fiber": 4,
      "notes": "Complex carbohydrate staple"
    }
  ],
  "nutrition": {
    "calories": 450,
    "protein": 18,
    "carbs": 64,
    "fat": 12,
    "fiber": 8
  },
  "suggestedMealType": "Lunch",
  "insight": "High fiber and balanced complex carbohydrates supporting steady digestion and sustained energy.",
  "healthScore": "Balanced"
}`;

      const systemInstruction = 'You are NutriSnap AI Clinical Nutritionist. Always return strictly valid JSON with exact numerical macro values without markdown code block ticks.';

      const jsonText = await generateMultimodalAIResponse({
        systemInstruction,
        userPrompt: prompt,
        base64Data: image,
        mimeType: mimeType || 'image/jpeg'
      });

      let parsed: any;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseErr) {
        const cleaned = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/```\n?$/i, '').trim();
        parsed = JSON.parse(cleaned);
      }

      // Ensure fallback / sanitized data structure
      if (!parsed.items || !Array.isArray(parsed.items)) {
        parsed.items = (parsed.detectedFoods || ['Meal Item']).map((foodName: string) => ({
          name: foodName,
          portion: '1 serving',
          calories: parsed.nutrition?.calories || 300,
          protein: parsed.nutrition?.protein || 10,
          carbs: parsed.nutrition?.carbs || 40,
          fat: parsed.nutrition?.fat || 8,
          fiber: parsed.nutrition?.fiber || 4,
          notes: 'Detected meal component'
        }));
      }

      if (!parsed.detectedFoods) {
        parsed.detectedFoods = parsed.items.map((i: any) => i.name);
      }

      if (parsed.nutrition) {
        parsed.nutrition.calories = Math.round(Number(parsed.nutrition.calories) || 0);
        parsed.nutrition.protein = Math.round(Number(parsed.nutrition.protein) || 0);
        parsed.nutrition.carbs = Math.round(Number(parsed.nutrition.carbs) || 0);
        parsed.nutrition.fat = Math.round(Number(parsed.nutrition.fat) || 0);
        parsed.nutrition.fiber = Math.round(Number(parsed.nutrition.fiber) || 0);
      }

      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/ai/scan-food:', error);
      res.status(500).json({ 
        error: 'Failed to analyze food image with Gemini AI',
        details: error.message || String(error)
      });
    }
  });

  // Helper to find row values case-insensitively by keyword list
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

  // Detector and Parser for ICMR/IFCT Clinical Nutritional Analysis Spreadsheets (Excel 97-2003 & XLSX)
  function parseClinicalNutritionSheetFromMatrix(rawMatrix: any[][], sheetName: string, fileName: string): any {
    const cleanFileName = fileName
      ? fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim()
      : '';

    // 1. Scan top 5 rows for explicit Dish/Recipe Title
    let topTitle = '';
    for (let i = 0; i < Math.min(5, rawMatrix.length); i++) {
      const rowStr = (rawMatrix[i] || []).map(v => String(v).trim()).filter(Boolean).join(' ');
      if (rowStr && !rowStr.toLowerCase().includes('food details') && !rowStr.toLowerCase().includes('s.no') && !rowStr.toLowerCase().includes('nutritive')) {
        topTitle = rowStr;
        break;
      }
    }

    const dishName = topTitle || (sheetName && !sheetName.toLowerCase().startsWith('sheet') ? sheetName : cleanFileName || 'Clinical Recipe Dish');

    const ingredientsSet = new Set<string>();
    let calories = 0;
    let carbs = 0;
    let protein = 0;
    let fat = 0;

    let inNutritiveSection = false;

    // 2. Iterate matrix rows with section tracking
    rawMatrix.forEach(rowArr => {
      if (!rowArr || rowArr.length === 0) return;
      const rowStr = rowArr.map(v => String(v).trim()).join(' ').toLowerCase();

      if (rowStr.includes('nutritive value')) {
        inNutritiveSection = true;
      }

      // If in Nutritive section and row starts with Total
      if (rowStr.startsWith('total') || rowStr.includes('total:')) {
        const numbers = rowArr
          .map(v => String(v).replace(/[^0-9.]/g, '').trim())
          .filter(Boolean)
          .map(v => parseFloat(v))
          .filter(n => !isNaN(n) && n > 0);

        if (numbers.length >= 4) {
          calories = numbers[0];
          carbs = numbers[1];
          protein = numbers[2];
          fat = numbers[3];
        } else if (numbers.length >= 1 && calories === 0) {
          calories = numbers[0];
        }
      }

      // If NOT in nutritive section yet, collect ingredients from Food Details table
      if (!inNutritiveSection) {
        const firstCell = String(rowArr[0] || '').trim();
        const secondCell = String(rowArr[1] || '').trim();
        const firstNum = parseInt(firstCell);

        if ((!isNaN(firstNum) && firstNum > 0) || (firstCell && secondCell && !firstCell.toLowerCase().includes('s.no') && !firstCell.toLowerCase().includes('food details'))) {
          const itemName = secondCell && isNaN(parseInt(secondCell)) ? secondCell : firstCell;
          const measure = String(rowArr[6] || rowArr[5] || rowArr[4] || rowArr[3] || '').replace(/Weight of Edible Portion = /gi, '').trim();
          
          if (itemName && !itemName.toLowerCase().includes('food item') && !itemName.toLowerCase().includes('food details') && !itemName.toLowerCase().includes('s.no')) {
            const ingText = measure ? `${itemName} (${measure})` : itemName;
            ingredientsSet.add(ingText);
          }
        }
      }
    });

    const ingredients = Array.from(ingredientsSet);

    let dietaryType = 'Vegetarian';
    const allIngStr = ingredients.join(' ').toLowerCase();
    if (allIngStr.includes('chicken') || allIngStr.includes('fish') || allIngStr.includes('mutton') || allIngStr.includes('beef') || allIngStr.includes('pork')) {
      dietaryType = 'Non-Vegetarian';
    } else if (allIngStr.includes('egg')) {
      dietaryType = 'Eggetarian';
    }

    return {
      name: dishName,
      dietaryType,
      calories: Math.round(calories * 100) / 100 || 180,
      protein: Math.round(protein * 100) / 100 || 8,
      carbs: Math.round(carbs * 100) / 100 || 25,
      fat: Math.round(fat * 100) / 100 || 5,
      ingredients: ingredients.length > 0 ? ingredients : [`Fresh ingredients for ${dishName}`],
      recipe: [
        `Prepare all measured ingredients: ${ingredients.slice(0, 3).join(', ')}...`,
        `Heat cooking oil and sauté aromatics until fragrant.`,
        `Add main ingredients and cook on medium heat until tender.`
      ],
      prepTime: '15 mins',
      cookTime: '20 mins',
      clinicalFocus: 'IFCT Clinical Analysis',
      sourceFileName: fileName || 'Clinical_Analysis.xls',
      sheetName: sheetName || 'Sheet1'
    };
  }

  // Smart Row Normalizer for Excel files
  function normalizeExcelRow(row: any, sheetName: string, fileName: string, rowIndex: number): any {
    // 1. Extract Name
    let rawName = findRowValue(row, [
      'meal name', 'recipe name', 'dish name', 'food item', 'item name', 
      'dish', 'recipe', 'meal', 'item', 'food', 'name', 'title', 'menu'
    ]);

    // Fallback if name is missing: pick first non-numeric text column with length > 2
    if (!rawName) {
      for (const [key, val] of Object.entries(row)) {
        if (typeof val === 'string' && val.trim().length > 2 && !['day', 'time', 'type', 'sn'].includes(key.toLowerCase())) {
          rawName = val.trim();
          break;
        }
      }
    }

    // Final fallback: combine Sheet Name & Index
    const name = rawName ? String(rawName).trim() : `${sheetName} Recipe #${rowIndex + 1}`;

    // 2. Extract Dietary Type
    let dietaryType = findRowValue(row, ['dietary type', 'diet type', 'diet', 'veg/non-veg', 'category', 'type']) || 'Vegetarian';
    const nameAndIng = (name + ' ' + (row['Ingredients'] || '')).toLowerCase();
    if (nameAndIng.includes('chicken') || nameAndIng.includes('fish') || nameAndIng.includes('mutton') || nameAndIng.includes('beef') || nameAndIng.includes('pork')) {
      dietaryType = 'Non-Vegetarian';
    } else if (nameAndIng.includes('egg')) {
      dietaryType = 'Eggetarian';
    }

    // 3. Extract Macros & Calories
    const calories = Number(findRowValue(row, ['calorie', 'kcal', 'energy', 'cal']) || 300);
    const protein = Number(findRowValue(row, ['protein', 'prot', 'p(g)']) || 15);
    const carbs = Number(findRowValue(row, ['carbohydrate', 'carb', 'cho', 'c(g)']) || 40);
    const fat = Number(findRowValue(row, ['fat', 'f(g)']) || 10);

    // 4. Extract Ingredients
    const rawIng = findRowValue(row, ['ingredient', 'items needed', 'composition', 'raw ingredients']);
    const ingredients = rawIng 
      ? String(rawIng).split(/;|\n|,/).map((i: string) => i.trim()).filter(Boolean)
      : [`1 portion of ${name}`];

    // 5. Extract Recipe Steps
    const rawRecipe = findRowValue(row, ['preparation', 'recipe', 'method', 'instruction', 'step', 'how to prepare']);
    const recipe = rawRecipe
      ? String(rawRecipe).split(/;|\n|\. /).map((s: string) => s.trim()).filter(Boolean)
      : [`Prepare ${name} according to standard portion sizes. Serve warm with water.`];

    const prepTime = String(findRowValue(row, ['prep time', 'preptime']) || '10 mins');
    const cookTime = String(findRowValue(row, ['cook time', 'cooktime']) || '15 mins');
    const clinicalFocus = String(findRowValue(row, ['clinical focus', 'health goal', 'focus', 'tag']) || 'General Wellness');

    return {
      name,
      dietaryType,
      calories,
      protein,
      carbs,
      fat,
      ingredients,
      recipe,
      prepTime,
      cookTime,
      clinicalFocus,
      sourceFileName: fileName || 'Uploaded_Excel.xlsx',
      sheetName: sheetName || 'Sheet1'
    };
  }

  // Excel Knowledge Base Import Route (.xlsx / .csv)
  app.post('/api/knowledge/import-excel', async (req, res) => {
    try {
      const { base64File, fileData, fileName } = req.body;
      let workbook: XLSX.WorkBook;

      if (base64File) {
        const base64Clean = base64File.replace(/^data:.*;base64,/, '');
        const buffer = Buffer.from(base64Clean, 'base64');
        try {
          // Supports .xlsx, .xlsm, .csv, .xls (Excel 97-2003)
          workbook = XLSX.read(buffer, { type: 'buffer', raw: true });
        } catch (e1) {
          try {
            workbook = XLSX.read(base64Clean, { type: 'base64', raw: true });
          } catch (e2) {
            workbook = XLSX.read(buffer.toString('binary'), { type: 'binary' });
          }
        }
      } else if (fileData) {
        workbook = XLSX.read(fileData, { type: 'string' });
      } else {
        return res.status(400).json({ error: 'No Excel file content provided' });
      }

      const allRecipes: any[] = [];
      const sourceFileName = fileName || 'Uploaded_Spreadsheet.xlsx';

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        
        // 1. Extract 2D matrix to test for ICMR/IFCT Clinical Analysis Format
        const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!rawMatrix || rawMatrix.length === 0) continue;

        const fullText = rawMatrix.map(r => r.join(' ')).join('\n').toLowerCase();
        const isClinicalFormat = 
          fullText.includes('food details') || 
          fullText.includes('nutritive value') || 
          fullText.includes('edible portion') || 
          fullText.includes('food code') ||
          (fullText.includes('energy [kcal]') || fullText.includes('carbohydrates [gms]'));

        if (isClinicalFormat) {
          console.log(`🥗 Processing ICMR/IFCT Clinical Single-Dish Sheet: "${sheetName}" in file "${sourceFileName}"`);
          const clinicalRecipe = parseClinicalNutritionSheetFromMatrix(rawMatrix, sheetName, sourceFileName);
          allRecipes.push(clinicalRecipe);
          continue;
        }

        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        if (!rows || rows.length === 0) continue;

        let sheetRecipes: any[] = [];
        let genericCount = 0;

        // Normalize each row
        rows.forEach((row, idx) => {
          const recipe = normalizeExcelRow(row, sheetName, sourceFileName, idx);
          if (recipe.name.includes('Recipe #') || recipe.name === 'Custom Meal') {
            genericCount++;
          }
          sheetRecipes.push(recipe);
        });

        // AI Fallback Parser if >40% of rows produced generic names (e.g. matrix/grid layout)
        if (genericCount / Math.max(rows.length, 1) > 0.4 && rows.length > 0) {
          try {
            console.log(`🤖 Using AI Fallback Parser for matrix layout sheet: "${sheetName}"`);
            const aiPrompt = `You are a clinical Excel spreadsheet parser. Extract all distinct recipes/meals from this raw sheet data:
Sheet Name: "${sheetName}"
Raw Data: ${JSON.stringify(rows.slice(0, 40))}

Return ONLY a valid JSON array of objects with schema:
[
  {
    "name": "Distinct Meal/Dish Name",
    "dietaryType": "Vegetarian",
    "calories": 350,
    "protein": 15,
    "carbs": 40,
    "fat": 10,
    "ingredients": ["ingredient 1"],
    "recipe": ["step 1"],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "clinicalFocus": "General Wellness"
  }
]`;

            const aiText = await generateAIResponse({
              systemInstruction: 'Respond with valid JSON array only.',
              userPrompt: aiPrompt,
              jsonMode: true
            });

            const cleanedAI = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedAI = JSON.parse(cleanedAI);

            if (Array.isArray(parsedAI) && parsedAI.length > 0) {
              sheetRecipes = parsedAI.map(r => ({
                ...r,
                sourceFileName,
                sheetName
              }));
            }
          } catch (aiErr) {
            console.warn('AI Fallback Parser encountered error, retaining normalized rows:', aiErr);
          }
        }

        allRecipes.push(...sheetRecipes);
      }

      const existing = getStoredKnowledge();
      const updated = [...existing, ...allRecipes];
      saveStoredKnowledge(updated);

      // Save to Firestore Cloud Database
      await saveRecipesToDB(allRecipes).catch(e => console.error('Failed to save to Firestore DB:', e));

      res.json({
        success: true,
        importedCount: allRecipes.length,
        totalKnowledgeCount: updated.length,
        sample: allRecipes.slice(0, 3)
      });
    } catch (error: any) {
      console.error('Error parsing Excel file:', error);
      res.status(500).json({ error: 'Failed to process Excel file', details: error.message });
    }
  });

  // Get Ingested Excel Knowledge Base Stats & Recipe List from Database
  app.get('/api/knowledge/list', async (req, res) => {
    try {
      let recipes = await getStoredRecipesFromDB();
      if (recipes.length === 0) {
        recipes = getStoredKnowledge();
      }
      res.json({
        count: recipes.length,
        recipes: recipes,
        sample: recipes.slice(0, 10)
      });
    } catch (e) {
      const knowledge = getStoredKnowledge();
      res.json({ count: knowledge.length, sample: knowledge.slice(0, 10), recipes: knowledge });
    }
  });

  // Clear Ingested Excel Knowledge Base
  app.delete('/api/knowledge/clear', async (req, res) => {
    try {
      saveStoredKnowledge([]);
      await clearRecipeDB().catch(e => console.error('Error clearing Firestore DB:', e));
      res.json({ success: true, message: 'Knowledge base database cleared' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to clear knowledge base' });
    }
  });

  // ─── META WHATSAPP CLOUD API INTEGRATION ────────────────────────────────────

  // 1. Meta Webhook Verification Handshake
  app.get('/api/whatsapp/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const config = getWhatsAppConfig();

    if (mode === 'subscribe' && token === config.verifyToken) {
      console.log('✅ Meta WhatsApp Webhook Verified Successfully!');
      res.status(200).send(challenge);
    } else {
      console.warn('⚠️ Webhook verification failed. Token mismatch or missing mode.');
      res.sendStatus(403);
    }
  });

  // 2. Meta WhatsApp Incoming Webhook Processor
  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      // Return 200 immediately to Meta so webhooks are acknowledged
      res.status(200).json({ status: 'received' });

      const body = req.body;
      if (!body.entry || !body.entry[0]?.changes[0]?.value?.messages) {
        return; // Ignore status notifications (delivered/read) or empty events
      }

      const value = body.entry[0].changes[0].value;
      const msg = value.messages[0];
      const contact = value.contacts?.[0];
      
      const whatsappMessageId = msg.id;
      const rawFrom = msg.from;
      const fromNumber = normalizeWhatsAppNumber(rawFrom);
      const senderName = contact?.profile?.name || 'WhatsApp Patient';
      const msgType = (msg.type || 'text').toUpperCase() as any;

      let messageText = '';
      let mediaId: string | undefined;
      let mediaMimeType: string | undefined;
      let mediaUrl: string | undefined;

      if (msg.type === 'text') {
        messageText = msg.text?.body || '';
      } else if (msg.type === 'image') {
        messageText = msg.image?.caption || '📸 Food/Photo Received';
        mediaId = msg.image?.id;
        mediaMimeType = msg.image?.mime_type;

        // Download photo securely from Meta
        if (mediaId) {
          const downloaded = await downloadMedia(mediaId);
          if (downloaded.localPath) {
            mediaUrl = downloaded.localPath;
          }
        }
      } else if (msg.type === 'audio' || msg.type === 'voice') {
        messageText = '🎙️ Voice Message Received';
        mediaId = msg.audio?.id || msg.voice?.id;
      } else if (msg.type === 'document') {
        messageText = `📄 Document Received: ${msg.document?.filename || ''}`;
        mediaId = msg.document?.id;
      } else {
        messageText = `Received ${msg.type} attachment`;
      }

      console.log(`📩 Inbound WhatsApp from ${senderName} (${fromNumber}): "${messageText}"`);

      // Match patient in Firestore
      const patient = await findPatientByWhatsAppNumber(fromNumber);
      const patientId = patient?.id;
      const patientName = patient?.name || senderName;

      // Create or update conversation thread
      const conversationId = await createOrUpdateWhatsAppConversation(
        fromNumber,
        patientName,
        patientId,
        messageText,
        true, // increment unread
        patientId ? 'ACTIVE' : 'UNRECOGNIZED'
      );

      // AI Suggested Reply Builder (if patient matched)
      let aiSuggestedReply = '';
      if (patientId && messageText) {
        try {
          const profile = await getPatientProfile(patientId);
          const mealPlans = await getMealPlans(patientId);
          const activePlan = mealPlans[0];

          const contextPrompt = `You are NutriSnap AI clinical assistant. 
Patient: ${patientName}
Goals: ${profile?.goals?.join(', ') || 'General Wellness'}
Diet Type: ${profile?.dietaryType || 'Standard'}
Active Meal Plan Targets: ${activePlan ? JSON.stringify(activePlan.targets) : 'None'}

Patient WhatsApp Question: "${messageText}"

Draft a clinical, empathetic 2-sentence response for the dietician to review and approve.`;

          aiSuggestedReply = await generateAIResponse({
            systemInstruction: 'You are a clinical dietician assistant. Provide short, exact 2-sentence draft replies.',
            userPrompt: contextPrompt
          });
        } catch (aiErr) {
          console.error('Failed to generate AI suggestion for WhatsApp:', aiErr);
        }
      }

      // Save WhatsApp message to Firestore
      await saveWhatsAppMessage({
        patientId,
        conversationId,
        direction: 'INCOMING',
        messageType: msgType,
        whatsappMessageId,
        fromNumber,
        toNumber: value.metadata?.display_phone_number || '',
        body: messageText,
        mediaId,
        mediaUrl,
        mediaMimeType,
        timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
        status: 'RECEIVED',
        aiSuggestedReply
      });

      // Submit to Query Inbox for Dietician
      await submitQuery({
        patientId: patientId || `unrecognized_${fromNumber}`,
        patientName: patientId ? patientName : `Unrecognized (+${fromNumber})`,
        whatsappNumber: fromNumber,
        question: messageText,
        source: 'whatsapp',
        status: 'pending',
        date: new Date().toISOString().split('T')[0]
      });

      // Notify Dietician Dashboard
      await createNotification({
        type: 'WHATSAPP_MESSAGE',
        patientId,
        patientName,
        message: `New WhatsApp message from ${patientName}: "${messageText.slice(0, 50)}..."`,
        read: false
      });

      // Send automated receipt acknowledgment (Non-medical operational confirmation)
      await sendTextMessage(
        fromNumber,
        `Hello ${patientName}! Your message has been received by NutriSnap. Your dietician will review and reply shortly.`
      ).catch(e => console.error('Auto-ack send error:', e));

    } catch (error) {
      console.error('WhatsApp Inbound Webhook Error:', error);
    }
  });

  // 3. Outgoing Message Endpoint (Dietician Response Dispatcher)
  app.post('/api/whatsapp/send-reply', async (req, res) => {
    try {
      const { whatsappNumber, replyText, patientName, conversationId, patientId } = req.body;
      if (!whatsappNumber || !replyText) {
        return res.status(400).json({ error: 'Missing whatsappNumber or replyText' });
      }

      const cleanPhone = normalizeWhatsAppNumber(whatsappNumber);
      console.log(`📤 Sending WhatsApp reply to ${patientName || cleanPhone} (${cleanPhone}): ${replyText}`);

      // Call Meta WhatsApp Cloud API
      const result = await sendTextMessage(cleanPhone, replyText);

      // Create conversation if not provided
      const convId = conversationId || await createOrUpdateWhatsAppConversation(
        cleanPhone,
        patientName || 'Patient',
        patientId,
        replyText,
        false
      );

      // Save outgoing message to Firestore
      if (result.success && result.messageId) {
        await saveWhatsAppMessage({
          patientId,
          conversationId: convId,
          direction: 'OUTGOING',
          messageType: 'TEXT',
          whatsappMessageId: result.messageId,
          fromNumber: 'SYSTEM_BUSINESS',
          toNumber: cleanPhone,
          body: replyText,
          timestamp: new Date().toISOString(),
          status: 'SENT'
        });
      }

      res.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        method: result.success ? 'meta_cloud_api' : 'failed'
      });
    } catch (error: any) {
      console.error('Error in /api/whatsapp/send-reply:', error);
      res.status(500).json({ error: 'Failed to send WhatsApp message', details: error.message });
    }
  });

  // 4. Send Meta Approved Template Message
  app.post('/api/whatsapp/send-template', async (req, res) => {
    try {
      const { whatsappNumber, templateName, languageCode, components } = req.body;
      if (!whatsappNumber || !templateName) {
        return res.status(400).json({ error: 'Missing whatsappNumber or templateName' });
      }

      const cleanPhone = normalizeWhatsAppNumber(whatsappNumber);
      const result = await sendTemplateMessage(cleanPhone, templateName, languageCode || 'en_US', components || []);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to send template message', details: error.message });
    }
  });

  // 5. Meta WhatsApp Connection Health Check Endpoint
  app.get('/api/whatsapp/health', async (req, res) => {
    try {
      const status = await healthCheck();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ connected: false, configured: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server } // Attach WebSocket to our HTTP server
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();