const fs = require('fs');

// Fix MealPlanGenerator
let mpg = fs.readFileSync('src/pages/Dietician/MealPlanGenerator.tsx', 'utf8');
mpg = mpg.replace(/Object\.entries\(mealsRecord\)\.map\(\(\[mealType, val\]\) => \(\{/g, "Object.entries(mealsRecord).map(([mealType, val]: [string, any]) => ({");
fs.writeFileSync('src/pages/Dietician/MealPlanGenerator.tsx', mpg);

// Fix db.ts
let db = fs.readFileSync('src/services/db.ts', 'utf8');
db = db.replace(/patientProfile\?\.clinicalConditions/g, "patientProfile?.medicalHistory");
if (!db.includes('contraindicatedFor?: string[]')) {
  db = db.replace(/export interface RecipeDBItem \{/g, "export interface RecipeDBItem {\n  contraindicatedFor?: string[];");
}
fs.writeFileSync('src/services/db.ts', db);

