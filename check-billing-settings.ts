import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBillingOnlySettings() {
    console.log('=== Checking Billing-Only Mode in Database ===\n');

    try {
        // Fetch the business settings
        const { data, error } = await supabase
            .from('businessSettings')
            .select('*')
            .eq('id', 'default')
            .single();

        if (error) {
            console.error('Error fetching settings:', error.message);
            return;
        }

        if (!data) {
            console.log('❌ No settings found in database!');
            return;
        }

        console.log('✅ Settings found in database\n');

        // Check if billing-only mode fields exist
        console.log('Billing-Only Mode Fields:');
        console.log('------------------------');
        console.log('billingOnlyMode:', data.billingOnlyMode ?? 'NOT EXISTS');
        console.log('cafeBillingOnlyMode:', data.cafeBillingOnlyMode ?? 'NOT EXISTS');
        console.log('barBillingOnlyMode:', data.barBillingOnlyMode ?? 'NOT EXISTS');
        console.log('hotelBillingOnlyMode:', data.hotelBillingOnlyMode ?? 'NOT EXISTS');
        console.log('gardenBillingOnlyMode:', data.gardenBillingOnlyMode ?? 'NOT EXISTS');

        console.log('\nWaiterless Mode Fields (for comparison):');
        console.log('------------------------');
        console.log('waiterlessMode:', data.waiterlessMode ?? 'NOT EXISTS');
        console.log('cafeWaiterlessMode:', data.cafeWaiterlessMode ?? 'NOT EXISTS');

        // Check if fields exist but are undefined
        const hasFields = Object.keys(data);
        console.log('\nAll fields in database:');
        console.log('------------------------');
        console.log(hasFields.join(', '));

        // Check if our new fields are in the list
        const billingFields = [
            'billingOnlyMode',
            'cafeBillingOnlyMode',
            'barBillingOnlyMode',
            'hotelBillingOnlyMode',
            'gardenBillingOnlyMode'
        ];

        console.log('\nBilling-only fields status:');
        console.log('------------------------');
        billingFields.forEach(field => {
            const exists = hasFields.includes(field);
            console.log(`${field}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        });

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkBillingOnlySettings();
