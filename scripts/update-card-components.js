#!/usr/bin/env node

/**
 * Card Component Replacement Script
 * 
 * This script replaces shadcn/ui Card components with DEORA premium-card system
 * across all dashboard pages and components.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Card component replacement patterns
const cardReplacements = [
  // Basic Card replacements
  {
    pattern: /<Card(\s+className="([^"]*)")?>/g,
    replacement: (match, classNameMatch, className) => {
      const baseClass = 'premium-card';
      const fullClass = className ? `${baseClass} ${className}` : baseClass;
      return `<div className="${fullClass}">`;
    }
  },
  {
    pattern: /<Card>/g,
    replacement: '<div className="premium-card">'
  },
  {
    pattern: /<\/Card>/g,
    replacement: '</div>'
  },
  
  // CardHeader replacements
  {
    pattern: /<CardHeader(\s+className="([^"]*)")?>/g,
    replacement: (match, classNameMatch, className) => {
      const baseClass = 'p-8 border-b border-[#E5E7EB]';
      const fullClass = className ? `${baseClass} ${className}` : baseClass;
      return `<div className="${fullClass}">`;
    }
  },
  {
    pattern: /<CardHeader>/g,
    replacement: '<div className="p-8 border-b border-[#E5E7EB]">'
  },
  {
    pattern: /<\/CardHeader>/g,
    replacement: '</div>'
  },
  
  // CardTitle replacements
  {
    pattern: /<CardTitle(\s+className="([^"]*)")?>/g,
    replacement: (match, classNameMatch, className) => {
      const baseClass = 'text-3xl font-bold text-[#111827]';
      const fullClass = className ? `${baseClass} ${className}` : baseClass;
      return `<h2 className="${fullClass}">`;
    }
  },
  {
    pattern: /<CardTitle>/g,
    replacement: '<h2 className="text-3xl font-bold text-[#111827]">'
  },
  {
    pattern: /<\/CardTitle>/g,
    replacement: '</h2>'
  },
  
  // CardContent replacements
  {
    pattern: /<CardContent(\s+className="([^"]*)")?>/g,
    replacement: (match, classNameMatch, className) => {
      const baseClass = 'p-8';
      const fullClass = className ? `${baseClass} ${className}` : baseClass;
      return `<div className="${fullClass}">`;
    }
  },
  {
    pattern: /<CardContent>/g,
    replacement: '<div className="p-8">'
  },
  {
    pattern: /<\/CardContent>/g,
    replacement: '</div>'
  },
  
  // CardFooter replacements
  {
    pattern: /<CardFooter(\s+className="([^"]*)")?>/g,
    replacement: (match, classNameMatch, className) => {
      const baseClass = 'p-8 border-t border-[#E5E7EB]';
      const fullClass = className ? `${baseClass} ${className}` : baseClass;
      return `<div className="${fullClass}">`;
    }
  },
  {
    pattern: /<CardFooter>/g,
    replacement: '<div className="p-8 border-t border-[#E5E7EB]">'
  },
  {
    pattern: /<\/CardFooter>/g,
    replacement: '</div>'
  }
];

// Import statement replacements
const importReplacements = [
  {
    pattern: /import\s*{\s*([^}]*Card[^}]*)\s*}\s*from\s*["']@\/components\/ui\/card["']/g,
    replacement: (match, imports) => {
      // Remove Card-related imports since we're using divs now
      const cleanImports = imports
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => !imp.includes('Card'))
        .join(', ');
      
      if (cleanImports) {
        return `import { ${cleanImports} } from "@/components/ui/card"`;
      } else {
        return ''; // Remove the entire import if no other components needed
      }
    }
  }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Apply import replacements first
  importReplacements.forEach(({ pattern, replacement }) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  // Apply card component replacements
  cardReplacements.forEach(({ pattern, replacement }) => {
    if (content.match(pattern)) {
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement);
      } else {
        content = content.replace(pattern, replacement);
      }
      modified = true;
    }
  });
  
  // Clean up empty import lines
  content = content.replace(/^\s*import\s*{\s*}\s*from\s*["'][^"']*["'];\s*$/gm, '');
  content = content.replace(/^\s*import\s*from\s*["'][^"']*["'];\s*$/gm, '');
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated Card components: ${filePath}`);
    return true;
  }
  
  return false;
}

function main() {
  console.log('🎨 Starting Card Component Replacement...\n');
  
  // Find all TypeScript/React files
  const patterns = [
    'src/app/dashboard/**/*.tsx',
    'src/components/**/*.tsx',
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
  
  console.log(`\n✨ Card Component Replacement Complete!`);
  console.log(`📊 Files processed: ${totalFiles}`);
  console.log(`✅ Files modified: ${modifiedFiles}`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Review the changes with: git diff`);
  console.log(`   2. Test the application: npm run dev`);
  console.log(`   3. Build to verify: npm run build`);
}

main();