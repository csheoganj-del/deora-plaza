#!/usr/bin/env node

/**
 * Fix Malformed Colors Script
 * 
 * This script fixes malformed color classes like text-[#F8FAFC]0 that are causing
 * visibility issues by replacing them with proper DEORA design system colors
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Color replacements for malformed classes
const colorReplacements = {
  // Fix malformed F8FAFC colors (these appear beige-like due to malformation)
  'text-\\[#F8FAFC\\]0': 'text-[#9CA3AF]',  // Muted text color
  'text-\\[#F8FAFC\\]800': 'text-[#6B7280]', // Secondary text color
  'bg-\\[#F8FAFC\\]0': 'bg-[#F8FAFC]',      // Proper background color
  
  // Fix any other malformed colors
  'text-\\[#FECACA\\]': 'text-[#EF4444]',   // Red text
  'bg-\\[#FECACA\\]': 'bg-[#FEE2E2]',       // Light red background
  
  // Fix any remaining beige-like colors
  'bg-\\[#FAF7F4\\]': 'bg-[#F8FAFC]',       // Use DEORA background
  'from-\\[#FAF7F4\\]': 'from-[#F8FAFC]',   // Gradient start
  'via-\\[#FAF7F4\\]': 'via-[#F8FAFC]',     // Gradient middle
  'to-\\[#FAF7F4\\]': 'to-[#F8FAFC]',       // Gradient end
};

function fixColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply each color replacement
    for (const [oldColor, newColor] of Object.entries(colorReplacements)) {
      const regex = new RegExp(oldColor, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newColor);
        modified = true;
        console.log(`  ✓ Fixed ${oldColor} → ${newColor}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🎨 Fixing malformed colors that cause visibility issues...\n');
  
  // Find all TypeScript and CSS files
  const patterns = [
    'src/**/*.tsx',
    'src/**/*.ts',
    'src/**/*.css'
  ];
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: ['node_modules/**', '.next/**'] });
    
    files.forEach(file => {
      totalFiles++;
      console.log(`Processing: ${file}`);
      
      if (fixColorsInFile(file)) {
        modifiedFiles++;
        console.log(`  ✅ Modified: ${file}\n`);
      } else {
        console.log(`  ⏭️  No changes needed\n`);
      }
    });
  });
  
  console.log(`\n🎯 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   ✅ All malformed colors fixed!`);
}

main();