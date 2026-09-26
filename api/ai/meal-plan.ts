import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDjtTL_trmdMEEH-BINiIAZD1ktgZwY0CE';

const DEFAULT_RECIPES = [
  {
    name: 'High-Protein Moong Dal Chilla & Mint Dip',
    dietaryType: 'Vegetarian',
    calories: 260,
    protein: 14,
    carbs: 34,
    fat: 6,
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: 'Blood Sugar Control & Satiety',
    ingredients: ['1/2 cup Yellow Moong Dal (soaked & blended)', '1/4 cup Grated Paneer', 'Chopped Coriander & Ginger', '1 tsp Olive Oil', 'Mint Yogurt Dip (50g)'],
    recipe: ['Blend soaked moong dal with spices.', 'Cook thin chilla on medium tawa.', 'Serve with mint yogurt dip.']
  },
  {
    name: 'Palak Paneer with Multigrain Phulka',
    dietaryType: 'Vegetarian',
    calories: 380,
    protein: 18,
    carbs: 32,
    fat: 16,
    prepTime: '15 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Metabolic & Iron Replenishment',
    ingredients: ['200g Fresh Spinach', '80g Low-Fat Paneer cubes', '2 Multigrain Phulkas (50g)', '1 tsp Mustard Oil'],
    recipe: ['Blanch and puree spinach.', 'Temper cumin and spices, add spinach puree and paneer.', 'Simmer and serve with phulkas.']
  },
  {
    name: 'Grilled Herb Chicken Breast with Steamed Quinoa & Greens',
    dietaryType: 'Non-Vegetarian',
    calories: 420,
    protein: 42,
    carbs: 28,
    fat: 10,
    prepTime: '20 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Lean Muscle & Weight Management',
    ingredients: ['180g Boneless Chicken Breast', '1/2 cup Cooked Quinoa', '100g Steamed Broccoli & Zucchini', '1 tsp Olive Oil'],
    recipe: ['Marinate chicken with herbs and lemon.', 'Grill 6-7 mins each side.', 'Serve with warm quinoa and steamed greens.']
  },
  {
    name: 'Steamed Pomfret Fish Curry with Brown Basmati Rice',
    dietaryType: 'Non-Vegetarian',
    calories: 360,
    protein: 32,
    carbs: 35,
    fat: 7,
    prepTime: '15 mins',
    cookTime: '12 mins',
    clinicalFocus: 'Cardiovascular & Omega-3 Care',
    ingredients: ['150g Fresh Pomfret Fillet', '1/2 cup Brown Basmati Rice', 'Tomato & Kokum Broth', 'Curry Leaves'],
    recipe: ['Temper spices and simmer kokum broth.', 'Slide fish fillets into simmering gravy for 7 mins.', 'Serve with brown rice.']
  },
  {
    name: 'Jain Paneer & Bottle Gourd (Doodhi) Curry with Roti',
    dietaryType: 'Jain',
    calories: 270,
    protein: 15,
    carbs: 28,
    fat: 9,
    prepTime: '10 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Jain Gut Health & Cooling Digestion',
    ingredients: ['150g Bottle Gourd (Doodhi)', '60g Fresh Paneer', 'Tomato Puree (no onion/garlic)', '2 Whole Wheat Rotis'],
    recipe: ['Cook diced bottle gourd until soft.', 'Simmer with tomato gravy and paneer cubes.', 'Serve fresh with rotis.']
  },
  {
    name: 'Jain Moong & Cabbage Tikki with Raw Mango Dip',
    dietaryType: 'Jain',
    calories: 240,
    protein: 12,
    carbs: 32,
    fat: 6,
    prepTime: '15 mins',
    cookTime: '10 mins',
    clinicalFocus: 'Jain Satiety & Low-GI',
    ingredients: ['1 cup Ground Moong Dal', '1/2 cup Shredded Cabbage', 'Roasted Cumin', '1 tsp Oil'],
    recipe: ['Form coarse moong mixture into flat tikkis.', 'Shallow fry until crisp.', 'Serve with mint/mango dip.']
  },
  {
    name: 'Tofu & Bell Pepper Stir-Fry with Sesame & Quinoa',
    dietaryType: 'Vegan',
    calories: 290,
    protein: 20,
    carbs: 24,
    fat: 11,
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: 'Plant-Based Anti-Inflammatory',
    ingredients: ['150g Firm Tofu', '1 cup Bell Peppers', '1/2 cup Cooked Quinoa', '1 tsp Sesame Seeds'],
    recipe: ['Stir fry peppers on high heat.', 'Toss tofu cubes with tamari and sesame.', 'Serve warm over quinoa.']
  },
  {
    name: 'Sprouted Methi & Black Chana Sundal',
    dietaryType: 'Vegan',
    calories: 250,
    protein: 13,
    carbs: 35,
    fat: 5,
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: 'Insulin Sensitivity & High Fiber',
    ingredients: ['1 cup Boiled Kala Chana', '2 tbsp Sprouted Methi', '1 tbsp Fresh Coconut', 'Curry Leaves'],
    recipe: ['Temper mustard and curry leaves.', 'Sauté chickpeas and sprouted methi.', 'Garnish with grated coconut.']
  },
  {
    name: 'Double Egg White & Spinach Bhurji with 2 Rotis',
    dietaryType: 'Eggetarian',
    calories: 320,
    protein: 22,
    carbs: 32,
    fat: 9,
    prepTime: '10 mins',
    cookTime: '8 mins',
    clinicalFocus: 'Lean Protein & Muscle Recovery',
    ingredients: ['3 Egg Whites + 1 Whole Egg', '1 cup Chopped Spinach', 'Tomatoes & Green Chilli', '2 Rotis'],
    recipe: ['Sauté cumin, tomatoes, and spinach.', 'Scramble whisked eggs gently until fluffy.', 'Serve warm with rotis.']
  },
  {
    name: 'Boiled Egg Chaat with Sprouted Moong & Lemon',
    dietaryType: 'Eggetarian',
    calories: 230,
    protein: 17,
    carbs: 18,
    fat: 8,
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: 'High-Protein Afternoon Satiety Snack',
    ingredients: ['2 Hard-Boiled Eggs', '1/2 cup Moong Sprouts', 'Cucumber & Tomatoes', 'Chaat Masala & Lemon'],
    recipe: ['Combine sprouts, cucumber, and tomatoes.', 'Toss with chaat masala and lemon.', 'Top with sliced boiled eggs.']
  }
];

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
    const { patientProfile, targets, instructions, availableRecipes } = req.body || {};

    const recipePool = Array.isArray(availableRecipes) && availableRecipes.length > 0
      ? availableRecipes
      : DEFAULT_RECIPES;

    // Extract Patient Clinical Conditions and Strict Allergies
    const rawConditions: string[] = [
      ...(patientProfile?.medicalHistory || []),
      ...(patientProfile?.healthInfo?.conditions && patientProfile.healthInfo.conditions.toLowerCase() !== 'none'
        ? patientProfile.healthInfo.conditions.split(',').map((c: string) => c.trim())
        : []),
      ...(patientProfile?.diagnosisOrProcedure ? [patientProfile.diagnosisOrProcedure] : [])
    ].filter(Boolean);

    const rawAllergies: string[] = [
      ...(Array.isArray(patientProfile?.allergies) ? patientProfile.allergies : []),
      ...(patientProfile?.healthInfo?.allergies && patientProfile.healthInfo.allergies.toLowerCase() !== 'none'
        ? patientProfile.healthInfo.allergies.split(',').map((a: string) => a.trim())
        : [])
    ].filter(Boolean);

    // Filter recipes compatible with patient dietary preference via clinical hierarchy
    const pDiet = (patientProfile?.dietaryType || '').toLowerCase();
    let eligibleRecipes = recipePool;
    if (pDiet && pDiet !== 'standard' && pDiet !== 'all') {
      const filtered = recipePool.filter((r: any) => {
        const rd = (r.dietaryType || 'vegetarian').toLowerCase();
        // Non-Vegetarian: Can consume all clinical recipes (Non-Veg, Eggetarian, Vegetarian, Jain, Vegan)
        if (pDiet === 'non-vegetarian' || pDiet === 'non veg' || pDiet === 'nonveg' || pDiet === 'omnivore') {
          return true;
        }
        // Eggetarian: Eggetarian, Vegetarian, Jain, Vegan
        if (pDiet === 'eggetarian' || pDiet === 'eggitarian') {
          return rd === 'eggetarian' || rd === 'eggitarian' || rd === 'vegetarian' || rd === 'veg' || rd === 'jain' || rd === 'vegan';
        }
        // Vegetarian: Vegetarian, Jain, Vegan (dairy OK, no eggs/meat)
        if (pDiet === 'vegetarian' || pDiet === 'veg' || pDiet === 'lacto-vegetarian') {
          return rd === 'vegetarian' || rd === 'veg' || rd === 'jain' || rd === 'vegan';
        }
        // Jain: strictly Jain
        if (pDiet === 'jain') {
          return rd === 'jain';
        }
        // Vegan: strictly Vegan
        if (pDiet === 'vegan') {
          return rd === 'vegan';
        }
        return rd === pDiet;
      });
      if (filtered.length >= 3) {
        eligibleRecipes = filtered;
      }
    }

    // Filter recipes against medical conditions and strict allergies
    if (rawConditions.length > 0 || rawAllergies.length > 0) {
      const lowerConditions = rawConditions.map(c => c.toLowerCase().trim());
      const lowerAllergies = rawAllergies.map(a => a.toLowerCase().trim()).filter(a => a !== 'none' && a !== 'nil');

      const safe = eligibleRecipes.filter((r: any) => {
        // Condition restrictions
        if (lowerConditions.length > 0) {
          if (Array.isArray(r.restrictedConditions) && r.restrictedConditions.length > 0) {
            const rc = r.restrictedConditions.map((c: string) => c.toLowerCase().trim());
            if (rc.some((cond: string) => lowerConditions.some(lc => lc.includes(cond) || cond.includes(lc)))) return false;
          }
          if (Array.isArray(r.contraindicatedFor) && r.contraindicatedFor.length > 0) {
            const cc = r.contraindicatedFor.map((c: string) => c.toLowerCase().trim());
            if (cc.some((cond: string) => lowerConditions.some(lc => lc.includes(cond) || cond.includes(lc)))) return false;
          }
        }
        // Strict allergies in ingredients
        if (lowerAllergies.length > 0) {
          const ingText = (Array.isArray(r.ingredients) ? r.ingredients.join(' ') : String(r.ingredients || '')).toLowerCase();
          const recText = (Array.isArray(r.recipe) ? r.recipe.join(' ') : String(r.recipe || '')).toLowerCase();
          const nameText = String(r.name || '').toLowerCase();
          const full = `${nameText} ${ingText} ${recText}`;
          if (lowerAllergies.some(alg => full.includes(alg))) return false;
        }
        return true;
      });

      if (safe.length >= 4) {
        eligibleRecipes = safe;
      }
    }

    const targetCalories = Number(targets?.calories) || 2000;
    const targetProtein = Number(targets?.protein) || Math.round((targetCalories * 0.25) / 4);
    const targetCarbs = Number(targets?.carbs) || Math.round((targetCalories * 0.50) / 4);
    const targetFat = Number(targets?.fat) || Math.round((targetCalories * 0.25) / 9);

    const recipeContext = eligibleRecipes.map((r: any) => ({
      name: r.name,
      dietaryType: r.dietaryType,
      calories: Number(r.calories) || 300,
      protein: Number(r.protein) || 15,
      carbs: Number(r.carbs) || 35,
      fat: Number(r.fat) || 8,
      prepTime: r.prepTime || '10 mins',
      cookTime: r.cookTime || '15 mins',
      ingredients: r.ingredients || [],
      recipe: r.recipe || [],
      clinicalFocus: r.clinicalFocus || 'Metabolic Wellness'
    }));

    let generatedPlan: any = null;

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `You are a licensed clinical dietician creating a 7-day meal plan.
Patient: ${JSON.stringify(patientProfile || {})}
Dietary Notes: ${instructions || 'None'}

STRICT DAILY CALORIC TARGET TO ENFORCE:
- Target Daily Calories: ${targetCalories} kcal (Target range: ${targetCalories - 60} to ${targetCalories + 60} kcal).
- Target Macros: Protein ~${targetProtein}g, Carbs ~${targetCarbs}g, Fat ~${targetFat}g.
- MANDATORY CALORIC CEILING: For EVERY single day (Day 1 through Day 7), the sum of calories across all 4 meals MUST closely equal ${targetCalories} kcal.
- Suggested Calorie Distribution per day:
  * Breakfast: ~28% of daily calories (~${Math.round(targetCalories * 0.28)} kcal)
  * Lunch: ~38% of daily calories (~${Math.round(targetCalories * 0.38)} kcal)
  * Evening Snack: ~12% of daily calories (~${Math.round(targetCalories * 0.12)} kcal)
  * Dinner: ~22% of daily calories (~${Math.round(targetCalories * 0.22)} kcal)
- Adjust the "portion" string and the meal "calories" / macros proportionally (e.g. "1.5 servings", "1 plate + 1 roti") so that each day precisely achieves the ${targetCalories} kcal goal.

CLINICAL CONDITIONS & ALLERGIES TO STRICTLY ENFORCE:
- Medical Conditions: ${rawConditions.length > 0 ? rawConditions.join(', ') : 'None flagged'}
- STRICT ALLERGIES / INTOLERANCES: ${rawAllergies.length > 0 ? rawAllergies.join(', ') : 'None flagged'}
- CLINICAL DIRECTIVE: You MUST NEVER prescribe or select any recipe containing the patient's allergens (${rawAllergies.join(', ')}). All chosen recipes must be clinically safe for ${rawConditions.join(', ') || 'general wellness'}.

CLINICAL DIETARY HIERARCHY LOGIC:
- Non-Vegetarian: Can and should consume dishes across all categories (Non-Vegetarian, Eggetarian, Vegetarian, Jain, Vegan). Provide a realistic, well-rounded clinical Indian diet including healthy vegetarian dals, rotis, sabzis, and salads alongside lean non-veg dishes.
- Eggetarian: Can consume Eggetarian, Vegetarian, Jain, and Vegan recipes (strictly NO meat, poultry, or fish).
- Vegetarian: Can consume Vegetarian, Jain, and Vegan recipes (dairy allowed; strictly NO eggs, poultry, meat, or fish).
- Jain: STRICTLY Jain recipes only (no onion, garlic, potatoes, tubers, meat, or eggs).
- Vegan: STRICTLY 100% plant-based recipes only (no dairy, paneer, curd, ghee, butter, eggs, honey, or meat).

CRITICAL REQUIREMENT:
You MUST ONLY select dishes and meals from the following pre-provided clinical recipe list.
DO NOT CREATE, INVENT, OR SUGGEST ANY DISH OR RECIPE OUTSIDE OF THIS LIST:
${JSON.stringify(recipeContext)}

Return ONLY a valid JSON array of 7 objects (Day 1 through Day 7). Each day must have 4 meals: Breakfast, Lunch, Evening Snack, Dinner.
Each meal must match a dish name from the pre-provided list. Ensure the day's total calories sum to ~${targetCalories} kcal.

JSON Array format:
[
  {
    "dayNumber": 1,
    "meals": [
      {
        "type": "Breakfast",
        "name": "Recipe Name from List",
        "portion": "1 serving",
        "calories": ${Math.round(targetCalories * 0.28)},
        "protein": 18,
        "carbs": 40,
        "fat": 10,
        "prepTime": "10 mins",
        "cookTime": "10 mins",
        "ingredients": ["item 1", "item 2"],
        "recipe": ["step 1", "step 2"],
        "notes": "Clinical breakfast note"
      }
    ]
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      if (Array.isArray(parsed) && parsed.length === 7) {
        // Enforce that every meal name exists in eligibleRecipes & calibrated to targetCalories
        const verified = parsed.map((dayObj: any, dIdx: number) => {
          const rawMeals = (dayObj.meals || []).map((m: any, mIdx: number) => {
            const match = eligibleRecipes.find((r: any) => r.name.toLowerCase() === (m.name || '').toLowerCase());
            const baseRecipe = match || eligibleRecipes[(dIdx + mIdx) % eligibleRecipes.length];
            const baseCals = Number(baseRecipe.calories) || 300;
            const mealCals = Number(m.calories) > 50 ? Number(m.calories) : baseCals;

            return {
              type: m.type || (mIdx === 0 ? 'Breakfast' : mIdx === 1 ? 'Lunch' : mIdx === 2 ? 'Evening Snack' : 'Dinner'),
              name: baseRecipe.name,
              portion: m.portion || '1 serving',
              calories: mealCals,
              protein: Number(m.protein) || Number(baseRecipe.protein) || 15,
              carbs: Number(m.carbs) || Number(baseRecipe.carbs) || 35,
              fat: Number(m.fat) || Number(baseRecipe.fat) || 8,
              prepTime: baseRecipe.prepTime || '10 mins',
              cookTime: baseRecipe.cookTime || '15 mins',
              ingredients: baseRecipe.ingredients || [],
              recipe: baseRecipe.recipe || [],
              notes: m.notes || baseRecipe.clinicalFocus || 'Clinical Nutrition'
            };
          });

          // Check Day Calorie Sum against Target Calories
          const currentDaySum = rawMeals.reduce((acc: number, item: any) => acc + (Number(item.calories) || 0), 0);
          if (currentDaySum > 0 && Math.abs(currentDaySum - targetCalories) > 100) {
            const scale = targetCalories / currentDaySum;
            // Calibrate meals proportionally to accurately respect targetCalories
            let runningSum = 0;
            const calibratedMeals = rawMeals.map((meal: any, idx: number) => {
              if (idx === rawMeals.length - 1) {
                // Last meal absorbs remainder for exact match
                const remainderCals = Math.max(100, targetCalories - runningSum);
                return {
                  ...meal,
                  calories: remainderCals,
                  protein: Math.round(meal.protein * scale),
                  carbs: Math.round(meal.carbs * scale),
                  fat: Math.round(meal.fat * scale)
                };
              }
              const scaledCals = Math.round(meal.calories * scale);
              runningSum += scaledCals;
              return {
                ...meal,
                calories: scaledCals,
                protein: Math.round(meal.protein * scale),
                carbs: Math.round(meal.carbs * scale),
                fat: Math.round(meal.fat * scale)
              };
            });
            return {
              dayNumber: dayObj.dayNumber || dIdx + 1,
              meals: calibratedMeals
            };
          }

          return {
            dayNumber: dayObj.dayNumber || dIdx + 1,
            meals: rawMeals
          };
        });

        generatedPlan = verified;
      }
    } catch (aiErr) {
      console.warn('Gemini meal plan generation error, falling back to deterministic assembly:', aiErr);
    }

    // Deterministic fallback using pre-provided recipes calibrated to targetCalories
    if (!generatedPlan) {
      const days = [];
      const mealSlots = [
        { slot: 'Breakfast', ratio: 0.28 },
        { slot: 'Lunch', ratio: 0.38 },
        { slot: 'Evening Snack', ratio: 0.12 },
        { slot: 'Dinner', ratio: 0.22 }
      ];

      for (let day = 1; day <= 7; day++) {
        let runningDaySum = 0;
        const meals = mealSlots.map(({ slot, ratio }, sIdx) => {
          const r = eligibleRecipes[(day + sIdx - 1) % eligibleRecipes.length];
          const slotTarget = sIdx === mealSlots.length - 1
            ? Math.max(150, targetCalories - runningDaySum)
            : Math.round(targetCalories * ratio);
          runningDaySum += slotTarget;

          const baseCals = Number(r.calories) || 300;
          const scale = slotTarget / baseCals;
          const portionText = scale > 1.25
            ? `${(Math.round(scale * 10) / 10)}x portion (${r.portionSize || '1 serving'})`
            : r.portionSize || '1 serving';

          return {
            type: slot,
            name: r.name,
            portion: portionText,
            calories: slotTarget,
            protein: Math.round((Number(r.protein) || 15) * scale),
            carbs: Math.round((Number(r.carbs) || 35) * scale),
            fat: Math.round((Number(r.fat) || 8) * scale),
            prepTime: r.prepTime || '10 mins',
            cookTime: r.cookTime || '15 mins',
            ingredients: r.ingredients || [],
            recipe: r.recipe || [],
            notes: `Clinical Approved Recipe (${r.dietaryType}) — ${r.clinicalFocus || 'Calibrated Target Nutrition'}`
          };
        });
        days.push({ dayNumber: day, meals });
      }
      generatedPlan = days;
    }

    return res.status(200).json(generatedPlan);
  } catch (error: any) {
    console.error('Meal plan endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
