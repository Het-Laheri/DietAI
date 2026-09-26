const fs = require('fs');
let code = fs.readFileSync('src/pages/Patient/MealNotepad.tsx', 'utf8');

// Ensure ChecklistMealItem is imported from db.ts and removed locally
code = code.replace(/interface ChecklistMealItem \{[\s\S]*?\}\n/, '');
code = code.replace(/import \{([^}]*)MealPlan, Meal([^}]*)\} from '\.\.\/\.\.\/services\/db';/, "import { $1MealPlan, Meal, ChecklistMealItem, savePatientChecklist, getPatientChecklist $2} from '../../services/db';");

// Update loadPlanAndChecklist
code = code.replace(
  /const savedRaw = localStorage\.getItem\(storageKey\);\n\s*const savedState: Record<string, \{ completed: boolean; completedAt\?: string \}> = savedRaw\n\s*\? JSON\.parse\(savedRaw\)\n\s*: \{\};/,
  "const savedStateList = await getPatientChecklist(profile.uid, todayStr);\n        const savedState: Record<string, ChecklistMealItem> = {};\n        savedStateList.forEach(i => savedState[i.id] = i);"
);

// If there are saved states, we might have custom items.
// We should make sure custom items (which don't match the plan) are retained!
code = code.replace(
  /setItems\(initialList\);/,
  `// Add any custom items from savedState that aren't in initialList
        const planItemIds = new Set(initialList.map(i => i.id));
        savedStateList.forEach(item => {
          if (!planItemIds.has(item.id)) {
            initialList.push(item);
          } else {
            // Update initialList with saved completed info
            const match = initialList.find(i => i.id === item.id);
            if (match) {
              match.completed = item.completed;
              match.completedAt = item.completedAt;
            }
          }
        });
        setItems(initialList);`
);

// Remove the inline item.completed map logic inside initialList mapping because we handled it above.
// Actually, it's safer to just replace toggleItem to also save to DB.
code = code.replace(
  /localStorage\.setItem\(storageKey, JSON\.stringify\(stateMap\)\);/,
  "localStorage.setItem(storageKey, JSON.stringify(stateMap));\n    if (profile) savePatientChecklist(profile.uid, todayStr, updated);"
);

// Add custom food state and handler
code = code.replace(
  /const \[patientReflection, setPatientReflection\] = useState\(''\);/,
  "const [patientReflection, setPatientReflection] = useState('');\n  const [customFoodText, setCustomFoodText] = useState('');\n  const [addingCustomFood, setAddingCustomFood] = useState(false);"
);

const handleAddCustomStr = `
  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodText.trim() || !profile) return;
    setAddingCustomFood(true);
    try {
      const res = await fetch('/api/ai/estimate-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodDesc: customFoodText })
      });
      let est = { name: customFoodText, portion: 'As consumed', calories: 0, protein: 0, carbs: 0, fat: 0 };
      if (res.ok) {
        est = await res.json();
      }
      const newItem: ChecklistMealItem = {
        id: 'custom_' + Date.now(),
        mealType: 'CUSTOM DIETARY NOTE',
        name: est.name || customFoodText,
        portion: est.portion || 'As consumed',
        calories: est.calories || 0,
        protein: est.protein || 0,
        carbs: est.carbs || 0,
        fat: est.fat || 0,
        completed: true,
        completedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      };
      const updated = [...items, newItem];
      setItems(updated);
      setCustomFoodText('');
      await savePatientChecklist(profile.uid, todayStr, updated);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCustomFood(false);
    }
  };
`;
code = code.replace(
  /const handleSaveReflection = \(\) => \{/,
  handleAddCustomStr + "\n  const handleSaveReflection = () => {"
);

// Add the custom food form to JSX
const customFormJSX = `
              {/* Add Custom Food Section */}
              <div className="p-4 bg-white/50 border-t border-stone-200/70 mt-4 rounded-b-2xl">
                <form onSubmit={handleAddCustomItem} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={customFoodText}
                    onChange={(e) => setCustomFoodText(e.target.value)}
                    placeholder="Add additional food or custom snack (e.g. 250g brownie cake)"
                    className="flex-1 p-3 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    disabled={addingCustomFood}
                  />
                  <button
                    type="submit"
                    disabled={!customFoodText.trim() || addingCustomFood}
                    className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addingCustomFood ? 'Estimating...' : 'Add to Checklist'}
                  </button>
                </form>
              </div>
            </div>
`;
code = code.replace(/<\/div>\n\s*\}\)\}\n\s*<\/div>\n\s*\)}/, customFormJSX + "\n          )}");

fs.writeFileSync('src/pages/Patient/MealNotepad.tsx', code);
