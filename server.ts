// Local development server (npm run dev / npm start).
// Production runs the Vercel functions in api/ directly; this server mounts the SAME handlers so
// there is one secured implementation of each route. No credentials are embedded here: every
// secret comes from the environment, and every /api route verifies a Firebase ID token.
import 'dotenv/config';
import express from 'express';
import path from 'path';
import http from 'http';
import { GoogleGenAI } from '@google/genai';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { getCaller, getAdminDb, sendError, assertCanAccessPatient, type Caller, type Role } from './api/_lib/security.js';
import createOrderHandler from './api/payment/create-order.js';
import verifyPaymentHandler from './api/payment/verify-payment.js';
import queriesPollHandler from './api/queries/poll.js';
import queriesSubmitHandler from './api/queries/submit.js';
import queriesReplyHandler from './api/queries/reply.js';
import knowledgeListHandler from './api/knowledge/list.js';
import knowledgeImportHandler from './api/knowledge/import.js';
import knowledgeClearHandler from './api/knowledge/clear.js';
import aiChatHandler from './api/ai/chat.js';
import aiMealPlanHandler from './api/ai/meal-plan.js';
import aiScanFoodHandler from './api/ai/scan-food.js';
import changePasswordHandler from './api/auth/change-password.js';
import notificationsVapidKeyHandler from './api/notifications/vapid-key.js';
import notificationsSubscribeHandler from './api/notifications/subscribe.js';
import notificationsRemindersHandler from './api/notifications/reminders.js';
import notificationsProcessRemindersHandler from './api/notifications/process-reminders.js';
import notificationsTestPushHandler from './api/notifications/test-push.js';
import { processDueReminders } from './api/_lib/webPush.js';

// Upstash Redis Initialization
let redis: Redis | null = null;
let aiRateLimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  aiRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
  });
}

// Global Express App Export
const app = express();
export default app;

app.disable('x-powered-by');
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Express middleware: verify the Firebase ID token and (optionally) the caller's role.
function requireApiAuth(roles?: Role[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const caller = await getCaller(req);
      if (roles && !roles.includes(caller.role)) {
        return res.status(403).json({ error: 'Not allowed for this account' });
      }
      (req as any).caller = caller;
      next();
    } catch (err) {
      sendError(res, err);
    }
  };
}

// Upstash rate limiter for AI endpoints, keyed by the authenticated user.
const aiRateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!aiRateLimiter) return next();
  const identifier = (req as any).caller?.uid || req.ip || 'anonymous';
  const { success } = await aiRateLimiter.limit(identifier);
  if (!success) {
    return res.status(429).json({ error: 'Too many AI requests. Please try again later.' });
  }
  next();
};

async function adminGetPatientProfile(patientId: string): Promise<any | null> {
  const snap = await getAdminDb().collection('patient_profiles').doc(patientId).get();
  return snap.exists ? snap.data() : null;
}

async function adminGetMealPlans(patientId: string): Promise<any[]> {
  const snap = await getAdminDb().collection('meal_plans').where('patientId', '==', patientId).get();
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
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
    if (params.userPrompt?.toLowerCase().includes('patient question') || params.systemInstruction?.includes('NutriSnap AI Coach')) {
      return "Based on your clinical nutrition profile, it is recommended to maintain balanced macronutrients, stay hydrated, and space your protein intake across meals. Please follow the meal targets established by your dietician.";
    }
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  const aiClient = new GoogleGenAI({ apiKey: geminiKey });
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    process.env.GEMINI_MODEL
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

  // Graceful fallback for clinical drafts when AI quotas or spikes occur
  if (params.userPrompt?.toLowerCase().includes('patient question') || params.systemInstruction?.includes('NutriSnap AI Coach')) {
    return "Thank you for reaching out! To best support your nutritional goals, ensure you are staying hydrated and spacing your protein intake throughout the day. Please review your customized meal plan for specific portion targets.";
  }

  throw lastError || new Error('All Gemini text models failed to generate response');
}

