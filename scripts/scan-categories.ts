import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function scanCategories() {
    const { data: bills } = await supabase
        .from('bills')
        .select('id, items, businessUnit');

    const categoryMap: Record<string, number> = {};
    const unitSuggestions: Record<string, string[]> = {
        'bar': [],
        'cafe': []
    };

    const barKeywords = ['beer', 'whiskey', 'rum', 'vodka', 'gin', 'wine', 'cocktail', 'mocktail', 'drink', 'bar'];
    const cafeKeywords = ['pizza', 'sandwich', 'coffee', 'tea', 'pasta', 'burger', 'cafe'];

    bills?.forEach(b => {
        let items = b.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { }
        }
        if (Array.isArray(items)) {
            items.forEach((item: any) => {
                const cat = (item.category || 'NO_CATEGORY').toUpperCase();
                categoryMap[cat] = (categoryMap[cat] || 0) + 1;

                const name = (item.name || '').toLowerCase();
                const isBar = barKeywords.some(k => name.includes(k) || cat.toLowerCase().includes(k));
                if (isBar) {
                    unitSuggestions.bar.push(b.id);
                }
            });
        }
    });

    console.log('--- Category Distribution ---');
    console.table(Object.entries(categoryMap).sort((a, b) => b[1] - a[1]));

    const uniqueBarBillIds = [...new Set(unitSuggestions.bar)];
    console.log(`\nFound ${uniqueBarBillIds.length} bills that might belong to BAR.`);
}
scanCategories();
