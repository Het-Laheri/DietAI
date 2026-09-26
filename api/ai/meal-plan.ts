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

    const recipeContext = eligibleRecipes.map((r: any) => ({
      name: r.name,
      dietaryType: r.dietaryType,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
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
Macro Targets: ${JSON.stringify(targets || { calories: 2000, protein: 120, carbs: 200, fat: 60 })}
Dietary Notes: ${instructions || 'None'}

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
Each meal must use the exact name, ingredients, recipe, calories, and macros from the matching pre-provided recipe.

JSON Array format:
[
  {
    "dayNumber": 1,
    "meals": [
      {
        "type": "Breakfast",
        "name": "Recipe Name from List",
        "portion": "1 serving",
        "calories": 300,
        "protein": 15,
        "carbs": 35,
        "fat": 8,
        "prepTime": "10 mins",
        "cookTime": "10 mins",
        "ingredients": ["item 1", "item 2"],
        "recipe": ["step 1", "step 2"],
        "notes": "Dietician clinical note"
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
        // Enforce that every meal name exists in eligibleRecipes
        const verified = parsed.map((dayObj: any, dIdx: number) => ({
          dayNumber: dayObj.dayNumber || dIdx + 1,
          meals: (dayObj.meals || []).map((m: any, mIdx: number) => {
            const match = eligibleRecipes.find((r: any) => r.name.toLowerCase() === (m.name || '').toLowerCase());
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
            // Fallback to an eligible recipe from catalog
            const fallback = eligibleRecipes[(dIdx + mIdx) % eligibleRecipes.length];
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
        generatedPlan = verified;
      }
    } catch (aiErr) {
      console.warn('Gemini meal plan generation error, falling back to deterministic assembly:', aiErr);
    }

    // Deterministic fallback using pre-provided recipes only
    if (!generatedPlan) {
      const days = [];
      const mealSlots = ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'];
      for (let day = 1; day <= 7; day++) {
        const meals = mealSlots.map((slot, sIdx) => {
          const r = eligibleRecipes[(day + sIdx - 1) % eligibleRecipes.length];
          return {
            type: slot,
            name: r.name,
            portion: '1 serving',
            calories: Number(r.calories) || 300,
            protein: Number(r.protein) || 15,
            carbs: Number(r.carbs) || 35,
            fat: Number(r.fat) || 8,
            prepTime: r.prepTime || '10 mins',
            cookTime: r.cookTime || '15 mins',
            ingredients: r.ingredients || [],
            recipe: r.recipe || [],
            notes: `Clinical Approved Recipe (${r.dietaryType}) — ${r.clinicalFocus || 'Metabolic Balance'}`
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
