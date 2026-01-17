
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function shareBeverages() {
    const categoriesToShare = [
        "WATER",
        "MOCKTAIL",
        "HOT & COLD BEVERAGE",
        "MILK SHAKE & JUICE"
    ];

    console.log(`Updating ${categoriesToShare.length} categories to 'shared'...`);

    const { data, error } = await supabase
        .from('menu_items')
        .update({ businessUnit: 'shared' })
        .in('category', categoriesToShare)
        .select();

    if (error) {
        console.error('Error updating beverages:', error);
    } else {
        console.log(`✅ Updated ${data.length} beverage/water items to 'shared' business unit.`);
    }
}

shareBeverages();
