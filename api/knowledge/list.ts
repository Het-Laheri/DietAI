import { guard, getAdminDb } from '../_lib/security.js';
import { DEFAULT_CLINICAL_RECIPES } from '../../src/services/defaultRecipes.js';

// GET /api/knowledge/list   (any signed-in user)
// Returns the clinical recipe knowledge base, falling back to the bundled default set.
export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, { methods: ['GET'] });
  if (!caller) return;

  let recipes: any[] = DEFAULT_CLINICAL_RECIPES;
  try {
    const snap = await getAdminDb().collection('dietician_notes').doc('clinical_knowledge_base').get();
    const stored = snap.exists ? snap.get('recipes') : null;
    if (Array.isArray(stored) && stored.length >= 200) {
      recipes = stored;
    }
  } catch {
    console.warn('[knowledge/list] Firestore read failed; using default recipes');
  }

  return res.status(200).json({
    count: recipes.length,
    recipes,
    sample: recipes.slice(0, 10),
  });
}
