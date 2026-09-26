const fs = require('fs');
let code = fs.readFileSync('src/pages/Dietician/PatientProfileView.tsx', 'utf8');

if (!code.includes('ChecklistMealItem')) {
  code = code.replace(/import \{([^}]*)getStoredRecipesFromDB,([^}]*)\} from '\.\.\/\.\.\/services\/db';/, "import { $1getStoredRecipesFromDB, getPatientChecklist, ChecklistMealItem,$2} from '../../services/db';");
  
  code = code.replace(/const \[foodLogs, setFoodLogs\] = useState<FoodLog\[\]>\(\[\]\);/, "const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);\n  const [todayChecklist, setTodayChecklist] = useState<ChecklistMealItem[]>([]);");

  code = code.replace(/getQueries\(undefined, id\),\n\s*getClinicalNotes\(id\)\n\s*\]\);/, "getQueries(undefined, id),\n          getClinicalNotes(id),\n          getPatientChecklist(id, new Date().toISOString().split('T')[0])\n        ]);");
  
  code = code.replace(/setQueries\(qs\);\n\s*setClinicalNotes\(notes\);/, "setQueries(qs);\n        setClinicalNotes(notes);\n        setTodayChecklist(arguments[0][6] || []); // arguments[0] is the Promise.all result array");

  // Fix the Promise.all destructuring
  code = code.replace(/const \[p, plans, logs, prog, qs, notes\] = await Promise\.all\(\[/, "const [p, plans, logs, prog, qs, notes, checklist] = await Promise.all([");
  code = code.replace(/setTodayChecklist\(arguments\[0\]\[6\] \|\| \[\]\);/, "setTodayChecklist(checklist || []);");

  // Add the UI for Today's Checklist inside the "Food Logs" tab
  const checklistJSX = `
          {/* Today's Live Checklist Section */}
          <div className="bg-amber-50/50 rounded-2xl border border-amber-200/60 p-5 mb-6 shadow-inner">
            <h4 className="font-bold text-stone-900 text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Today's Live Meal Checklist (Real-time)
            </h4>
            {todayChecklist.length === 0 ? (
              <p className="text-xs text-stone-500">No checklist items synced for today yet.</p>
            ) : (
              <div className="space-y-2">
                {todayChecklist.map(item => (
                  <div key={item.id} className={\`p-3 rounded-xl flex items-start gap-3 \${item.completed ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-stone-200'}\`}>
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-stone-300 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-stone-900">{item.name}</span>
                        {item.completedAt && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <Clock className="w-3 h-3 inline mr-1" /> {item.completedAt}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {item.mealType} • {item.portion} {item.calories ? \`• \${item.calories} kcal\` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
`;

  code = code.replace(
    /<div className="divide-y divide-stone-100 space-y-4">/,
    checklistJSX + "\n          <h4 className=\"font-bold text-stone-900 text-sm mb-3\">Historical Food Logs</h4>\n          <div className=\"divide-y divide-stone-100 space-y-4\">"
  );

  fs.writeFileSync('src/pages/Dietician/PatientProfileView.tsx', code);
}
