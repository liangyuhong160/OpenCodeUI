const fs = require('fs');
const p = 'D:/repo/lyh/prdtest/OpenCodeUI/src/features/requirement/RequirementPanel.tsx';
let c = fs.readFileSync(p, 'utf8');
const lines = c.split('\n');
const l = lines[311];
console.log('Line 312:', JSON.stringify(l));
console.log('Last 15 chars:', JSON.stringify(l.substring(l.length-15)));
const codes = Array.from(l.substring(l.length-15)).map(c => c.charCodeAt(0));
console.log('Codes:', codes);