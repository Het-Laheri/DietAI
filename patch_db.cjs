const fs = require('fs');
let code = fs.readFileSync('src/services/db.ts', 'utf8');

if (!code.includes('export interface ChecklistMealItem')) {
  const importsRegex = /import \{[\s\S]*?\} from 'firebase\/firestore';/;
  code = code.replace(importsRegex, (match) => {
    if (!match.includes('setDoc')) match = match.replace('}', ', setDoc }');
    if (!match.includes('getDoc')) match = match.replace('}', ', getDoc }');
    return match;
  });

  const appendCode = `
export interface ChecklistMealItem {
  id: string;
  mealType: string;
  name: string;
  portion: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  recipe?: string[];
  ingredients?: string[];
  completed: boolean;
  completedAt?: string;
}

export async function savePatientChecklist(patientId: string, date: string, items: ChecklistMealItem[]) {
  const sanitized = cleanFirestoreData(items);
  await setDoc(doc(db, 'patient_checklists', \`\${patientId}_\${date}\`), {
    patientId,
    date,
    items: sanitized,
    updatedAt: serverTimestamp()
  });
}

export async function getPatientChecklist(patientId: string, date: string): Promise<ChecklistMealItem[]> {
  const d = await getDoc(doc(db, 'patient_checklists', \`\${patientId}_\${date}\`));
  if (d.exists()) {
    return d.data().items || [];
  }
  return [];
}
`;
  code += appendCode;
  fs.writeFileSync('src/services/db.ts', code);
}
