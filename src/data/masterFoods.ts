import type { RecipeDBItem } from '../services/db';

// 73 foods from Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx (sheet 'Master - Backend') whose names were not
// already in the Exchange List or Build My Plate lists and that have nutrient values. Meal options are mapped to
// the app's slots: Early/Mid Morning -> Morning Snack, Mid Evening/Tea Time -> Evening Snack, Bed Time -> Bedtime Snack.
export const MASTER_FOODS: RecipeDBItem[] = [
  {
    "id": "mf_0001",
    "name": "Chapati dry",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 100,
    "protein": 2.5,
    "carbs": 21.0,
    "fat": 0.5,
    "fiber": 2.5,
    "sodium": 1,
    "potassium": 73,
    "ingredients": [
      "30 g whole-wheat atta",
      "water as needed"
    ],
    "recipe": [
      "Knead atta with water; rest 10 minutes.",
      "Roll one medium chapati and roast both sides on a hot tawa without oil or ghee."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 piece",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "EXCHANGE BASED — 30 g wheat cereal exchange; no oil or salt | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0002",
    "name": "Phulka dry",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 100,
    "protein": 2.5,
    "carbs": 21.0,
    "fat": 0.5,
    "fiber": 2.5,
    "sodium": 1,
    "potassium": 73,
    "ingredients": [
      "30 g whole-wheat atta",
      "water as needed"
    ],
    "recipe": [
      "Knead a soft dough, rest, roll thinly and cook on a tawa.",
      "Puff briefly over direct heat where safe; do not add oil or ghee."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 piece",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "EXCHANGE BASED — 30 g wheat cereal exchange; no oil or salt | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0003",
    "name": "Plain rice",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 100,
    "protein": 2.5,
    "carbs": 21.0,
    "fat": 0.5,
    "fiber": 2.5,
    "sodium": 1,
    "potassium": 73,
    "ingredients": [
      "30 g raw rice",
      "water as needed"
    ],
    "recipe": [
      "Rinse rice until water runs nearly clear.",
      "Cook in water until tender, cover to rest and fluff.",
      "Do not add oil or salt."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 bowl (from stated raw ingredients)",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0004",
    "name": "Dalia khichdi with vegetables",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 157,
    "protein": 4.5,
    "carbs": 25.0,
    "fat": 3.9,
    "fiber": 6.0,
    "sodium": 30,
    "potassium": 358,
    "ingredients": [
      "30 g dry daliya",
      "50 g bottle gourd",
      "50 g carrot",
      "3 g oil",
      "water, cumin"
    ],
    "recipe": [
      "Wash daliya.",
      "Dice vegetables finely.",
      "Heat 3 g oil, add cumin and vegetables; sauté briefly.",
      "Add daliya and water, simmer covered until soft; adjust consistency."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 bowl (from stated raw ingredients)",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0005",
    "name": "Moong dal vaghar",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 135,
    "protein": 6.5,
    "carbs": 14.5,
    "fat": 5.5,
    "fiber": 4.5,
    "sodium": 4,
    "potassium": 346,
    "ingredients": [
      "30 g raw yellow moong dal",
      "5 g oil",
      "turmeric, cumin, water"
    ],
    "recipe": [
      "Wash moong dal, pressure-cook with turmeric and water until soft.",
      "Heat 5 g oil separately, bloom cumin and optional asafoetida, pour tempering into dal and simmer 2 minutes."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 bowl (from stated raw ingredients)",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0006",
    "name": "Jowar roti",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 100,
    "protein": 2.5,
    "carbs": 21.0,
    "fat": 0.5,
    "fiber": 2.5,
    "sodium": 1,
    "potassium": 73,
    "ingredients": [
      "30 g jowar flour",
      "warm water"
    ],
    "recipe": [
      "Mix jowar flour with warm water into a soft dough.",
      "Pat into one roti using dry flour sparingly.",
      "Roast both sides on a hot tawa without oil."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 piece",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0009",
    "name": "Dudhi thepla",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 155,
    "protein": 3.2,
    "carbs": 22.5,
    "fat": 5.7,
    "fiber": 3.8,
    "sodium": 7,
    "potassium": 193,
    "ingredients": [
      "30 g wheat flour",
      "50 g grated bottle gourd (Veg A)",
      "5 g oil",
      "spices"
    ],
    "recipe": [
      "Grate dudhi and squeeze only if excessively wet.",
      "Knead with flour, spices and a little water.",
      "Roll one thepla and cook on a tawa using 5 g oil."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 piece",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0012",
    "name": "Mix veg paratha",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 175,
    "protein": 4.5,
    "carbs": 25.0,
    "fat": 5.9,
    "fiber": 6.0,
    "sodium": 30,
    "potassium": 358,
    "ingredients": [
      "30 g wheat flour",
      "50 g cabbage (Veg A)",
      "50 g carrot (Veg B)",
      "5 g oil"
    ],
    "recipe": [
      "Finely chop and lightly cook cabbage and carrot; cool and drain.",
      "Stuff into wheat dough, roll gently and roast using 5 g oil."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 piece",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0014",
    "name": "Cow milk",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack",
      "Bedtime Snack"
    ],
    "calories": 124,
    "protein": 6.4,
    "carbs": 9.6,
    "fat": 6.6,
    "fiber": 0.0,
    "sodium": 88,
    "potassium": 300,
    "ingredients": [
      "Plain whole cow milk",
      "no sugar"
    ],
    "recipe": [
      "Serve 200 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "200 ml",
    "clinicalFocus": "Milk & Milk Products",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0015",
    "name": "Buffalo milk",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack",
      "Bedtime Snack"
    ],
    "calories": 194,
    "protein": 7.6,
    "carbs": 10.4,
    "fat": 13.8,
    "fiber": 0.0,
    "sodium": 104,
    "potassium": 356,
    "ingredients": [
      "Full-fat buffalo milk",
      "no sugar"
    ],
    "recipe": [
      "Serve 200 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "200 ml",
    "clinicalFocus": "Milk & Milk Products",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0016",
    "name": "Soy milk",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack",
      "Bedtime Snack"
    ],
    "calories": 80,
    "protein": 7.0,
    "carbs": 4.0,
    "fat": 4.0,
    "fiber": 1.0,
    "sodium": 80,
    "potassium": 240,
    "ingredients": [
      "Unsweetened, unfortified",
      "varies by brand"
    ],
    "recipe": [
      "Serve 200 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "200 ml",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0017",
    "name": "Almond milk",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack",
      "Bedtime Snack"
    ],
    "calories": 30,
    "protein": 1.0,
    "carbs": 1.0,
    "fat": 2.5,
    "fiber": 0.5,
    "sodium": 70,
    "potassium": 70,
    "ingredients": [
      "Unsweetened commercial almond milk",
      "varies by brand"
    ],
    "recipe": [
      "Serve 200 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "200 ml",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0018",
    "name": "Goat milk",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack",
      "Bedtime Snack"
    ],
    "calories": 138,
    "protein": 7.2,
    "carbs": 9.0,
    "fat": 8.2,
    "fiber": 0.0,
    "sodium": 100,
    "potassium": 408,
    "ingredients": [
      "Plain whole goat milk"
    ],
    "recipe": [
      "Serve 200 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "200 ml",
    "clinicalFocus": "Milk & Milk Products",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0022",
    "name": "Mixed vegetable raita",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 95,
    "protein": 4.5,
    "carbs": 10.0,
    "fat": 4.0,
    "fiber": 1.7,
    "sodium": 230,
    "potassium": 300,
    "ingredients": [
      "Curd 100g, vegetables 50g, salt"
    ],
    "recipe": [
      "Serve 150 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "150 g",
    "clinicalFocus": "Milk & Milk Products",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0023",
    "name": "Tea",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 65,
    "protein": 2.0,
    "carbs": 8.5,
    "fat": 2.5,
    "fiber": 0.0,
    "sodium": 28,
    "potassium": 95,
    "ingredients": [
      "Milk tea with 1 tsp sugar"
    ],
    "recipe": [
      "Serve 150 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "150 ml",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0024",
    "name": "Coffee",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 70,
    "protein": 2.5,
    "carbs": 9.0,
    "fat": 2.5,
    "fiber": 0.0,
    "sodium": 35,
    "potassium": 145,
    "ingredients": [
      "Milk coffee with 1 tsp sugar"
    ],
    "recipe": [
      "Serve 150 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "150 ml",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0025",
    "name": "Black tea",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 2,
    "protein": 0.0,
    "carbs": 0.5,
    "fat": 0.0,
    "fiber": 0.0,
    "sodium": 3,
    "potassium": 55,
    "ingredients": [
      "Without milk or sugar"
    ],
    "recipe": [
      "Serve 150 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "150 ml",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0026",
    "name": "Black coffee",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 2,
    "protein": 0.3,
    "carbs": 0.0,
    "fat": 0.0,
    "fiber": 0.0,
    "sodium": 5,
    "potassium": 75,
    "ingredients": [
      "Without milk or sugar"
    ],
    "recipe": [
      "Serve 150 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "150 ml",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0027",
    "name": "Sweetened lassi",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack",
      "Bedtime Snack"
    ],
    "calories": 180,
    "protein": 6.0,
    "carbs": 26.0,
    "fat": 6.0,
    "fiber": 0.0,
    "sodium": 85,
    "potassium": 280,
    "ingredients": [
      "Curd-based, with about 15g added sugar"
    ],
    "recipe": [
      "Serve 200 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "200 ml",
    "clinicalFocus": "Milk & Milk Products",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0028",
    "name": "Unsweetened lassi",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Breakfast",
      "Evening Snack",
      "Bedtime Snack"
    ],
    "calories": 110,
    "protein": 6.0,
    "carbs": 9.0,
    "fat": 6.0,
    "fiber": 0.0,
    "sodium": 90,
    "potassium": 280,
    "ingredients": [
      "Curd-based, no added sugar or salt"
    ],
    "recipe": [
      "Serve 200 ml as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "200 ml",
    "clinicalFocus": "Milk & Milk Products",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0029",
    "name": "Roasted kurmura with besan sev",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 175,
    "protein": 4.0,
    "carbs": 25.0,
    "fat": 7.0,
    "fiber": 1.8,
    "sodium": 270,
    "potassium": 125,
    "ingredients": [
      "Puffed rice 25g, besan sev 15g"
    ],
    "recipe": [
      "Serve 40 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "40 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0030",
    "name": "Sukha bhel with sprouts",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 205,
    "protein": 8.0,
    "carbs": 34.0,
    "fat": 5.0,
    "fiber": 6.0,
    "sodium": 340,
    "potassium": 380,
    "ingredients": [
      "Puffed rice, mixed sprouts, onion, chutney, little sev"
    ],
    "recipe": [
      "Serve 150 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "150 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0031",
    "name": "Sprouts chaat",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 145,
    "protein": 9.0,
    "carbs": 22.0,
    "fat": 2.5,
    "fiber": 6.5,
    "sodium": 240,
    "potassium": 430,
    "ingredients": [
      "Boiled mixed sprouts, vegetables, lemon and salt"
    ],
    "recipe": [
      "Serve 150 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "150 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0032",
    "name": "Paneer patties",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 290,
    "protein": 10.0,
    "carbs": 23.0,
    "fat": 18.0,
    "fiber": 2.0,
    "sodium": 390,
    "potassium": 230,
    "ingredients": [
      "Baked puff-pastry style paneer patty"
    ],
    "recipe": [
      "Serve 1 piece ~100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "1 piece ~100 g",
    "clinicalFocus": "Milk & Milk Products",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0033",
    "name": "Paneer cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 200,
    "protein": 8.0,
    "carbs": 15.0,
    "fat": 12.0,
    "fiber": 2.0,
    "sodium": 330,
    "potassium": 220,
    "ingredients": [
      "Shallow-fried paneer and potato cutlet"
    ],
    "recipe": [
      "Serve 1 piece ~80 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "1 piece ~80 g",
    "clinicalFocus": "Milk & Milk Products",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0034",
    "name": "Vegetable cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 155,
    "protein": 3.0,
    "carbs": 19.0,
    "fat": 8.0,
    "fiber": 3.0,
    "sodium": 300,
    "potassium": 290,
    "ingredients": [
      "Shallow-fried mixed vegetable cutlet"
    ],
    "recipe": [
      "Serve 1 piece ~80 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "1 piece ~80 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0035",
    "name": "Corn cutlet",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 175,
    "protein": 4.0,
    "carbs": 21.0,
    "fat": 9.0,
    "fiber": 2.5,
    "sodium": 300,
    "potassium": 240,
    "ingredients": [
      "Shallow-fried sweetcorn and potato cutlet"
    ],
    "recipe": [
      "Serve 1 piece ~80 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "1 piece ~80 g",
    "clinicalFocus": "Mixed Dishes & Other",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0037",
    "name": "Rajma khakhra",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 125,
    "protein": 5.0,
    "carbs": 19.0,
    "fat": 3.5,
    "fiber": 3.5,
    "sodium": 145,
    "potassium": 160,
    "ingredients": [
      "Whole wheat and rajma flour khakhra"
    ],
    "recipe": [
      "Serve 1 medium ~30 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "1 medium ~30 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0038",
    "name": "Plain vegetable sandwich",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 230,
    "protein": 7.0,
    "carbs": 39.0,
    "fat": 5.0,
    "fiber": 5.0,
    "sodium": 420,
    "potassium": 320,
    "ingredients": [
      "2 bread slices, cucumber, tomato, chutney",
      "no butter"
    ],
    "recipe": [
      "Serve 1 sandwich ~140 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "1 sandwich ~140 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0039",
    "name": "Toasted vegetable sandwich",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Evening Snack"
    ],
    "calories": 285,
    "protein": 8.0,
    "carbs": 40.0,
    "fat": 10.0,
    "fiber": 5.0,
    "sodium": 460,
    "potassium": 340,
    "ingredients": [
      "2 bread slices, vegetables, chutney and 1 tsp butter"
    ],
    "recipe": [
      "Serve 1 sandwich ~150 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "1 sandwich ~150 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0040",
    "name": "Cucumber sev puri (no maida)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 180,
    "protein": 5.0,
    "carbs": 23.0,
    "fat": 8.0,
    "fiber": 3.0,
    "sodium": 330,
    "potassium": 280,
    "ingredients": [
      "Cucumber rounds replacing puris, sev, chutneys"
    ],
    "recipe": [
      "Serve 1 plate ~120 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "1 plate ~120 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL — original estimate, not recalculated from IFCT ingredient exchanges | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0489",
    "name": "Almonds (Badam)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Almonds (Badam) — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0490",
    "name": "Cashews (Kaju)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Cashews (Kaju) — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0491",
    "name": "Walnuts (Akhrot)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Walnuts (Akhrot) — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0492",
    "name": "Pistachios (Pista)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Pistachios (Pista) — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0493",
    "name": "Peanuts (Groundnuts)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Peanuts (Groundnuts) — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0494",
    "name": "Hazelnuts",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Hazelnuts — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0495",
    "name": "Pecans",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Pecans — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0496",
    "name": "Macadamia nuts",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Macadamia nuts — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0497",
    "name": "Brazil nuts",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Brazil nuts — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0498",
    "name": "Pine nuts (Chilgoza)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Pine nuts (Chilgoza) — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0499",
    "name": "Chestnuts",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 100,
    "protein": 4.0,
    "carbs": 3.0,
    "fat": 8.5,
    "fiber": 2.5,
    "sodium": 2,
    "potassium": 128,
    "ingredients": [
      "Chestnuts — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Pulses, Proteins, Nuts & Seeds",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0504",
    "name": "Dry coconut (Kopra)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 100,
    "protein": 1.1,
    "carbs": 1.3,
    "fat": 10.0,
    "fiber": 2.3,
    "sodium": 2,
    "potassium": 110,
    "ingredients": [
      "Dry coconut (Kopra) — 15 g"
    ],
    "recipe": [
      "Serve 15 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "15 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Directly listed source exchange | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0505",
    "name": "Fresh coconut",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 100,
    "protein": 0.8,
    "carbs": 1.5,
    "fat": 10.3,
    "fiber": 1.5,
    "sodium": 1,
    "potassium": 37,
    "ingredients": [
      "Fresh coconut — 25 g"
    ],
    "recipe": [
      "Serve 25 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "25 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "Directly listed source exchange | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0506",
    "name": "Dates (Khajoor)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Evening Snack"
    ],
    "calories": 57,
    "protein": 0.2,
    "carbs": 13.5,
    "fat": 0.1,
    "fiber": 6.5,
    "sodium": 2,
    "potassium": 289,
    "ingredients": [
      "Dates (Khajoor) — 20 g"
    ],
    "recipe": [
      "Serve 20 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "20 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Directly listed source exchange | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0517",
    "name": "Amla (Indian gooseberry)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Amla (Indian gooseberry) — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0518",
    "name": "Guava",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Guava — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0519",
    "name": "Lime",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Lime — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0520",
    "name": "Orange",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Orange — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0521",
    "name": "Muskmelon",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Muskmelon — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0522",
    "name": "Watermelon",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Watermelon — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0523",
    "name": "Papaya",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Papaya — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0524",
    "name": "Peach",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Peach — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0525",
    "name": "Pear",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Pear — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0526",
    "name": "Pineapple",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Pineapple — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0527",
    "name": "Starfruit",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Starfruit — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0528",
    "name": "Strawberry",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Strawberry — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0529",
    "name": "Apple",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Apple — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0530",
    "name": "Blackberry",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Blackberry — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0531",
    "name": "Cherry",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Cherry — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0532",
    "name": "Fresh fig",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Fresh fig — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0533",
    "name": "Grapes",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Grapes — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0534",
    "name": "Jackfruit",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Morning Snack",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Jackfruit — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0535",
    "name": "Jamun",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Jamun — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0536",
    "name": "Litchi",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Litchi — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0537",
    "name": "Mango",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Mango — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0538",
    "name": "Plum",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Plum — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0539",
    "name": "Pomegranate",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Breakfast",
      "Lunch",
      "Evening Snack",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Pomegranate — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0540",
    "name": "Chikoo (Sapota)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Chikoo (Sapota) — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0541",
    "name": "Banana",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Banana — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0542",
    "name": "Custard apple",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 50,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 0.3,
    "fiber": 3.0,
    "sodium": 3,
    "potassium": 215,
    "ingredients": [
      "Custard apple — 100 g"
    ],
    "recipe": [
      "Serve 100 g as listed; no added sugar or salt unless prescribed."
    ],
    "prepTime": "5 mins",
    "cookTime": "0 mins",
    "portionSize": "100 g",
    "clinicalFocus": "Vegetables & Fruits",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Source group-average; NOT food-specific | Diabetes: Review portion and total meal carbohydrates | Renal: Review potassium, sodium, protein and prescribed renal stage"
  },
  {
    "id": "mf_0543",
    "name": "Bajra Rotlo",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Lunch",
      "Dinner"
    ],
    "calories": 133,
    "protein": 3.3,
    "carbs": 28.0,
    "fat": 0.7,
    "fiber": 3.3,
    "sodium": 1,
    "potassium": 97,
    "ingredients": [
      "Bajra flour (cereal) 40g",
      "Water 50g"
    ],
    "recipe": [
      "Home-cooked; no butter or ghee."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 medium rotlo (40 g flour)",
    "clinicalFocus": "Cereals & Grains",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium",
      "high_fiber"
    ],
    "restrictedConditions": [],
    "notes": "Exchange-calculated (ingredient quantities assumed); Ca/Mg unavailable; verify recipe | Diabetes: Portion-controlled; include in total carbohydrate plan | Renal: Individual renal review: potassium and sodium; not automatically renal-safe"
  },
  {
    "id": "mf_0544",
    "name": "Turmeric Milk (Haldi Doodh)",
    "dietaryType": "Vegetarian",
    "mealTypes": [
      "Bedtime Snack"
    ],
    "calories": 149,
    "protein": 6.4,
    "carbs": 9.8,
    "fat": 9.0,
    "fiber": 0.2,
    "sodium": 51,
    "potassium": 230,
    "ingredients": [
      "Cow milk 200 ml",
      "turmeric powder 1 g",
      "no sugar"
    ],
    "recipe": [
      "Heat milk with turmeric; serve warm."
    ],
    "prepTime": "5 mins",
    "cookTime": "10 mins",
    "portionSize": "1 cup (200 ml milk + 1 g turmeric)",
    "clinicalFocus": "Milk & Milk Products",
    "source": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sourceFileName": "Indian_Foods_With_Bedtime_Turmeric_Milk.xlsx",
    "sheetName": "Master - Backend",
    "tags": [
      "low_sodium"
    ],
    "restrictedConditions": [],
    "notes": "PROVISIONAL: milk exchange calculation; turmeric micronutrients not independently validated | Diabetes: Unsweetened; carbohydrate portion to be counted | Renal: Individual renal review: potassium, fluid and phosphorus"
  }
];
