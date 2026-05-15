#!/usr/bin/env node

/**
 * Fix Old Colors Script
 * 
 * This script replaces all remaining old colors (#C58A2D, #E6B566) with DEORA design system colors
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Old color replacements
const colorReplacements = {
  // Old gold/amber colors -> DEORA Primary Purple
  '#C58A2D': '#6D5DFB',
  'C58A2D': '6D5DFB',
  '#E6B566': '#EDEBFF', // Light purple background
  'E6B566': 'EDEBFF',
  
  // Any remaining old colors
  'bg-\\[#C58A2D\\]': 'bg-[#6D5DFB]',
  'text-\\[#C58A2D\\]': 'text-[#6D5DFB]',
  'border-\\[#C58A2D\\]': 'border-[#6D5DFB]',
  'hover:bg-\\[#C58A2D\\]': 'hover:bg-[#5B4EE5]',
  'focus:ring-\\[#C58A2D\\]': 'focus:ring-[#6D5DFB]',
  
  'bg-\\[#E6B566\\]': 'bg-[#EDEBFF]',
  'text-\\[#E6B566\\]': 'text-[#6D5DFB]',
  'border-\\[#E6B566\\]': 'border-[#EDEBFF]',
  
  // Background variations
  'bg-\\[#E6B566\\]/30': 'bg-[#6D5DFB]/10',
  'bg-\\[#E6B566\\]/20': 'bg-[#6D5DFB]/10',
  'bg-\\[#E6B566\\]/10': 'bg-[#6D5DFB]/10',
  
  // Hover states
  'hover:bg-\\[#C58A2D\\]/90': 'hover:bg-[#5B4EE5]',
  'hover:bg-\\[#C58A2D\\]/80': 'hover:bg-[#5B4EE5]',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Apply color replacements
  Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
    const regex = new RegExp(oldColor, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, newColor);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed old colors: ${filePath}`);
    return true;
  }
  
  return false;
}

function main() {
  console.log('🎨 Fixing remaining old colors...\n');
  
  // Find all TypeScript/React files
  const patterns = [
    'src/**/*.tsx',
    'src/**/*.ts',
  ];
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { 
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'] 
    });
    
    files.forEach(file => {
      totalFiles++;
      if (processFile(file)) {
        modifiedFiles++;
      }
    });
  });
  
  console.log(`\n✨ Old Color Fix Complete!`);
  console.log(`📊 Files processed: ${totalFiles}`);
  console.log(`✅ Files modified: ${modifiedFiles}`);
}

main();