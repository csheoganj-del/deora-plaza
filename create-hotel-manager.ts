import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createHotelManager() {
    try {
        console.log('🏨 Creating hotel manager user...');

        // Hash the password
        const password = 'Hotel123!';
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed successfully');

        // Insert user into database
        const { data, error } = await supabase
            .from('users')
            .upsert([
                {
                    username: 'hotelmanager',
                    password: hashedPassword,
                    email: 'hotel@deoraplaza.com',
                    phoneNumber: null,
                    role: 'hotel_manager',
                    businessUnit: 'hotel',
                    name: 'Hotel Manager',
                    isActive: true,
                    authMethod: 'password',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ], {
                onConflict: 'username'
            })
            .select();

        if (error) {
            console.error('❌ Error creating hotel manager:', error.message);
            process.exit(1);
        }

        console.log('✅ Hotel manager created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Username: hotelmanager');
        console.log('   Password: Hotel123!');
        console.log('   Role: hotel_manager');
        console.log('   Business Unit: hotel');
        console.log('\n🎯 You can now login at: http://localhost:3000/login');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

createHotelManager();
