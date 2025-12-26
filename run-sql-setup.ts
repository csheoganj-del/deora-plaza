import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runSqlSetup() {
  try {
    console.log('🚀 Running SQL setup...\n');
    
    // Read the SQL setup file
    const sqlFilePath = join(process.cwd(), 'supabase-table-setup.sql');
    console.log(`📂 Reading SQL file: ${sqlFilePath}`);
    
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    // Note: This is a simple split and may not work for complex SQL with semicolons in strings
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`✅ Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements or comments
      if (!statement || statement.startsWith('--')) continue;
      
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // For CREATE TABLE statements, we need to use raw SQL execution
        // But Supabase JS client doesn't have a direct way to execute raw SQL
        // So we'll show what needs to be done
        console.log(`   This statement needs to be executed in the Supabase SQL Editor:`);
        console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}\n`);
      } catch (stmtError: any) {
        console.warn(`   ⚠️  Warning for statement ${i + 1}:`, stmtError);
      }
    }
    
    console.log('📋 Manual Setup Instructions:');
    console.log('===========================');
    console.log('1. Go to your Supabase project dashboard: https://app.supabase.com/project/wjqsqwitgxqypzbaayos');
    console.log('2. Navigate to Database > SQL Editor in the left sidebar');
    console.log('3. Copy the entire contents of supabase-table-setup.sql');
    console.log('4. Paste it into the SQL editor');
    console.log('5. Click Run to execute all commands');
    console.log('6. After tables are created, run: npx tsx initialize-all-data.ts');
    
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error('❌ SQL setup file not found. Please ensure supabase-table-setup.sql exists in the project root.');
      console.log('\n📋 To create the file, you can:');
      console.log('1. Copy the SQL commands from the documentation');
      console.log('2. Save them as supabase-table-setup.sql in your project root');
    } else {
      console.error('❌ Unexpected error:', error);
    }
    process.exit(1);
  }
}

runSqlSetup();