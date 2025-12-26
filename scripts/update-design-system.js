#!/usr/bin/env node

/**
 * DEORA Design System Migration Script
 * Converts old color classes to new design system
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color mapping from old to new design system
const colorMappings = {
  // Background colors
  'bg-slate-50': 'bg-[#F8FAFC]',
  'bg-slate-100': 'bg-[#F1F5F9]',
  'bg-slate-200': 'bg-[#E2E8F0]',
  'bg-slate-900': 'bg-[#0F172A]',
  'bg-gray-50': 'bg-[#F8FAFC]',
  'bg-gray-100': 'bg-[#F1F5F9]',
  'bg-gray-200': 'bg-[#E2E8F0]',
  'bg-white': 'bg-[#FFFFFF]',

  // Text colors
  'text-slate-900': 'text-[#111827]',
  'text-slate-800': 'text-[#111827]',
  'text-slate-700': 'text-[#374151]',
  'text-slate-600': 'text-[#6B7280]',
  'text-slate-500': 'text-[#6B7280]',
  'text-slate-400': 'text-[#9CA3AF]',
  'text-gray-900': 'text-[#111827]',
  'text-gray-800': 'text-[#111827]',
  'text-gray-700': 'text-[#374151]',
  'text-gray-600': 'text-[#6B7280]',
  'text-gray-500': 'text-[#6B7280]',
  'text-gray-400': 'text-[#9CA3AF]',

  // Border colors
  'border-slate-200': 'border-[#E5E7EB]',
  'border-slate-300': 'border-[#E5E7EB]',
  'border-gray-200': 'border-[#E5E7EB]',
  'border-gray-300': 'border-[#E5E7EB]',

  // Status colors (keep semantic but update values)
  'text-emerald-600': 'text-[#22C55E]',
  'text-green-600': 'text-[#22C55E]',
  'text-amber-600': 'text-[#F59E0B]',
  'text-yellow-600': 'text-[#F59E0B]',
  'text-red-600': 'text-[#EF4444]',
  'text-rose-600': 'text-[#EF4444]',
  'text-indigo-600': 'text-[#6D5DFB]',
  'text-purple-600': 'text-[#8B5CF6]',

  // Background status colors
  'bg-emerald-100': 'bg-[#22C55E]/10',
  'bg-green-100': 'bg-[#22C55E]/10',
  'bg-amber-100': 'bg-[#F59E0B]/10',
  'bg-yellow-100': 'bg-[#F59E0B]/10',
  'bg-red-100': 'bg-[#EF4444]/10',
  'bg-rose-100': 'bg-[#EF4444]/10',
  'bg-indigo-100': 'bg-[#6D5DFB]/10',
  'bg-purple-100': 'bg-[#8B5CF6]/10',

  // Border status colors
  'border-emerald-300': 'border-[#22C55E]/20',
  'border-green-300': 'border-[#22C55E]/20',
  'border-amber-300': 'border-[#F59E0B]/20',
  'border-yellow-300': 'border-[#F59E0B]/20',
  'border-red-300': 'border-[#EF4444]/20',
  'border-rose-300': 'border-[#EF4444]/20',
  'border-indigo-300': 'border-[#6D5DFB]/20',
  'border-purple-300': 'border-[#8B5CF6]/20',
};

// Component class replacements
const componentReplacements = {
  // Replace Card usage with premium-card
  'className=".*?Card.*?"': (match) => {
    if (match.includes('cursor-pointer') || match.includes('hover:')) {
      return match.replace(/Card/g, 'premium-card-interactive');
    }
    return match.replace(/Card/g, 'premium-card');
  },
  
  // Update gradients
  'bg-gradient-to-br from-slate-50 to-slate-100': 'bg-[#F8FAFC]',
  'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900': 'bg-gradient-to-br from-[#0F172A] via-[#581C87] to-[#0F172A]',
};

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Apply color mappings
  Object.entries(colorMappings).forEach(([oldClass, newClass]) => {
    const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, newClass);
      updated = true;
    }
  });

  // Apply component replacements
  Object.entries(componentReplacements).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern, 'g');
    if (content.match(regex)) {
      if (typeof replacement === 'function') {
        content = content.replace(regex, replacement);
      } else {
        content = content.replace(regex, replacement);
      }
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  return false;
}

function main() {
  console.log('🎨 Starting DEORA Design System Migration...\n');

  const patterns = [
    'src/app/dashboard/**/*.tsx',
    'src/components/**/*.tsx',
    'src/app/**/*.tsx'
  ];

  let totalUpdated = 0;

  patterns.forEach(pattern => {
    const files = glob.sync(pattern);
    console.log(`\n📁 Processing ${pattern} (${files.length} files):`);
    
    files.forEach(file => {
      if (updateFile(file)) {
        totalUpdated++;
      }
    });
  });

  console.log(`\n🎉 Migration complete! Updated ${totalUpdated} files.`);
  console.log('\n📋 Next steps:');
  console.log('1. Review changes with git diff');
  console.log('2. Test the application');
  console.log('3. Run npm run build to verify');
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, colorMappings };