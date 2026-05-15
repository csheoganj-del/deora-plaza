import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function refreshRoomsCache() {
    try {
        console.log('Attempting to refresh Supabase schema cache for rooms...');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase environment variables');
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Making test queries to rooms table...');

        // Query 1: Simple select on rooms
        const { data: data1, error: error1 } = await supabase
            .from('rooms')
            .select('id, number, status')
            .limit(1);

        if (error1) {
            console.error('Query 1 failed:', error1.message);
        } else {
            console.log('Query 1 succeeded');
        }

        // Query 2: Select all columns
        const { data: data2, error: error2 } = await supabase
            .from('rooms')
            .select('*')
            .limit(1);

        if (error2) {
            console.error('Query 2 failed:', error2.message);
            console.log('If this is the PGRST204 error, the cache might need more persistent refreshing or table recreate.');
        } else {
            console.log('Query 2 succeeded - schema seems fine');
            if (data2 && data2.length > 0) {
                console.log('Columns found:', Object.keys(data2[0]));
            }
        }

    } catch (error) {
        console.error('Error during schema cache refresh:', error);
    }
}

refreshRoomsCache();
