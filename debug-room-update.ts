
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for updates

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRoomUpdate() {
    console.log('=== DEBUGGING ROOM UPDATE ===');

    // 1. Get a room
    const { data: rooms, error: getError } = await supabase
        .from('rooms')
        .select('*')
        .limit(1);

    if (getError || !rooms || rooms.length === 0) {
        console.error('Failed to get rooms:', getError);
        return;
    }

    const room = rooms[0];
    console.log('Found room:', { id: room.id, number: room.number, status: room.status });

    // 2. Try to update status
    console.log('Attempting to update room status...');

    const updateData = {
        status: room.status === 'available' ? 'occupied' : 'available',
        updatedAt: new Date().toISOString()
    };

    console.log('Update payload:', updateData);

    const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', room.id)
        .select();

    if (updateError) {
        console.error('❌ UPDATE FAILED:', updateError);
        console.error('Error message:', updateError.message);
        console.error('Error details:', updateError.details);
        console.error('Error code:', updateError.code);
    } else {
        console.log('✅ UPDATE SUCCESS:', updated);
    }
}

debugRoomUpdate();
