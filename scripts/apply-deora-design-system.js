#!/usr/bin/env node

/**
 * DEORA Design System Transformation Script
 * 
 * This script systematically replaces old color classes with DEORA design system colors
 * across all dashboard pages and components.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Color mapping from old to new DEORA design system
const colorReplacements = {
  // Slate colors -> DEORA equivalents
  'slate-50': '[#F8FAFC]',
  'slate-100': '[#F1F5F9]',
  'slate-200': '[#E5E7EB]',
  'slate-300': '[#9CA3AF]',
  'slate-400': '[#9CA3AF]',
  'slate-500': '[#6B7280]',
  'slate-600': '[#6B7280]',
  'slate-700': '[#111827]',
  'slate-800': '[#111827]',
  'slate-900': '[#111827]',
  
  // Gray colors -> DEORA equivalents
  'gray-50': '[#F8FAFC]',
  'gray-100': '[#F1F5F9]',
  'gray-200': '[#E5E7EB]',
  'gray-300': '[#9CA3AF]',
  'gray-400': '[#9CA3AF]',
  'gray-500': '[#6B7280]',
  'gray-600': '[#6B7280]',
  'gray-700': '[#111827]',
  'gray-800': '[#111827]',
  'gray-900': '[#111827]',
  
  // Emerald/Green colors -> Success color
  'emerald-50': '[#DCFCE7]',
  'emerald-100': '[#BBF7D0]',
  'emerald-500': '[#22C55E]',
  'emerald-600': '[#22C55E]',
  'emerald-700': '[#16A34A]',
  'green-50': '[#DCFCE7]',
  'green-100': '[#BBF7D0]',
  'green-500': '[#22C55E]',
  'green-600': '[#22C55E]',
  'green-700': '[#16A34A]',
  
  // Amber/Yellow colors -> Warning color
  'amber-50': '[#FEF3C7]',
  'amber-100': '[#FDE68A]',
  'amber-500': '[#F59E0B]',
  'amber-600': '[#F59E0B]',
  'amber-700': '[#D97706]',
  'yellow-50': '[#FEF3C7]',
  'yellow-100': '[#FDE68A]',
  'yellow-500': '[#F59E0B]',
  'yellow-600': '[#F59E0B]',
  'yellow-700': '[#D97706]',
  
  // Rose/Red colors -> Danger color
  'rose-50': '[#FEE2E2]',
  'rose-100': '[#FECACA]',
  'rose-500': '[#EF4444]',
  'rose-600': '[#EF4444]',
  'rose-700': '[#DC2626]',
  'red-50': '[#FEE2E2]',
  'red-100': '[#FECACA]',
  'red-500': '[#EF4444]',
  'red-600': '[#EF4444]',
  'red-700': '[#DC2626]',
  
  // Indigo/Purple colors -> Primary color
  'indigo-50': '[#EDEBFF]',
  'indigo-100': '[#EDEBFF]',
  'indigo-400': '[#6D5DFB]',
  'indigo-500': '[#6D5DFB]',
  'indigo-600': '[#6D5DFB]',
  'indigo-700': '[#5B4EE5]',
  'indigo-900': '[#4C3FB8]',
  'purple-50': '[#EDEBFF]',
  'purple-100': '[#EDEBFF]',
  'purple-400': '[#C084FC]',
  'purple-500': '[#C084FC]',
  'purple-600': '[#C084FC]',
  'purple-700': '[#A855F7]',
  'purple-900': '[#7E22CE]',
  
  // Blue colors -> Primary/Accent
  'blue-50': '[#EFF6FF]',
  'blue-100': '[#DBEAFE]',
  'blue-500': '[#6D5DFB]',
  'blue-600': '[#6D5DFB]',
  'blue-700': '[#5B4EE5]',
  
  // Pink colors -> Accent
  'pink-50': '[#FCE7F3]',
  'pink-100': '[#FBCFE8]',
  'pink-500': '[#EC4899]',
  'pink-600': '[#EC4899]',
  'pink-700': '[#DB2777]',
  'pink-900': '[#831843]',
  
  // Teal/Cyan colors
  'teal-500': '[#14B8A6]',
  'teal-600': '[#14B8A6]',
  'cyan-500': '[#06B6D4]',
  'cyan-600': '[#06B6D4]',
};

// Card component replacements
const cardReplacements = [
  {
    pattern: /<Card(\s+[^>]*)?>/g,
    replacement: '<div className="premium-card">'
  },
  {
    pattern: /<\/Card>/g,
    replacement: '</div>'
  },
  {
    pattern: /<Card\s+className="([^"]*)"/g,
    replacement: (match, classes) => {
      return `<div className="premium-card ${classes}"`;
    }
  }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace color classes
  Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
    // Match text-{color}, bg-{color}, border-{color}, etc.
    const patterns = [
      new RegExp(`text-${oldColor}`, 'g'),
      new RegExp(`bg-${oldColor}`, 'g'),
      new RegExp(`border-${oldColor}`, 'g'),
      new RegExp(`from-${oldColor}`, 'g'),
      new RegExp(`to-${oldColor}`, 'g'),
      new RegExp(`via-${oldColor}`, 'g'),
      new RegExp(`hover:text-${oldColor}`, 'g'),
      new RegExp(`hover:bg-${oldColor}`, 'g'),
      new RegExp(`hover:border-${oldColor}`, 'g'),
      new RegExp(`focus:ring-${oldColor}`, 'g'),
      new RegExp(`ring-${oldColor}`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      const replacement = pattern.source.replace(oldColor, newColor);
      if (content.match(pattern)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
  });
  
  // Replace Card components with premium-card divs (only in specific contexts)
  // This is more conservative to avoid breaking existing Card usage
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

function main() {
  console.log('🎨 Starting DEORA Design System Transformation...\n');
  
  // Find all TypeScript/React files
  const patterns = [
    'src/app/**/*.tsx',
    'src/components/**/*.tsx',
    'src/app/**/*.ts',
    'src/components/**/*.ts',
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
  
  console.log(`\n✨ Transformation Complete!`);
  console.log(`📊 Files processed: ${totalFiles}`);
  console.log(`✅ Files modified: ${modifiedFiles}`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Review the changes with: git diff`);
  console.log(`   2. Test the application: npm run dev`);
  console.log(`   3. Build to verify: npm run build`);
}

main();
