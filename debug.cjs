const fs = require('fs');
const p = 'D:/repo/lyh/prdtest/OpenCodeUI/src/features/requirement/RequirementPanel.tsx';
let c = fs.readFileSync(p, 'utf8');
const bt = String.fromCharCode(96);
const lines = c.split('\n');

// Line 312 has extra } at end: `}" -> `"
lines[311] = lines[311].split('`"').join(bt + '"').split('`}"}').split('`}').join(bt);

// Actually let me just check what the line looks like
console.log('Line 312 before:', JSON.stringify(lines[311]));

// The issue is `}" at the end should be just `}
// But `} is correct for closing template literal + JSX expression
// Let me check the actual chars
const l = lines[311];
console.log('Last 10 chars:', l.substring(l.length-10));
console.log('Last 10 char codes:', Array.from(l.substring(l.length-10)).map(c=>c.charCodeAt(0)));