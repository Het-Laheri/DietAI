const fs = require('fs');

let file1 = fs.readFileSync('src/pages/Dietician/PatientProfileView.tsx', 'utf8');
file1 = file1.replace("import { ChevronRight, ClipboardList, Dumbbell, Stethoscope, ChevronDown, Check, Loader2, ArrowRight } from 'lucide-react';", "import { ChevronRight, ClipboardList, Dumbbell, Stethoscope, ChevronDown, Check, Loader2, ArrowRight, Wand2 } from 'lucide-react';");
fs.writeFileSync('src/pages/Dietician/PatientProfileView.tsx', file1);

let file2 = fs.readFileSync('src/pages/DieticianDashboard.tsx', 'utf8');
file2 = file2.replace("import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';", "import { collection, query, where, getDocs, updateDoc, doc, addDoc, onSnapshot } from 'firebase/firestore';");
file2 = file2.replace("import { db, auth } from '../config/firebase';", "import { db, auth } from '../config/firebase';"); // Check if it's there
if (!file2.includes("import { db")) {
  file2 = file2.replace("import { db } from '../../services/db';", "import { db } from '../config/firebase';");
  // Let me just add the import at the top
  file2 = "import { db } from '../config/firebase';\n" + file2;
}
fs.writeFileSync('src/pages/DieticianDashboard.tsx', file2);
