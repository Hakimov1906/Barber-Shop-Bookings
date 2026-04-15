const fs = require('fs');
const path = require('path');
const root = path.resolve('src');
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(name)) files.push(full);
  }
}
walk(root);
const ignorePatterns = [
  /tr\(/,
  /tv\(/,
  /useI18n/,
  /import\s+/, 
  /export\s+/, 
  /interface\s+/, 
  /type\s+/, 
  /const\s+/, 
  /let\s+/, 
  /function\s+/, 
  /=>/, 
  /\bif\b/, 
  /return\s+/, 
  /className=/,
  /style=/,
  /key=/,
  /data-/,
  /aria-/,
  /href=/,
  /src=/,
  /to=|from=/,
  /\bnew\b/,
  /\bthis\b/,
  /\btrue\b/,
  /\bfalse\b/,
  /#[0-9A-Fa-f]{3,6}/,
];
const results = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/["'][A-Za-z].*["']/.test(line)) continue;
    if (ignorePatterns.some((rx) => rx.test(line))) continue;
    results.push({ file: path.relative(process.cwd(), file), line: i + 1, text: line.trim() });
  }
}
for (const item of results) {
  console.log(`${item.file}:${item.line}: ${item.text}`);
}
console.log('TOTAL', results.length);
