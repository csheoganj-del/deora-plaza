#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files to remove (test, debug, sample files)
const filesToRemove = [
  'active-bookings-card-test.ts',
  'active-bookings-test.ts',
  'analyze-bills.ts',
  'check-actual-schema.ts',
  'check-admin-user.ts',
  'check-and-fix-database-schema.ts',
  'check-and-update-user-role.ts',
  'check-bills-simple.ts',
  'check-bills.ts',
  'check-business-settings.ts',
  'check-business-units.ts',
  'check-count.ts',
  'check-counters-columns.ts',
  'check-customer-columns.ts',
  'check-customers-direct.js',
  'check-data.ts',
  'check-duplicates.ts',
  'check-menu-items-constraints.ts',
  'check-menu-table.ts',
  'check-menu.ts',
  'check-required-tables.ts',
  'check-rooms-data.ts',
  'check-rooms-schema.ts',
  'check-schema.mjs',
  'check-specific-user.ts',
  'check-table-columns.ts',
  'check-table-schema.ts',
  'check-tables-exist.ts',
  'check-tables-schema.ts',
  'check-ui-bills.ts',
  'check-user-details.ts',
  'check-user.ts',
  'check-users.ts',
  'comprehensive-system-audit.ts',
  'comprehensive-system-test.js',
  'comprehensive-table-check.ts',
  'count-bills.ts',
  'debug-auth-env.ts',
  'debug-bar-menu.ts',
  'debug-bill-generation-detailed.js',
  'debug-bookings.js',
  'debug-bookings.mjs',
  'debug-client-env.ts',
  'debug-complete-bill-flow.js',
  'debug-customer-creation.ts',
  'debug-env-vars.js',
  'debug-env.js',
  'debug-key.ts',
  'debug-keys.cjs',
  'debug-navigation.tsx',
  'debug-revenue.ts',
  'debug-room-creation-test.ts',
  'test-backup-connection.ts',
  'test-bar-menu-items.ts',
  'test-bill-generation-detailed.js',
  'test-bill-generation.js',
  'test-bill-printing.html',
  'test-booking-count-fix.ts',
  'test-booking-fields.ts',
  'test-booking.js',
  'test-business-settings-functionality.ts',
  'test-cafe-manager-bill.js',
  'test-create-customer.js',
  'test-customer-insert.ts',
  'test-customer-order-flow.js',
  'test-customer-with-env.cjs',
  'test-direct-firestore.ts',
  'test-garden-bookings.ts',
  'test-garden-revenue-fix.ts',
  'test-get-bar-menu.ts',
  'test-invoice-template.tsx',
  'test-items-parsing.js',
  'test-print-button-fix.ts',
  'test-print-functionality.ts',
  'test-professional-receipt.ts',
  'test-query-documents.ts',
  'test-query.ts',
  'test-receipt-improvements.ts',
  'test-revenue-stats.ts',
  'test-rls-policies.sql',
  'test-room-insert.ts',
  'test-server-actions.ts',
  'test-statistics.ts',
  'test-stats-with-env.ts',
  'test-supabase-config.ts',
  'test-supabase-connection.cjs',
  'test-supabase-connection.ts',
  'test-table-creation.ts',
  'test-tables-query.ts',
  'test-user-workflows.js',
  'test-validation.ts',
  'test-waiterless-mode.js',
  'test-webapp-bill-generation.js',
  'verify-billnumber-fix.js',
  'verify-case-fix.js',
  'verify-complete-fix.js',
  'verify-order-flow.html',
  'verify-tables-schema.ts',
  'verify-tables.ts',
  'verify-user.ts',
  'verify-users.ts',
  'verify_db.cjs',
  'verify_db.js',
  'auto-fix-bookings.mjs',
  'simple-garden-test.ts',
  'simple-table-check.ts',
  'hotel-dashboard-test.ts',
  'payment-overview-test.ts',
  'final-system-demonstration.ts',
  'final-verification.ts',
  'dashboard-fix-summary.ts',
  'fix-summary.ts',
  'detailed-button-workflow-analysis.ts',
  'diagnose-dashboard-issue.ts',
  'diagnose-session.ts',
  'implement-recommendations-with-testing.ts'
];

console.log('🧹 Cleaning up sample data and test files...\n');

let removedCount = 0;
let notFoundCount = 0;

filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`✅ Removed: ${file}`);
      removedCount++;
    } catch (error) {
      console.log(`❌ Failed to remove: ${file} - ${error.message}`);
    }
  } else {
    notFoundCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Removed: ${removedCount} files`);
console.log(`   Not found: ${notFoundCount} files`);
console.log(`\n✨ Sample data cleanup complete!`);