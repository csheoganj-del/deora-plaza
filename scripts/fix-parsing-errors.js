#!/usr/bin/env node

/**
 * Fix Parsing Errors Script
 * 
 * This script fixes remaining parsing errors from the Card component replacement
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Common parsing error fixes
const fixes = [
  // Fix mismatched CardTitle tags
  {
    pattern: /<CardTitle([^>]*)>([^<]*)<\/h2>/g,
    replacement: '<h2 className="text-3xl font-bold text-[#111827]"$1>$2</h2>'
  },
  {
    pattern: /<CardTitle([^>]*)>/g,
    replacement: '<h2 className="text-3xl font-bold text-[#111827]"$1>'
  },
  {
    pattern: /<\/CardTitle>/g,
    replacement: '</h2>'
  },
  
  // Fix any remaining Card imports
  {
    pattern: /import\s*{\s*Card\s*}\s*from\s*["']@\/components\/ui\/card["'];?\s*/g,
    replacement: ''
  },
  
  // Fix any remaining CardHeader, CardContent, CardFooter
  {
    pattern: /<CardHeader([^>]*)>/g,
    replacement: '<div className="p-8 border-b border-[#E5E7EB]"$1>'
  },
  {
    pattern: /<\/CardHeader>/g,
    replacement: '</div>'
  },
  {
    pattern: /<CardContent([^>]*)>/g,
    replacement: '<div className="p-8"$1>'
  },
  {
    pattern: /<\/CardContent>/g,
    replacement: '</div>'
  },
  {
    pattern: /<CardFooter([^>]*)>/g,
    replacement: '<div className="p-8 border-t border-[#E5E7EB]"$1>'
  },
  {
    pattern: /<\/CardFooter>/g,
    replacement: '</div>'
  },
  
  // Fix any remaining Card tags
  {
    pattern: /<Card([^>]*)>/g,
    replacement: '<div className="premium-card"$1>'
  },
  {
    pattern: /<\/Card>/g,
    replacement: '</div>'
  }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  fixes.forEach(({ pattern, replacement }) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  // Clean up empty import lines
  content = content.replace(/^\s*import\s*{\s*}\s*from\s*["'][^"']*["'];\s*$/gm, '');
  content = content.replace(/^\s*;\s*$/gm, '');
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed parsing errors: ${filePath}`);
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Fixing parsing errors...\n');
  
  // Target the specific files with errors
  const errorFiles = [
    'src/app/dashboard/bar/page.tsx',
    'src/app/dashboard/owner/page.tsx',
    'src/components/cafe/MenuGrid.tsx',
    'src/components/kitchen/KitchenBoard.tsx',
    'src/components/orders/OrderFlowDashboard.tsx',
    'src/components/tables/TableGrid.tsx',
    'src/components/ui/heritage-card.tsx',
    'src/components/waiter/WaiterBoard.tsx'
  ];
  
  let modifiedFiles = 0;
  
  errorFiles.forEach(file => {
    if (fs.existsSync(file)) {
      if (processFile(file)) {
        modifiedFiles++;
      }
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  // Also process all other tsx files to catch any remaining issues
  const patterns = [
    'src/app/**/*.tsx',
    'src/components/**/*.tsx',
  ];
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { 
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'] 
    });
    
    files.forEach(file => {
      if (!errorFiles.includes(file)) {
        if (processFile(file)) {
          modifiedFiles++;
        }
      }
    });
  });
  
  console.log(`\n✨ Parsing Error Fixes Complete!`);
  console.log(`✅ Files modified: ${modifiedFiles}`);
}

main();