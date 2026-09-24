const fs = require('fs');
let pkg = fs.readFileSync('package.json', 'utf8');
pkg = pkg.replace(/<<<<<<< HEAD\n\s*"razorpay": "\^2\.9\.8",\n=======\n\s*"pdf-parse": "\^2\.4\.5",\n>>>>>>> .*?\n/g, '    "pdf-parse": "^2.4.5",\n    "razorpay": "^2.9.8",\n');
fs.writeFileSync('package.json', pkg);
