const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// Update conditions
code = code.replace(
  /const TEST_PATIENT_EMAIL = 'testpatient@nutrisnap\.com';\n\s*const TEST_PATIENT_PASS = 'Patient123!';/,
  "const TEST_PATIENT_EMAIL = 'testpatient@nutrisnap.com';\n      const TEST_PATIENT_PASS = 'Patient123!';\n      const MEALS_TEST_EMAIL = 'mealstest@nutrisnap.com';\n      const MEALS_TEST_PASS = 'Meals123!';"
);

code = code.replace(
  /else if \(email\.toLowerCase\(\) === TEST_PATIENT_EMAIL && password === TEST_PATIENT_PASS\) \{/,
  "else if ((email.toLowerCase() === TEST_PATIENT_EMAIL && password === TEST_PATIENT_PASS) || (email.toLowerCase() === MEALS_TEST_EMAIL && password === MEALS_TEST_PASS)) {"
);

code = code.replace(
  /const user = await registerPatient\(email, password, 'Demo VIP Patient', \{/,
  "const isMealsTest = email.toLowerCase() === MEALS_TEST_EMAIL;\n            const patientName = isMealsTest ? 'Meals Test Patient' : 'Demo VIP Patient';\n            const user = await registerPatient(email, password, patientName, {"
);

// Add Button
const newBtn = `
                <button
                  type="button"
                  onClick={() => {
                    setEmail('mealstest@nutrisnap.com');
                    setPassword('Meals123!');
                  }}
                  className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 transition-all text-left flex flex-col justify-between shadow-xs group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Meals Test Patient
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                      VIP Unlocked
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-stone-700 truncate">mealstest@nutrisnap.com</span>
                  <span className="text-[10px] text-stone-500 mt-0.5">Pass: Meals123!</span>
                  <span className="text-[10px] font-bold text-emerald-600 mt-2 group-hover:underline">
                    Click to auto-fill →
                  </span>
                </button>
`;

code = code.replace(
  /Click to auto-fill →\n\s*<\/span>\n\s*<\/button>/,
  "Click to auto-fill →\n                  </span>\n                </button>" + newBtn
);

fs.writeFileSync('src/pages/Login.tsx', code);
