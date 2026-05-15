const fs = require('fs');
const path = require('path');

// Read the backup file
const backupFilePath = path.join(__dirname, 'bloom-backup-1765388052067.json');

if (!fs.existsSync(backupFilePath)) {
  console.error(`❌ Backup file not found at: ${backupFilePath}`);
  process.exit(1);
}

const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

if (!backupData.menu || !Array.isArray(backupData.menu)) {
  console.error('❌ Invalid backup file format: missing menu array');
  process.exit(1);
}

console.log(`✅ Found ${backupData.menu.length} menu items in backup`);

// Transform backup menu items to match our database schema
const menuItems = backupData.menu.map((item, index) => ({
  name: item.name,
  description: '', // No description in backup
  price: item.price,
  category: item.category,
  businessUnit: 'cafe', // Default to cafe for all items
  isAvailable: true,
  isDrink: item.category === 'COLD COFFEE' || item.category === 'SHAKE' || item.category === 'MOCKTAIL' || item.category === 'SMOOTHIE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

console.log(`📦 Prepared ${menuItems.length} menu items for insertion`);

// Save to a JSON file that can be used for database insertion
const outputPath = path.join(__dirname, 'updated-menu-items.json');
fs.writeFileSync(outputPath, JSON.stringify(menuItems, null, 2));

console.log(`✅ Menu items saved to: ${outputPath}`);
console.log('\n📋 To update the database, you can:');
console.log('1. Use the Supabase dashboard to import this file');
console.log('2. Or run the update-menu-from-backup.ts script (requires Supabase credentials)');