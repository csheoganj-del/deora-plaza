// Helper script to generate bcrypt hash for your password
// Run this with: node generate-password-hash.js

const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'Deora@123'; // Change this to your desired password
    const hash = await bcrypt.hash(password, 10);

    console.log('\n=================================');
    console.log('Password Hash Generated!');
    console.log('=================================');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nCopy this hash and use it in the SQL script (create_admin_user.sql)');
    console.log('Replace the placeholder password value with this hash.');
    console.log('=================================\n');
}

generateHash();
