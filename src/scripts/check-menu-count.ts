
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // using anon key for safety, or service role if needed

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMenu() {
    const { count, error } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting items:', error);
        return;
    }
    console.log(`Total existing menu items: ${count}`);

    const { data: categories } = await supabase
        .from('categories')
        .select('name');

    console.log('Existing Categories:', categories?.map(c => c.name));
}

checkMenu();
