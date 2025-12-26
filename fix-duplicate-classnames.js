import fs from 'fs';
import path from 'path';

// Files with duplicate className issues
const filesToFix = [
  'src/app/dashboard/bar/page.tsx',
  'src/app/dashboard/owner/page.tsx',
  'src/components/bar/BarQueue.tsx',
  'src/components/cafe/MenuGrid.tsx',
  'src/components/cafe/TableGrid.tsx',
  'src/components/crm/CustomerList.tsx',
  'src/components/hotel/RoomServiceOrders.tsx',
  'src/components/kds/KitchenDisplaySystem.tsx',
  'src/components/kitchen/KitchenBoard.tsx',
  'src/components/orders/OrderFlowDashboard.tsx',
  'src/components/orders/OrderMenuSection.tsx',
  'src/components/tables/TableGrid.tsx',
  'src/components/ui/enhanced-skeleton.tsx'
];

function fixDuplicateClassNames(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix pattern: className="..." ... className="..."
    // Merge the two className attributes
    content = content.replace(
      /className="([^"]*)"([^>]*?)className="([^"]*)"/g,
      'className="$1 $3"'
    );
    
    // Fix pattern: className="premium-card"Skeleton
    content = content.replace(
      /className="premium-card"Skeleton/g,
      'className="premium-card"'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixDuplicateClassNames);

console.log('Duplicate className fixes completed!');