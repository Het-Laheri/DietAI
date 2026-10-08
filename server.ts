import 'dotenv/config';
import express from 'express';
import path from 'path';
import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';
import webpush from 'web-push';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { 
  submitQuery, 
  createNotification,
  getPatientProfile,
  getMealPlans,
  getAllFoodLogsForPatient,
  getStoredRecipesFromDB,
  saveRecipesToDB,
  clearRecipeDB,
  buildClinicalMealPlanFromRecipes,
  cleanFirestoreData
} from './src/services/db';
import { 
  validateImageInput, 
  parseAndValidateFoodScanResponse 
} from './src/services/foodScannerService';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './src/services/firebase';
import createOrderHandler from './api/payment/create-order';
import verifyPaymentHandler from './api/payment/verify-payment';

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

// Global Express App Export for Vercel
const app = express();
export default app;

// Ensure server possesses admin/dietician privileges for Firestore data operations
let adminAuthPromise: Promise<void> | null = null;
async function ensureAdminAuth(): Promise<void> {
  if (auth.currentUser?.email === 'admin@aidiet.com') {
    return;
  }
  if (!adminAuthPromise) {
    adminAuthPromise = (async () => {
      try {
        await signInWithEmailAndPassword(auth, 'admin@aidiet.com', 'Admin123!');
        console.log('[Server] Successfully authenticated with Firestore as dietician/admin');
      } catch (err: any) {
        console.error('[Server] Failed to sign in as admin:', err?.message || err);
        throw err;
      } finally {
        adminAuthPromise = null;
      }
    })();
  }
  await adminAuthPromise;
}

// Pre-authenticate at startup so patient write requests have zero delay
ensureAdminAuth().catch((err) => {
  console.warn('[Server] Initial admin sign-in deferred:', err?.message || err);
});


async function getStoredKnowledge(): Promise<any[]> {
  try {
    return await getStoredRecipesFromDB();
  } catch (err) {
    console.error('Error reading knowledge base from Firestore:', err);
    return [];
  }
}