// ─── Routes shared with production (same handlers as the Vercel functions) ───
type Handler = (req: any, res: any) => any;
const mount = (paths: string[], handler: Handler) => app.all(paths, (req, res) => handler(req, res));
mount(['/api/create-order', '/api/payment/create-order'], createOrderHandler);
mount(['/api/verify-payment', '/api/payment/verify-payment'], verifyPaymentHandler);
mount(['/api/queries/poll'], queriesPollHandler);
mount(['/api/queries/submit'], queriesSubmitHandler);
mount(['/api/queries/reply'], queriesReplyHandler);
mount(['/api/knowledge/list'], knowledgeListHandler);
mount(['/api/knowledge/import'], knowledgeImportHandler);
mount(['/api/knowledge/clear'], knowledgeClearHandler);
mount(['/api/ai/chat'], aiChatHandler);
mount(['/api/ai/meal-plan'], aiMealPlanHandler);
mount(['/api/ai/scan-food'], aiScanFoodHandler);
mount(['/api/auth/change-password'], changePasswordHandler);
mount(['/api/notifications/vapid-key'], notificationsVapidKeyHandler);
mount(['/api/notifications/subscribe'], notificationsSubscribeHandler);
mount(['/api/notifications/reminders'], notificationsRemindersHandler);
mount(['/api/notifications/process-reminders'], notificationsProcessRemindersHandler);
mount(['/api/notifications/test-push'], notificationsTestPushHandler);

