import { createClient } from '@supabase/supabase-js';
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

async function listAllUsers() {
    try {
        console.log('📋 Fetching all users from database...\n');

        // Get all users
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, phoneNumber, role, businessUnit, name, isActive, authMethod, createdAt')
            .order('createdAt', { ascending: true });

        if (error) {
            console.error('❌ Error fetching users:', error.message);
            process.exit(1);
        }

        if (!users || users.length === 0) {
            console.log('⚠️  No users found in database!');
            console.log('\n💡 You need to create users first. Common default passwords:');
            console.log('   - Admin: AdminPass123!');
            console.log('   - Hotel Manager: Hotel123!');
            console.log('   - Cafe Manager: Cafe123!');
            return;
        }

        console.log(`✅ Found ${users.length} user(s) in database:\n`);
        console.log('═'.repeat(120));

        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name || user.username}`);
            console.log('   ├─ Username:', user.username || 'N/A');
            console.log('   ├─ Email:', user.email || 'N/A');
            console.log('   ├─ Phone:', user.phoneNumber || 'N/A');
            console.log('   ├─ Role:', user.role);
            console.log('   ├─ Business Unit:', user.businessUnit);
            console.log('   ├─ Auth Method:', user.authMethod);
            console.log('   ├─ Active:', user.isActive ? '✅ Yes' : '❌ No');
            console.log('   └─ Created:', new Date(user.createdAt).toLocaleString());
        });

        console.log('\n' + '═'.repeat(120));
        console.log('\n📝 Common Default Passwords (if users were created with standard scripts):');
        console.log('   • admin → AdminPass123!');
        console.log('   • hotelmanager → Hotel123!');
        console.log('   • cafemanager → Cafe123!');
        console.log('   • barmanager → Bar123!');
        console.log('   • gardenmanager → Garden123!');
        console.log('\n⚠️  Note: Passwords are hashed in database and cannot be retrieved.');
        console.log('   If you forgot a password, you need to reset it using a password reset script.');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

listAllUsers();
