import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'careclarity-e67bb',
  appId: '1:84746597643:web:cce300194b200eb5cbde0e',
  apiKey: 'AIzaSyCuHfs4FyxUCMlAcZyT5tjsKr43BYba99M',
  authDomain: 'careclarity-e67bb.firebaseapp.com',
  storageBucket: 'careclarity-e67bb.firebasestorage.app',
  messagingSenderId: '84746597643',
};

const app = getApps().some(a => a.name === 'admin_knowledge_backend')
  ? getApps().find(a => a.name === 'admin_knowledge_backend')!
  : initializeApp(firebaseConfig, 'admin_knowledge_backend');

const auth = getAuth(app);
const db = initializeFirestore(app, {}, 'ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf');

const DEFAULT_CLINICAL_RECIPES = [
  {
    id: 'rec_1',
    name: 'Sprouted Moong & Vegetable Khichdi',
    dietaryType: 'Vegetarian',
    calories: 310,
    protein: 14,
    carbs: 48,
    fat: 6,
    ingredients: ['1/2 cup Sprouted Green Moong Dal', '1/4 cup Brown Rice', '1/2 cup Diced Mixed Vegetables (Carrot, Beans, Peas)', '1 tsp Cow Ghee', 'Cumin, Hing, Turmeric, Ginger Paste'],
    recipe: [
      'Rinse sprouted moong dal and brown rice thoroughly.',
      'Heat ghee in a pressure cooker, splutter cumin seeds and hing.',
      'Add ginger paste, mixed vegetables, turmeric, and pinch of pink salt.',
      'Add soaked dal and rice with 2.5 cups of water.',
      'Pressure cook for 3-4 whistles on medium flame until soft. Serve warm with homemade curd.'
    ],
    prepTime: '10 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Low-GI & Gut Health / Recovery',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Vegetarian'
  },
  {
    id: 'rec_2',
    name: 'Palak Paneer with Multigrain Phulka',
    dietaryType: 'Vegetarian',
    calories: 380,
    protein: 18,
    carbs: 32,
    fat: 16,
    ingredients: ['200g Fresh Spinach (blanched & pureed)', '80g Low-Fat Cow Milk Paneer cubes', '1 tsp Cumin Seeds', '1 tsp Ginger-Garlic Paste', '1 tsp Cold-Pressed Mustard Oil', '2 Multigrain Phulkas (50g)'],
    recipe: [
      'Blanch spinach leaves in hot water for 2 mins, shock in cold water, and puree smoothly.',
      'Heat oil in a pan, temper cumin seeds, and sauté ginger-garlic paste.',
      'Add spinach puree, mild spices (turmeric, garam masala, salt) and simmer for 5 mins.',
      'Add paneer cubes, cook on low flame for 2 mins, and serve fresh with 2 hot multigrain phulkas.'
    ],
    prepTime: '15 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Metabolic & Iron Replenishment',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Vegetarian'
  },
  {
    id: 'rec_3',
    name: 'Grilled Herb Chicken Breast with Steamed Quinoa & Greens',
    dietaryType: 'Non-Vegetarian',
    calories: 420,
    protein: 42,
    carbs: 28,
    fat: 10,
    ingredients: ['180g Boneless Skinless Chicken Breast', '1/2 cup Cooked Quinoa', '100g Steamed Broccoli & Zucchini', '1 tsp Extra Virgin Olive Oil', 'Lemon juice, Rosemary, Black Pepper & Himalayan Salt'],
    recipe: [
      'Marinate clean chicken breast with lemon juice, crushed garlic, rosemary, and olive oil for 20 mins.',
      'Grill on a ridged pan for 6-7 minutes on each side until internal temperature reaches 75°C.',
      'Steam broccoli florets and sliced zucchini for 4 mins to retain crispness and chlorophyll.',
      'Assemble plated meal with warm fluffy quinoa, sliced chicken breast, and steamed greens.'
    ],
    prepTime: '20 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Lean Muscle & Weight Management',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Non-Vegetarian'
  },
  {
    id: 'rec_4',
    name: 'Steamed Pomfret Fish Curry with Brown Basmati Rice',
    dietaryType: 'Non-Vegetarian',
    calories: 360,
    protein: 32,
    carbs: 35,
    fat: 7,
    ingredients: ['150g Fresh Pomfret / Rohu Fish Fillet', '1/2 cup Cooked Brown Basmati Rice', 'Tomato & Kokum / Tamarind Broth', 'Curry Leaves, Fenugreek Seeds & Turmeric', '1 tsp Sesame Oil'],
    recipe: [
      'Heat sesame oil, temper fenugreek seeds and fresh curry leaves.',
      'Pour in tomato-kokum broth with turmeric, red chili, and coriander powder; bring to a boil.',
      'Gently slide fish fillets into the simmering gravy. Cover and cook on gentle flame for 7-8 mins.',
      'Serve warm alongside measured portion of fiber-rich steamed brown basmati rice.'
    ],
    prepTime: '15 mins',
    cookTime: '12 mins',
    clinicalFocus: 'Cardiovascular & Omega-3 Care',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Non-Vegetarian'
  },
  {
    id: 'rec_5',
    name: 'Jain Paneer & Bottle Gourd (Doodhi) Curry with Roti',
    dietaryType: 'Jain',
    calories: 270,
    protein: 15,
    carbs: 28,
    fat: 9,
    ingredients: ['150g Peeled Bottle Gourd (Doodhi)', '60g Fresh Paneer cubes', 'Tomato Puree (no onion/garlic/root veg)', '1 tsp Ghee', 'Cumin, Hing, Turmeric, Coriander powder', '2 Whole Wheat Rotis'],
    recipe: [
      'Pressure cook diced bottle gourd with water and pinch of turmeric until soft.',
      'In a pan, heat 1 tsp ghee, add hing and cumin seeds. Add tomato puree and spices.',
      'Stir in cooked bottle gourd and paneer cubes. Simmer for 5 mins until thick gravy forms.',
      'Garnish with fresh coriander leaves and serve with fresh rotis.'
    ],
    prepTime: '10 mins',
    cookTime: '15 mins',
    clinicalFocus: 'Jain Gut Health & Cooling Digestion',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Jain Clinical'
  },
  {
    id: 'rec_6',
    name: 'Jain Moong & Cabbage Tikki with Raw Mango Dip',
    dietaryType: 'Jain',
    calories: 240,
    protein: 12,
    carbs: 32,
    fat: 6,
    ingredients: ['1 cup Soaked & Coarsely Ground Moong Dal', '1/2 cup Shredded Cabbage (Jain compliant)', 'Ginger-free green chilli paste', '1 tsp Roasted Cumin Powder', '1 tsp Oil for shallow frying'],
    recipe: [
      'Mix coarsely ground moong dal with finely shredded cabbage, green chillies, and roasted cumin.',
      'Form into round flat cutlets/tikkis.',
      'Shallow fry on a non-stick pan with light oil brush until crisp and golden brown.',
      'Serve hot with Jain-friendly raw mango or mint chutney.'
    ],
    prepTime: '15 mins',
    cookTime: '10 mins',
    clinicalFocus: 'Jain Satiety & Low-GI',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Jain Clinical'
  },
  {
    id: 'rec_7',
    name: 'Tofu & Bell Pepper Stir-Fry with Sesame & Quinoa',
    dietaryType: 'Vegan',
    calories: 290,
    protein: 20,
    carbs: 24,
    fat: 11,
    ingredients: ['150g Firm Organic Tofu (cubed)', '1 cup Tri-color Bell Peppers & Spring Onion Greens', '1/2 cup Cooked Quinoa', '1 tsp Toasted Sesame Seeds', '1 tsp Cold-Pressed Sesame Oil & Low-Sodium Tamari'],
    recipe: [
      'Press tofu to remove excess moisture and cut into cubes.',
      'Heat sesame oil in a wok, stir fry sliced bell peppers and greens on high heat for 2 mins.',
      'Add tofu cubes and low-sodium tamari / soy sauce, tossing continuously until edges are golden.',
      'Sprinkle toasted sesame seeds and serve warm over fluffy quinoa.'
    ],
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: '100% Plant-Based Anti-Inflammatory',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Vegan'
  },
  {
    id: 'rec_8',
    name: 'Sprouted Methi & Black Chana Sundal',
    dietaryType: 'Vegan',
    calories: 250,
    protein: 13,
    carbs: 35,
    fat: 5,
    ingredients: ['1 cup Boiled Kala Chana (Black Chickpeas)', '2 tbsp Sprouted Fenugreek (Methi) seeds', '1 tbsp Fresh Grated Coconut', 'Curry Leaves, Mustard Seeds, Green Chili', '1 tsp Coconut Oil'],
    recipe: [
      'Boil pre-soaked black chickpeas until tender with a pinch of rock salt.',
      'Heat coconut oil in a pan, splutter mustard seeds, curry leaves, and green chillies.',
      'Add boiled chickpeas and sprouted methi seeds. Sauté for 3 mins.',
      'Garnish with grated fresh coconut and squeeze fresh lime juice before serving.'
    ],
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: 'Insulin Sensitivity & High Fiber',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Vegan'
  },
  {
    id: 'rec_9',
    name: 'Double Egg White & Spinach Bhurji with 2 Rotis',
    dietaryType: 'Eggetarian',
    calories: 320,
    protein: 22,
    carbs: 32,
    fat: 9,
    ingredients: ['3 Egg Whites + 1 Whole Egg', '1 cup Chopped Fresh Spinach', '1 Small Tomato & Green Chilli (chopped)', '1 tsp Olive Oil', 'Turmeric, Cumin & Black Pepper', '2 Whole Wheat Rotis'],
    recipe: [
      'Whisk egg whites and 1 whole egg together with black pepper and salt.',
      'Heat olive oil, sauté cumin seeds, chopped tomatoes, and green chillies.',
      'Add chopped spinach and cook for 2 mins until wilted.',
      'Pour whisked eggs into the pan and scramble gently on medium heat until soft and fluffy. Serve with rotis.'
    ],
    prepTime: '10 mins',
    cookTime: '8 mins',
    clinicalFocus: 'Lean Protein & Muscle Recovery',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Eggetarian'
  },
  {
    id: 'rec_10',
    name: 'Boiled Egg Chaat with Sprouted Moong & Lemon',
    dietaryType: 'Eggetarian',
    calories: 230,
    protein: 17,
    carbs: 18,
    fat: 8,
    ingredients: ['2 Hard-Boiled Eggs (sliced)', '1/2 cup Steamed Moong Sprouts', '1/4 cup Diced Cucumber & Tomatoes', '1/2 tsp Chaat Masala & Roasted Cumin', 'Fresh Lemon Juice & Chopped Mint'],
    recipe: [
      'Hard boil 2 fresh eggs for 9 mins, peel and slice into wedges.',
      'In a bowl, combine steamed moong sprouts, cucumber, and tomatoes.',
      'Toss with chaat masala, roasted cumin powder, and lemon juice.',
      'Arrange sliced eggs on top, garnish with fresh mint leaves and serve immediately.'
    ],
    prepTime: '10 mins',
    cookTime: '10 mins',
    clinicalFocus: 'High-Protein Afternoon Satiety Snack',
    sourceFileName: 'Clinical_IFCT_Standard.xlsx',
    sheetName: 'Eggetarian'
  }
];

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    try {
      if (!auth.currentUser) {
        await signInWithEmailAndPassword(auth, 'admin@aidiet.com', 'Admin123!');
      }
    } catch (e) {
      console.warn('Backend auth attempt notice:', e);
    }

    let recipes = DEFAULT_CLINICAL_RECIPES;

    try {
      const snap = await getDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'));
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.recipes) && data.recipes.length > 0) {
          recipes = data.recipes;
        }
      }
    } catch (firestoreErr) {
      console.warn('Firestore read fallback to default clinical recipes:', firestoreErr);
    }

    return res.status(200).json({
      count: recipes.length,
      recipes,
      sample: recipes.slice(0, 10)
    });
  } catch (error: any) {
    console.error('Error in /api/knowledge/list:', error);
    return res.status(200).json({
      count: DEFAULT_CLINICAL_RECIPES.length,
      recipes: DEFAULT_CLINICAL_RECIPES,
      sample: DEFAULT_CLINICAL_RECIPES.slice(0, 10)
    });
  }
}