async function saveStoredKnowledge(recipes: any[]) {
  try {
    await saveRecipesToDB(recipes);
  } catch (err) {
    console.error('Error saving knowledge base to Firestore:', err);
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
  const geminiKey = process.env.GEMINI_API_KEY || 'AIzaSyDjtTL_trmdMEEH-BINiIAZD1ktgZwY0CE';
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

// Multimodal Gemini AI Vision Analysis Handler (Image + User Prompt + Context)
async function generateMultimodalAIResponse(params: {
  systemInstruction?: string;
  userPrompt: string;
  base64Data?: string;
  mimeType?: string;
}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY || 'AIzaSyDjtTL_trmdMEEH-BINiIAZD1ktgZwY0CE';
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  const aiClient = new GoogleGenAI({ apiKey: geminiKey });
  const modelsToTry = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    process.env.GEMINI_MODEL
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
      const callPromise = aiClient.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json'
        }
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after 7500ms on model ${modelName}`)), 7500)
      );

      const response: any = await Promise.race([callPromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Gemini multimodal attempt with model "${modelName}" failed or timed out:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Multimodal AI vision model failed to analyze the image.');
}

// Upstash Rate Limiter Middleware for AI endpoints
const aiRateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!aiRateLimiter) return next();
  const identifier = req.body?.patientId || req.ip || 'anonymous';
  const { success } = await aiRateLimiter.limit(identifier);
  if (!success) {
    return res.status(429).json({ error: 'Too many AI requests. Please try again later.' });
  }
  next();
};

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── WEB PUSH NOTIFICATIONS ENGINE ──────────────────────────────────────────
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BF0eHsETu6MTVR7eiyVk65qAqC8WEww3yH1wn5dh-836PtGxUk368pDq3udFCDZxxTyF1Hk9HE7dOkOz8q1zBTI';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'aXvLP0ckWhlyJrxfPHqjz6djC6OeYiDs_RJMNHfdjCs';
const VAPID_SUBJECT = 'mailto:support@nutrisnap.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Server] Web Push VAPID credentials configured');
} catch (vapidErr) {
  console.warn('[Server] Web Push VAPID setup note:', vapidErr);
}

interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  role: 'dietician' | 'patient';
  userId?: string;
  createdAt: number;
}

const pushSubscriptionsMap = new Map<string, StoredSubscription>();

// 1. Get VAPID Public Key
app.get('/api/notifications/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// 2. Subscribe device to Push Notifications
app.post('/api/notifications/subscribe', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { subscription, role, userId } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid push subscription payload' });
    }

    const subId = crypto.createHash('md5').update(subscription.endpoint).digest('hex');
    const storedItem: StoredSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      role: role || 'patient',
      userId: userId || undefined,
      createdAt: Date.now()
    };

    pushSubscriptionsMap.set(subId, storedItem);

    // Persist to Firestore collection 'push_subscriptions' for cross-instance and persistent delivery
    try {
      await ensureAdminAuth();
      await setDoc(doc(db, 'push_subscriptions', subId), {
        ...storedItem,
        updatedAt: serverTimestamp()
      });
    } catch (fsErr) {
      console.warn('[Server] Firestore push_subscriptions write note:', fsErr);
    }

    console.log(`[Server] Device subscribed to Push Notifications (${role}, user: ${userId || 'all'})`);
    return res.json({ success: true, subId });
  } catch (err: any) {
    console.error('[Server] Push subscription error:', err);
    return res.status(500).json({ error: 'Failed to save push subscription', details: err.message });
  }
});

// 3. Dispatch Web Push Notification (called when query submitted, query answered, meal plan published, or custom alert)
app.post('/api/notifications/send-push', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { role, recipientId, title, message, link, tag, type } = req.body;

    const payload = JSON.stringify({
      title: title || 'NutriSnap Health Alert',
      message: message || 'You have a new clinical update on NutriSnap.',
      link: link || (role === 'dietician' ? '/dietician/inbox' : '/patient/meals'),
      tag: tag || `push_${Date.now()}`,
      type: type || 'ALERT',
      timestamp: Date.now()
    });

    // Gather subscriptions from in-memory map and Firestore
    const candidateSubs: StoredSubscription[] = Array.from(pushSubscriptionsMap.values());

    try {
      await ensureAdminAuth();
      const snap = await getDocs(collection(db, 'push_subscriptions'));
      snap.docs.forEach(d => {
        const data = d.data() as StoredSubscription;
        if (data && data.endpoint && !candidateSubs.some(s => s.endpoint === data.endpoint)) {
          candidateSubs.push(data);
        }
      });
    } catch (e) {
      console.warn('[Server] Push subs fetch from Firestore note:', e);
    }

    // Filter matching recipients
    const targetSubs = candidateSubs.filter(sub => {
      if (role && sub.role !== role) return false;
      if (recipientId && sub.userId && sub.userId !== recipientId) return false;
      return true;
    });

    console.log(`[Server] Dispatching push notification to ${targetSubs.length} device(s)`);

    let sentCount = 0;
    const sendPromises = targetSubs.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: sub.keys
        }, payload, {
          TTL: 60 * 60 * 24 // 24 hours delivery window
        });
        sentCount++;
      } catch (pushErr: any) {
        console.warn(`[Server] Push dispatch to endpoint failed: ${pushErr.statusCode || pushErr.message}`);
        // If 410 Gone or 404 Not Found, delete the dead subscription
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          const subId = crypto.createHash('md5').update(sub.endpoint).digest('hex');
          pushSubscriptionsMap.delete(subId);
          deleteDoc(doc(db, 'push_subscriptions', subId)).catch(() => {});
        }
      }
    });

    await Promise.all(sendPromises);

    return res.json({ success: true, sentCount, totalTargets: targetSubs.length });
  } catch (err: any) {
    console.error('[Server] send-push error:', err);
    return res.status(500).json({ error: 'Failed to send push notification', details: err.message });
  }
});

// 4. Background Query Poll Endpoint (Prevents 404 in perpetual background checks)
app.get('/api/queries/poll', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    serverTime: new Date().toISOString()
  });
});

// ─── RAZORPAY PAYMENT GATEWAY ────────────────────────────────────────────────
const getRazorpayCredentials = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TgJehzpfLu7yQI';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'CeG1ExRkjbkDf7IEzovWWlhZ';
  return { key_id, key_secret };
};

// 1. Create Order Endpoint
app.post(['/api/create-order', '/create-order', '/api/payment/create-order'], async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { key_id, key_secret } = getRazorpayCredentials();
    if (!key_id || !key_secret) {
      return res.status(401).json({
        error: 'Razorpay authentication credentials missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'
      });
    }

    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Minimum amount validation: 100 paise
    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 100) {
      return res.status(400).json({ error: 'Invalid amount. Minimum amount is 100 paise (₹1.00).' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${key_id}:${key_secret}`).toString('base64');
    const orderOptions = {
      amount: Math.round(numericAmount),
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      notes: notes || {}
    };

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderOptions)
    });

    const order = await rzpResponse.json();

    if (!rzpResponse.ok) {
      if (rzpResponse.status === 401) {
        return res.status(401).json({
          error: 'Razorpay authentication failed. Please verify your Key ID and Secret.',
          details: order
        });
      }
      return res.status(rzpResponse.status || 500).json({
        error: order.error?.description || 'Failed to create payment order with Razorpay',
        details: order
      });
    }

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id
    });
  } catch (error: any) {
    console.error('Razorpay create-order error:', error);
    if (error?.statusCode === 401 || error?.status === 401 || error?.error?.code === 'BAD_REQUEST_ERROR' && error?.error?.description?.includes('auth')) {
      return res.status(401).json({
        error: 'Razorpay authentication failed. Please verify your Key ID and Secret.',
        details: error?.message || error
      });
    }
    return res.status(500).json({
      error: 'Failed to create payment order with Razorpay',
      details: error?.message || error
    });
  }
});

