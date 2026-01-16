// Test script to verify billing-only mode settings
import { getBusinessSettings } from './src/actions/businessSettings';
import { isBillingOnlyModeEnabled } from './src/actions/businessSettings';

async function testBillingOnlyMode() {
    console.log('=== Testing Billing-Only Mode ===');

    // Test 1: Get all settings
    console.log('\n1. Fetching business settings...');
    const settings = await getBusinessSettings();

    if (settings) {
        console.log('Global billingOnlyMode:', settings.billingOnlyMode);
        console.log('cafeBillingOnlyMode:', settings.cafeBillingOnlyMode);
        console.log('barBillingOnlyMode:', settings.barBillingOnlyMode);
        console.log('hotelBillingOnlyMode:', settings.hotelBillingOnlyMode);
        console.log('gardenBillingOnlyMode:', settings.gardenBillingOnlyMode);
    } else {
        console.log('No settings found!');
    }

    // Test 2: Check if billing-only mode is enabled for cafe
    console.log('\n2. Checking if cafe billing-only mode is enabled...');
    const cafeEnabled = await isBillingOnlyModeEnabled('cafe');
    console.log('Cafe billing-only mode enabled?', cafeEnabled);

    // Test 3: Check for other units
    console.log('\n3. Checking other units...');
    console.log('Bar:', await isBillingOnlyModeEnabled('bar'));
    console.log('Hotel:', await isBillingOnlyModeEnabled('hotel'));
    console.log('Garden:', await isBillingOnlyModeEnabled('garden'));

    console.log('\n=== Test Complete ===');
}

testBillingOnlyMode().catch(console.error);
