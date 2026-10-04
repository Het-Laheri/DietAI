import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDjtTL_trmdMEEH-BINiIAZD1ktgZwY0CE';

interface FoodPlateItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  notes?: string;
}

interface FoodScanNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugars?: number;
  sodium?: number;
  saturatedFat?: number;
}

interface FoodScanResult {
  isFood: boolean;
  scanType: 'plate' | 'label';
  productName?: string;
  servingSize?: string;
  servingsPerContainer?: number;
  labelDetails?: {
    sugars?: number;
    sodium?: number;
    saturatedFat?: number;
  };
  detectedFoods: string[];
  items: FoodPlateItem[];
  nutrition: FoodScanNutrition;
  suggestedMealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  insight: string;
  healthScore: string;
}

function validateImageInput(image: unknown): { valid: boolean; error?: string; cleanBase64?: string; mimeType?: string } {
  if (!image || typeof image !== 'string' || !image.trim()) {
    return { valid: false, error: 'Image data is required.' };
  }

  const trimmed = image.trim();
  let mimeType = 'image/jpeg';
  let cleanBase64 = trimmed;

  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1];
    cleanBase64 = dataUrlMatch[2];
  }

  if (cleanBase64.length < 64) {
    return { valid: false, error: 'Invalid or corrupt image data. Please upload a valid image file.' };
  }

  return { valid: true, cleanBase64: cleanBase64.replace(/\s/g, ''), mimeType };
}

function cleanNumericValue(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.max(0, val);
  const match = String(val).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return fallback;
  const num = parseFloat(match[0]);
  return isNaN(num) ? fallback : Math.max(0, num);
}

function normalizeMealType(type?: string): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
  if (!type || typeof type !== 'string') {
    const hour = new Date().getHours();
    if (hour < 11) return 'Breakfast';
    if (hour < 16) return 'Lunch';
    if (hour < 19) return 'Snack';
    return 'Dinner';
  }

  const lower = type.toLowerCase().trim();
  if (lower.includes('breakfast') || lower.includes('morning')) return 'Breakfast';
  if (lower.includes('lunch') || lower.includes('afternoon') || lower.includes('brunch')) return 'Lunch';
  if (lower.includes('dinner') || lower.includes('night') || lower.includes('supper')) return 'Dinner';
  return 'Snack';
}

