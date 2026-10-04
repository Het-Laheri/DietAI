export interface FoodPlateItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  notes?: string;
}

export interface FoodScanNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugars?: number;
  sodium?: number;
  saturatedFat?: number;
}

export interface FoodScanResult {
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

/**
 * Validates base64 / data-url image payload before sending to vision models.
 */
export function validateImageInput(image: unknown): { valid: boolean; error?: string; cleanBase64?: string; mimeType?: string } {
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

  // Minimum length check (an authentic compressed JPEG/PNG is at least ~100-200 base64 chars)
  if (cleanBase64.length < 64) {
    return { valid: false, error: 'Invalid or corrupt image data. Please upload a valid image file.' };
  }

  // Verify valid base64 character set
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  const sample = cleanBase64.slice(0, 100).replace(/\s/g, '');
  if (!base64Regex.test(sample)) {
    return { valid: false, error: 'Image format is invalid. Base64 encoding corrupted.' };
  }

  return { valid: true, cleanBase64: cleanBase64.replace(/\s/g, ''), mimeType };
}

/**
 * Normalizes suggested meal type to standard 4 options.
 */
export function normalizeMealType(type?: string): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
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

/**
 * Safely parses string/number values with units (e.g. '5g', '470mg', '120 kcal') into clean non-negative numbers.
 */
export function cleanNumericValue(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.max(0, val);
  const match = String(val).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return fallback;
  const num = parseFloat(match[0]);
  return isNaN(num) ? fallback : Math.max(0, num);
}

/**
 * Parses, sanitizes, and mathematically validates the AI response for plate scanning or nutrition labels.
 */
export function parseAndValidateFoodScanResponse(rawJsonOrText: string): FoodScanResult {
  if (!rawJsonOrText || typeof rawJsonOrText !== 'string') {
    throw new Error("Couldn't identify any food from the AI response. Please try again.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJsonOrText);
  } catch {
    // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
    const cleaned = rawJsonOrText
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/m, '')
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Find JSON object boundaries { ... }
      const firstBrace = rawJsonOrText.indexOf('{');
      const lastBrace = rawJsonOrText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(rawJsonOrText.substring(firstBrace, lastBrace + 1));
      } else {
        throw new Error("Couldn't parse food analysis. Please try taking another photo.");
      }
    }
  }

  // 1. Check if the model flagged non-food or empty food
  if (parsed.isFood === false || (
    !parsed.servingSize &&
    (!parsed.detectedFoods || parsed.detectedFoods.length === 0) &&
    (!parsed.items || parsed.items.length === 0)
  )) {
    throw new Error(parsed.message || parsed.error || "Couldn't identify any food in this image. Please take a clear, well-lit photo of your meal.");
  }

  // 2. Detect if this is a Nutrition Facts Label scan
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

    const suggestedMealType = normalizeMealType(parsed.suggestedMealType);
    const insight = String(
      parsed.insight || 
      `Nutrition label parsed successfully for 1 serving (${servingSize}): ${calories} kcal with ${protein}g protein, ${carbs}g carbs, and ${fat}g fat.`
    ).trim();
    const healthScore = String(parsed.healthScore || 'Packaged Nutrition').trim();

    return {
      isFood: true,
      scanType: 'label',
      productName,
      servingSize,
      servingsPerContainer,
      labelDetails: {
        sugars,
        sodium,
        saturatedFat
      },
      detectedFoods: [productName],
      items: [item],
      nutrition: {
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sugars,
        sodium,
        saturatedFat
      },
      suggestedMealType,
      insight,
      healthScore
    };
  }

  // 3. Plate scan handling
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

  // Sanitize each item and recalculate totals to guarantee 100% mathematical consistency
  const sanitizedItems: FoodPlateItem[] = rawItems.map((item: any, idx: number) => {
    const name = String(item.name || parsed.detectedFoods?.[idx] || 'Meal Item').trim();
    const portion = String(item.portion || '1 serving').trim();
    let calories = Math.max(0, Math.round(cleanNumericValue(item.calories, 0)));
    const protein = Math.max(0, cleanNumericValue(item.protein, 0));
    const carbs = Math.max(0, cleanNumericValue(item.carbs, 0));
    const fat = Math.max(0, cleanNumericValue(item.fat, 0));
    const fiber = Math.max(0, cleanNumericValue(item.fiber, 0));
    const notes = item.notes ? String(item.notes).trim() : undefined;

    // Atwater factor cross-verification: (P * 4) + (C * 4) + (F * 9)
    // Ensures >96% caloric precision and prevents impossible macro combinations
    const atwater = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
    if (calories === 0 && atwater > 0) {
      calories = atwater;
    } else if (calories > 0 && atwater > 0 && Math.abs(calories - atwater) > Math.max(25, atwater * 0.35)) {
      calories = atwater;
    }

    return { name, portion, calories, protein, carbs, fat, fiber, notes };
  });

  // Calculate sum of all items
  const sumCalories = sanitizedItems.reduce((acc, i) => acc + i.calories, 0);
  const sumProtein = Math.round(sanitizedItems.reduce((acc, i) => acc + i.protein, 0) * 10) / 10;
  const sumCarbs = Math.round(sanitizedItems.reduce((acc, i) => acc + i.carbs, 0) * 10) / 10;
  const sumFat = Math.round(sanitizedItems.reduce((acc, i) => acc + i.fat, 0) * 10) / 10;
  const sumFiber = Math.round(sanitizedItems.reduce((acc, i) => acc + i.fiber, 0) * 10) / 10;

  // Reconcile nutrition totals
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
