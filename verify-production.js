#!/usr/bin/env node

/**
 * DEORA Plaza - Production Verification Script
 * Verifies that the application is ready for production deployment
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 DEORA Plaza - Production Verification\n');

const checks = [];

// Check 1: Environment files
const envExists = fs.existsSync('.env.local') || fs.existsSync('.env');
checks.push({
  name: 'Environment Configuration',
  status: envExists,
  message: envExists ? '✅ Environment file found' : '❌ Create .env.local from .env.production template'
});

// Check 2: Build directory
const buildExists = fs.existsSync('.next');
checks.push({
  name: 'Build Output',
  status: buildExists,
  message: buildExists ? '✅ Build directory exists' : '❌ Run npm run build first'
});

// Check 3: Package.json scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasStartScript = packageJson.scripts && packageJson.scripts.start;
checks.push({
  name: 'Production Scripts',
  status: hasStartScript,
  message: hasStartScript ? '✅ Start script configured' : '❌ Missing start script in package.json'
});

// Check 4: Key components exist
const keyFiles = [
  'src/app/dashboard/page.tsx',
  'src/components/dashboard/UnifiedDashboard.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/lib/supabase/client.ts'
];

const filesExist = keyFiles.every(file => fs.existsSync(file));
checks.push({
  name: 'Core Components',
  status: filesExist,
  message: filesExist ? '✅ All core components present' : '❌ Missing core application files'
});

// Check 5: No sample data in key files
const dashboardContent = fs.readFileSync('src/components/dashboard/UnifiedDashboard.tsx', 'utf8');
const hasSampleData = dashboardContent.includes('kalpeshdeora') || dashboardContent.includes('admin@deora.com');
checks.push({
  name: 'Sample Data Removed',
  status: !hasSampleData,
  message: !hasSampleData ? '✅ No sample data found' : '❌ Sample data still present'
});

// Display results
console.log('📋 Production Readiness Report:\n');
checks.forEach((check, index) => {
  console.log(`${index + 1}. ${check.name}: ${check.message}`);
});

const allPassed = checks.every(check => check.status);
console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 ALL CHECKS PASSED - READY FOR PRODUCTION!');
  console.log('\n📚 Next Steps:');
  console.log('1. Configure .env.local with your Supabase credentials');
  console.log('2. Deploy using: vercel --prod (or your preferred platform)');
  console.log('3. Set up database schema in Supabase');
  console.log('4. Create admin user and start managing your business!');
} else {
  console.log('⚠️  Some checks failed - please address the issues above');
  console.log('\n📖 See DEPLOYMENT_GUIDE.md for detailed instructions');
}

console.log('\n🚀 DEORA Plaza - Restaurant Management System');
console.log('Ready to manage your multi-unit hospitality operations!');