// 2. Verify Payment Signature Endpoint
app.post(['/api/verify-payment', '/verify-payment', '/api/payment/verify-payment'], async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { key_secret } = getRazorpayCredentials();
    if (!key_secret) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay Key Secret is not configured on the server'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Missing fields validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required'
      });
    }

    // HMAC-SHA256 signature verification: order_id + "|" + payment_id
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('Payment signature verification failed. Generated vs Provided:', {
        expectedSignature,
        razorpay_signature
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Verification failed.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (error: any) {
    console.error('Razorpay verify-payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while verifying payment',
      details: error?.message || error
    });
  }
});


  app.post(['/api/ai/meal-plan', '/ai/meal-plan'], aiRateLimitMiddleware, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { patientProfile, instructions, targets, availableRecipes } = req.body;
      
      let stored = Array.isArray(availableRecipes) && availableRecipes.length > 0 
        ? availableRecipes 
        : await getStoredRecipesFromDB(patientProfile?.dietaryType);

      if (!stored || stored.length === 0) {
        stored = await getStoredRecipesFromDB();
      }

      const relevantRecipes = stored.map((r: any) => ({
        name: r.name,
        dietaryType: r.dietaryType,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        ingredients: r.ingredients || [],
        recipe: r.recipe || [],
        clinicalFocus: r.clinicalFocus || 'Clinical Care'
      }));

      const prompt = `You are a licensed clinical dietician creating a 7-day meal plan.
Patient: ${JSON.stringify(patientProfile || {})}
Calorie & Macro Targets: ${JSON.stringify(targets || {})}
Additional Instructions: ${instructions || 'None'}

CRITICAL REQUIREMENT:
You MUST ONLY choose dishes and recipes from the following clinical pre-provided recipe catalog.
DO NOT CREATE, INVENT, OR SUGGEST ANY DISH OR INGREDIENT OUTSIDE OF THIS LIST:
${JSON.stringify(relevantRecipes)}

Return ONLY a valid JSON array of 7 objects (Day 1 through Day 7). Each day must have 4 meals: Breakfast, Lunch, Evening Snack, Dinner.
Each meal must use the exact name, ingredients, recipe, calories, and macros from the matching pre-provided recipe.

JSON Array format:
[
  {
    "dayNumber": 1,
    "meals": [
      {
        "type": "Breakfast",
        "name": "Recipe Name",
        "portion": "1 serving",
        "calories": 300,
        "protein": 15,
        "carbs": 40,
        "fat": 10,
        "prepTime": "10 mins",
        "cookTime": "15 mins",
        "ingredients": ["1 cup Oats"],
        "recipe": ["Boil milk"],
        "notes": "Rich in soluble fiber"
      }
    ]
  }
]`;

      let generatedPlan: any = null;

      try {
        const text = await generateAIResponse({
          systemInstruction: 'You are an expert clinical dietician. Respond with valid JSON array only. Only choose from provided recipes.',
          userPrompt: prompt,
          jsonMode: true
        });

        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length === 7) {
          generatedPlan = parsed.map((dayObj: any, dIdx: number) => ({
            dayNumber: dayObj.dayNumber || dIdx + 1,
            meals: (dayObj.meals || []).map((m: any, mIdx: number) => {
              const match = stored.find((r: any) => r.name.toLowerCase() === (m.name || '').toLowerCase());
              if (match) {
                return {
                  type: m.type || (mIdx === 0 ? 'Breakfast' : mIdx === 1 ? 'Lunch' : mIdx === 2 ? 'Evening Snack' : 'Dinner'),
                  name: match.name,
                  portion: m.portion || '1 serving',
                  calories: match.calories,
                  protein: match.protein,
                  carbs: match.carbs,
                  fat: match.fat,
                  prepTime: match.prepTime || '10 mins',
                  cookTime: match.cookTime || '15 mins',
                  ingredients: match.ingredients || [],
                  recipe: match.recipe || [],
                  notes: m.notes || match.clinicalFocus
                };
              }
              const fallback = stored[(dIdx + mIdx) % stored.length];
              return {
                type: m.type || (mIdx === 0 ? 'Breakfast' : mIdx === 1 ? 'Lunch' : mIdx === 2 ? 'Evening Snack' : 'Dinner'),
                name: fallback.name,
                portion: '1 serving',
                calories: fallback.calories,
                protein: fallback.protein,
                carbs: fallback.carbs,
                fat: fallback.fat,
                prepTime: fallback.prepTime || '10 mins',
                cookTime: fallback.cookTime || '15 mins',
                ingredients: fallback.ingredients || [],
                recipe: fallback.recipe || [],
                notes: fallback.clinicalFocus
              };
            })
          }));
        }
      } catch (aiErr) {
        console.warn('AI meal plan error, assembling directly from recipes:', aiErr);
      }

      if (!generatedPlan) {
        generatedPlan = buildClinicalMealPlanFromRecipes(stored, patientProfile, targets);
      }

      res.json(generatedPlan);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      res.status(500).json({ error: 'Failed to generate meal plan' });
    }
  });

  // AI Assistant (Dietician & Patient)
  app.post(['/api/ai/chat', '/ai/chat'], aiRateLimitMiddleware, async (req: express.Request, res: express.Response): Promise<any> => {
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

  // AI-Powered Food Estimation (Calories & Macros for Extra Foods)
  app.post(['/api/ai/estimate-food', '/ai/estimate-food'], async (req: express.Request, res: express.Response): Promise<any> => {
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
      res.status(500).json({ error: error.message || 'Failed to estimate food nutrition' });
    }
  });

  // Patient Real-Time Meal Checklist & Food Log Persistence Endpoints (Bypasses Client Firestore Permission Limits)
  app.post(['/api/patient/save-checklist', '/api/patient/checklist'], async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { patientId, date, items } = req.body;
      if (!patientId || !date) {
        return res.status(400).json({ error: 'patientId and date are required' });
      }
      await ensureAdminAuth();
      const rawList = Array.isArray(items) ? items : Object.values(items || {});
      const sanitized = cleanFirestoreData(rawList);
      const docRef = doc(db, 'food_logs', `checklist_${patientId}_${date}`);
      await setDoc(docRef, {
        patientId,
        date,
        items: sanitized,
        type: 'checklist',
        updatedAt: serverTimestamp()
      });
      console.log(`[Server] Successfully persisted checklist for patient ${patientId} on ${date} (${sanitized.length} items)`);
      return res.json({ success: true, docId: docRef.id });
    } catch (err: any) {
      console.error('[Server] Error in /api/patient/save-checklist:', err);
      return res.status(500).json({ error: err.message || 'Failed to save patient checklist' });
    }
  });

  app.get('/api/patient/checklist/:patientId/:date', async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { patientId, date } = req.params;
      await ensureAdminAuth();
      const docRef = doc(db, 'food_logs', `checklist_${patientId}_${date}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const raw = snap.data().items;
        const items = Array.isArray(raw) ? raw : Object.values(raw || {});
        return res.json({ success: true, items });
      }
      return res.json({ success: true, items: [] });
    } catch (err: any) {
      console.error('[Server] Error in GET /api/patient/checklist:', err);
      return res.status(500).json({ error: err.message || 'Failed to get patient checklist' });
    }
  });

  app.post(['/api/patient/log-meal', '/api/food-logs'], async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const logData = req.body;
      if (!logData.patientId || !logData.date) {
        return res.status(400).json({ error: 'patientId and date are required' });
      }
      await ensureAdminAuth();
      const sanitized = cleanFirestoreData(logData);
      const ref = await addDoc(collection(db, 'food_logs'), {
        ...sanitized,
        createdAt: serverTimestamp()
      });
      console.log(`[Server] Successfully logged meal for patient ${logData.patientId} (Doc ID: ${ref.id})`);
      return res.json({ success: true, id: ref.id });
    } catch (err: any) {
      console.error('[Server] Error in /api/patient/log-meal:', err);
      return res.status(500).json({ error: err.message || 'Failed to log patient meal' });
    }
  });

  app.delete('/api/patient/food-log/:id', async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { id } = req.params;
      await ensureAdminAuth();
      await deleteDoc(doc(db, 'food_logs', id));
      console.log(`[Server] Deleted food log doc ${id}`);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Server] Error in DELETE /api/patient/food-log:', err);
      return res.status(500).json({ error: err.message || 'Failed to delete food log' });
    }
  });

  app.get('/api/patient/food-logs/:patientId', async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { patientId } = req.params;
      await ensureAdminAuth();
      const q = query(collection(db, 'food_logs'), where('patientId', '==', patientId));
      const snap = await getDocs(q);
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ success: true, logs });
    } catch (err: any) {
      console.error('[Server] Error in GET /api/patient/food-logs:', err);
      return res.status(500).json({ error: err.message || 'Failed to get food logs' });
    }
  });

  // Patient Profile Management
  app.get('/api/patient/profile/:patientId', async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { patientId } = req.params;
      await ensureAdminAuth();
      const docRef = doc(db, 'patient_profiles', patientId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return res.json({ success: true, profile: { id: snap.id, ...snap.data() } });
      }
      return res.status(404).json({ error: 'Patient profile not found' });
    } catch (err: any) {
      console.error('[Server] Error in GET /api/patient/profile:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch patient profile' });
    }
  });

  app.post('/api/patient/profile/:patientId', async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { patientId } = req.params;
      const updates = req.body;
      await ensureAdminAuth();
      const sanitized = cleanFirestoreData(updates);
      const docRef = doc(db, 'patient_profiles', patientId);
      await setDoc(docRef, {
        ...sanitized,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // If name updated, also update in users collection
      if (sanitized.name) {
        try {
          await setDoc(doc(db, 'users', patientId), { name: sanitized.name }, { merge: true });
        } catch (uErr) {
          console.warn('[Server] Note: user name update skipped:', uErr);
        }
      }

      console.log(`[Server] Successfully updated profile for patient ${patientId}`);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Server] Error in POST /api/patient/profile:', err);
      return res.status(500).json({ error: err.message || 'Failed to update patient profile' });
    }
  });

  // Weight & Progress Record Logging
  app.post('/api/patient/progress-record', async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const record = req.body;
      if (!record.patientId || !record.date || record.weightKg === undefined) {
        return res.status(400).json({ error: 'patientId, date, and weightKg are required' });
      }
      await ensureAdminAuth();
      const sanitized = cleanFirestoreData(record);

      const q = query(
        collection(db, 'progress_records'),
        where('patientId', '==', record.patientId),
        where('date', '==', record.date)
      );
      const existingSnap = await getDocs(q);
      let recordId: string;
      if (!existingSnap.empty) {
        recordId = existingSnap.docs[0].id;
        await setDoc(doc(db, 'progress_records', recordId), {
          ...sanitized,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        const docRef = await addDoc(collection(db, 'progress_records'), {
          ...sanitized,
          createdAt: serverTimestamp()
        });
        recordId = docRef.id;
      }

      // Sync currentWeightKg and BMI to patient_profiles doc
      const profileRef = doc(db, 'patient_profiles', record.patientId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const heightCm = profileSnap.data().heightCm || 165;
        const newWeight = Number(record.weightKg);
        const bmi = Number((newWeight / ((heightCm / 100) * (heightCm / 100))).toFixed(1));
        let bmiClassification = 'Normal (18.5 - 24.9)';
        if (bmi < 18.5) bmiClassification = 'Underweight (< 18.5)';
        else if (bmi < 30) bmiClassification = 'Overweight (25 - 29.9)';
        else bmiClassification = 'Obese (≥ 30)';

        await setDoc(profileRef, {
          currentWeightKg: newWeight,
          bmi,
          bmiClassification,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      console.log(`[Server] Successfully logged progress record for patient ${record.patientId} (Weight: ${record.weightKg} kg)`);
      return res.json({ success: true, id: recordId });
    } catch (err: any) {
      console.error('[Server] Error in POST /api/patient/progress-record:', err);
      return res.status(500).json({ error: err.message || 'Failed to save progress record' });
    }
  });

  app.get('/api/patient/progress-records/:patientId', async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { patientId } = req.params;
      await ensureAdminAuth();
      const q = query(collection(db, 'progress_records'), where('patientId', '==', patientId));
      const snap = await getDocs(q);
      const records = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
      return res.json({ success: true, records });
    } catch (err: any) {
      console.error('[Server] Error in GET /api/patient/progress-records:', err);
      return res.status(500).json({ error: err.message || 'Failed to get progress records' });
    }
  });

  // Gemini Multimodal AI Food Scanner
  app.post(['/api/ai/scan-food', '/ai/scan-food'], aiRateLimitMiddleware, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { image, mimeType, userNotes, patientProfile } = req.body || {};
      
      const validation = validateImageInput(image);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error || 'Valid image data is required' });
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
Carefully examine the uploaded image.

CRITICAL INSTRUCTIONS:
1. FIRST, determine what type of image this is:
   A. NON-FOOD / INVALID: If the image DOES NOT contain food, drink, a meal plate, or a nutrition facts label (e.g. an electronic device, keyboard, furniture, person, blurry background, pet, document, or completely unclear scene), you MUST return strictly:
      {
        "isFood": false,
        "message": "Couldn't identify any food or nutrition label in this image. Please take a clear, well-lit photo of your meal or nutrition facts table."
      }

   B. NUTRITION FACTS / PACKAGING LABEL: If the image shows a Nutrition Facts panel or food packaging nutritional table:
      - Set scanType: "label".
      - productName: Brand or food product name if visible (e.g. "Greek Yogurt", "Whole Wheat Bread", "Protein Bar", "Oat Milk").
      - servingSize: Exact declared serving size string (e.g. "1 cup (228g)", "30g", "2 slices (56g)").
      - servingsPerContainer: Number of servings per container (e.g. 2).
      - nutrition: Exact declared nutrient amounts PER SERVING:
        * calories: Declared calories in kcal (integer)
        * protein: Protein in grams (number)
        * carbs: Total Carbohydrate in grams (number)
        * fat: Total Fat in grams (number)
        * fiber: Dietary Fiber in grams (number)
        * sugars: Total or Added Sugars in grams (number)
        * sodium: Sodium in mg (number)
        * saturatedFat: Saturated Fat in grams (number)
      - items: [
          {
            "name": productName,
            "portion": servingSize,
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fat": fat,
            "fiber": fiber,
            "notes": "Nutrition Facts table declared values per serving"
          }
        ]
      - suggestedMealType: "Snack" | "Breakfast" | "Lunch" | "Dinner".
      - insight: Concise 2-sentence clinical dietician evaluation of this packaged item's nutritional profile (e.g., protein density, sodium/sugar moderation).
      - healthScore: "Healthy" | "Balanced" | "Moderate" | "Indulgent".

   C. EDIBLE MEAL / FOOD PLATE: If edible food or beverage items are present on a plate or in a dish:
      - Set scanType: "plate".
   ${patientContext}${userNotesText}
   - Identify all distinct food and beverage items.
   - If user notes mention specific quantities or oils (e.g. "cooked in 1 tbsp olive oil", "2 rotis", "added 1 scoop whey"), calculate portions and macros accordingly.
   - For EACH detected food item, provide:
     * name: Clear descriptive item name (e.g. "Fresh Red Apple", "Whole Wheat Roti", "Yellow Moong Dal", "Vegetable Pizza")
     * portion: Estimated portion / quantity with weight or volume (e.g. "1 medium apple (180g)", "2 medium rotis (80g)", "1 slice (120g)")
     * calories: Estimated calories in kcal FOR THIS ENTIRE PORTION (integer, not per 100g unless portion is 100g)
     * protein: Estimated protein in grams for this portion (number)
     * carbs: Estimated carbs in grams for this portion (number)
     * fat: Estimated total fat in grams for this portion (number)
     * fiber: Estimated dietary fiber in grams for this portion (number)
     * notes: Short dietary observation (e.g. "Rich in dietary fiber and vitamins")
   - Accurately calculate the meal totals:
     * total calories = exact sum of all item calories
     * total protein = sum of all item protein
     * total carbs = sum of all item carbs
     * total fat = sum of all item fat
     * total fiber = sum of all item fiber
   - Suggest the meal type: "Breakfast" | "Lunch" | "Dinner" | "Snack".
   - Provide a concise, clinical, supportive 2-sentence feedback insight on the nutritional quality, balance, and satiety of this meal.
   - Assign a health score: "Healthy" | "Balanced" | "Moderate" | "Indulgent".

Return strictly a valid JSON object matching:
{
  "isFood": true,
  "detectedFoods": ["Whole Wheat Roti", "Moong Dal"],
  "items": [
    {
      "name": "Whole Wheat Roti",
      "portion": "2 medium rotis (80g)",
      "calories": 160,
      "protein": 6,
      "carbs": 32,
      "fat": 1.5,
      "fiber": 4,
      "notes": "Complex carbohydrate staple"
    }
  ],
  "nutrition": {
    "calories": 160,
    "protein": 6,
    "carbs": 32,
    "fat": 1.5,
    "fiber": 4
  },
  "suggestedMealType": "Lunch",
  "insight": "Nutritious complex carbohydrates supporting steady blood glucose levels.",
  "healthScore": "Balanced"
}`;

      const systemInstruction = 'You are NutriSnap AI Clinical Nutritionist. Always return strictly valid JSON without markdown code block ticks. If the image is not food or a nutrition facts label, return isFood: false.';

      const jsonText = await generateMultimodalAIResponse({
        systemInstruction,
        userPrompt: prompt,
        base64Data: validation.cleanBase64,
        mimeType: validation.mimeType || mimeType || 'image/jpeg'
      });

      const parsedResult = parseAndValidateFoodScanResponse(jsonText);
      return res.status(200).json(parsedResult);
    } catch (error: any) {
      console.error('Error in /api/ai/scan-food:', error);
      const msg = error.message || String(error);
      const isRateLimit = error.status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
      const isNonFood = 
        msg.includes("Couldn't identify any food") || 
        msg.includes("No food detected");
      const isBadInput = msg.includes("Invalid or corrupt image") || msg.includes("Image format is invalid");

      const statusCode = isRateLimit ? 429 : isNonFood ? 422 : isBadInput ? 400 : 500;
      const userMessage = isRateLimit
        ? 'The scanner service is momentarily at capacity. Please try again in a few moments.'
        : isNonFood
        ? "Couldn't identify any food in this image. Please take a clear, well-lit photo of your meal."
        : isBadInput
        ? (error.message || 'Invalid image format provided.')
        : (error.message || 'Failed to analyze food image with AI');

      return res.status(statusCode).json({ 
        error: userMessage,
        details: msg
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


  // Helper to extract recipes from unstructured text (PDF/Word) using Gemini
  async function parseRecipesFromText(text: string, sourceFileName: string): Promise<any[]> {
    try {
      console.log(`🤖 Using Gemini AI to parse recipes from unstructured document: "${sourceFileName}"`);
      const aiPrompt = `You are a clinical nutritionist and recipe extractor. Extract all distinct recipes or meals from the following raw document text:\nDocument Name: "${sourceFileName}"\nRaw Text:\n${text.substring(0, 15000)}\n\nReturn ONLY a valid JSON array of objects with this schema:\n[\n  {\n    "name": "Distinct Meal/Dish Name",\n    "dietaryType": "Vegetarian",\n    "calories": 350,\n    "protein": 15,\n    "carbs": 40,\n    "fat": 10,\n    "ingredients": ["ingredient 1"],\n    "recipe": ["step 1"],\n    "prepTime": "10 mins",\n    "cookTime": "15 mins",\n    "clinicalFocus": "General Wellness"\n  }\n]\n`;

      const aiText = await generateAIResponse({
        systemInstruction: 'Respond with a valid JSON array only. Do not wrap in markdown.',
        userPrompt: aiPrompt,
        jsonMode: true
      });

      const cleanedAI = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedAI = JSON.parse(cleanedAI);
      
      if (Array.isArray(parsedAI)) {
        return parsedAI.map(r => ({
          ...r,
          sourceFileName
        }));
      }
    } catch (err) {
      console.error('Failed to parse unstructured text into recipes:', err);
    }
    return [];
  }

  // Unified Knowledge Base Import Route (.zip, .pdf, .docx, .xlsx, .csv)
  app.post('/api/knowledge/import', async (req, res) => {
    try {
      const { base64File, fileName } = req.body;
      if (!base64File) {
        return res.status(400).json({ error: 'No file content provided' });
      }

      const base64Clean = base64File.replace(/^data:.*;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');
      const lowerName = fileName.toLowerCase();

      const allRecipes: any[] = [];
      
      const processSingleFile = async (fileBuffer: Buffer, name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        
        if (ext === 'txt' || ext === 'md' || ext === 'json') {
          console.log(`📄 Processing Document: ${name}`);
          const text = fileBuffer.toString('utf-8');
          const recipes = await parseRecipesFromText(text, name);
          allRecipes.push(...recipes);
        } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          console.log(`📊 Processing Spreadsheet: ${name}`);
          let workbook: XLSX.WorkBook;
          try {
            workbook = XLSX.read(fileBuffer, { type: 'buffer', raw: true });
          } catch (e) {
            workbook = XLSX.read(fileBuffer.toString('binary'), { type: 'binary' });
          }
          
          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            
            const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (!rawMatrix || rawMatrix.length === 0) continue;

            const fullText = rawMatrix.map(r => r.join(' ')).join('\n').toLowerCase();
            const isClinicalFormat = 
              fullText.includes('food details') || 
              fullText.includes('nutritive value') || 
              fullText.includes('edible portion') || 
              (fullText.includes('energy [kcal]') || fullText.includes('carbohydrates [gms]'));

            if (isClinicalFormat) {
              const clinicalRecipe = parseClinicalNutritionSheetFromMatrix(rawMatrix, sheetName, name);
              allRecipes.push(clinicalRecipe);
              continue;
            }

            const rows: any[] = XLSX.utils.sheet_to_json(sheet);
            if (!rows || rows.length === 0) continue;

            let sheetRecipes: any[] = [];
            let genericCount = 0;
            rows.forEach((row, idx) => {
              const recipe = normalizeExcelRow(row, sheetName, name, idx);
              if (recipe.name.includes('Recipe #') || recipe.name === 'Custom Meal') {
                genericCount++;
              }
              sheetRecipes.push(recipe);
            });

            if (genericCount / Math.max(rows.length, 1) > 0.4 && rows.length > 0) {
              try {
                const aiPrompt = `Extract recipes from this raw sheet data: Sheet Name: "${sheetName}". Raw Data: ${JSON.stringify(rows.slice(0, 40))} \nReturn ONLY a valid JSON array of objects.`;
                const aiText = await generateAIResponse({
                  systemInstruction: 'Respond with valid JSON array only.',
                  userPrompt: aiPrompt,
                  jsonMode: true
                });
                const cleanedAI = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsedAI = JSON.parse(cleanedAI);
                if (Array.isArray(parsedAI) && parsedAI.length > 0) {
                  sheetRecipes = parsedAI.map(r => ({ ...r, sourceFileName: name, sheetName }));
                }
              } catch (aiErr) {
                console.warn('AI Fallback Parser failed:', aiErr);
              }
            }
            allRecipes.push(...sheetRecipes);
          }
        }
      };

      await processSingleFile(buffer, fileName);

      if (allRecipes.length > 0) {
        const existing = await getStoredKnowledge();
        const updated = [...existing, ...allRecipes];
        await saveStoredKnowledge(updated);
      }

      res.json({
        success: true,
        importedCount: allRecipes.length,
        sample: allRecipes.slice(0, 3)
      });
    } catch (error: any) {
      console.error('Error importing file:', error);
      res.status(500).json({ error: 'Failed to process file', details: error.message });
    }
  });

  // Get Ingested Excel Knowledge Base Stats & Recipe List from Database
  app.get(['/api/knowledge/list', '/knowledge/list'], async (req, res) => {
    try {
      let recipes = await getStoredKnowledge();
      res.json({
        count: recipes.length,
        recipes: recipes,
        sample: recipes.slice(0, 10)
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to retrieve knowledge base' });
    }
  });

  // Clear Ingested Excel Knowledge Base
  app.delete(['/api/knowledge/clear', '/knowledge/clear'], async (req, res) => {
    try {
      await saveStoredKnowledge([]);
      res.json({ success: true, message: 'Knowledge base database cleared' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to clear knowledge base' });
    }
  });

  // ─── AI COACH (DIETICIAN-APPROVAL FLOW) ─────────────────────────────────────

  // Patient sends a question → AI generates a draft → frontend saves to Firestore
  // with status 'pending' → dietician reviews/edits/approves → patient sees approved answer.
  app.post(['/api/ai/coach', '/ai/coach'], aiRateLimitMiddleware, async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { patientId, patientName, question, patientProfile } = req.body;
      if (!question) {
        return res.status(400).json({ error: 'Missing question' });
      }

      // Build rich context for the AI draft
      let contextInfo = '';
      try {
        const profile = patientProfile || (patientId ? await getPatientProfile(patientId) : null);
        const plans = patientId ? await getMealPlans(patientId) : [];
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
      res.status(500).json({ error: 'Failed to generate AI coach draft', details: error.message });
    }
  });

  // ─── RAZORPAY STANDARD CHECKOUT ROUTES ─────────────────────────────────────
  app.all(['/api/create-order', '/api/payment/create-order'], (req, res) => createOrderHandler(req, res));
  app.all(['/api/verify-payment', '/api/payment/verify-payment'], (req, res) => verifyPaymentHandler(req, res));

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
  }
}

// Start server initialization
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => console.error('Failed to start server:', err));
}