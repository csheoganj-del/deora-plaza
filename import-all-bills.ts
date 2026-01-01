import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

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

interface BackupBill {
  id: string
  date: string
  items: Array<{
    id: string
    name: string
    price: number
    category: string
    quantity: number
  }>
  subtotal: number
  discount: number
  gst: number
  total: number
  rounded: number
  paymentMethod: string
  billNumber: number
}

async function importAllBills() {
  try {
    console.log('🔄 Importing all bills from backup...')
    
    // Read the backup file
    const backupFilePath = path.join(__dirname, 'bloom-backup-1765388052067.json')
    
    if (!fs.existsSync(backupFilePath)) {
      console.error(`❌ Backup file not found at: ${backupFilePath}`)
      process.exit(1)
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'))
    
    if (!backupData.bills || !Array.isArray(backupData.bills)) {
      console.error('❌ Invalid backup file format: missing bills array')
      process.exit(1)
    }
    
    console.log(`✅ Found ${backupData.bills.length} bills in backup`)
    
    // Get existing bill numbers to avoid duplicates
    const { data: existingBills, error: fetchError } = await supabase
      .from('bills')
      .select('billNumber')
    
    if (fetchError) {
      console.error('❌ Error fetching existing bills:', fetchError.message)
      process.exit(1)
    }
    
    const existingBillNumbers = new Set(existingBills?.map(bill => bill.billNumber) || [])
    console.log(`📊 Found ${existingBillNumbers.size} existing bills in database`)
    
    // Transform backup bills to match our database schema
    const billsToInsert = backupData.bills.map((bill: BackupBill, index: number) => {
      // Calculate totals
      const subtotal = bill.subtotal || 0
      const discountAmount = bill.discount || 0
      const gstAmount = bill.gst || 0
      const grandTotal = bill.total || bill.rounded || 0
      
      // Calculate percentages
      const discountPercent = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0
      const gstPercent = (subtotal - discountAmount) > 0 ? (gstAmount / (subtotal - discountAmount)) * 100 : 0
      
      // Generate unique bill number
      const dateStr = new Date(bill.date).toISOString().split('T')[0].replace(/-/g, '')
      let billNumber = `BILL-${dateStr}-${String(bill.billNumber || index + 1).padStart(3, '0')}`
      
      // Ensure uniqueness by appending a suffix if needed
      let counter = 1
      let uniqueBillNumber = billNumber
      while (existingBillNumbers.has(uniqueBillNumber)) {
        uniqueBillNumber = `${billNumber}-${counter}`
        counter++
      }
      
      // Add to existing bill numbers set to prevent duplicates within this batch
      existingBillNumbers.add(uniqueBillNumber)
      
      return {
        billNumber: uniqueBillNumber,
        orderId: bill.id,
        businessUnit: 'cafe',
        customerName: null,
        customerMobile: null,
        subtotal: subtotal,
        discountPercent: parseFloat(discountPercent.toFixed(2)),
        discountAmount: discountAmount,
        gstPercent: parseFloat(gstPercent.toFixed(2)),
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        paymentMethod: bill.paymentMethod || 'cash',
        paymentStatus: 'paid',
        source: 'dine-in',
        address: null,
        items: bill.items || [],
        createdBy: 'system-import',
        createdAt: bill.date || new Date().toISOString(),
        updatedAt: bill.date || new Date().toISOString()
      }
    })
    
    console.log(`📦 Preparing to insert ${billsToInsert.length} bills...`)
    
    // Insert bills in batches to avoid timeouts
    const batchSize = 50
    let insertedCount = 0
    let skippedCount = 0
    
    for (let i = 0; i < billsToInsert.length; i += batchSize) {
      const batch = billsToInsert.slice(i, i + batchSize)
      console.log(`📥 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(billsToInsert.length/batchSize)} (${batch.length} bills)...`)
      
      // Insert batch
      const { error: insertError } = await supabase
        .from('bills')
        .insert(batch)
      
      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError.message)
        // Try inserting one by one to identify problematic bills
        for (const bill of batch) {
          const { error: singleError } = await supabase
            .from('bills')
            .insert([bill])
          
          if (singleError) {
            console.error(`   ❌ Failed to insert bill ${bill.billNumber}:`, singleError.message)
            skippedCount++
          } else {
            insertedCount++
          }
        }
      } else {
        insertedCount += batch.length
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} inserted successfully`)
      }
    }
    
    console.log(`✅ Bills import completed! ${insertedCount} bills inserted, ${skippedCount} bills skipped`)
    
    // Verify the import
    const { count: totalCount, error: countError } = await supabase
      .from('bills')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting bills:', countError.message)
    } else {
      console.log(`📊 Total bills in database: ${totalCount}`)
    }
    
    // Show sample of recently added bills
    const { data: recentBills, error: recentError } = await supabase
      .from('bills')
      .select('id, billNumber, grandTotal, paymentStatus, createdAt')
      .order('createdAt', { ascending: false })
      .limit(5)
    
    if (recentError) {
      console.error('❌ Error fetching recent bills:', recentError.message)
    } else {
      console.log('🔍 Recent bills sample:')
      recentBills?.forEach(bill => {
        console.log(`   • ${bill.billNumber} - ₹${bill.grandTotal} (${bill.paymentStatus})`)
      })
    }
    
    console.log('\n🎉 Bill import completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('1. Refresh the statistics page to see the updated data')
    
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

// Run the import
importAllBills()