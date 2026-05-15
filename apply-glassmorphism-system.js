import fs from 'fs';
import path from 'path';

// Comprehensive glassmorphism transformation script
const glassmorphismMappings = {
  // Background classes
  'bg-white': 'glass-card',
  'bg-gray-50': 'glass-background',
  'bg-gray-100': 'glass-background',
  'bg-slate-50': 'glass-background',
  'bg-slate-100': 'glass-background',
  'bg-[#F8FAFC]': 'glass-background',
  'bg-[#F1F5F9]': 'glass-background',
  
  // Card classes
  'bg-white/80': 'glass-card',
  'bg-white/90': 'glass-card',
  'backdrop-blur-sm': '',
  'backdrop-blur-md': '',
  'backdrop-blur-lg': '',
  'backdrop-blur-xl': '',
  
  // Button classes
  'bg-blue-600': 'glass-button-primary',
  'bg-indigo-600': 'glass-button-primary',
  'bg-purple-600': 'glass-button-primary',
  'bg-[#6D5DFB]': 'glass-button-primary',
  'hover:bg-blue-700': '',
  'hover:bg-indigo-700': '',
  'hover:bg-purple-700': '',
  
  // Input classes
  'border-gray-300': 'glass-input',
  'border-slate-300': 'glass-input',
  'focus:border-blue-500': '',
  'focus:ring-blue-500': '',
  
  // Text colors for glassmorphism
  'text-gray-900': 'text-white',
  'text-gray-800': 'text-white',
  'text-gray-700': 'text-white/90',
  'text-gray-600': 'text-white/70',
  'text-gray-500': 'text-white/60',
  'text-slate-900': 'text-white',
  'text-slate-800': 'text-white',
  'text-slate-700': 'text-white/90',
  'text-slate-600': 'text-white/70',
  'text-[#111827]': 'text-white',
  'text-[#1F2937]': 'text-white',
  'text-[#374151]': 'text-white/90',
  'text-[#6B7280]': 'text-white/70',
  'text-[#9CA3AF]': 'text-white/60',
};

// Files to transform
const filesToTransform = [
  'src/components/dashboard/DashboardContent.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/table.tsx',
  'src/components/orders/OrderFlowDashboard.tsx',
  'src/components/hotel/RoomServiceOrders.tsx',
  'src/components/inventory/InventoryDashboard.tsx',
  'src/components/kitchen/KitchenBoard.tsx',
  'src/components/billing/InvoiceTemplate.tsx',
  'src/app/dashboard/statistics/page.tsx',
  'src/app/dashboard/users/page.tsx',
  'src/app/dashboard/gst-report/page.tsx',
  'src/app/dashboard/discounts/page.tsx',
];

function transformFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Apply glassmorphism mappings
  for (const [oldClass, newClass] of Object.entries(glassmorphismMappings)) {
    const regex = new RegExp(`\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    if (content.includes(oldClass)) {
      content = content.replace(regex, newClass);
      modified = true;
    }
  }

  // Additional transformations
  const additionalTransforms = [
    // Replace common card patterns
    {
      from: /className="([^"]*?)bg-white([^"]*?)rounded-lg([^"]*?)"/g,
      to: 'className="$1glass-card$2$3"'
    },
    {
      from: /className="([^"]*?)bg-white([^"]*?)shadow-md([^"]*?)"/g,
      to: 'className="$1glass-card$2$3"'
    },
    {
      from: /className="([^"]*?)bg-white([^"]*?)border([^"]*?)"/g,
      to: 'className="$1glass-card$2$3"'
    },
    // Replace button patterns
    {
      from: /className="([^"]*?)bg-blue-600([^"]*?)text-white([^"]*?)"/g,
      to: 'className="$1glass-button-primary$2$3"'
    },
    {
      from: /className="([^"]*?)bg-indigo-600([^"]*?)text-white([^"]*?)"/g,
      to: 'className="$1glass-button-primary$2$3"'
    },
    // Replace input patterns
    {
      from: /className="([^"]*?)border-gray-300([^"]*?)focus:border-blue-500([^"]*?)"/g,
      to: 'className="$1glass-input$2$3"'
    },
  ];

  additionalTransforms.forEach(transform => {
    if (transform.from.test(content)) {
      content = content.replace(transform.from, transform.to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Transformed: ${filePath}`);
  } else {
    console.log(`⚪ No changes: ${filePath}`);
  }
}

// Transform all files
console.log('🎨 Applying glassmorphism system to components...\n');

filesToTransform.forEach(transformFile);

console.log('\n✨ Glassmorphism transformation completed!');
console.log('🔗 Demo available at: http://localhost:3001/vision-demo');