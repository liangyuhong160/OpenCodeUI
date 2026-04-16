const fs = require('fs');
const p = 'D:/repo/lyh/prdtest/OpenCodeUI/src/features/requirement/RequirementPanel.tsx';
let c = fs.readFileSync(p, 'utf8');
const bt = String.fromCharCode(96);
const lines = c.split('\n');

// Line 312 ends with `}" but should end with `}
// Remove the trailing }
const l312 = lines[311];
if (l312.endsWith('`}"}')) {
  lines[311] = l312.slice(0, -1);
  console.log('Fixed line 312 - removed trailing }');
} else if (l312.endsWith('`}')) {
  console.log('Line 312 looks correct');
} else {
  console.log('Line 312 ends with:', JSON.stringify(l312.substring(l312.length-5)));
}

c = lines.join('\n');
fs.writeFileSync(p, c, 'utf8');