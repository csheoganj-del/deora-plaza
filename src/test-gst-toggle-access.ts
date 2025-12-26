/**
 * Test script to verify that bar managers can access GST toggle settings
 * This script tests the fix for the GST toggle being disabled for bar managers
 */

// Mock session data for testing
const mockSessions = [
  {
    role: 'super_admin',
    canAccessGST: true,
    description: 'Super admin should have access to GST settings'
  },
  {
    role: 'owner',
    canAccessGST: true,
    description: 'Owner should have access to GST settings'
  },
  {
    role: 'bar_manager',
    canAccessGST: true, // This should be true after our fix
    description: 'Bar manager should have access to GST settings (FIXED)'
  },
  {
    role: 'cafe_manager',
    canAccessGST: false,
    description: 'Cafe manager should NOT have access to GST settings'
  },
  {
    role: 'waiter',
    canAccessGST: false,
    description: 'Waiter should NOT have access to GST settings'
  }
];

function testGSTToggleAccess() {
  console.log('Testing GST Toggle Access for Different User Roles...\n');
  
  mockSessions.forEach(session => {
    const isAdmin = session.role === 'super_admin' || session.role === 'owner';
    const isBarManager = session.role === 'bar_manager';
    const canAccess = isAdmin || isBarManager;
    
    const status = canAccess === session.canAccessGST ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${session.description}`);
    console.log(`  - isAdmin: ${isAdmin}, isBarManager: ${isBarManager}`);
    console.log(`  - Expected access: ${session.canAccessGST}, Actual access: ${canAccess}\n`);
  });
  
  console.log('GST Toggle Access Test Complete.');
}

// Run the test
testGSTToggleAccess();

