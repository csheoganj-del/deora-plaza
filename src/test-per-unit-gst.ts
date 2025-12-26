/**
 * Test script to verify the per-unit GST configuration functionality
 * This script tests the new workflow where administrators configure GST per business unit
 */

import { getBusinessSettings, updateBusinessSettings } from "@/actions/businessSettings";

async function testPerUnitGST() {
  console.log("Testing Per-Unit GST Configuration...\n");
  
  try {
    // Test 1: Check current business settings structure
    console.log("1. Checking current business settings structure...");
    const currentSettings = await getBusinessSettings();
    console.log("Current settings keys:", Object.keys(currentSettings || {}));
    
    // Test 2: Update settings with per-unit GST configuration
    console.log("\n2. Updating settings with per-unit GST configuration...");
    if (currentSettings) {
      const updatedSettings = {
        ...currentSettings,
        gstEnabled: true,
        // Per-unit GST settings
        barGstEnabled: true,
        barGstPercentage: 18,
        cafeGstEnabled: true,
        cafeGstPercentage: 12,
        hotelGstEnabled: true,
        hotelGstPercentage: 15,
        gardenGstEnabled: true,
        gardenGstPercentage: 10,
      };
      
      const result = await updateBusinessSettings(updatedSettings);
      if (result.success) {
        console.log("✅ Successfully updated per-unit GST settings");
      } else {
        console.log("❌ Failed to update per-unit GST settings:", result.error);
      }
    }
    
    // Test 3: Verify settings were saved correctly
    console.log("\n3. Verifying settings were saved correctly...");
    const newSettings = await getBusinessSettings();
    if (newSettings) {
      console.log("GST Enabled:", newSettings.gstEnabled);
      console.log("Bar GST Enabled:", newSettings.barGstEnabled, "Percentage:", newSettings.barGstPercentage);
      console.log("Cafe GST Enabled:", newSettings.cafeGstEnabled, "Percentage:", newSettings.cafeGstPercentage);
      console.log("Hotel GST Enabled:", newSettings.hotelGstEnabled, "Percentage:", newSettings.hotelGstPercentage);
      console.log("Garden GST Enabled:", newSettings.gardenGstEnabled, "Percentage:", newSettings.gardenGstPercentage);
      
      // Verify values
      const checks = [
        { name: "Global GST", condition: newSettings.gstEnabled === true },
        { name: "Bar GST Enabled", condition: newSettings.barGstEnabled === true },
        { name: "Bar GST Percentage", condition: newSettings.barGstPercentage === 18 },
        { name: "Cafe GST Enabled", condition: newSettings.cafeGstEnabled === true },
        { name: "Cafe GST Percentage", condition: newSettings.cafeGstPercentage === 12 },
        { name: "Hotel GST Enabled", condition: newSettings.hotelGstEnabled === true },
        { name: "Hotel GST Percentage", condition: newSettings.hotelGstPercentage === 15 },
        { name: "Garden GST Enabled", condition: newSettings.gardenGstEnabled === true },
        { name: "Garden GST Percentage", condition: newSettings.gardenGstPercentage === 10 },
      ];
      
      checks.forEach(check => {
        console.log(`${check.condition ? "✅" : "❌"} ${check.name}: ${check.condition ? "PASS" : "FAIL"}`);
      });
    }
    
    console.log("\nPer-Unit GST Configuration Test Complete.");
  } catch (error) {
    console.error("Error during testing:", error);
  }
}

// Run the test
testPerUnitGST();

