// Helper script to generate bcrypt hash for your password
// Run this with: node generate-password-hash.mjs

import bcrypt from 'bcryptjs';

async function generateHash() {
    const password = 'Deora@123'; // Change this to your desired password
    const hash = await bcrypt.hash(password, 10);

    console.log('\n=================================');
    console.log('Password Hash Generated!');
    console.log('=================================');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nUse this SQL to create the admin user:');
    console.log('=================================\n');
    console.log(`INSERT INTO users (
    id,
    username,
    "authMethod",
    password,
    role,
    "businessUnit",
    name,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'kalpeshdeora',
    'password',
    '${hash}',
    'super_admin',
    'all',
    'Kalpesh Deora',
    true,
    NOW(),
    NOW()
);`);
    console.log('\n=================================\n');
}

generateHash();
