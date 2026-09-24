const fs = require('fs');
let file2 = fs.readFileSync('src/pages/DieticianDashboard.tsx', 'utf8');
file2 = file2.replace("import { db } from '../config/firebase';", "import { db } from '../services/firebase';\nimport { query, collection, onSnapshot } from 'firebase/firestore';");
fs.writeFileSync('src/pages/DieticianDashboard.tsx', file2);
