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

async function removeExtraBills() {
  try {
    console.log('🔍 Removing extra bills to reach exactly 225...')
    
    // Get total bill count
    const { count: totalCount, error: countError } = await supabase
      .from('bills')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting bills:', countError.message)
      process.exit(1)
    }
    
    console.log(`📊 Current total bills: ${totalCount}`)
    
    const targetCount = 225
    const billsToRemove = (totalCount || 0) - targetCount
    
    if (billsToRemove <= 0) {
      console.log('✅ Already at or below target count')
      return
    }
    
    console.log(`⚠️  Need to remove ${billsToRemove} bills`)
    
    // Get the most recently created bills to remove
    const { data: recentBills, error: fetchError } = await supabase
      .from('bills')
      .select('id, billNumber, createdAt')
      .order('createdAt', { ascending: false })
      .limit(billsToRemove)
    
    if (fetchError) {
      console.error('❌ Error fetching recent bills:', fetchError.message)
      process.exit(1)
    }
    
    console.log('\n📋 Bills to remove:')
    recentBills?.forEach((bill, index) => {
      console.log(`  ${index + 1}. ${bill.billNumber} - Created: ${bill.createdAt}`)
    })
    
    // Remove the extra bills
    const billIdsToRemove = recentBills?.map(bill => bill.id) || []
    const { error: deleteError } = await supabase
      .from('bills')
      .delete()
      .in('id', billIdsToRemove)
    
    if (deleteError) {
      console.error('❌ Error deleting bills:', deleteError.message)
      process.exit(1)
    }
    
    console.log(`✅ Successfully removed ${billIdsToRemove.length} bills`)
    
    // Verify the new count
    const { count: newCount, error: verifyError } = await supabase
      .from('bills')
      .select('*', { count: 'exact', head: true })
    
    if (verifyError) {
      console.error('❌ Error verifying count:', verifyError.message)
    } else {
      console.log(`📊 New total bills count: ${newCount}`)
      
      if (newCount === targetCount) {
        console.log('✅ Successfully reduced to exactly 225 bills!')
      } else {
        console.log(`⚠️  Target not reached. Current: ${newCount}, Target: ${targetCount}`)
      }
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

removeExtraBills()