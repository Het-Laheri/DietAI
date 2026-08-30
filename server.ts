import express from 'express';
import path from 'path';
import http from 'http';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

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
      const knowledgeBase = getStoredKnowledge();
      const knowledgeContext = knowledgeBase.length > 0 
        ? `\n\nIMPORTED EXCEL CLINICAL RECIPE KNOWLEDGE BASE (STRICTLY PREFER & ADAPT THESE EXACT RECIPES AND INGREDIENTS):\n${JSON.stringify(knowledgeBase.slice(0, 30))}`
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

  // Excel Knowledge Base Import Route (.xlsx / .csv)
  app.post('/api/knowledge/import-excel', async (req, res) => {
    try {
      const { base64File, fileData } = req.body;
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
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        rows.forEach(row => {
          allRecipes.push({
            name: row['Meal Name'] || row['Name'] || row['Title'] || row['Meal'] || 'Custom Meal',
            dietaryType: row['Dietary Type'] || row['Diet'] || row['Type'] || 'Vegetarian',
            calories: Number(row['Calories'] || row['Kcal'] || 300),
            protein: Number(row['Protein'] || row['Protein(g)'] || 15),
            carbs: Number(row['Carbs'] || row['Carbs(g)'] || 40),
            fat: Number(row['Fat'] || row['Fat(g)'] || 10),
            ingredients: (row['Ingredients'] || row['Ingredient List'] || '').toString().split(/;|\n|,/).map((i: string) => i.trim()).filter(Boolean),
            recipe: (row['Preparation Steps'] || row['Recipe'] || row['Instructions'] || row['Method'] || '').toString().split(/;|\n|\. /).map((s: string) => s.trim()).filter(Boolean),
            prepTime: row['Prep Time'] || row['PrepTime'] || '10 mins',
            cookTime: row['Cook Time'] || row['CookTime'] || '15 mins',
            clinicalFocus: row['Clinical Focus'] || row['Health Goal'] || row['Category'] || 'General Wellness'
          });
        });
      });

      const existing = getStoredKnowledge();
      const updated = [...existing, ...allRecipes];
      saveStoredKnowledge(updated);

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

  // Get Ingested Excel Knowledge Base Stats
  app.get('/api/knowledge/list', (req, res) => {
    const knowledge = getStoredKnowledge();
    res.json({
      count: knowledge.length,
      sample: knowledge.slice(0, 10)
    });
  });

  // WhatsApp Webhook Verification (Meta / Twilio Integration)
  app.get('/api/whatsapp/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'nutrisnap_whatsapp_token';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WhatsApp Webhook Verified!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // WhatsApp Incoming Webhook Route (Meta / Twilio API)
  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      console.log('Received WhatsApp Webhook:', JSON.stringify(req.body));
      // Supports Meta WhatsApp Business API & Twilio Webhook Formats
      const body = req.body;
      let fromNumber = '';
      let messageText = '';
      let senderName = 'WhatsApp Patient';

      if (body.entry && body.entry[0]?.changes[0]?.value?.messages[0]) {
        const msg = body.entry[0].changes[0].value.messages[0];
        fromNumber = msg.from;
        messageText = msg.text?.body || 'Sent an image or attachment';
        senderName = body.entry[0].changes[0].value.contacts[0]?.profile?.name || 'WhatsApp Patient';
      } else if (body.From && body.Body) {
        fromNumber = body.From;
        messageText = body.Body;
        senderName = body.ProfileName || 'WhatsApp Patient';
      }

      res.status(200).json({ 
        status: 'received',
        source: 'whatsapp',
        senderName,
        fromNumber,
        messageText
      });
    } catch (error) {
      console.error('WhatsApp Webhook Error:', error);
      res.status(500).json({ error: 'Failed to process WhatsApp webhook' });
    }
  });
  app.post('/api/whatsapp/send-reply', async (req, res) => {
    try {
      const { whatsappNumber, replyText, patientName, question } = req.body;
      console.log(`Sending WhatsApp reply to ${whatsappNumber} (${patientName}): ${replyText}`);

      const cleanPhone = (whatsappNumber || '').replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(`Hi ${patientName || 'Patient'},\n\nRegarding your query: "${question || ''}"\n\n${replyText}`);
      const directWhatsAppUrl = cleanPhone 
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;

      // If Meta WhatsApp Business API Token exists:
      if (process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_ID && cleanPhone) {
        await fetch(`https://graph.facebook.com/v18.0/${process.env.META_WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: replyText }
          })
        });
      }

      res.json({
        success: true,
        method: process.env.META_WHATSAPP_TOKEN ? 'api_direct' : 'web_link',
        directWhatsAppUrl
      });
    } catch (error) {
      console.error('Error sending WhatsApp reply:', error);
      res.status(500).json({ error: 'Failed to send WhatsApp reply' });
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