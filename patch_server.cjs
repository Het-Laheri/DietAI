const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Resolve Conflict 1: Imports
code = code.replace(/<<<<<<< HEAD\n=======\n/g, '');
code = code.replace(/>>>>>>> eef303c.*?\n/g, '');

// Resolve Conflict 2: The old route
const conflict2Regex = /<<<<<<< HEAD\n\s*\/\/ Excel Knowledge Base Import Route \(\.xlsx \/ \.csv\)\n\s*app\.post\(\['\/api\/knowledge\/import-excel', '\/knowledge\/import-excel'\], async \(req, res\) => \{\n\s*try \{\n\s*const \{ base64File, fileData, fileName \} = req\.body;\n\s*let workbook: XLSX\.WorkBook;\n=======\n/;

code = code.replace(conflict2Regex, '');

fs.writeFileSync('server.ts', code);
