const fs = require('fs');
let code = fs.readFileSync('src/pages/Dietician/PatientProfileView.tsx', 'utf8');

code = code.replace(
  /\{foodLogs\.length === 0 \? \(\n\s*<div className="text-center py-12 text-stone-400 text-xs">\n\s*No meal logs have been recorded by this client yet\.\n\s*<\/div>\n\s*\) : \(\n\s*\{\/\*/,
  "{foodLogs.length === 0 ? (\n            <div className=\"text-center py-12 text-stone-400 text-xs\">\n              No meal logs have been recorded by this client yet.\n            </div>\n          ) : (\n            <>\n          {/*"
);

code = code.replace(
  /<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\)}/,
  "</div>\n              )}\n            </div>\n            </>\n          )}"
);

fs.writeFileSync('src/pages/Dietician/PatientProfileView.tsx', code);
