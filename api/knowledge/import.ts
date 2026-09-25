import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';

const firebaseConfig = {
  projectId: 'careclarity-e67bb',
  appId: '1:84746597643:web:cce300194b200eb5cbde0e',
  apiKey: 'AIzaSyCuHfs4FyxUCMlAcZyT5tjsKr43BYba99M',
  authDomain: 'careclarity-e67bb.firebaseapp.com',
  storageBucket: 'careclarity-e67bb.firebasestorage.app',
  messagingSenderId: '84746597643',
};

const app = getApps().some(a => a.name === 'admin_knowledge_backend')
  ? getApps().find(a => a.name === 'admin_knowledge_backend')!
  : initializeApp(firebaseConfig, 'admin_knowledge_backend');

const auth = getAuth(app);
const db = initializeFirestore(app, {}, 'ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf');

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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    } else if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf-8')); } catch {}
    }

    const { base64File, fileName } = body || {};
    if (!base64File) {
      return res.status(400).json({ error: 'No file content provided' });
    }

    const base64Clean = base64File.replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    const ext = (fileName || '').split('.').pop()?.toLowerCase();

    const allRecipes: any[] = [];

    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(buffer, { type: 'buffer' });
      } catch {
        workbook = XLSX.read(buffer.toString('binary'), { type: 'binary' });
      }

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
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
      const geminiKey = process.env.GEMINI_API_KEY || 'AIzaSyDjtTL_trmdMEEH-BINiIAZD1ktgZwY0CE';
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
      try {
        if (!auth.currentUser) {
          await signInWithEmailAndPassword(auth, 'admin@aidiet.com', 'Admin123!');
        }
      } catch (authErr) {
        console.warn('Backend auth notice:', authErr);
      }

      const snap = await getDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'));
      let existing: any[] = [];
      if (snap.exists() && Array.isArray(snap.data().recipes)) {
        existing = snap.data().recipes;
      }

      const merged = [
        ...allRecipes,
        ...existing.filter(e => !allRecipes.some(r => r.name.toLowerCase() === e.name.toLowerCase()))
      ];

      await setDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'), {
        recipes: merged,
        count: merged.length,
        updatedAt: serverTimestamp()
      });
    }

    return res.status(200).json({
      success: true,
      importedCount: allRecipes.length,
      sample: allRecipes.slice(0, 3)
    });
  } catch (error: any) {
    console.error('Error in /api/knowledge/import:', error);
    return res.status(500).json({ error: 'Failed to process file', details: error.message });
  }
}
