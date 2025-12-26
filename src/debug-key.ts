
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Find the FIREBASE_SERVICE_ACCOUNT_KEY line
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.+)'/);
if (!match) {
    console.log('Could not find FIREBASE_SERVICE_ACCOUNT_KEY in .env with expected quoting');
    // Try without quotes or with double quotes if needed
    const match2 = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.+)/);
    if (match2) {
        console.log('Found with alternative pattern');
    }
} else {
    try {
        const jsonStr = match[1];
        console.log('Raw JSON string length:', jsonStr.length);
        const parsed = JSON.parse(jsonStr);
        const key = parsed.private_key;

        console.log('Private Key Analysis:');
        console.log('Length:', key.length);
        console.log('Has real newlines?', key.includes('\n'));
        console.log('Has literal \\n?', key.includes('\\n'));
        console.log('First 50 chars:', JSON.stringify(key.substring(0, 50)));

        // Test potential fixes
        const fixed1 = key.replace(/\\n/g, '\n');
        console.log('Fixed1 (replace \\\\n -> \\n) has newlines?', fixed1.includes('\n'));
        console.log('Fixed1 starts with:', JSON.stringify(fixed1.substring(0, 50)));

    } catch (e) {
        console.error('Failed to parse JSON:', e);
    }
}

