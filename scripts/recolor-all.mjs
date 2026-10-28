import fs from 'fs';
import path from 'path';

const srcDir = 'd:/Volaitile Friday/frontend/src';

const hexReplacements = [
  // Order matters: specific hexes
  ['#140d09', '#18102B'],
  ['#0f0a07', '#110B20'],
  ['#1e130d', '#211737'],
  ['#2a1a11', '#2C2048'],
  ['#f3e6da', '#F5F3FF'],
  ['#c4b5a8', '#C9C6D5'],
  ['#a89384', '#9D98AA'],
  ['#6e5d50', '#6C667C'],
  ['#4a3d35', '#3A3355'],
  ['#d98a5a', '#834DFB'],
  ['#e0975f', '#834DFB'],
  ['#c47a4a', '#6F3BE6'],
  ['#a86840', '#5B2FC4'],
  ['#7a4a30', '#3E2380'],
  ['#3a2518', '#2A1B52'],
  ['#f0b088', '#A98BFF'],
  ['#8900ff', '#834DFB'],
  ['#1a1030', '#18102B'],
  ['#eee6ff', '#F5F3FF'],
  ['#ffd60a', '#F0E100'],
  ['#f9c74f', '#F0E100'],
  ['#090b10', '#110B20'],
  ['#07090e', '#110B20'],
  ['#0a0c12', '#110B20'],
  ['#030407', '#110B20'],
  ['#0a0a0a', '#18102B'],
  ['#262626', '#3A3355'],
  ['#404040', '#6C667C'],
  ['#171717', '#211737'],
  ['#111111', '#18102B'],
];

const regexReplacements = [
  // RGBA replacements
  [/rgba\(\s*255\s*,\s*200\s*,\s*150\s*,/gi, 'rgba(245, 243, 255, '],
  [/rgb\(\s*255\s*,\s*200\s*,\s*150\s*\)/gi, 'rgb(245, 243, 255)'],
  [/rgba\(\s*20\s*,\s*13\s*,\s*9\s*,/gi, 'rgba(24, 16, 43, '],
  [/rgb\(\s*20\s*,\s*13\s*,\s*9\s*\)/gi, 'rgb(24, 16, 43)'],
  [/rgba\(\s*217\s*,\s*138\s*,\s*90\s*,/gi, 'rgba(131, 77, 251, '],
  [/rgb\(\s*217\s*,\s*138\s*,\s*90\s*\)/gi, 'rgb(131, 77, 251)'],
  [/rgba\(\s*196\s*,\s*122\s*,\s*74\s*,/gi, 'rgba(131, 77, 251, '],
  [/rgba\(\s*168\s*,\s*104\s*,\s*64\s*,/gi, 'rgba(91, 47, 196, '],
  [/rgba\(\s*122\s*,\s*74\s*,\s*48\s*,/gi, 'rgba(62, 35, 128, '],
  [/rgba\(\s*58\s*,\s*37\s*,\s*24\s*,/gi, 'rgba(42, 27, 82, '],
  [/rgba\(\s*240\s*,\s*176\s*,\s*136\s*,/gi, 'rgba(169, 139, 255, '],
  [/rgba\(\s*207\s*,\s*78\s*,\s*36\s*,/gi, 'rgba(131, 77, 251, '],
  [/rgba\(\s*255\s*,\s*87\s*,\s*34\s*,/gi, 'rgba(131, 77, 251, '],
  [/(?<!&)#111(?![0-9a-fA-F])/gi, '#18102B'],
];

let totalFilesModified = 0;
let totalReplacements = 0;

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (/\.(jsx?|tsx?|css|html)$/.test(entry.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      let count = 0;

      // Hex replacements
      for (const [oldHex, newHex] of hexReplacements) {
        // Regex with word boundary or boundary after hex
        const regex = new RegExp(oldHex.replace('#', '(?<!&)#') + '(?![0-9a-fA-F])', 'gi');
        const matches = (content.match(regex) || []).length;
        if (matches > 0) {
          count += matches;
          content = content.replace(regex, newHex);
        }
      }

      // Regex replacements
      for (const [regex, replacement] of regexReplacements) {
        const matches = (content.match(regex) || []).length;
        if (matches > 0) {
          count += matches;
          content = content.replace(regex, replacement);
        }
      }

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        totalFilesModified++;
        totalReplacements += count;
        console.log(`Updated ${path.relative(srcDir, fullPath)} (${count} replacements)`);
      }
    }
  }
}

processDir(srcDir);
console.log(`\nCompleted! Modified ${totalFilesModified} files with ${totalReplacements} total replacements.`);