// ─── Development-only AI routes (not deployed to Vercel; see UNC-001) ───
  app.post(['/api/ai/estimate-food', '/ai/estimate-food'], requireApiAuth(), aiRateLimitMiddleware, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { foodItem, portionSize, foodDesc } = req.body;
      const queryItem = (foodItem || foodDesc || '').trim();
      const queryPortion = (portionSize || '1 standard portion').trim();

      if (!queryItem) {
        return res.status(400).json({ error: 'Food item description is required' });
      }

      const prompt = `You are a clinical dietitian and nutrition estimation engine.
A patient has logged eating an extra food item:
Food Item: "${queryItem}"
Portion / Quantity: "${queryPortion}"

Estimate the approximate nutritional content for this food and portion.
Return ONLY a valid JSON object with the following exact keys:
{
  "name": "Clean display name of the food (e.g. Chocolate Brownie Cake)",
  "portion": "Clean portion descriptor (e.g. 1 slice (120g))",
  "calories": 420,
  "protein": 5,
  "carbs": 58,
  "fat": 19
}
Ensure calories, protein, carbs, and fat are realistic non-negative integers.`;

      let parsed: any = null;
      try {
        const aiText = await generateAIResponse({
          systemInstruction: 'You are an accurate nutritional estimation API. Respond with a valid JSON object only. Do not wrap in markdown quotes or code blocks.',
          userPrompt: prompt,
          jsonMode: true
        });

        const cleaned = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (aiErr) {
        console.warn('AI Estimation generation warning, using nutrition heuristic:', aiErr);
      }

      // Robust fallback heuristic if AI fails or returns non-numeric values
      if (!parsed || typeof parsed.calories !== 'number') {
        const lower = queryItem.toLowerCase();
        let cal = 250;
        let p = 6;
        let c = 30;
        let f = 10;

        if (lower.includes('brownie') || lower.includes('cake') || lower.includes('pastry') || lower.includes('cookie')) {
          cal = 380; p = 5; c = 52; f = 18;
        } else if (lower.includes('bagel') || lower.includes('bread') || lower.includes('toast')) {
          cal = 290; p = 9; c = 48; f = 6;
        } else if (lower.includes('pizza') || lower.includes('burger')) {
          cal = 550; p = 22; c = 50; f = 28;
        } else if (lower.includes('salad') || lower.includes('fruit') || lower.includes('apple')) {
          cal = 120; p = 2; c = 24; f = 2;
        } else if (lower.includes('coffee') || lower.includes('latte') || lower.includes('tea')) {
          cal = 160; p = 6; c = 18; f = 7;
        } else if (lower.includes('chicken') || lower.includes('meat') || lower.includes('egg')) {
          cal = 320; p = 30; c = 4; f = 16;
        }

        parsed = {
          name: queryItem.charAt(0).toUpperCase() + queryItem.slice(1),
          portion: queryPortion || '1 serving',
          calories: cal,
          protein: p,
          carbs: c,
          fat: f
        };
      }

      res.json({
        name: parsed.name || queryItem,
        portion: parsed.portion || queryPortion || '1 serving',
        calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
        protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
        carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
        fat: Math.max(0, Math.round(Number(parsed.fat) || 0))
      });
    } catch (error: any) {
      console.error('Error in /api/ai/estimate-food:', error);
      res.status(500).json({ error: 'Failed to estimate food nutrition' });
    }
  });

  app.post(['/api/ai/coach', '/ai/coach'], requireApiAuth(), aiRateLimitMiddleware, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const caller = (req as any).caller as Caller;
      const { patientName, question, patientProfile } = req.body;
      // Patients can only ask about themselves; a dietician may draft for any patient.
      const patientId = caller.role === 'patient' ? caller.uid : req.body.patientId;
      if (patientId) assertCanAccessPatient(caller, patientId);
      if (!question) {
        return res.status(400).json({ error: 'Missing question' });
      }

      // Build rich context for the AI draft
      let contextInfo = '';
      try {
        const profile = patientProfile || (patientId ? await adminGetPatientProfile(patientId) : null);
        const plans = patientId ? await adminGetMealPlans(patientId) : [];
        const activePlan = plans.find((p: any) => p.status === 'published');

        contextInfo = `
Patient: ${patientName || profile?.name || 'Unknown'}
Age: ${profile?.age || 'N/A'}
Goals: ${profile?.goals?.join(', ') || 'General wellness'}
Diet Type: ${profile?.dietaryType || 'Standard'}
Allergies: ${profile?.allergies?.join(', ') || 'None reported'}
Active Plan Targets: ${activePlan ? JSON.stringify(activePlan.targets) : 'No active plan'}
`;
      } catch (ctxErr) {
        console.warn('Could not load patient context for AI coach:', ctxErr);
      }

      const systemPrompt = `You are NutriSnap AI Coach — a clinical nutrition assistant working under a licensed dietician.
Your response will be reviewed and potentially edited by the lead dietician before being shown to the patient.
Provide helpful, accurate, empathetic advice in 2-4 sentences.
Do NOT prescribe medication or make medical diagnoses.
Always recommend consulting the dietician for major dietary changes.`;

      const userPrompt = `${contextInfo}
Patient Question: "${question}"

Draft a helpful clinical nutrition response for the dietician to review.`;

      const aiDraft = await generateAIResponse({
        systemInstruction: systemPrompt,
        userPrompt
      });

      res.json({ aiDraft });
    } catch (error: any) {
      console.error('Error in /api/ai/coach:', error);
      res.status(500).json({ error: 'Failed to generate AI coach draft' });
    }
  });

// Any other /api path: JSON 404 instead of the SPA page.
app.all('/api/*', (req, res) => res.status(404).json({ error: 'Not found' }));

async function startServer() {
  // Vite middleware for development (Only if not running on Vercel)
  if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.VERCEL !== '1') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const server = http.createServer(app);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Persistent backend scheduler worker: processes due reminders every 15s independently of browser tabs
    const schedulerInterval = setInterval(async () => {
      try {
        const result = await processDueReminders();
        if (result.processedCount > 0) {
          console.log(
            `[ReminderScheduler] Processed ${result.processedCount} due reminder(s): sent=${result.sentCount}, retry=${result.retryScheduledCount}, noSub=${result.noActiveSubCount}, failed=${result.failedCount}`
          );
        }
      } catch (err) {
        console.warn('[ReminderScheduler] Tick warning:', err);
      }
    }, 15_000);
    schedulerInterval.unref?.();
  }
}

// Start server initialization
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => console.error('Failed to start server:', err));
}