const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDjtTL_trmdMEEH-BINiIAZD1ktgZwY0CE';

async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const payload: any = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && typeof text === 'string' && text.trim()) {
          return text.trim();
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`Gemini model ${model} HTTP ${res.status}:`, errText.slice(0, 200));
      }
    } catch (err: any) {
      console.warn(`Gemini model ${model} fetch failed:`, err?.message || err);
    }
  }

  return '';
}

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
Review the patient's exact question and clinical profile, and write a concise (2-3 sentences), personalized, empathetic, and clinically sound answer tailored strictly to what the patient asked.`
      : `You are an AI nutrition assistant for a patient. Provide helpful, empathetic guidance based on their current plan and question.`;

    let userPrompt = '';
    if (Array.isArray(messages)) {
      userPrompt = messages.map(m => {
        if (typeof m === 'string') return m;
        if (m.parts && Array.isArray(m.parts) && m.parts[0]?.text) {
          return m.parts[0].text;
        }
        if (m.text) return m.text;
        if (m.content) return m.content;
        return JSON.stringify(m);
      }).join('\n');
    } else if (typeof messages === 'string') {
      userPrompt = messages;
    } else if (context?.query) {
      userPrompt = `Patient Question: "${context.query}"\nPatient Name: ${context.patientName || 'Patient'}\nDietary Type: ${context.dietaryType || 'Not specified'}`;
    }

    if (!userPrompt.trim()) {
      userPrompt = 'Hello, how can I optimize my nutrition?';
    }

    // Call real Gemini API
    let responseText = await callGeminiApi(userPrompt, systemInstruction);

    // If API quota or network fails, provide smart contextual fallback
    if (!responseText) {
      const q = String(context?.query || userPrompt).toLowerCase();
      if (q.includes('tea') || q.includes('coffee') || q.includes('caffeine')) {
        responseText = "Yes, plain green tea or black coffee (without sugar or heavy creamers) is generally fine between meals. Keep daily intake moderate (1-2 cups) and avoid caffeine close to bedtime or immediately with iron-rich meals.";
      } else if (q.includes('swap') || q.includes('replace') || q.includes('substitute') || q.includes('paneer') || q.includes('tofu')) {
        responseText = "Yes, you can make this substitution! Ensure you match similar portion weights (e.g., 80-100g) to keep your protein and calorie targets consistent with your prescribed meal plan.";
      } else if (q.includes('snack') || q.includes('hungry') || q.includes('evening') || q.includes('4 pm')) {
        responseText = "For balanced satiety without blood sugar spikes, choose roasted chana with cucumber slices, a small handful of unsalted almonds, or a bowl of sprouted moong.";
      } else if (q.includes('fruit') || q.includes('sugar') || q.includes('sweet')) {
        responseText = "Whole fruits like apples, guava, or berries are great options due to their dietary fiber. Avoid fruit juices and have whole fruit between meals rather than late at night.";
      } else {
        responseText = "Thank you for reaching out! Based on your clinical profile, aim for balanced macronutrients, consistent hydration, and mindful portion sizes. Let me know if you experience any digestive changes.";
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
