#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config()

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
}

async function updateMenuFromBackup() {
  try {
    console.log('🔄 Updating menu items from backup...')
    
    // Read the backup file
    const fs = await import('fs')
    const path = await import('path')
    
    const backupFilePath = path.join(__dirname, 'bloom-backup-1765388052067.json')
    
    if (!fs.existsSync(backupFilePath)) {
      console.error(`❌ Backup file not found at: ${backupFilePath}`)
      process.exit(1)
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'))
    
    if (!backupData.menu || !Array.isArray(backupData.menu)) {
      console.error('❌ Invalid backup file format: missing menu array')
      process.exit(1)
    }
    
    console.log(`✅ Found ${backupData.menu.length} menu items in backup`)
    
    // Transform backup menu items to match our database schema
    const menuItems = backupData.menu.map((item: any) => ({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      businessUnit: 'cafe', // Default to cafe for all items
      isAvailable: true,
      isDrink: item.category === 'COLD COFFEE' || item.category === 'SHAKE' || item.category === 'MOCKTAIL' || item.category === 'SMOOTHIE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    console.log(`📦 Preparing to insert ${menuItems.length} menu items...`)
    
    // First, clear existing menu items
    console.log('🗑️  Clearing existing menu items...')
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all items
    
    if (deleteError) {
      console.error('❌ Error clearing menu items:', deleteError.message)
      process.exit(1)
    }
    
    console.log('✅ Existing menu items cleared')
    
    // Insert new menu items
    console.log('📥 Inserting new menu items from backup...')
    const { error: insertError } = await supabase
      .from('menu_items')
      .insert(menuItems)
    
    if (insertError) {
      console.error('❌ Error inserting menu items:', insertError.message)
      process.exit(1)
    }
    
    console.log('✅ Menu items successfully updated from backup!')
    console.log(`📊 Summary: ${menuItems.length} items inserted`)
    
    // Verify the update
    const { data: verificationData, error: verificationError } = await supabase
      .from('menu_items')
      .select('id, name, category, price')
      .limit(5)
    
    if (verificationError) {
      console.error('❌ Error verifying update:', verificationError.message)
    } else {
      console.log('🔍 Verification sample:')
      verificationData?.forEach(item => {
        console.log(`   • ${item.name} (${item.category}) - ₹${item.price}`)
      })
    }
    
    console.log('\n🎉 Menu update completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('1. Restart your development server: npm run dev')
    console.log('2. Refresh the menu page to see the updated items')
    console.log('3. Test creating orders with the new menu')
    
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

// Run the update
updateMenuFromBackup()