
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findDuplicates() {
    console.log('Fetching all menu items...');

    // Use a recursive fetch or large limit to get all
    // Assuming < 1000 items given my previous count of 244
    const { data: items, error } = await supabase
        .from('menu_items')
        .select('id, name, price, category, businessUnit')
        .limit(5000);

    if (error) {
        console.error('Error fetching items:', error);
        return;
    }

    console.log(`Scanned ${items.length} items.`);

    const nameMap = new Map<string, any[]>();

    items.forEach(item => {
        const normalized = item.name.trim().toLowerCase();
        if (!nameMap.has(normalized)) {
            nameMap.set(normalized, []);
        }
        nameMap.get(normalized)?.push(item);
    });

    const duplicates = [];
    for (const [name, itemList] of nameMap.entries()) {
        if (itemList.length > 1) {
            duplicates.push({ name, count: itemList.length, items: itemList });
        }
    }

    if (duplicates.length === 0) {
        console.log('✅ No duplicates found.');
    } else {
        console.log(`⚠️ Found ${duplicates.length} duplicate groups:`);
        duplicates.forEach(dup => {
            console.log(`\nDuplicate: "${dup.name}" (Count: ${dup.count})`);
            dup.items.forEach(item => {
                console.log(`   - ID: ${item.id} | Price: ${item.price} | Category: ${item.category} | Unit: ${item.businessUnit}`);
            });
        });
    }
}

findDuplicates();
