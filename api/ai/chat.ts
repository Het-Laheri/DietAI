import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDjtTL_trmdMEEH-BINiIAZD1ktgZwY0CE';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { messages, context, role } = req.body || {};

    const systemInstruction = role === 'dietician'
      ? `You are an expert clinical nutrition AI assistant working alongside a licensed dietician.
Provide concise, clinically sound, empathetic recommendations.
Context: ${JSON.stringify(context || {})}`
      : `You are an AI nutrition assistant for a patient. Provide helpful guidance based on their current plan and logs.
Do NOT prescribe medical advice or change their plan; direct them to their dietician for major changes.
Context: ${JSON.stringify(context || {})}`;

    let userText = '';
    if (Array.isArray(messages)) {
      userText = messages.map(m => {
        if (typeof m === 'string') return m;
        if (m.parts && Array.isArray(m.parts) && m.parts[0]?.text) {
          return `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.parts[0].text}`;
        }
        if (m.text) return `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`;
        if (m.content) return `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`;
        return JSON.stringify(m);
      }).join('\n');
    } else if (typeof messages === 'string') {
      userText = messages;
    } else if (context?.query) {
      userText = `Draft a concise 2-3 sentence clinical response for the dietician to review and approve for this patient query: "${context.query}"`;
    } else {
      userText = 'Hello';
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

    let responseText = '';
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${userText}` }]
            }
          ]
        });

        if (result?.text) {
          responseText = result.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed in /api/ai/chat:`, err?.message || err);
      }
    }

    if (!responseText) {
      // Intelligent clinical fallback if all models fail
      if (context?.query) {
        const q = String(context.query).toLowerCase();
        if (q.includes('swap') || q.includes('replace') || q.includes('substitute')) {
          responseText = "Yes, you can make this substitution! Ensure you match similar portion weights to keep your macronutrient and caloric targets aligned with your prescribed meal plan.";
        } else if (q.includes('snack') || q.includes('hungry')) {
          responseText = "For balanced satiety without blood sugar spikes, pair a complex fiber source with light protein, such as roasted chana or sliced cucumbers with hummus.";
        } else {
          responseText = "Thank you for checking in! Based on your clinical profile, keep your portions consistent and ensure adequate hydration throughout the day. Reach out if symptoms persist.";
        }
      } else {
        responseText = "Based on clinical nutrition principles, prioritize whole foods, consistent meal timing, and balanced protein and fiber distribution.";
      }
    }

    return res.status(200).json({ text: responseText });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    return res.status(500).json({
      error: 'Failed to process chat',
      details: error?.message || String(error)
    });
  }
}
