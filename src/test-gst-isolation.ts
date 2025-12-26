/**
 * Test script to verify GST report data isolation between business units
 * This script tests that each business unit's GST report only shows data for that specific unit
 */

import { getGSTReport } from "@/actions/gst";

async function testGSTIsolation() {
  console.log("Testing GST Report Data Isolation...\n");
  
  // Test dates
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2023-12-31');
  
  // Test each business unit
  const businessUnits = ['bar', 'cafe', 'hotel', 'garden'];
  
  for (const unit of businessUnits) {
    console.log(`Testing ${unit.toUpperCase()} GST Report...`);
    
    try {
      const bills = await getGSTReport(startDate, endDate, unit);
      
      // Verify all bills belong to the correct business unit
      const isValid = bills.every((bill: any) => bill.businessUnit === unit);
      
      if (isValid) {
        console.log(`✅ ${unit} GST Report: All ${bills.length} bills belong to ${unit}\n`);
      } else {
        console.log(`❌ ${unit} GST Report: Found bills from other units!\n`);
        
        // Show which bills are from wrong units
        const wrongBills = bills.filter((bill: any) => bill.businessUnit !== unit);
        wrongBills.slice(0, 5).forEach((bill: any) => {
          console.log(`  - Bill ${bill.billNumber} belongs to ${bill.businessUnit}, not ${unit}`);
        });
      }
    } catch (error) {
      console.log(`❌ ${unit} GST Report: Error occurred - ${error}\n`);
    }
  }
  
  // Test "all" business units report
  console.log("Testing ALL BUSINESS UNITS GST Report...");
  try {
    const allBills = await getGSTReport(startDate, endDate, 'all');
    console.log(`✅ ALL GST Report: Retrieved ${allBills.length} bills from all units\n`);
  } catch (error) {
    console.log(`❌ ALL GST Report: Error occurred - ${error}\n`);
  }
  
  console.log("GST Report Isolation Test Complete.");
}

// Run the test
testGSTIsolation().catch(console.error);

