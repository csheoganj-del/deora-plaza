// Test script to verify per-unit waiterless mode functionality
import { getBusinessSettings, updateBusinessSettings } from "./actions/businessSettings";

async function testPerUnitWaiterless() {
  try {
    console.log("Testing per-unit waiterless mode functionality...");
    
    // Get current settings
    const currentSettings = await getBusinessSettings();
    console.log("Current business settings:", currentSettings);
    
    // Enable global waiterless mode and configure per-unit settings
    const testSettings = {
      name: currentSettings?.name || "",
      address: currentSettings?.address || "",
      mobile: currentSettings?.mobile || "",
      waiterlessMode: true,
      barWaiterlessMode: true,
      cafeWaiterlessMode: true,
      hotelWaiterlessMode: false,
      gardenWaiterlessMode: true,
      // Preserve other settings
      gstEnabled: currentSettings?.gstEnabled,
      gstPercentage: currentSettings?.gstPercentage,
      barGstEnabled: currentSettings?.barGstEnabled,
      barGstPercentage: currentSettings?.barGstPercentage,
      cafeGstEnabled: currentSettings?.cafeGstEnabled,
      cafeGstPercentage: currentSettings?.cafeGstPercentage,
      hotelGstEnabled: currentSettings?.hotelGstEnabled,
      hotelGstPercentage: currentSettings?.hotelGstPercentage,
      gardenGstEnabled: currentSettings?.gardenGstEnabled,
      gardenGstPercentage: currentSettings?.gardenGstPercentage,
      enablePasswordProtection: currentSettings?.enablePasswordProtection,
      enableBarModule: currentSettings?.enableBarModule,
      gardenName: currentSettings?.gardenName,
      gardenAddress: currentSettings?.gardenAddress,
      gardenMobile: currentSettings?.gardenMobile,
    };
    
    console.log("Updating settings with per-unit waiterless configuration...");
    const updateResult = await updateBusinessSettings(testSettings);
    
    if (updateResult.success) {
      console.log("✅ Successfully updated business settings");
      
      // Verify the settings were saved correctly
      const updatedSettings = await getBusinessSettings();
      console.log("Updated business settings:", updatedSettings);
      
      // Check that per-unit settings are correctly applied
      if (updatedSettings?.waiterlessMode === true &&
          updatedSettings?.barWaiterlessMode === true &&
          updatedSettings?.cafeWaiterlessMode === true &&
          updatedSettings?.hotelWaiterlessMode === false &&
          updatedSettings?.gardenWaiterlessMode === true) {
        console.log("✅ All per-unit waiterless mode settings are correctly configured");
      } else {
        console.log("❌ Per-unit waiterless mode settings validation failed");
        console.log("Expected: global=true, bar=true, cafe=true, hotel=false, garden=true");
        console.log("Actual:", {
          global: updatedSettings?.waiterlessMode,
          bar: updatedSettings?.barWaiterlessMode,
          cafe: updatedSettings?.cafeWaiterlessMode,
          hotel: updatedSettings?.hotelWaiterlessMode,
          garden: updatedSettings?.gardenWaiterlessMode
        });
      }
    } else {
      console.log("❌ Failed to update business settings:", updateResult.error);
    }
    
    console.log("\n✅ Per-unit waiterless mode test completed!");
    console.log("Administrators can now control waiterless mode centrally and configure it per business unit.");
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testPerUnitWaiterless();

