import fs from 'fs';
import path from 'path';

const srcDir = 'd:/Volaitile Friday/frontend/src';

const hexCounts = {};
const rgbCounts = {};

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(jsx?|tsx?|css|html)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const hexMatches = content.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g);
      for (const m of hexMatches) {
        const hex = m[0].toLowerCase();
        hexCounts[hex] = (hexCounts[hex] || 0) + 1;
      }
      
      const rgbMatches = content.matchAll(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/g);
      for (const m of rgbMatches) {
        const rgb = m[0].replace(/\s+/g, ' ').toLowerCase();
        rgbCounts[rgb] = (rgbCounts[rgb] || 0) + 1;
      }
    }
  }
}

scanDir(srcDir);

console.log('--- HEX COUNTS ---');
const sortedHex = Object.entries(hexCounts).sort((a, b) => b[1] - a[1]);
for (const [hex, count] of sortedHex) {
  console.log(`${hex}: ${count}`);
}

console.log('--- RGB COUNTS ---');
const sortedRgb = Object.entries(rgbCounts).sort((a, b) => b[1] - a[1]);
for (const [rgb, count] of sortedRgb) {
  console.log(`${rgb}: ${count}`);
}
