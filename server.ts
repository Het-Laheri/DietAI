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
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: params.userPrompt,
      config: {
        systemInstruction: params.systemInstruction,
        ...(params.jsonMode ? { responseMimeType: 'application/json' } : {})
      }
    });
    return response.text || '';
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

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
        ? messages.map(m => typeof m === 'string' ? m : (m.content || m.text || JSON.stringify(m))).join('\n')
        : String(messages);

      const text = await generateAIResponse({
        systemInstruction,
        userPrompt: userText
      });

      res.json({ text });
    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ error: 'Failed to process chat' });
    }
  });

  // Food Scanner Mock/Demo
  app.post('/api/ai/scan-food', async (req, res) => {
    try {
      // In a real app, we'd send the image to Gemini Vision. 
      // For MVP, we'll return a simulated response based on the image (which we ignore here).
      const mockFoods = [
        { name: '2 Roti + Dal + Sabzi', calories: 450, protein: 15, carbs: 65, fat: 12, fiber: 8, suggestion: 'Good balanced meal.' },
        { name: 'Paneer Tikka (6 pieces)', calories: 320, protein: 18, carbs: 8, fat: 22, fiber: 2, suggestion: 'High protein, but watch the fat content.' },
        { name: 'Idli (3) + Sambar', calories: 280, protein: 8, carbs: 55, fat: 4, fiber: 5, suggestion: 'Good carbs, relatively low protein vs. your target.' }
      ];
      const result = mockFoods[Math.floor(Math.random() * mockFoods.length)];
      res.json({ 
        detectedFoods: [result.name],
        nutrition: {
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber
        },
        insight: result.suggestion
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to scan food' });
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

  // Detector for IFCT / ICMR Clinical Nutritional Analysis Spreadsheets (Food Details + Nutritive Value Details format)
  function isClinicalNutritionSheet(rows: any[], sheetName: string): boolean {
    if (!rows || rows.length === 0) return false;
    const sampleStr = JSON.stringify(rows.slice(0, 20)).toLowerCase();
    return (
      sampleStr.includes('food details') ||
      sampleStr.includes('nutritive value details') ||
      sampleStr.includes('edible portion') ||
      (sampleStr.includes('energy [kcal]') || sampleStr.includes('carbohydrates [gms]'))
    );
  }

  // Parser for Single-Dish ICMR/IFCT Clinical Nutritional Analysis Spreadsheets
  function parseClinicalNutritionSheet(rows: any[], sheetName: string, fileName: string): any {
    const cleanFileName = fileName
      ? fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim()
      : '';
    const dishName = (cleanFileName && cleanFileName !== 'Uploaded Spreadsheet' && cleanFileName !== 'Uploaded Excel')
      ? cleanFileName
      : (sheetName && !sheetName.toLowerCase().includes('sheet') ? sheetName : 'Clinical Recipe Dish');

    const ingredients: string[] = [];
    let calories = 0;
    let carbs = 0;
    let protein = 0;
    let fat = 0;

    rows.forEach(row => {
      // Extract Ingredient
      const foodItemName = findRowValue(row, ['food item name', 'food item', 'item name', 'ingredient']);
      const measureDetail = findRowValue(row, ['net grams', 'measure detail', 'measure', 'portion', 'grams']);

      if (foodItemName && !String(foodItemName).toLowerCase().includes('food item') && !String(foodItemName).toLowerCase().includes('s.no')) {
        const itemClean = String(foodItemName).trim();
        const portionClean = measureDetail ? ` (${String(measureDetail).replace(/Weight of Edible Portion = /g, '').trim()})` : '';
        ingredients.push(`${itemClean}${portionClean}`);
      }

      // Check for summary "Total:" row in Nutritive Value Details
      const isTotalRow = Object.values(row).some(v => String(v).toLowerCase().trim().startsWith('total'));
      if (isTotalRow) {
        calories = Number(findRowValue(row, ['energy', 'kcal', 'calories', 'cal']) || 0);
        carbs = Number(findRowValue(row, ['carbohydrates', 'carbs', 'cho']) || 0);
        protein = Number(findRowValue(row, ['protein', 'prot']) || 0);
        fat = Number(findRowValue(row, ['fat', 'fats']) || 0);
      }
    });

    // If total row was not found, sum ingredient nutrition
    if (calories === 0) {
      rows.forEach(row => {
        const c = Number(findRowValue(row, ['energy', 'kcal', 'calories']) || 0);
        const p = Number(findRowValue(row, ['protein', 'prot']) || 0);
        const cb = Number(findRowValue(row, ['carbohydrates', 'carbs']) || 0);
        const f = Number(findRowValue(row, ['fat']) || 0);
        calories += c;
        protein += p;
        carbs += cb;
        fat += f;
      });
    }

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
      calories: Math.round(calories * 100) / 100 || 150,
      protein: Math.round(protein * 100) / 100 || 5,
      carbs: Math.round(carbs * 100) / 100 || 20,
      fat: Math.round(fat * 100) / 100 || 3,
      ingredients: ingredients.length > 0 ? ingredients : [`Fresh ingredients for ${dishName}`],
      recipe: [
        `Combine all measured ingredients (${ingredients.slice(0, 3).join(', ')}...).`,
        `Heat cooking oil and sauté aromatics until golden brown.`,
        `Add remaining ingredients and cook on medium heat until tender.`
      ],
      prepTime: '15 mins',
      cookTime: '20 mins',
      clinicalFocus: 'IFCT Clinical Analysis',
      sourceFileName: fileName || 'Clinical_Analysis.xlsx',
      sheetName: sheetName || 'Food Details'
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
        const buffer = Buffer.from(base64File.replace(/^data:.*;base64,/, ''), 'base64');
        workbook = XLSX.read(buffer, { type: 'buffer' });
      } else if (fileData) {
        workbook = XLSX.read(fileData, { type: 'string' });
      } else {
        return res.status(400).json({ error: 'No Excel file content provided' });
      }

      const allRecipes: any[] = [];
      const sourceFileName = fileName || 'Uploaded_Spreadsheet.xlsx';

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) continue;

        // Check if this sheet is an IFCT / ICMR Single-Dish Clinical Nutritional Analysis format
        if (isClinicalNutritionSheet(rows, sheetName)) {
          console.log(`🥗 Detected ICMR/IFCT Clinical Nutrition Analysis Sheet: "${sheetName}" in file "${sourceFileName}"`);
          const clinicalRecipe = parseClinicalNutritionSheet(rows, sheetName, sourceFileName);
          allRecipes.push(clinicalRecipe);
          continue;
        }

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