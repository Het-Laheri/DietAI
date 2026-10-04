import { ClinicalGuideItem } from '../services/db';

export const CLINICAL_GUIDES: ClinicalGuideItem[] = [
  {
    id: 'heart_health_fats_grains',
    title: 'Low Cholesterol & Heart Health Diet: Fats, Oils & Grains',
    subtitle: 'Fats and Oils (5-8 tsp/day) & Grains, Breads, Cereals (6+ servings/day)',
    category: 'Heart Health',
    imageUrl: '/guide-heart-health-1.jpg',
    description: 'Evidence-based cardiovascular diet guidelines for managing LDL cholesterol, arterial health, and cardiovascular risk through smart fat and complex carbohydrate selections.',
    chooseFoods: [
      'Corn, olive, canola, safflower, sesame, soybean & sunflower oils',
      'Margarine with liquid vegetable oil as first ingredient & < 2g saturated fat',
      'Whole grain breads, water bagels, English muffins, rice cakes',
      'Low-fat crackers, hot & cold whole grain cereals, spaghetti, macaroni, noodles, plain baked potato',
      'Dried peas & beans, lentils'
    ],
    goEasyFoods: [
      'Nuts, seeds, avocados, olives, peanut oil',
      'Store-bought pancakes, waffles, biscuits, muffins, corn bread'
    ],
    avoidFoods: [
      'Croissants, sweet rolls, danish, doughnuts, pastries',
      'Crackers and granola cereals made with saturated/hydrogenated oils',
      'Egg noodles, pasta or rice prepared with cream butter or cheese sauces',
      'Scalloped potatoes, coconut, vegetables prepared in heavy butter, cream or rich sauces'
    ]
  },
  {
    id: 'heart_health_meats_dairy',
    title: 'Low Cholesterol & Heart Health Diet: Meats, Dairy & Eggs',
    subtitle: 'Lean Meats (up to 6 oz/day), Low-Fat Dairy (2-4 servings/day) & Egg Guidelines',
    category: 'Heart Health',
    imageUrl: '/guide-heart-health-3.jpg',
    description: 'Clinical criteria for saturated fat and dietary cholesterol reduction across animal proteins, poultry, seafood, and dairy products.',
    chooseFoods: [
      'Lean cuts of meat with all visible fat trimmed off',
      'Chicken & turkey without skin, fresh fish',
      'Skim milk (fat-free), 1% low-fat milk, low-fat buttermilk, evaporated skim milk',
      'Low-fat yogurt, low-fat cottage cheese, cheese with ≤ 3g fat per ounce',
      'Egg whites, cholesterol-free egg substitutes (unlimited)'
    ],
    goEasyFoods: [
      'Shellfish (shrimp, crab, lobster)',
      '2% fat milk, plain low-fat yogurt, part-skim ricotta, part-skim or imitation hard cheeses',
      'Part-skim mozzarella, "lite" cream cheese, "lite" sour cream',
      'Egg yolks limited to 3-4 per week'
    ],
    avoidFoods: [
      'PRIME-grade fatty cuts of beef, pork, goose, duck',
      'Organ meats: liver, kidneys, brain',
      'Sausages, bacon, regular luncheon meats, hot dogs, salami',
      'Whole milk, cream, half-and-half, whipped cream, custard-style yogurt, whole milk ricotta',
      'Hard high-fat cheeses (Swiss, American cheddar, muenster), regular cream cheese & sour cream',
      'Saturated fats: butter, lard, bacon fat, coconut oil, palm & palm kernel oils'
    ]
  },
  {
    id: 'heart_health_fruits_snacks',
    title: 'Low Cholesterol & Heart Health Diet: Fruits, Vegetables & Snacks',
    subtitle: 'Produce (5+ servings/day) & Low-Saturated-Fat Snack Protocol',
    category: 'Heart Health',
    imageUrl: '/guide-heart-health-2.png',
    description: 'Promoting soluble and insoluble dietary fiber to bind bile acids, lower total cholesterol, and satisfy hunger without trans or saturated fats.',
    chooseFoods: [
      'Fresh, frozen or dried fruits',
      'Canned fruits packed in natural juice or water (monitor sodium content)',
      'All fresh vegetables, leafy greens, steamed or roasted veggies without butter',
      'Sherbet, sorbet, Italian fruit ice, low-fat frozen yogurt, popsicles',
      'Angel food cake, fig bars, gingersnaps, low-fat jelly beans, plain air-popped popcorn'
    ],
    goEasyFoods: [
      'Canned fruit in heavy syrup (high added sugar)',
      'Dried fruits with added sugars or glaze'
    ],
    avoidFoods: [
      'Ice cream, deep-fried tofu, candy, milk chocolate, potato chips',
      'Buttered movie-style popcorn, milkshakes, frappes, ice cream floats, eggnog',
      'Store-bought commercial pies, frosted bakery cakes, and high-fat pound cakes'
    ]
  },
  {
    id: 'how_to_read_nutrition_facts',
    title: 'How to Read a Nutrition Facts Label: Step-by-Step Patient Guide',
    subtitle: 'Mastering Servings, % Daily Value (DV), Calorie Density & Core Nutrients',
    category: 'Nutrition Facts',
    imageUrl: '/guide-nutrition-facts.png',
    description: 'A practical, 5-section visual framework helping patients decode packaged food labels, avoid hidden sodium/sugars, and make informed choices.',
    bulletPoints: [
      'Section 1 — Serving Size & Servings Per Container: Always check this first! The nutrient values listed apply only to ONE serving, not the entire package.',
      'Section 2 — Calories: Quantifies the total energy provided per serving. If you eat two servings, double all calories and macros.',
      'Section 3 — Nutrients to Limit: Eating too much Total Fat, Saturated Fat, Trans Fat, Cholesterol, and Sodium increases risk of hypertension, cardiovascular disease, and metabolic disorders.',
      'Section 4 — Healthy Nutrients to Get Enough Of: Ensure adequate Dietary Fiber, Protein, Vitamin A, Vitamin C, Calcium, and Iron to support gut microbiota, immunity, and bone density.',
      'Section 5 — % Daily Value (% DV): Based on a 2,000 calorie reference diet. Rule of thumb: 5% DV or less is LOW (good for sodium/saturated fat); 20% DV or more is HIGH (great for fiber/protein/vitamins).'
    ]
  },
  {
    id: 'keto_food_pyramid',
    title: 'Ketogenic Diet Food Pyramid: Foundation, Moderate & Excluded Foods',
    subtitle: 'Healthy Fats & Proteins at Base, Low-Carb Veggies & Berries, Strict Carb Exclusions',
    category: 'Keto',
    imageUrl: '/guide-keto-pyramid.png',
    description: 'Clinical macronutrient hierarchy for patients on very-low-carbohydrate, high-healthy-fat nutritional protocols for insulin stabilization and ketosis.',
    chooseFoods: [
      'Pyramid Base — High-Quality Proteins: Meats, poultry, fish, shrimp/seafood',
      'Healthy Fats & Dairy: Eggs, butter, ghee, olive oil, avocado oil, hard cheeses',
      'Low-Carb Green Vegetables: Spinach, kale, broccoli, lettuce, zucchini, avocado',
      'Moderate Veggies: Bell peppers, cucumbers, celery, asparagus, mushrooms',
      'Pyramid Peak — Nuts, Seeds & Low-Sugar Berries: Walnuts, almonds, chia seeds, flax seeds, strawberries, blueberries (limited portions)'
    ],
    avoidFoods: [
      'Bread (white, multigrain, pita)',
      'Pasta & noodles',
      'Refined Sugar, sweets, honey & sugary desserts',
      'Cow Milk (high lactose content)',
      'Corn & sweet corn products',
      'Beans, chickpeas, lentils & legumes (high starchy carb count)',
      'White & brown rice, quinoa, grains'
    ]
  }
];