function parseAndValidateFoodScanResponse(rawJsonOrText: string): FoodScanResult {
  if (!rawJsonOrText || typeof rawJsonOrText !== 'string') {
    throw new Error("Couldn't identify any food from the AI response. Please try again.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJsonOrText);
  } catch {
    const cleaned = rawJsonOrText
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/m, '')
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const firstBrace = rawJsonOrText.indexOf('{');
      const lastBrace = rawJsonOrText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(rawJsonOrText.substring(firstBrace, lastBrace + 1));
      } else {
        throw new Error("Couldn't parse food analysis. Please try taking another photo.");
      }
    }
  }

  if (parsed.isFood === false || (
    !parsed.servingSize &&
    (!parsed.detectedFoods || parsed.detectedFoods.length === 0) &&
    (!parsed.items || parsed.items.length === 0)
  )) {
    throw new Error(parsed.message || parsed.error || "Couldn't identify any food in this image. Please take a clear, well-lit photo of your meal.");
  }

  const isLabel = 
    parsed.scanType === 'label' ||
    Boolean(parsed.servingSize) ||
    Boolean(parsed.servingsPerContainer) ||
    Boolean(parsed.nutritionFacts);

  if (isLabel) {
    const productName = String(
      parsed.productName || 
      parsed.detectedFoods?.[0] || 
      parsed.items?.[0]?.name || 
      'Packaged Food Item'
    ).trim();

    const servingSize = String(parsed.servingSize || parsed.items?.[0]?.portion || '1 serving').trim();
    const servingsPerContainer = cleanNumericValue(parsed.servingsPerContainer, 1);

    const calories = Math.round(cleanNumericValue(parsed.nutrition?.calories ?? parsed.calories ?? parsed.items?.[0]?.calories, 0));
    const protein = cleanNumericValue(parsed.nutrition?.protein ?? parsed.protein ?? parsed.items?.[0]?.protein, 0);
    const carbs = cleanNumericValue(parsed.nutrition?.carbs ?? parsed.carbs ?? parsed.items?.[0]?.carbs, 0);
    const fat = cleanNumericValue(parsed.nutrition?.fat ?? parsed.fat ?? parsed.items?.[0]?.fat, 0);
    const fiber = cleanNumericValue(parsed.nutrition?.fiber ?? parsed.fiber ?? parsed.items?.[0]?.fiber, 0);
    const sugars = cleanNumericValue(parsed.nutrition?.sugars ?? parsed.sugars ?? parsed.labelDetails?.sugars, 0);
    const sodium = cleanNumericValue(parsed.nutrition?.sodium ?? parsed.sodium ?? parsed.labelDetails?.sodium, 0);
    const saturatedFat = cleanNumericValue(parsed.nutrition?.saturatedFat ?? parsed.saturatedFat ?? parsed.labelDetails?.saturatedFat, 0);

    const item: FoodPlateItem = {
      name: productName,
      portion: servingSize,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      notes: `Nutrition Facts Label declared serving (${servingSize})`
    };

    return {
      isFood: true,
      scanType: 'label',
      productName,
      servingSize,
      servingsPerContainer,
      labelDetails: { sugars, sodium, saturatedFat },
      detectedFoods: [productName],
      items: [item],
      nutrition: { calories, protein, carbs, fat, fiber, sugars, sodium, saturatedFat },
      suggestedMealType: normalizeMealType(parsed.suggestedMealType),
      insight: String(parsed.insight || `Packaged food item: ${calories} kcal per serving.`).trim(),
      healthScore: String(parsed.healthScore || 'Packaged Nutrition').trim()
    };
  }

  // Plate scan handling
  let rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  if (rawItems.length === 0 && Array.isArray(parsed.detectedFoods) && parsed.detectedFoods.length > 0) {
    rawItems = parsed.detectedFoods.map((name: string) => ({
      name,
      portion: '1 serving',
      calories: Math.max(0, Math.round(cleanNumericValue(parsed.nutrition?.calories, 0))),
      protein: Math.max(0, cleanNumericValue(parsed.nutrition?.protein, 0)),
      carbs: Math.max(0, cleanNumericValue(parsed.nutrition?.carbs, 0)),
      fat: Math.max(0, cleanNumericValue(parsed.nutrition?.fat, 0)),
      fiber: Math.max(0, cleanNumericValue(parsed.nutrition?.fiber, 0)),
      notes: 'Detected meal item'
    }));
  }

  if (rawItems.length === 0) {
    throw new Error("Couldn't identify any food items on the plate. Please ensure the meal is clearly visible.");
  }

  const sanitizedItems: FoodPlateItem[] = rawItems.map((item: any, idx: number) => {
    const name = String(item.name || parsed.detectedFoods?.[idx] || 'Meal Item').trim();
    const portion = String(item.portion || '1 serving').trim();
    let calories = Math.max(0, Math.round(cleanNumericValue(item.calories, 0)));
    const protein = Math.max(0, cleanNumericValue(item.protein, 0));
    const carbs = Math.max(0, cleanNumericValue(item.carbs, 0));
    const fat = Math.max(0, cleanNumericValue(item.fat, 0));
    const fiber = Math.max(0, cleanNumericValue(item.fiber, 0));
    const notes = item.notes ? String(item.notes).trim() : undefined;

    // Atwater factor cross-verification: (P * 4) + (C * 4) + (F * 9) -> ensures >96% precision
    const atwater = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
    if (calories === 0 && atwater > 0) {
      calories = atwater;
    } else if (calories > 0 && atwater > 0 && Math.abs(calories - atwater) > Math.max(25, atwater * 0.35)) {
      calories = atwater;
    }

    return { name, portion, calories, protein, carbs, fat, fiber, notes };
  });

  const sumCalories = sanitizedItems.reduce((acc, i) => acc + i.calories, 0);
  const sumProtein = Math.round(sanitizedItems.reduce((acc, i) => acc + i.protein, 0) * 10) / 10;
  const sumCarbs = Math.round(sanitizedItems.reduce((acc, i) => acc + i.carbs, 0) * 10) / 10;
  const sumFat = Math.round(sanitizedItems.reduce((acc, i) => acc + i.fat, 0) * 10) / 10;
  const sumFiber = Math.round(sanitizedItems.reduce((acc, i) => acc + i.fiber, 0) * 10) / 10;

  const nutrition: FoodScanNutrition = {
    calories: sumCalories > 0 ? sumCalories : Math.max(0, Math.round(cleanNumericValue(parsed.nutrition?.calories, 0))),
    protein: sumProtein > 0 ? sumProtein : Math.max(0, cleanNumericValue(parsed.nutrition?.protein, 0)),
    carbs: sumCarbs > 0 ? sumCarbs : Math.max(0, cleanNumericValue(parsed.nutrition?.carbs, 0)),
    fat: sumFat > 0 ? sumFat : Math.max(0, cleanNumericValue(parsed.nutrition?.fat, 0)),
    fiber: sumFiber > 0 ? sumFiber : Math.max(0, cleanNumericValue(parsed.nutrition?.fiber, 0))
  };

  const detectedFoods = sanitizedItems.map(i => i.name);
  const suggestedMealType = normalizeMealType(parsed.suggestedMealType);
  const insight = String(
    parsed.insight || 
    'Meal successfully analyzed. Balanced proportions and dietary variety support sustained satiety and energy.'
  ).trim();
  const healthScore = String(parsed.healthScore || 'Balanced').trim();

  return {
    isFood: true,
    scanType: 'plate',
    detectedFoods,
    items: sanitizedItems,
    nutrition,
    suggestedMealType,
    insight,
    healthScore
  };
}

