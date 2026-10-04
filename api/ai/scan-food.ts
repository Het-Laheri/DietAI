import { GoogleGenAI } from '@google/genai';
import { 
  validateImageInput, 
  parseAndValidateFoodScanResponse 
} from '../../src/services/foodScannerService';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDjtTL_trmdMEEH-BINiIAZD1ktgZwY0CE';

export default async function handler(req: any, res: any) {
  // Enable CORS
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

    // Helper to race API call with a strict timeout so no single model hangs the serverless request
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
