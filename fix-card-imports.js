const fs = require('fs');
const path = require('path');

// Files that likely need Card imports based on build errors
const filesToFix = [
  'src/components/menu/MenuManagement.tsx',
  'src/components/orders/OrderCard.tsx',
  'src/components/orders/OrderTracker.tsx',
  'src/components/tables/TableGrid.tsx',
  'src/components/ui/FrostedGlassDemo.tsx',
  'src/components/ui/heritage-card.tsx',
  'src/app/dashboard/bar/page.tsx',
  'src/app/dashboard/billing/page.tsx',
  'src/app/dashboard/garden/page.tsx',
  'src/app/dashboard/hotel/page.tsx',
  'src/app/dashboard/statistics/page.tsx'
];

function fixCardImport(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if Card is already imported
    if (content.includes('import { Card') || content.includes('import {Card')) {
      console.log(`Card already imported in: ${filePath}`);
      return;
    }

    // Check if file uses Card component
    if (!content.includes('<Card')) {
      console.log(`No Card usage found in: ${filePath}`);
      return;
    }

    // Find existing card imports and add Card
    if (content.includes('import { CardContent') || content.includes('import { CardHeader')) {
      content = content.replace(
        /import \{ (Card(?:Content|Header|Title|Footer)[^}]*)\} from "@\/components\/ui\/card"/,
        'import { Card, $1} from "@/components/ui/card"'
      );
    } else {
      // Add new Card import after other UI imports
      const uiImportRegex = /import \{ [^}]+ \} from "@\/components\/ui\/[^"]+"/;
      const match = content.match(uiImportRegex);
      if (match) {
        const insertIndex = content.indexOf(match[0]) + match[0].length;
        content = content.slice(0, insertIndex) + '\nimport { Card } from "@/components/ui/card";' + content.slice(insertIndex);
      } else {
        // Add at the beginning after "use client" if present
        const useClientMatch = content.match(/"use client";?\n/);
        if (useClientMatch) {
          const insertIndex = content.indexOf(useClientMatch[0]) + useClientMatch[0].length;
          content = content.slice(0, insertIndex) + '\nimport { Card } from "@/components/ui/card";\n' + content.slice(insertIndex);
        } else {
          content = 'import { Card } from "@/components/ui/card";\n' + content;
        }
      }
    }

    fs.writeFileSync(filePath, content);
    console.log(`Fixed Card import in: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixCardImport);

console.log('Card import fixes completed!');