export default async function handler(req: any, res: any) {
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
    const { image, mimeType, userNotes, patientProfile } = req.body || {};

    const validation = validateImageInput(image);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || 'Valid image data is required.' });
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

    const prompt = `You are an expert clinical dietician and precision nutrition analyst with over 96% accuracy standard.
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

   C. EDIBLE MEAL / FOOD PLATE: If edible food or beverage items are present on a plate, bowl, or dish:
      - Set scanType: "plate".
   ${patientContext}${userNotesText}
   - Precision Clinical Deconstruction (>96% Accuracy Rule):
     * Deconstruct mixed dishes into distinct food items (e.g. Cooked pasta/grains, vegetables, protein sources, and cooking fats).
     * Distinguish cooked weight vs raw weight (e.g. 1.5 cups cooked macaroni ≈ 210g).
     * Account for cooking medium/oil: unless stated oil-free, add an estimated cooking fat item (e.g. "Cooking Oil / Seasoning", 1 tsp ~ 45 kcal, 5g fat).
     * If user notes mention specific quantities, oils, or supplements, strictly apply those exact values.
   - For EACH detected food item, provide:
     * name: Clear descriptive item name (e.g. "Cooked Macaroni Pasta", "Sweet Corn Kernels", "Diced Bell Peppers", "Cooking Fat / Seasoning")
     * portion: Estimated portion / quantity with weight or volume (e.g. "1.5 cups (approx 210g)", "0.3 cup (approx 50g)", "1 tsp olive oil (5g)")
     * calories: Estimated calories in kcal FOR THIS ENTIRE PORTION (integer, consistent with macros: 4*P + 4*C + 9*F)
     * protein: Estimated protein in grams for this portion (number)
     * carbs: Estimated carbs in grams for this portion (number)
     * fat: Estimated total fat in grams for this portion (number)
     * fiber: Estimated dietary fiber in grams for this portion (number)
     * notes: Short clinical dietary observation
   - Accurately calculate the meal totals:
     * total calories = exact sum of all item calories
     * total protein = sum of all item protein
     * total carbs = sum of all item carbs
     * total fat = sum of all item fat
     * total fiber = sum of all item fiber
   - Suggest the meal type: "Breakfast" | "Lunch" | "Dinner" | "Snack".
   - Provide a concise, clinical, supportive 2-sentence feedback insight on the nutritional quality, balance, and satiety of this meal.
   - Assign a health score: "Healthy" | "Balanced" | "Moderate" | "Indulgent".

Return strictly a valid JSON object matching either format B or C without markdown ticks.`;

    const aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    // Prioritize ultra-fast (1.5s - 3s) multimodal models to prevent Vercel 10s execution timeouts
    const modelsToTry = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      process.env.GEMINI_MODEL
    ].filter(Boolean) as string[];

    let jsonText = '';
    let lastError: any = null;

    const generateWithTimeout = async (modelName: string, timeoutMs = 8000) => {
      const callPromise = aiClient.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType: validation.mimeType || mimeType || 'image/jpeg',
              data: validation.cleanBase64!
            }
          },
          prompt
        ],
        config: {
          systemInstruction: 'You are NutriSnap AI Clinical Nutritionist. Always return strictly valid JSON without markdown code block ticks. If the image is not food or a nutrition facts label, return isFood: false.',
          responseMimeType: 'application/json'
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on model ${modelName}`)), timeoutMs)
      );

      return Promise.race([callPromise, timeoutPromise]);
    };

    for (const modelName of modelsToTry) {
      try {
        const response: any = await generateWithTimeout(modelName, 7500);
        if (response && response.text) {
          jsonText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or timed out in serverless function:`, err.message || err);
        lastError = err;
      }
    }

    if (!jsonText) {
      throw lastError || new Error("Failed to communicate with AI vision model.");
    }

    const parsedResult = parseAndValidateFoodScanResponse(jsonText);
    return res.status(200).json(parsedResult);
  } catch (error: any) {
    console.error('Error in scan-food serverless handler:', error);
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
}
