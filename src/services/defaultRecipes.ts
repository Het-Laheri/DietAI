import type { RecipeDBItem } from './db';

// Canonical 200 Clinical Exchange-List Recipes loaded directly from 200_Exchange_List_Based_Recipes.xlsx
export const DEFAULT_CLINICAL_RECIPES: RecipeDBItem[] = [
  {
    "id": "rec_ex_1_vegetable_daliya_upma",
    "name": "Vegetable Daliya Upma",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Daliya",
      "Veg A"
    ],
    "recipe": [
      "Dry-roast the cereal component lightly.",
      "Sauté the vegetable component with minimal oil, add water, bring to a simmer, then add the roasted cereal gradually while stirring.",
      "Cook until fluffy."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_2_ragi_vegetable_pancake",
    "name": "Ragi Vegetable Pancake",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Ragi",
      "Veg B"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_3_jowar_moong_chilla",
    "name": "Jowar Moong Chilla",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 190,
    "carbs": 35.5,
    "protein": 9,
    "fat": 1,
    "fiber": 7,
    "sodium": 5,
    "potassium": 419,
    "ingredients": [
      "Jowar",
      "Pulse"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_4_barley_vegetable_porridge",
    "name": "Barley Vegetable Porridge",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Barley",
      "Veg A"
    ],
    "recipe": [
      "Rinse the cereal/grain.",
      "Cook it with the listed milk/water until soft and creamy.",
      "Add the listed fruit or nuts, simmer briefly, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_5_quinoa_vegetable_bowl",
    "name": "Quinoa Vegetable Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 120,
    "carbs": 19,
    "protein": 5.4,
    "fat": 1.9,
    "fiber": 6.9,
    "sodium": 13.3,
    "potassium": 382,
    "ingredients": [
      "Quinoa",
      "Veg A"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_6_wheat_vegetable_upma",
    "name": "Wheat Vegetable Upma",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Wheat",
      "Veg B"
    ],
    "recipe": [
      "Dry-roast the cereal component lightly.",
      "Sauté the vegetable component with minimal oil, add water, bring to a simmer, then add the roasted cereal gradually while stirring.",
      "Cook until fluffy."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_7_semolina_vegetable_upma",
    "name": "Semolina Vegetable Upma",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Semolina",
      "Veg A"
    ],
    "recipe": [
      "Dry-roast the cereal component lightly.",
      "Sauté the vegetable component with minimal oil, add water, bring to a simmer, then add the roasted cereal gradually while stirring.",
      "Cook until fluffy."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_8_vermicelli_vegetable_upma",
    "name": "Vermicelli Vegetable Upma",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Vermicelli",
      "Veg B"
    ],
    "recipe": [
      "Dry-roast the cereal component lightly.",
      "Sauté the vegetable component with minimal oil, add water, bring to a simmer, then add the roasted cereal gradually while stirring.",
      "Cook until fluffy."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_9_bajra_moong_chilla",
    "name": "Bajra Moong Chilla",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 190,
    "carbs": 35.5,
    "protein": 9,
    "fat": 1,
    "fiber": 7,
    "sodium": 5,
    "potassium": 419,
    "ingredients": [
      "Bajra",
      "Pulse"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_10_samai_vegetable_khichdi",
    "name": "Samai Vegetable Khichdi",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 210,
    "carbs": 38.5,
    "protein": 10.5,
    "fat": 1.3,
    "fiber": 9.5,
    "sodium": 17,
    "potassium": 659,
    "ingredients": [
      "Samai",
      "Pulse",
      "Veg A"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_11_ragi_moong_dosa",
    "name": "Ragi Moong Dosa",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 190,
    "carbs": 35.5,
    "protein": 9,
    "fat": 1,
    "fiber": 7,
    "sodium": 5,
    "potassium": 419,
    "ingredients": [
      "Ragi",
      "Pulse"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_12_jowar_vegetable_dosa",
    "name": "Jowar Vegetable Dosa",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Jowar",
      "Veg A"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_13_quinoa_paneer_bowl",
    "name": "Quinoa Paneer Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 200,
    "carbs": 20.9,
    "protein": 11.4,
    "fat": 7.5,
    "fiber": 4.4,
    "sodium": 8.5,
    "potassium": 167.4,
    "ingredients": [
      "Quinoa",
      "Paneer"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_14_daliya_milk_porridge",
    "name": "Daliya Milk Porridge",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 173,
    "carbs": 25.9,
    "protein": 5.7,
    "fat": 5,
    "fiber": 2.5,
    "sodium": 26.5,
    "potassium": 188,
    "ingredients": [
      "Daliya",
      "Milk C"
    ],
    "recipe": [
      "Rinse the cereal/grain.",
      "Cook it with the listed milk/water until soft and creamy.",
      "Add the listed fruit or nuts, simmer briefly, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_15_daliya_apple_porridge",
    "name": "Daliya Apple Porridge",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 223,
    "carbs": 35.9,
    "protein": 6.7,
    "fat": 5.3,
    "fiber": 5.5,
    "sodium": 29.1,
    "potassium": 403,
    "ingredients": [
      "Daliya",
      "Milk C",
      "Fruit"
    ],
    "recipe": [
      "Rinse the cereal/grain.",
      "Cook it with the listed milk/water until soft and creamy.",
      "Add the listed fruit or nuts, simmer briefly, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_16_ragi_banana_porridge",
    "name": "Ragi Banana Porridge",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 223,
    "carbs": 35.9,
    "protein": 6.7,
    "fat": 5.3,
    "fiber": 5.5,
    "sodium": 29.1,
    "potassium": 403,
    "ingredients": [
      "Ragi",
      "Milk C",
      "Fruit"
    ],
    "recipe": [
      "Rinse the cereal/grain.",
      "Cook it with the listed milk/water until soft and creamy.",
      "Add the listed fruit or nuts, simmer briefly, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_17_barley_pear_porridge",
    "name": "Barley Pear Porridge",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 223,
    "carbs": 35.9,
    "protein": 6.7,
    "fat": 5.3,
    "fiber": 5.5,
    "sodium": 29.1,
    "potassium": 403,
    "ingredients": [
      "Barley",
      "Milk C",
      "Fruit"
    ],
    "recipe": [
      "Rinse the cereal/grain.",
      "Cook it with the listed milk/water until soft and creamy.",
      "Add the listed fruit or nuts, simmer briefly, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_18_quinoa_fruit_bowl",
    "name": "Quinoa Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 150,
    "carbs": 26,
    "protein": 4.9,
    "fat": 1.9,
    "fiber": 7.4,
    "sodium": 3.9,
    "potassium": 357,
    "ingredients": [
      "Quinoa",
      "Fruit"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_19_wheat_banana_bowl",
    "name": "Wheat Banana Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 223,
    "carbs": 35.9,
    "protein": 6.7,
    "fat": 5.3,
    "fiber": 5.5,
    "sodium": 29.1,
    "potassium": 403,
    "ingredients": [
      "Wheat",
      "Fruit",
      "Milk C"
    ],
    "recipe": [
      "Rinse the cereal/grain.",
      "Cook it with the listed milk/water until soft and creamy.",
      "Add the listed fruit or nuts, simmer briefly, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_20_semolina_milk_porridge",
    "name": "Semolina Milk Porridge",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 173,
    "carbs": 25.9,
    "protein": 5.7,
    "fat": 5,
    "fiber": 2.5,
    "sodium": 26.5,
    "potassium": 188,
    "ingredients": [
      "Semolina",
      "Milk C"
    ],
    "recipe": [
      "Rinse the cereal/grain.",
      "Cook it with the listed milk/water until soft and creamy.",
      "Add the listed fruit or nuts, simmer briefly, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_21_vegetable_corn_breakfast_bowl",
    "name": "Vegetable Corn Breakfast Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 120,
    "carbs": 20.7,
    "protein": 4.8,
    "fat": 1.5,
    "fiber": 0,
    "sodium": 0,
    "potassium": 0,
    "ingredients": [
      "Tender Corn",
      "Veg A"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_22_peas_daliya_breakfast",
    "name": "Peas Daliya Breakfast",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 181,
    "carbs": 32.9,
    "protein": 9.8,
    "fat": 0.6,
    "fiber": 8.8,
    "sodium": 4.7,
    "potassium": 322,
    "ingredients": [
      "Daliya",
      "Peas"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_23_soy_quinoa_breakfast_bowl",
    "name": "Soy Quinoa Breakfast Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 195,
    "carbs": 18.8,
    "protein": 13.1,
    "fat": 6.5,
    "fiber": 9.9,
    "sodium": 1.8,
    "potassium": 547,
    "ingredients": [
      "Soybean",
      "Quinoa"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_24_paneer_vegetable_daliya",
    "name": "Paneer Vegetable Daliya",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Daliya",
      "Paneer",
      "Veg A"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_25_paneer_jowar_chilla",
    "name": "Paneer Jowar Chilla",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 200,
    "carbs": 25.9,
    "protein": 10,
    "fat": 6.4,
    "fiber": 2.5,
    "sodium": 8.2,
    "potassium": 98.4,
    "ingredients": [
      "Jowar",
      "Paneer"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_26_moong_vegetable_chilla",
    "name": "Moong Vegetable Chilla",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 110,
    "carbs": 17.5,
    "protein": 8,
    "fat": 0.8,
    "fiber": 7,
    "sodium": 16,
    "potassium": 586,
    "ingredients": [
      "Pulse",
      "Veg A"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_27_soy_vegetable_chilla",
    "name": "Soy Vegetable Chilla",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 115,
    "carbs": 5.8,
    "protein": 10.7,
    "fat": 5.2,
    "fiber": 8,
    "sodium": 12.5,
    "potassium": 645,
    "ingredients": [
      "Soybean",
      "Veg A"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_28_bajra_paneer_bowl",
    "name": "Bajra Paneer Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Bajra",
      "Paneer",
      "Veg A"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_29_barley_peas_porridge",
    "name": "Barley Peas Porridge",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 181,
    "carbs": 32.9,
    "protein": 9.8,
    "fat": 0.6,
    "fiber": 8.8,
    "sodium": 4.7,
    "potassium": 322,
    "ingredients": [
      "Barley",
      "Peas"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_30_ragi_paneer_pancake",
    "name": "Ragi Paneer Pancake",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 200,
    "carbs": 25.9,
    "protein": 10,
    "fat": 6.4,
    "fiber": 2.5,
    "sodium": 8.2,
    "potassium": 98.4,
    "ingredients": [
      "Ragi",
      "Paneer"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_31_samai_paneer_upma",
    "name": "Samai Paneer Upma",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Samai",
      "Paneer",
      "Veg A"
    ],
    "recipe": [
      "Dry-roast the cereal component lightly.",
      "Sauté the vegetable component with minimal oil, add water, bring to a simmer, then add the roasted cereal gradually while stirring.",
      "Cook until fluffy."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_32_wheat_egg_bowl",
    "name": "Wheat Egg Bowl",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 187,
    "carbs": 24,
    "protein": 10.5,
    "fat": 5.3,
    "fiber": 5,
    "sodium": 74,
    "potassium": 382,
    "ingredients": [
      "Wheat",
      "Egg",
      "Veg A"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_33_ragi_egg_pancake",
    "name": "Ragi Egg Pancake",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 187,
    "carbs": 24,
    "protein": 10.5,
    "fat": 5.3,
    "fiber": 5,
    "sodium": 74,
    "potassium": 382,
    "ingredients": [
      "Ragi",
      "Egg",
      "Veg A"
    ],
    "recipe": [
      "Mix the cereal/grain component with the pulse/vegetable component and enough water to form a pourable batter.",
      "Rest 5-10 minutes, cook on a hot non-stick pan using minimal oil, flip, and cook through."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_34_daliya_egg_upma",
    "name": "Daliya Egg Upma",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 207,
    "carbs": 26,
    "protein": 11.5,
    "fat": 5.5,
    "fiber": 7,
    "sodium": 107,
    "potassium": 472,
    "ingredients": [
      "Daliya",
      "Egg",
      "Veg B"
    ],
    "recipe": [
      "Dry-roast the cereal component lightly.",
      "Sauté the vegetable component with minimal oil, add water, bring to a simmer, then add the roasted cereal gradually while stirring.",
      "Cook until fluffy."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_35_quinoa_egg_bowl",
    "name": "Quinoa Egg Bowl",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Breakfast"
    ],
    "calories": 187,
    "carbs": 19,
    "protein": 11.9,
    "fat": 6.4,
    "fiber": 6.9,
    "sodium": 74.3,
    "potassium": 451,
    "ingredients": [
      "Quinoa",
      "Egg",
      "Veg A"
    ],
    "recipe": [
      "Wash and prepare the ingredients.",
      "Combine the listed exchange portions, cook using minimal oil and water as appropriate, season to the desired taste, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Breakfast • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_36_guava_fruit_bowl",
    "name": "Guava Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_37_apple_fruit_bowl",
    "name": "Apple Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_38_papaya_fruit_bowl",
    "name": "Papaya Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_39_watermelon_fruit_bowl",
    "name": "Watermelon Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_40_muskmelon_fruit_bowl",
    "name": "Muskmelon Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_41_pineapple_fruit_bowl",
    "name": "Pineapple Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_42_pear_fruit_bowl",
    "name": "Pear Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_43_orange_fruit_bowl",
    "name": "Orange Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_44_pomegranate_fruit_bowl",
    "name": "Pomegranate Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_45_mixed_gap3_fruit_bowl",
    "name": "Mixed GAP3 Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_46_date_nut_mini_bowl",
    "name": "Date & Nut Mini Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 157,
    "carbs": 16.5,
    "protein": 4.2,
    "fat": 8.6,
    "fiber": 9,
    "sodium": 3.6,
    "potassium": 417,
    "ingredients": [
      "Fruit"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_47_fruit_milk_smoothie",
    "name": "Fruit Milk Smoothie",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 123,
    "carbs": 14.9,
    "protein": 4.2,
    "fat": 4.8,
    "fiber": 3,
    "sodium": 28.1,
    "potassium": 330,
    "ingredients": [
      "Milk-based"
    ],
    "recipe": [
      "Blend the listed fruit with the milk component until smooth.",
      "Do not add sugar unless clinically prescribed; serve immediately."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_48_fruit_milk_b_smoothie",
    "name": "Fruit Milk B Smoothie",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 157,
    "carbs": 18.3,
    "protein": 4.6,
    "fat": 6.9,
    "fiber": 3,
    "sodium": 32.7,
    "potassium": 324,
    "ingredients": [
      "Milk-based"
    ],
    "recipe": [
      "Blend the listed fruit with the milk component until smooth.",
      "Do not add sugar unless clinically prescribed; serve immediately."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_49_plain_milk_drink",
    "name": "Plain Milk Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 73,
    "carbs": 4.9,
    "protein": 3.2,
    "fat": 4.5,
    "fiber": 0,
    "sodium": 25.5,
    "potassium": 115,
    "ingredients": [
      "Milk-based"
    ],
    "recipe": [
      "Warm the milk gently, do not boil repeatedly, and serve warm or chilled."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_50_creamier_milk_drink",
    "name": "Creamier Milk Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 107,
    "carbs": 8.3,
    "protein": 3.6,
    "fat": 6.6,
    "fiber": 0,
    "sodium": 30.1,
    "potassium": 109,
    "ingredients": [
      "Milk-based"
    ],
    "recipe": [
      "Warm the milk gently and serve as a richer milk beverage."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_51_vegetable_clear_soup",
    "name": "Vegetable Clear Soup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 40,
    "carbs": 6,
    "protein": 3,
    "fat": 0.6,
    "fiber": 5,
    "sodium": 24,
    "potassium": 480,
    "ingredients": [
      "Soup"
    ],
    "recipe": [
      "Cook the listed vegetables until tender.",
      "Blend partially or fully as desired.",
      "Add the pulse/protein component and simmer briefly; adjust consistency with water."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_52_mixed_vegetable_soup",
    "name": "Mixed Vegetable Soup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 60,
    "carbs": 8,
    "protein": 4,
    "fat": 0.8,
    "fiber": 7,
    "sodium": 57,
    "potassium": 570,
    "ingredients": [
      "Soup"
    ],
    "recipe": [
      "Cook the listed vegetables until tender.",
      "Blend partially or fully as desired.",
      "Add the pulse/protein component and simmer briefly; adjust consistency with water."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_53_renal_vegetable_soup",
    "name": "Renal Vegetable Soup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 50,
    "carbs": 6,
    "protein": 2.4,
    "fat": 0.6,
    "fiber": 5,
    "sodium": 18,
    "potassium": 396,
    "ingredients": [
      "Soup"
    ],
    "recipe": [
      "Cook the listed vegetables until tender.",
      "Blend partially or fully as desired.",
      "Add the pulse/protein component and simmer briefly; adjust consistency with water."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_54_peas_soup",
    "name": "Peas Soup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 101,
    "carbs": 14.9,
    "protein": 8.8,
    "fat": 0.4,
    "fiber": 8.8,
    "sodium": 15.7,
    "potassium": 489,
    "ingredients": [
      "Soup"
    ],
    "recipe": [
      "Cook the listed vegetables until tender.",
      "Blend partially or fully as desired.",
      "Add the pulse/protein component and simmer briefly; adjust consistency with water."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_55_moong_vegetable_soup",
    "name": "Moong Vegetable Soup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 110,
    "carbs": 17.5,
    "protein": 8,
    "fat": 0.8,
    "fiber": 7,
    "sodium": 16,
    "potassium": 586,
    "ingredients": [
      "Soup"
    ],
    "recipe": [
      "Cook the listed vegetables until tender.",
      "Blend partially or fully as desired.",
      "Add the pulse/protein component and simmer briefly; adjust consistency with water."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_56_soy_vegetable_soup",
    "name": "Soy Vegetable Soup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 115,
    "carbs": 5.8,
    "protein": 10.7,
    "fat": 5.2,
    "fiber": 8,
    "sodium": 12.5,
    "potassium": 645,
    "ingredients": [
      "Soup"
    ],
    "recipe": [
      "Cook the listed vegetables until tender.",
      "Blend partially or fully as desired.",
      "Add the pulse/protein component and simmer briefly; adjust consistency with water."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_57_corn_vegetable_soup",
    "name": "Corn Vegetable Soup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 20.7,
    "protein": 4.8,
    "fat": 1.5,
    "fiber": 0,
    "sodium": 0,
    "potassium": 0,
    "ingredients": [
      "Soup"
    ],
    "recipe": [
      "Cook the listed vegetables until tender.",
      "Blend partially or fully as desired.",
      "Add the pulse/protein component and simmer briefly; adjust consistency with water."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_58_quinoa_vegetable_soup",
    "name": "Quinoa Vegetable Soup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 19,
    "protein": 5.4,
    "fat": 1.9,
    "fiber": 6.9,
    "sodium": 13.3,
    "potassium": 382,
    "ingredients": [
      "Soup"
    ],
    "recipe": [
      "Cook the listed vegetables until tender.",
      "Blend partially or fully as desired.",
      "Add the pulse/protein component and simmer briefly; adjust consistency with water."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_59_paneer_vegetable_soup",
    "name": "Paneer Vegetable Soup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 7.9,
    "protein": 9,
    "fat": 6.2,
    "fiber": 2.5,
    "sodium": 19.2,
    "potassium": 265.4,
    "ingredients": [
      "Soup"
    ],
    "recipe": [
      "Cook the listed vegetables until tender.",
      "Blend partially or fully as desired.",
      "Add the pulse/protein component and simmer briefly; adjust consistency with water."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_60_fruit_lassi_style_drink",
    "name": "Fruit Lassi-style Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 123,
    "carbs": 14.9,
    "protein": 4.2,
    "fat": 4.8,
    "fiber": 3,
    "sodium": 28.1,
    "potassium": 330,
    "ingredients": [
      "Lassi-style"
    ],
    "recipe": [
      "Blend milk with fruit until smooth.",
      "Serve chilled without added sugar."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_61_mango_lassi_style_drink",
    "name": "Mango Lassi-style Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 123,
    "carbs": 14.9,
    "protein": 4.2,
    "fat": 4.8,
    "fiber": 3,
    "sodium": 28.1,
    "potassium": 330,
    "ingredients": [
      "Lassi-style"
    ],
    "recipe": [
      "Blend milk with the fruit exchange until smooth.",
      "Chill and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_62_banana_lassi_style_drink",
    "name": "Banana Lassi-style Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 123,
    "carbs": 14.9,
    "protein": 4.2,
    "fat": 4.8,
    "fiber": 3,
    "sodium": 28.1,
    "potassium": 330,
    "ingredients": [
      "Lassi-style"
    ],
    "recipe": [
      "Blend milk with banana-equivalent fruit until smooth.",
      "Serve immediately."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_63_papaya_lassi_style_drink",
    "name": "Papaya Lassi-style Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 123,
    "carbs": 14.9,
    "protein": 4.2,
    "fat": 4.8,
    "fiber": 3,
    "sodium": 28.1,
    "potassium": 330,
    "ingredients": [
      "Lassi-style"
    ],
    "recipe": [
      "Blend milk with papaya-equivalent fruit until smooth.",
      "Serve chilled."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_64_guava_lassi_style_drink",
    "name": "Guava Lassi-style Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 123,
    "carbs": 14.9,
    "protein": 4.2,
    "fat": 4.8,
    "fiber": 3,
    "sodium": 28.1,
    "potassium": 330,
    "ingredients": [
      "Lassi-style"
    ],
    "recipe": [
      "Blend milk with guava-equivalent fruit until smooth.",
      "Serve chilled."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_65_strawberry_lassi_style_drink",
    "name": "Strawberry Lassi-style Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 123,
    "carbs": 14.9,
    "protein": 4.2,
    "fat": 4.8,
    "fiber": 3,
    "sodium": 28.1,
    "potassium": 330,
    "ingredients": [
      "Lassi-style"
    ],
    "recipe": [
      "Blend milk with strawberry-equivalent fruit until smooth.",
      "Serve chilled."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_66_paneer_fruit_mini_bowl",
    "name": "Paneer Fruit Mini Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 150,
    "carbs": 14.9,
    "protein": 8.5,
    "fat": 6.2,
    "fiber": 3,
    "sodium": 9.8,
    "potassium": 240.4,
    "ingredients": [
      "Snack"
    ],
    "recipe": [
      "Cube paneer, add chopped fruit, mix gently, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_67_nut_milk_mini_drink",
    "name": "Nut Milk Mini Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 173,
    "carbs": 7.9,
    "protein": 7.2,
    "fat": 13,
    "fiber": 2.5,
    "sodium": 27.5,
    "potassium": 243,
    "ingredients": [
      "Snack"
    ],
    "recipe": [
      "Blend nuts with the milk exchange and serve immediately."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_68_coconut_fruit_bowl",
    "name": "Coconut Fruit Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 150,
    "carbs": 11.5,
    "protein": 1.8,
    "fat": 10.6,
    "fiber": 4.5,
    "sodium": 3.8,
    "potassium": 251.9,
    "ingredients": [
      "Snack"
    ],
    "recipe": [
      "Mix fresh coconut with chopped fruit and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_69_date_milk_drink",
    "name": "Date Milk Drink",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 130,
    "carbs": 18.4,
    "protein": 3.4,
    "fat": 4.6,
    "fiber": 6.5,
    "sodium": 27.1,
    "potassium": 404,
    "ingredients": [
      "Snack"
    ],
    "recipe": [
      "Blend dates with milk until smooth.",
      "Serve immediately."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_70_fruit_quinoa_cup",
    "name": "Fruit & Quinoa Cup",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 150,
    "carbs": 26,
    "protein": 4.9,
    "fat": 1.9,
    "fiber": 7.4,
    "sodium": 3.9,
    "potassium": 357,
    "ingredients": [
      "Snack"
    ],
    "recipe": [
      "Combine cooked quinoa with chopped fruit and chill before serving."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Mid-morning / Mid-evening • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_71_roasted_moong_chaat",
    "name": "Roasted Moong Chaat",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 110,
    "carbs": 17.5,
    "protein": 8,
    "fat": 0.8,
    "fiber": 7,
    "sodium": 16,
    "potassium": 586,
    "ingredients": [
      "Roasted Moong Chaat portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_72_soy_chaat",
    "name": "Soy Chaat",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 115,
    "carbs": 5.8,
    "protein": 10.7,
    "fat": 5.2,
    "fiber": 8,
    "sodium": 12.5,
    "potassium": 645,
    "ingredients": [
      "Soy Chaat portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_73_peas_chaat",
    "name": "Peas Chaat",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 101,
    "carbs": 14.9,
    "protein": 8.8,
    "fat": 0.4,
    "fiber": 8.8,
    "sodium": 15.7,
    "potassium": 489,
    "ingredients": [
      "Peas Chaat portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_74_paneer_vegetable_chaat",
    "name": "Paneer Vegetable Chaat",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 7.9,
    "protein": 9,
    "fat": 6.2,
    "fiber": 2.5,
    "sodium": 19.2,
    "potassium": 265.4,
    "ingredients": [
      "Paneer Vegetable Chaat portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_75_quinoa_chaat",
    "name": "Quinoa Chaat",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 19,
    "protein": 5.4,
    "fat": 1.9,
    "fiber": 6.9,
    "sodium": 13.3,
    "potassium": 382,
    "ingredients": [
      "Quinoa Chaat portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_76_daliya_chaat",
    "name": "Daliya Chaat",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Daliya Chaat portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_77_corn_chaat",
    "name": "Corn Chaat",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 20.7,
    "protein": 4.8,
    "fat": 1.5,
    "fiber": 0,
    "sodium": 0,
    "potassium": 0,
    "ingredients": [
      "Corn Chaat portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_78_fruit_nut_chaat",
    "name": "Fruit Nut Chaat",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 150,
    "carbs": 13,
    "protein": 5,
    "fat": 8.8,
    "fiber": 5.5,
    "sodium": 4.6,
    "potassium": 343,
    "ingredients": [
      "Fruit Nut Chaat portion (clinical exchange basis)"
    ],
    "recipe": [
      "Wash and chop the listed vegetables/fruit.",
      "Combine with the protein component if present.",
      "Season with herbs/lemon and serve fresh."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_79_date_nut_bite",
    "name": "Date Nut Bite",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 157,
    "carbs": 16.5,
    "protein": 4.2,
    "fat": 8.6,
    "fiber": 9,
    "sodium": 3.6,
    "potassium": 417,
    "ingredients": [
      "Date Nut Bite portion (clinical exchange basis)"
    ],
    "recipe": [
      "Mash dates, mix with crushed nuts, shape into small bites, and chill."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_80_coconut_date_bite",
    "name": "Coconut Date Bite",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 157,
    "carbs": 14.8,
    "protein": 1.3,
    "fat": 10.1,
    "fiber": 8.8,
    "sodium": 4.1,
    "potassium": 399,
    "ingredients": [
      "Coconut Date Bite portion (clinical exchange basis)"
    ],
    "recipe": [
      "Mash dates with dry coconut, shape into small bites, and chill."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_81_paneer_lettuce_wrap",
    "name": "Paneer Lettuce Wrap",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 7.9,
    "protein": 9,
    "fat": 6.2,
    "fiber": 2.5,
    "sodium": 19.2,
    "potassium": 265.4,
    "ingredients": [
      "Paneer Lettuce Wrap portion (clinical exchange basis)"
    ],
    "recipe": [
      "Fill lettuce/vegetable leaves with paneer and chopped vegetables, roll tightly, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_82_egg_vegetable_cup",
    "name": "Egg Vegetable Cup",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 87,
    "carbs": 3,
    "protein": 8,
    "fat": 4.8,
    "fiber": 2.5,
    "sodium": 73,
    "potassium": 309,
    "ingredients": [
      "Egg Vegetable Cup portion (clinical exchange basis)"
    ],
    "recipe": [
      "Chop cooked egg and vegetables, combine, and serve as a small cup."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_83_egg_white_veg_cup",
    "name": "Egg White Veg Cup",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 33,
    "carbs": 3,
    "protein": 4.5,
    "fat": 0.3,
    "fiber": 2.5,
    "sodium": 62,
    "potassium": 285,
    "ingredients": [
      "Egg White Veg Cup portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook egg white, chop, combine with vegetables, and season lightly."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_84_chicken_veg_lettuce_cup",
    "name": "Chicken Veg Lettuce Cup",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 255,
    "carbs": 3,
    "protein": 20.5,
    "fat": 14,
    "fiber": 2.5,
    "sodium": 72,
    "potassium": 496,
    "ingredients": [
      "Chicken Veg Lettuce Cup portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook chicken thoroughly, chop finely, mix with vegetables, and spoon into lettuce leaves."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_85_fish_veg_cup",
    "name": "Fish Veg Cup",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 171,
    "carbs": 3,
    "protein": 21.5,
    "fat": 8,
    "fiber": 2.5,
    "sodium": 107,
    "potassium": 502,
    "ingredients": [
      "Fish Veg Cup portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook fish thoroughly, flake, mix with vegetables, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_86_prawn_veg_cup",
    "name": "Prawn Veg Cup",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 93,
    "carbs": 3,
    "protein": 16.5,
    "fat": 1,
    "fiber": 2.5,
    "sodium": 182,
    "potassium": 480,
    "ingredients": [
      "Prawn Veg Cup portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook prawns thoroughly, chop, mix with vegetables, and serve warm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "high_protein",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_87_bajra_veg_bites",
    "name": "Bajra Veg Bites",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Bajra Veg Bites portion (clinical exchange basis)"
    ],
    "recipe": [
      "Make a thick bajra and vegetable mixture, shape into small bites, and pan-cook until firm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_88_ragi_veg_bites",
    "name": "Ragi Veg Bites",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Ragi Veg Bites portion (clinical exchange basis)"
    ],
    "recipe": [
      "Mix ragi with vegetables and water, shape into small portions, and cook on a non-stick pan."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_89_jowar_veg_bites",
    "name": "Jowar Veg Bites",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Jowar Veg Bites portion (clinical exchange basis)"
    ],
    "recipe": [
      "Mix jowar with vegetables, shape, and cook on a hot non-stick pan until done."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_90_quinoa_paneer_bites",
    "name": "Quinoa Paneer Bites",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 200,
    "carbs": 20.9,
    "protein": 11.4,
    "fat": 7.5,
    "fiber": 4.4,
    "sodium": 8.5,
    "potassium": 167.4,
    "ingredients": [
      "Quinoa Paneer Bites portion (clinical exchange basis)"
    ],
    "recipe": [
      "Mix cooked quinoa and paneer, shape into small patties, and pan-cook until set."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_91_peas_paneer_bites",
    "name": "Peas Paneer Bites",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 181,
    "carbs": 16.8,
    "protein": 14.8,
    "fat": 6,
    "fiber": 6.3,
    "sodium": 10.9,
    "potassium": 274.4,
    "ingredients": [
      "Peas Paneer Bites portion (clinical exchange basis)"
    ],
    "recipe": [
      "Mash peas and paneer, shape into patties, and cook on a non-stick pan."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_92_moong_paneer_bites",
    "name": "Moong Paneer Bites",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 190,
    "carbs": 19.4,
    "protein": 14,
    "fat": 6.4,
    "fiber": 4.5,
    "sodium": 11.2,
    "potassium": 371.4,
    "ingredients": [
      "Moong Paneer Bites portion (clinical exchange basis)"
    ],
    "recipe": [
      "Combine cooked pulse and paneer, shape into patties, and pan-cook until golden."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_93_vegetable_egg_roll_up",
    "name": "Vegetable Egg Roll-up",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 87,
    "carbs": 3,
    "protein": 8,
    "fat": 4.8,
    "fiber": 2.5,
    "sodium": 73,
    "potassium": 309,
    "ingredients": [
      "Vegetable Egg Roll-up portion (clinical exchange basis)"
    ],
    "recipe": [
      "Make a thin egg omelette, fill with cooked vegetables, roll, slice and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_94_egg_white_roll_up",
    "name": "Egg White Roll-up",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 33,
    "carbs": 3,
    "protein": 4.5,
    "fat": 0.3,
    "fiber": 2.5,
    "sodium": 62,
    "potassium": 285,
    "ingredients": [
      "Egg White Roll-up portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook egg white as a thin omelette, fill with vegetables, roll and slice."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_95_chicken_veg_roll_up",
    "name": "Chicken Veg Roll-up",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 355,
    "carbs": 24,
    "protein": 23,
    "fat": 14.5,
    "fiber": 5,
    "sodium": 73,
    "potassium": 569,
    "ingredients": [
      "Chicken Veg Roll-up portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook chicken thoroughly, combine with vegetables, wrap in a cereal-based flatbread exchange and roll."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_96_fish_quinoa_bites",
    "name": "Fish Quinoa Bites",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 251,
    "carbs": 16,
    "protein": 23.9,
    "fat": 9.3,
    "fiber": 4.4,
    "sodium": 96.3,
    "potassium": 404,
    "ingredients": [
      "Fish Quinoa Bites portion (clinical exchange basis)"
    ],
    "recipe": [
      "Mix flaked cooked fish with quinoa, shape into bites, and pan-cook until firm."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Snacks • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_97_daliya_apple_pudding",
    "name": "Daliya Apple Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 223,
    "carbs": 35.9,
    "protein": 6.7,
    "fat": 5.3,
    "fiber": 5.5,
    "sodium": 29.1,
    "potassium": 403,
    "ingredients": [
      "Daliya Apple Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_98_ragi_fruit_pudding",
    "name": "Ragi Fruit Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 223,
    "carbs": 35.9,
    "protein": 6.7,
    "fat": 5.3,
    "fiber": 5.5,
    "sodium": 29.1,
    "potassium": 403,
    "ingredients": [
      "Ragi Fruit Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_99_barley_pear_pudding",
    "name": "Barley Pear Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 223,
    "carbs": 35.9,
    "protein": 6.7,
    "fat": 5.3,
    "fiber": 5.5,
    "sodium": 29.1,
    "potassium": 403,
    "ingredients": [
      "Barley Pear Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_100_semolina_fruit_pudding",
    "name": "Semolina Fruit Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 223,
    "carbs": 35.9,
    "protein": 6.7,
    "fat": 5.3,
    "fiber": 5.5,
    "sodium": 29.1,
    "potassium": 403,
    "ingredients": [
      "Semolina Fruit Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_101_quinoa_milk_pudding",
    "name": "Quinoa Milk Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 173,
    "carbs": 20.9,
    "protein": 7.1,
    "fat": 6.1,
    "fiber": 4.4,
    "sodium": 26.8,
    "potassium": 257,
    "ingredients": [
      "Quinoa Milk Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_102_sago_milk_pudding",
    "name": "Sago Milk Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 178,
    "carbs": 30.9,
    "protein": 3.2,
    "fat": 4.5,
    "fiber": 0,
    "sodium": 25.5,
    "potassium": 115,
    "ingredients": [
      "Sago Milk Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_103_arrowroot_milk_pudding",
    "name": "Arrowroot Milk Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 173,
    "carbs": 29.9,
    "protein": 3.2,
    "fat": 4.5,
    "fiber": 0,
    "sodium": 34.5,
    "potassium": 121,
    "ingredients": [
      "Arrowroot Milk Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_104_fruit_paneer_pudding",
    "name": "Fruit Paneer Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 150,
    "carbs": 14.9,
    "protein": 8.5,
    "fat": 6.2,
    "fiber": 3,
    "sodium": 9.8,
    "potassium": 240.4,
    "ingredients": [
      "Fruit Paneer Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_105_khoa_fruit_pudding",
    "name": "Khoa Fruit Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 145,
    "carbs": 14.9,
    "protein": 5.8,
    "fat": 6.5,
    "fiber": 3,
    "sodium": 17,
    "potassium": 376,
    "ingredients": [
      "Khoa Fruit Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_106_milk_date_pudding",
    "name": "Milk Date Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 130,
    "carbs": 18.4,
    "protein": 3.4,
    "fat": 4.6,
    "fiber": 6.5,
    "sodium": 27.1,
    "potassium": 404,
    "ingredients": [
      "Milk Date Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_107_coconut_date_pudding",
    "name": "Coconut Date Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 157,
    "carbs": 14.8,
    "protein": 1.3,
    "fat": 10.1,
    "fiber": 8.8,
    "sodium": 4.1,
    "potassium": 399,
    "ingredients": [
      "Coconut Date Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_108_nut_milk_pudding",
    "name": "Nut Milk Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 173,
    "carbs": 7.9,
    "protein": 7.2,
    "fat": 13,
    "fiber": 2.5,
    "sodium": 27.5,
    "potassium": 243,
    "ingredients": [
      "Nut Milk Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_109_coconut_milk_fruit_pudding",
    "name": "Coconut Milk Fruit Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 223,
    "carbs": 16.4,
    "protein": 5,
    "fat": 15.1,
    "fiber": 4.5,
    "sodium": 29.3,
    "potassium": 366.9,
    "ingredients": [
      "Coconut Milk Fruit Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_110_quinoa_date_pudding",
    "name": "Quinoa Date Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 157,
    "carbs": 29.5,
    "protein": 4.1,
    "fat": 1.7,
    "fiber": 10.9,
    "sodium": 2.9,
    "potassium": 431,
    "ingredients": [
      "Quinoa Date Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_111_ragi_nut_pudding",
    "name": "Ragi Nut Pudding",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Evening Snack",
      "Dessert"
    ],
    "calories": 273,
    "carbs": 28.9,
    "protein": 9.7,
    "fat": 13.5,
    "fiber": 5,
    "sodium": 28.5,
    "potassium": 316,
    "ingredients": [
      "Ragi Nut Pudding portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the cereal/starch component with milk until thick.",
      "Add fruit or nuts, simmer briefly, cool to a safe serving temperature, and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Puddings • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_112_vegetable_daliya_cutlet",
    "name": "Vegetable Daliya Cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Vegetable Daliya Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_113_ragi_vegetable_cutlet",
    "name": "Ragi Vegetable Cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Ragi Vegetable Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_114_jowar_vegetable_cutlet",
    "name": "Jowar Vegetable Cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Jowar Vegetable Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_115_quinoa_vegetable_cutlet",
    "name": "Quinoa Vegetable Cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 120,
    "carbs": 19,
    "protein": 5.4,
    "fat": 1.9,
    "fiber": 6.9,
    "sodium": 13.3,
    "potassium": 382,
    "ingredients": [
      "Quinoa Vegetable Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_116_moong_vegetable_cutlet",
    "name": "Moong Vegetable Cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 110,
    "carbs": 17.5,
    "protein": 8,
    "fat": 0.8,
    "fiber": 7,
    "sodium": 16,
    "potassium": 586,
    "ingredients": [
      "Moong Vegetable Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_117_soy_vegetable_cutlet",
    "name": "Soy Vegetable Cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 115,
    "carbs": 5.8,
    "protein": 10.7,
    "fat": 5.2,
    "fiber": 8,
    "sodium": 12.5,
    "potassium": 645,
    "ingredients": [
      "Soy Vegetable Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_118_peas_paneer_cutlet",
    "name": "Peas Paneer Cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 181,
    "carbs": 16.8,
    "protein": 14.8,
    "fat": 6,
    "fiber": 6.3,
    "sodium": 10.9,
    "potassium": 274.4,
    "ingredients": [
      "Peas Paneer Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_119_chicken_vegetable_cutlet",
    "name": "Chicken Vegetable Cutlet",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 255,
    "carbs": 3,
    "protein": 20.5,
    "fat": 14,
    "fiber": 2.5,
    "sodium": 72,
    "potassium": 496,
    "ingredients": [
      "Chicken Vegetable Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_120_fish_vegetable_cutlet",
    "name": "Fish Vegetable Cutlet",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 171,
    "carbs": 3,
    "protein": 21.5,
    "fat": 8,
    "fiber": 2.5,
    "sodium": 107,
    "potassium": 502,
    "ingredients": [
      "Fish Vegetable Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_121_prawn_vegetable_cutlet",
    "name": "Prawn Vegetable Cutlet",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 93,
    "carbs": 3,
    "protein": 16.5,
    "fat": 1,
    "fiber": 2.5,
    "sodium": 182,
    "potassium": 480,
    "ingredients": [
      "Prawn Vegetable Cutlet portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "high_protein",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_122_egg_vegetable_savory",
    "name": "Egg Vegetable Savory",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 107,
    "carbs": 5,
    "protein": 9,
    "fat": 5,
    "fiber": 4.5,
    "sodium": 106,
    "potassium": 399,
    "ingredients": [
      "Egg Vegetable Savory portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_123_egg_white_vegetable_savory",
    "name": "Egg White Vegetable Savory",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 53,
    "carbs": 5,
    "protein": 5.5,
    "fat": 0.5,
    "fiber": 4.5,
    "sodium": 95,
    "potassium": 375,
    "ingredients": [
      "Egg White Vegetable Savory portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_124_paneer_vegetable_tikki",
    "name": "Paneer Vegetable Tikki",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 140,
    "carbs": 9.9,
    "protein": 10,
    "fat": 6.4,
    "fiber": 4.5,
    "sodium": 52.2,
    "potassium": 355.4,
    "ingredients": [
      "Paneer Vegetable Tikki portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "high_protein",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_125_bajra_paneer_tikki",
    "name": "Bajra Paneer Tikki",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 200,
    "carbs": 25.9,
    "protein": 10,
    "fat": 6.4,
    "fiber": 2.5,
    "sodium": 8.2,
    "potassium": 98.4,
    "ingredients": [
      "Bajra Paneer Tikki portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_126_ragi_paneer_tikki",
    "name": "Ragi Paneer Tikki",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 200,
    "carbs": 25.9,
    "protein": 10,
    "fat": 6.4,
    "fiber": 2.5,
    "sodium": 8.2,
    "potassium": 98.4,
    "ingredients": [
      "Ragi Paneer Tikki portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_127_daliya_paneer_tikki",
    "name": "Daliya Paneer Tikki",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 200,
    "carbs": 25.9,
    "protein": 10,
    "fat": 6.4,
    "fiber": 2.5,
    "sodium": 8.2,
    "potassium": 98.4,
    "ingredients": [
      "Daliya Paneer Tikki portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_128_quinoa_paneer_tikki",
    "name": "Quinoa Paneer Tikki",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 200,
    "carbs": 20.9,
    "protein": 11.4,
    "fat": 7.5,
    "fiber": 4.4,
    "sodium": 8.5,
    "potassium": 167.4,
    "ingredients": [
      "Quinoa Paneer Tikki portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_129_moong_paneer_tikki",
    "name": "Moong Paneer Tikki",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 190,
    "carbs": 19.4,
    "protein": 14,
    "fat": 6.4,
    "fiber": 4.5,
    "sodium": 11.2,
    "potassium": 371.4,
    "ingredients": [
      "Moong Paneer Tikki portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_130_soy_paneer_tikki",
    "name": "Soy Paneer Tikki",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 195,
    "carbs": 7.7,
    "protein": 16.7,
    "fat": 10.8,
    "fiber": 5.5,
    "sodium": 7.7,
    "potassium": 430.4,
    "ingredients": [
      "Soy Paneer Tikki portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_131_corn_paneer_tikki",
    "name": "Corn Paneer Tikki",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 200,
    "carbs": 22.6,
    "protein": 10.8,
    "fat": 7.1,
    "fiber": 0,
    "sodium": 0,
    "potassium": 0,
    "ingredients": [
      "Corn Paneer Tikki portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the cereal/pulse base into a thick batter or dough.",
      "Add vegetables/protein, shape into portions, and cook on a non-stick pan or steam until fully cooked."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Savories • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; oil/spices/water are not separately quantified."
  },
  {
    "id": "rec_ex_132_vegetable_pizza_style_toast",
    "name": "Vegetable Pizza-style Toast",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Vegetable Pizza-style Toast portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_133_paneer_pizza_style_toast",
    "name": "Paneer Pizza-style Toast",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 200,
    "carbs": 25.9,
    "protein": 10,
    "fat": 6.4,
    "fiber": 2.5,
    "sodium": 8.2,
    "potassium": 98.4,
    "ingredients": [
      "Paneer Pizza-style Toast portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_134_chicken_pizza_style_toast",
    "name": "Chicken Pizza-style Toast",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 355,
    "carbs": 24,
    "protein": 23,
    "fat": 14.5,
    "fiber": 5,
    "sodium": 73,
    "potassium": 569,
    "ingredients": [
      "Chicken Pizza-style Toast portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_135_fish_pizza_style_toast",
    "name": "Fish Pizza-style Toast",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 271,
    "carbs": 24,
    "protein": 24,
    "fat": 8.5,
    "fiber": 5,
    "sodium": 108,
    "potassium": 575,
    "ingredients": [
      "Fish Pizza-style Toast portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_136_prawn_pizza_style_toast",
    "name": "Prawn Pizza-style Toast",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 193,
    "carbs": 24,
    "protein": 19,
    "fat": 1.5,
    "fiber": 5,
    "sodium": 183,
    "potassium": 553,
    "ingredients": [
      "Prawn Pizza-style Toast portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_137_egg_pizza_style_toast",
    "name": "Egg Pizza-style Toast",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 187,
    "carbs": 24,
    "protein": 10.5,
    "fat": 5.3,
    "fiber": 5,
    "sodium": 74,
    "potassium": 382,
    "ingredients": [
      "Egg Pizza-style Toast portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_138_paneer_burger_style_bun",
    "name": "Paneer Burger-style Bun",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Paneer Burger-style Bun portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_139_chicken_burger_style_bun",
    "name": "Chicken Burger-style Bun",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 355,
    "carbs": 24,
    "protein": 23,
    "fat": 14.5,
    "fiber": 5,
    "sodium": 73,
    "potassium": 569,
    "ingredients": [
      "Chicken Burger-style Bun portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_140_fish_burger_style_bun",
    "name": "Fish Burger-style Bun",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 271,
    "carbs": 24,
    "protein": 24,
    "fat": 8.5,
    "fiber": 5,
    "sodium": 108,
    "potassium": 575,
    "ingredients": [
      "Fish Burger-style Bun portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_141_egg_burger_style_bun",
    "name": "Egg Burger-style Bun",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 187,
    "carbs": 24,
    "protein": 10.5,
    "fat": 5.3,
    "fiber": 5,
    "sodium": 74,
    "potassium": 382,
    "ingredients": [
      "Egg Burger-style Bun portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_142_vegetable_sandwich",
    "name": "Vegetable Sandwich",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Vegetable Sandwich portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_143_chicken_sandwich",
    "name": "Chicken Sandwich",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 355,
    "carbs": 24,
    "protein": 23,
    "fat": 14.5,
    "fiber": 5,
    "sodium": 73,
    "potassium": 569,
    "ingredients": [
      "Chicken Sandwich portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_144_fish_sandwich",
    "name": "Fish Sandwich",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 271,
    "carbs": 24,
    "protein": 24,
    "fat": 8.5,
    "fiber": 5,
    "sodium": 108,
    "potassium": 575,
    "ingredients": [
      "Fish Sandwich portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_145_prawn_sandwich",
    "name": "Prawn Sandwich",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 193,
    "carbs": 24,
    "protein": 19,
    "fat": 1.5,
    "fiber": 5,
    "sodium": 183,
    "potassium": 553,
    "ingredients": [
      "Prawn Sandwich portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_146_egg_sandwich",
    "name": "Egg Sandwich",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 187,
    "carbs": 24,
    "protein": 10.5,
    "fat": 5.3,
    "fiber": 5,
    "sodium": 74,
    "potassium": 382,
    "ingredients": [
      "Egg Sandwich portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_147_paneer_wrap",
    "name": "Paneer Wrap",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Paneer Wrap portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_148_chicken_wrap",
    "name": "Chicken Wrap",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 355,
    "carbs": 24,
    "protein": 23,
    "fat": 14.5,
    "fiber": 5,
    "sodium": 73,
    "potassium": 569,
    "ingredients": [
      "Chicken Wrap portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_149_fish_wrap",
    "name": "Fish Wrap",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 271,
    "carbs": 24,
    "protein": 24,
    "fat": 8.5,
    "fiber": 5,
    "sodium": 108,
    "potassium": 575,
    "ingredients": [
      "Fish Wrap portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_150_prawn_wrap",
    "name": "Prawn Wrap",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 193,
    "carbs": 24,
    "protein": 19,
    "fat": 1.5,
    "fiber": 5,
    "sodium": 183,
    "potassium": 553,
    "ingredients": [
      "Prawn Wrap portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_151_egg_wrap",
    "name": "Egg Wrap",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 187,
    "carbs": 24,
    "protein": 10.5,
    "fat": 5.3,
    "fiber": 5,
    "sodium": 74,
    "potassium": 382,
    "ingredients": [
      "Egg Wrap portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the base and filling from the listed exchange portions.",
      "Assemble, heat/cook until done, and serve as an occasional food rather than a routine therapeutic meal."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Junk Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate; intended as an occasional recipe. Commercial sauces/cheese may substantially increase sodium and calories."
  },
  {
    "id": "rec_ex_152_vegetable_pakora_style_bite",
    "name": "Vegetable Pakora-style Bite",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Vegetable Pakora-style Bite portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_153_paneer_pakora_style_bite",
    "name": "Paneer Pakora-style Bite",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 200,
    "carbs": 25.9,
    "protein": 10,
    "fat": 6.4,
    "fiber": 2.5,
    "sodium": 8.2,
    "potassium": 98.4,
    "ingredients": [
      "Paneer Pakora-style Bite portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_154_chicken_pakora_style_bite",
    "name": "Chicken Pakora-style Bite",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 335,
    "carbs": 21,
    "protein": 21.5,
    "fat": 14.2,
    "fiber": 2.5,
    "sodium": 61,
    "potassium": 329,
    "ingredients": [
      "Chicken Pakora-style Bite portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_155_fish_pakora_style_bite",
    "name": "Fish Pakora-style Bite",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 251,
    "carbs": 21,
    "protein": 22.5,
    "fat": 8.2,
    "fiber": 2.5,
    "sodium": 96,
    "potassium": 335,
    "ingredients": [
      "Fish Pakora-style Bite portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_156_prawn_pakora_style_bite",
    "name": "Prawn Pakora-style Bite",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 173,
    "carbs": 21,
    "protein": 17.5,
    "fat": 1.2,
    "fiber": 2.5,
    "sodium": 171,
    "potassium": 313,
    "ingredients": [
      "Prawn Pakora-style Bite portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_157_egg_pakora_style_bite",
    "name": "Egg Pakora-style Bite",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 167,
    "carbs": 21,
    "protein": 9,
    "fat": 5,
    "fiber": 2.5,
    "sodium": 62,
    "potassium": 142,
    "ingredients": [
      "Egg Pakora-style Bite portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_158_moong_fritter",
    "name": "Moong Fritter",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 110,
    "carbs": 17.5,
    "protein": 8,
    "fat": 0.8,
    "fiber": 7,
    "sodium": 16,
    "potassium": 586,
    "ingredients": [
      "Moong Fritter portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_159_soy_fritter",
    "name": "Soy Fritter",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 115,
    "carbs": 5.8,
    "protein": 10.7,
    "fat": 5.2,
    "fiber": 8,
    "sodium": 12.5,
    "potassium": 645,
    "ingredients": [
      "Soy Fritter portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "high_protein",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_160_peas_fritter",
    "name": "Peas Fritter",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 101,
    "carbs": 14.9,
    "protein": 8.8,
    "fat": 0.4,
    "fiber": 8.8,
    "sodium": 15.7,
    "potassium": 489,
    "ingredients": [
      "Peas Fritter portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_161_quinoa_fritter",
    "name": "Quinoa Fritter",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 120,
    "carbs": 19,
    "protein": 5.4,
    "fat": 1.9,
    "fiber": 6.9,
    "sodium": 13.3,
    "potassium": 382,
    "ingredients": [
      "Quinoa Fritter portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_162_ragi_fritter",
    "name": "Ragi Fritter",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Ragi Fritter portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_163_jowar_fritter",
    "name": "Jowar Fritter",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Jowar Fritter portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_164_daliya_fritter",
    "name": "Daliya Fritter",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Daliya Fritter portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_165_paneer_tawa_fry",
    "name": "Paneer Tawa Fry",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 120,
    "carbs": 7.9,
    "protein": 9,
    "fat": 6.2,
    "fiber": 2.5,
    "sodium": 19.2,
    "potassium": 265.4,
    "ingredients": [
      "Paneer Tawa Fry portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_166_chicken_tawa_fry",
    "name": "Chicken Tawa Fry",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 255,
    "carbs": 3,
    "protein": 20.5,
    "fat": 14,
    "fiber": 2.5,
    "sodium": 72,
    "potassium": 496,
    "ingredients": [
      "Chicken Tawa Fry portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare the listed ingredients and coat/bind as needed.",
      "Cook using the smallest practical amount of oil, preferably shallow-frying or air-frying.",
      "Drain and serve."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Fried Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_glycemic",
      "diabetes_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate before added frying oil; actual calories/fat will be higher if substantial oil is absorbed."
  },
  {
    "id": "rec_ex_167_vegetable_wheat_pasta",
    "name": "Vegetable Wheat Pasta",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Vegetable Wheat Pasta portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_168_paneer_wheat_pasta",
    "name": "Paneer Wheat Pasta",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Paneer Wheat Pasta portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_169_chicken_wheat_pasta",
    "name": "Chicken Wheat Pasta",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 355,
    "carbs": 24,
    "protein": 23,
    "fat": 14.5,
    "fiber": 5,
    "sodium": 73,
    "potassium": 569,
    "ingredients": [
      "Chicken Wheat Pasta portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_170_fish_wheat_pasta",
    "name": "Fish Wheat Pasta",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 271,
    "carbs": 24,
    "protein": 24,
    "fat": 8.5,
    "fiber": 5,
    "sodium": 108,
    "potassium": 575,
    "ingredients": [
      "Fish Wheat Pasta portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_171_prawn_wheat_pasta",
    "name": "Prawn Wheat Pasta",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 193,
    "carbs": 24,
    "protein": 19,
    "fat": 1.5,
    "fiber": 5,
    "sodium": 183,
    "potassium": 553,
    "ingredients": [
      "Prawn Wheat Pasta portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_172_egg_wheat_pasta",
    "name": "Egg Wheat Pasta",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 187,
    "carbs": 24,
    "protein": 10.5,
    "fat": 5.3,
    "fiber": 5,
    "sodium": 74,
    "potassium": 382,
    "ingredients": [
      "Egg Wheat Pasta portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_173_soy_vegetable_pasta",
    "name": "Soy Vegetable Pasta",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 215,
    "carbs": 26.8,
    "protein": 13.2,
    "fat": 5.7,
    "fiber": 10.5,
    "sodium": 13.5,
    "potassium": 718,
    "ingredients": [
      "Soy Vegetable Pasta portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_174_moong_vegetable_pasta",
    "name": "Moong Vegetable Pasta",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 210,
    "carbs": 38.5,
    "protein": 10.5,
    "fat": 1.3,
    "fiber": 9.5,
    "sodium": 17,
    "potassium": 659,
    "ingredients": [
      "Moong Vegetable Pasta portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_175_peas_vegetable_pasta",
    "name": "Peas Vegetable Pasta",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 201,
    "carbs": 35.9,
    "protein": 11.3,
    "fat": 0.9,
    "fiber": 11.3,
    "sodium": 16.7,
    "potassium": 562,
    "ingredients": [
      "Peas Vegetable Pasta portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_176_quinoa_pasta_bowl",
    "name": "Quinoa Pasta Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 120,
    "carbs": 19,
    "protein": 5.4,
    "fat": 1.9,
    "fiber": 6.9,
    "sodium": 13.3,
    "potassium": 382,
    "ingredients": [
      "Quinoa Pasta Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_177_creamy_paneer_pasta_style_bowl",
    "name": "Creamy Paneer Pasta-style Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 273,
    "carbs": 30.8,
    "protein": 13.2,
    "fat": 10.9,
    "fiber": 2.5,
    "sodium": 33.7,
    "potassium": 213.4,
    "ingredients": [
      "Creamy Paneer Pasta-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_178_chicken_milk_pasta_style_bowl",
    "name": "Chicken Milk Pasta-style Bowl",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 408,
    "carbs": 25.9,
    "protein": 24.7,
    "fat": 18.7,
    "fiber": 2.5,
    "sodium": 86.5,
    "potassium": 444,
    "ingredients": [
      "Chicken Milk Pasta-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_179_fish_milk_pasta_style_bowl",
    "name": "Fish Milk Pasta-style Bowl",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 324,
    "carbs": 25.9,
    "protein": 25.7,
    "fat": 12.7,
    "fiber": 2.5,
    "sodium": 121.5,
    "potassium": 450,
    "ingredients": [
      "Fish Milk Pasta-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_180_prawn_milk_pasta_style_bowl",
    "name": "Prawn Milk Pasta-style Bowl",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 246,
    "carbs": 25.9,
    "protein": 20.7,
    "fat": 5.7,
    "fiber": 2.5,
    "sodium": 196.5,
    "potassium": 428,
    "ingredients": [
      "Prawn Milk Pasta-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_181_vegetable_vermicelli_pasta_style_bowl",
    "name": "Vegetable Vermicelli Pasta-style Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Vegetable Vermicelli Pasta-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Cook the pasta/cereal component until just tender.",
      "Prepare vegetables/protein separately with minimal oil, combine, season, and toss for 1-2 minutes."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Pasta • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Pasta sauce, cheese, oil and commercial seasonings are not included unless represented by an exchange."
  },
  {
    "id": "rec_ex_182_vegetable_stir_fry_noodles",
    "name": "Vegetable Stir-fry Noodles",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 120,
    "carbs": 24,
    "protein": 4,
    "fat": 0.8,
    "fiber": 5,
    "sodium": 13,
    "potassium": 313,
    "ingredients": [
      "Vegetable Stir-fry Noodles portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_183_paneer_stir_fry_noodles",
    "name": "Paneer Stir-fry Noodles",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Paneer Stir-fry Noodles portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_184_chicken_stir_fry_noodles",
    "name": "Chicken Stir-fry Noodles",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 355,
    "carbs": 24,
    "protein": 23,
    "fat": 14.5,
    "fiber": 5,
    "sodium": 73,
    "potassium": 569,
    "ingredients": [
      "Chicken Stir-fry Noodles portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_185_fish_stir_fry_noodles",
    "name": "Fish Stir-fry Noodles",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 271,
    "carbs": 24,
    "protein": 24,
    "fat": 8.5,
    "fiber": 5,
    "sodium": 108,
    "potassium": 575,
    "ingredients": [
      "Fish Stir-fry Noodles portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_186_prawn_stir_fry_noodles",
    "name": "Prawn Stir-fry Noodles",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 193,
    "carbs": 24,
    "protein": 19,
    "fat": 1.5,
    "fiber": 5,
    "sodium": 183,
    "potassium": 553,
    "ingredients": [
      "Prawn Stir-fry Noodles portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_187_egg_stir_fry_noodles",
    "name": "Egg Stir-fry Noodles",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 187,
    "carbs": 24,
    "protein": 10.5,
    "fat": 5.3,
    "fiber": 5,
    "sodium": 74,
    "potassium": 382,
    "ingredients": [
      "Egg Stir-fry Noodles portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_188_soy_stir_fry_noodles",
    "name": "Soy Stir-fry Noodles",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 215,
    "carbs": 26.8,
    "protein": 13.2,
    "fat": 5.7,
    "fiber": 10.5,
    "sodium": 13.5,
    "potassium": 718,
    "ingredients": [
      "Soy Stir-fry Noodles portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_189_moong_stir_fry_noodles",
    "name": "Moong Stir-fry Noodles",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 210,
    "carbs": 38.5,
    "protein": 10.5,
    "fat": 1.3,
    "fiber": 9.5,
    "sodium": 17,
    "potassium": 659,
    "ingredients": [
      "Moong Stir-fry Noodles portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_190_peas_stir_fry_noodles",
    "name": "Peas Stir-fry Noodles",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 201,
    "carbs": 35.9,
    "protein": 11.3,
    "fat": 0.9,
    "fiber": 11.3,
    "sodium": 16.7,
    "potassium": 562,
    "ingredients": [
      "Peas Stir-fry Noodles portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_191_quinoa_chinese_style_bowl",
    "name": "Quinoa Chinese-style Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 120,
    "carbs": 19,
    "protein": 5.4,
    "fat": 1.9,
    "fiber": 6.9,
    "sodium": 13.3,
    "potassium": 382,
    "ingredients": [
      "Quinoa Chinese-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_glycemic",
      "diabetes_safe",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_192_vegetable_fried_rice_style_bowl",
    "name": "Vegetable Fried Rice-style Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Vegetable Fried Rice-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_193_egg_fried_rice_style_bowl",
    "name": "Egg Fried Rice-style Bowl",
    "dietaryType": "Eggetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 187,
    "carbs": 24,
    "protein": 10.5,
    "fat": 5.3,
    "fiber": 5,
    "sodium": 74,
    "potassium": 382,
    "ingredients": [
      "Egg Fried Rice-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_194_chicken_fried_rice_style_bowl",
    "name": "Chicken Fried Rice-style Bowl",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 355,
    "carbs": 24,
    "protein": 23,
    "fat": 14.5,
    "fiber": 5,
    "sodium": 73,
    "potassium": 569,
    "ingredients": [
      "Chicken Fried Rice-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_195_fish_fried_rice_style_bowl",
    "name": "Fish Fried Rice-style Bowl",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 271,
    "carbs": 24,
    "protein": 24,
    "fat": 8.5,
    "fiber": 5,
    "sodium": 108,
    "potassium": 575,
    "ingredients": [
      "Fish Fried Rice-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_196_prawn_fried_rice_style_bowl",
    "name": "Prawn Fried Rice-style Bowl",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 193,
    "carbs": 24,
    "protein": 19,
    "fat": 1.5,
    "fiber": 5,
    "sodium": 183,
    "potassium": 553,
    "ingredients": [
      "Prawn Fried Rice-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_197_paneer_fried_rice_style_bowl",
    "name": "Paneer Fried Rice-style Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 220,
    "carbs": 28.9,
    "protein": 11.5,
    "fat": 6.7,
    "fiber": 5,
    "sodium": 20.2,
    "potassium": 338.4,
    "ingredients": [
      "Paneer Fried Rice-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_198_vegetable_manchurian_style_bowl",
    "name": "Vegetable Manchurian-style Bowl",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 140,
    "carbs": 26,
    "protein": 5,
    "fat": 1,
    "fiber": 7,
    "sodium": 46,
    "potassium": 403,
    "ingredients": [
      "Vegetable Manchurian-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "low_sodium",
      "cardiac_safe",
      "weight_loss"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_199_chicken_chinese_style_bowl",
    "name": "Chicken Chinese-style Bowl",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 355,
    "carbs": 24,
    "protein": 23,
    "fat": 14.5,
    "fiber": 5,
    "sodium": 73,
    "potassium": 569,
    "ingredients": [
      "Chicken Chinese-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  },
  {
    "id": "rec_ex_200_fish_chinese_style_bowl",
    "name": "Fish Chinese-style Bowl",
    "dietaryType": "Non-Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 271,
    "carbs": 24,
    "protein": 24,
    "fat": 8.5,
    "fiber": 5,
    "sodium": 108,
    "potassium": 575,
    "ingredients": [
      "Fish Chinese-style Bowl portion (clinical exchange basis)"
    ],
    "recipe": [
      "Prepare vegetables/protein.",
      "Stir-fry quickly in a hot pan with minimal oil, add the cooked cereal/noodle component, toss thoroughly, and season with herbs/low-sodium sauces as appropriate."
    ],
    "prepTime": "10 mins",
    "cookTime": "15 mins",
    "portionSize": "1 serving",
    "clinicalFocus": "Chinese Food • Exchange List Certified",
    "source": "200_Exchange_List_Based_Recipes.xlsx",
    "sourceFileName": "200_Exchange_List_Based_Recipes.xlsx",
    "sheetName": "200 Recipes",
    "tags": [
      "high_fiber",
      "high_protein"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-based estimate. Sodium can be much higher with soy sauce, stock cubes or commercial sauces; these are not included in the exchange calculation."
  }
];

// Standard IFCT Exchange System Reference Values
export const EXCHANGE_SYSTEM_REFERENCE = [
  {
    "group": "Cereal group: Bajra/Barley/Jowar/Samai/Wheat/Daliya/Semolina/Vermicelli/Maize dry/Ragi/Rice",
    "portion": "30 g",
    "calories": 100,
    "carbs": 21,
    "protein": 2.5,
    "fat": 0.5,
    "fiber": 2.5,
    "sodium": 1,
    "potassium": 73
  },
  {
    "group": "Tender maize (American corn)",
    "portion": "90 g",
    "calories": 100,
    "carbs": 17.7,
    "protein": 3.3,
    "fat": 1.2,
    "fiber": 0,
    "sodium": 0,
    "potassium": 0
  },
  {
    "group": "Quinoa",
    "portion": "30 g",
    "calories": 100,
    "carbs": 16,
    "protein": 3.9,
    "fat": 1.6,
    "fiber": 4.4,
    "sodium": 1.3,
    "potassium": 142
  },
  {
    "group": "Sago",
    "portion": "30 g",
    "calories": 105,
    "carbs": 26,
    "protein": 0,
    "fat": 0,
    "fiber": 0,
    "sodium": 0,
    "potassium": 0
  },
  {
    "group": "Arrowroot flour",
    "portion": "30 g",
    "calories": 100,
    "carbs": 25,
    "protein": 0,
    "fat": 0,
    "fiber": 0,
    "sodium": 9,
    "potassium": 6
  },
  {
    "group": "Soybean",
    "portion": "25 g",
    "calories": 95,
    "carbs": 2.8,
    "protein": 9.2,
    "fat": 4.9,
    "fiber": 5.5,
    "sodium": 0.5,
    "potassium": 405
  },
  {
    "group": "All pulses except soybean",
    "portion": "30 g",
    "calories": 90,
    "carbs": 14.5,
    "protein": 6.5,
    "fat": 0.5,
    "fiber": 4.5,
    "sodium": 4,
    "potassium": 346
  },
  {
    "group": "Milk (C)",
    "portion": "100 ml",
    "calories": 73,
    "carbs": 4.9,
    "protein": 3.2,
    "fat": 4.5,
    "fiber": 0,
    "sodium": 25.5,
    "potassium": 115
  },
  {
    "group": "Milk (B)",
    "portion": "100 ml",
    "calories": 107,
    "carbs": 8.3,
    "protein": 3.6,
    "fat": 6.6,
    "fiber": 0,
    "sodium": 30.1,
    "potassium": 109
  },
  {
    "group": "Paneer",
    "portion": "40 g",
    "calories": 100,
    "carbs": 4.9,
    "protein": 7.5,
    "fat": 5.9,
    "fiber": 0,
    "sodium": 7.2,
    "potassium": 25.4
  },
  {
    "group": "Khoa",
    "portion": "30 g",
    "calories": 95,
    "carbs": 4.9,
    "protein": 4.8,
    "fat": 6.2,
    "fiber": 0,
    "sodium": 14.4,
    "potassium": 161
  },
  {
    "group": "All nuts",
    "portion": "20 g",
    "calories": 100,
    "carbs": 3,
    "protein": 4,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128
  },
  {
    "group": "Coconut dry",
    "portion": "15 g",
    "calories": 100,
    "carbs": 1.3,
    "protein": 1.1,
    "fat": 10,
    "fiber": 2.3,
    "sodium": 2.5,
    "potassium": 110
  },
  {
    "group": "Coconut fresh",
    "portion": "25 g",
    "calories": 100,
    "carbs": 1.5,
    "protein": 0.8,
    "fat": 10.3,
    "fiber": 1.5,
    "sodium": 1.2,
    "potassium": 36.9
  },
  {
    "group": "Fruit group",
    "portion": "100 g",
    "calories": 50,
    "carbs": 10,
    "protein": 1,
    "fat": 0.3,
    "fiber": 3,
    "sodium": 2.6,
    "potassium": 215
  },
  {
    "group": "Dates",
    "portion": "20 g",
    "calories": 57,
    "carbs": 13.5,
    "protein": 0.2,
    "fat": 0.1,
    "fiber": 6.5,
    "sodium": 1.6,
    "potassium": 289
  },
  {
    "group": "Vegetable A",
    "portion": "100 g",
    "calories": 20,
    "carbs": 3,
    "protein": 1.5,
    "fat": 0.3,
    "fiber": 2.5,
    "sodium": 12,
    "potassium": 240
  },
  {
    "group": "Vegetable B",
    "portion": "100 g",
    "calories": 40,
    "carbs": 5,
    "protein": 2.5,
    "fat": 0.5,
    "fiber": 4.5,
    "sodium": 45,
    "potassium": 330
  },
  {
    "group": "Vegetable C",
    "portion": "100 g",
    "calories": 90,
    "carbs": 17,
    "protein": 1.5,
    "fat": 0.4,
    "fiber": 4.3,
    "sodium": 15,
    "potassium": 339
  },
  {
    "group": "Fresh peas",
    "portion": "100 g",
    "calories": 81,
    "carbs": 11.9,
    "protein": 7.3,
    "fat": 0.1,
    "fiber": 6.3,
    "sodium": 3.7,
    "potassium": 249
  },
  {
    "group": "Renal vegetables",
    "portion": "100 g",
    "calories": 25,
    "carbs": 3,
    "protein": 1.2,
    "fat": 0.3,
    "fiber": 2.5,
    "sodium": 9,
    "potassium": 198
  },
  {
    "group": "Egg whole",
    "portion": "50 g",
    "calories": 67,
    "carbs": 0,
    "protein": 6.5,
    "fat": 4.5,
    "fiber": 0,
    "sodium": 61,
    "potassium": 69
  },
  {
    "group": "Egg white",
    "portion": "30 g",
    "calories": 13,
    "carbs": 0,
    "protein": 3,
    "fat": 0,
    "fiber": 0,
    "sodium": 50,
    "potassium": 45
  },
  {
    "group": "Egg yolk",
    "portion": "20 g",
    "calories": 59,
    "carbs": 0,
    "protein": 3,
    "fat": 5.3,
    "fiber": 0,
    "sodium": 9,
    "potassium": 24
  },
  {
    "group": "Chicken without skin",
    "portion": "100 g",
    "calories": 235,
    "carbs": 0,
    "protein": 19,
    "fat": 13.7,
    "fiber": 0,
    "sodium": 60,
    "potassium": 256
  },
  {
    "group": "Country hen",
    "portion": "100 g",
    "calories": 180,
    "carbs": 0,
    "protein": 19,
    "fat": 11.7,
    "fiber": 0,
    "sodium": 45,
    "potassium": 325
  },
  {
    "group": "Chicken liver",
    "portion": "100 g",
    "calories": 123,
    "carbs": 0,
    "protein": 21.5,
    "fat": 4,
    "fiber": 0,
    "sodium": 61.5,
    "potassium": 241
  },
  {
    "group": "Fish group",
    "portion": "100 g",
    "calories": 151,
    "carbs": 0,
    "protein": 20,
    "fat": 7.7,
    "fiber": 0,
    "sodium": 95,
    "potassium": 262
  },
  {
    "group": "Prawns/Bombay duck/Lobster group",
    "portion": "100 g",
    "calories": 73,
    "carbs": 0,
    "protein": 15,
    "fat": 0.7,
    "fiber": 0,
    "sodium": 170,
    "potassium": 240
  }
];
