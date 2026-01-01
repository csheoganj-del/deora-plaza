#!/usr/bin/env node

/**
 * Fix Remaining Colors Script
 * 
 * This script replaces all remaining amber/yellow color classes with DEORA design system colors
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Remaining color replacements
const colorReplacements = {
  // Amber/Yellow color classes -> Warning color
  'bg-amber-': 'bg-[#F59E0B]/10',
  'text-amber-': 'text-[#F59E0B]',
  'border-amber-': 'border-[#F59E0B]/20',
  'bg-yellow-': 'bg-[#F59E0B]/10',
  'text-yellow-': 'text-[#F59E0B]',
  'border-yellow-': 'border-[#F59E0B]/20',
  
  // Specific amber/yellow instances
  'bg-\\[#FDE68A\\]': 'bg-[#F59E0B]/10',
  'text-\\[#D97706\\]': 'text-[#F59E0B]',
  'border-amber-300': 'border-[#F59E0B]/20',
  'border-amber-200': 'border-[#F59E0B]/20',
  'text-amber-800': 'text-[#F59E0B]',
  'text-amber-900': 'text-[#F59E0B]',
  'text-yellow-800': 'text-[#F59E0B]',
  'text-yellow-400': 'text-[#F59E0B]',
  'fill-yellow-400': 'fill-[#F59E0B]',
  
  // Background variations
  'bg-\\[#FEF3C7\\]': 'bg-[#F59E0B]/10',
  'bg-\\[#FEF3C7\\]/50': 'bg-[#F59E0B]/10',
  'bg-\\[#FEF3C7\\]0/20': 'bg-[#F59E0B]/10',
  
  // Hover states
  'hover:bg-\\[#FEF3C7\\]': 'hover:bg-[#F59E0B]/10',
  
  // Border variations
  'border-\\[#FEF3C7\\]0/50': 'border-[#F59E0B]/20',
  'border-\\[#F59E0B\\]': 'border-[#F59E0B]/20',
  
  // Text variations
  'text-\\[#FEF3C7\\]0': 'text-[#F59E0B]',
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
    console.log(`✅ Fixed remaining colors: ${filePath}`);
    return true;
  }
  
  return false;
}

function main() {
  console.log('🎨 Fixing remaining amber/yellow colors...\n');
  
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
  
  console.log(`\n✨ Remaining Color Fix Complete!`);
  console.log(`📊 Files processed: ${totalFiles}`);
  console.log(`✅ Files modified: ${modifiedFiles}`);
}

main();