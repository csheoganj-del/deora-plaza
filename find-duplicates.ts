import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function findDuplicates() {
  try {
    console.log('🔍 Finding duplicate bills...')
    
    // Get all bills sorted by creation date
    const { data: bills, error } = await supabase
      .from('bills')
      .select('id, billNumber, createdAt')
      .order('createdAt', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching bills:', error.message)
      process.exit(1)
    }
    
    console.log(`📊 Found ${bills?.length || 0} total bills`)
    
    // Group bills by billNumber to find duplicates
    const billGroups: Record<string, any[]> = {}
    
    bills?.forEach(bill => {
      if (!billGroups[bill.billNumber]) {
        billGroups[bill.billNumber] = []
      }
      billGroups[bill.billNumber].push(bill)
    })
    
    // Find duplicates (bills with the same billNumber)
    const duplicates: any[] = []
    Object.entries(billGroups).forEach(([billNumber, bills]) => {
      if (bills.length > 1) {
        // Sort by creation date and keep the oldest, mark newer ones as duplicates
        bills.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        // Add all except the first (oldest) to duplicates
        duplicates.push(...bills.slice(1))
      }
    })
    
    console.log(`🔍 Found ${duplicates.length} duplicate bills`)
    
    if (duplicates.length > 0) {
      console.log('\n📋 Duplicate bills to remove:')
      duplicates.forEach((bill, index) => {
        console.log(`  ${index + 1}. ${bill.billNumber} (ID: ${bill.id}) - Created: ${bill.createdAt}`)
      })
      
      // Ask for confirmation before removing
      console.log(`\n⚠️  About to remove ${duplicates.length} duplicate bills.`)
      console.log('Do you want to proceed? (y/N)')
      
      // For automation, we'll proceed with removal
      console.log('Proceeding with removal...')
      
      // Remove duplicate bills
      const duplicateIds = duplicates.map(bill => bill.id)
      const { error: deleteError } = await supabase
        .from('bills')
        .delete()
        .in('id', duplicateIds)
      
      if (deleteError) {
        console.error('❌ Error deleting duplicate bills:', deleteError.message)
        process.exit(1)
      }
      
      console.log(`✅ Successfully removed ${duplicateIds.length} duplicate bills`)
      
      // Verify the count
      const { count: newCount, error: countError } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('❌ Error counting bills after removal:', countError.message)
      } else {
        console.log(`📊 New total bills count: ${newCount}`)
      }
    } else {
      console.log('✅ No duplicate bills found')
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

findDuplicates()