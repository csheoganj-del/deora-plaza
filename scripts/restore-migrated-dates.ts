import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
}

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

async function restoreMigratedDates() {
    const DRY_RUN = false; // Always live for this run

    try {
        console.log(`🔄 Starting Cafe Bill Date Restoration (LIVE UPDATE with Collision Handling)...`)

        // 1. Load Backup Data
        const backupFilePath = path.join(process.cwd(), 'bloom-backup-1767110545373.json')
        if (!fs.existsSync(backupFilePath)) {
            console.error(`❌ Backup file not found at: ${backupFilePath}`)
            process.exit(1)
        }

        const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'))
        const backupBills: BackupBill[] = backupData.bills || []
        console.log(`✅ Loaded ${backupBills.length} bills from backup.`)

        // 2. Fetch Migrated Bills from DB (created on 2025-12-30)
        const targetDate = '2025-12-30'
        const { data: dbBills, error: fetchError } = await supabase
            .from('bills')
            .select('*')
            .gte('createdAt', `${targetDate}T00:00:00.000Z`)
            .lte('createdAt', `${targetDate}T23:59:59.999Z`)
            .eq('businessUnit', 'cafe')

        if (fetchError) {
            console.error('❌ Error fetching bills from database:', fetchError.message)
            process.exit(1)
        }

        console.log(`📊 Found ${dbBills?.length || 0} migrated bills in database for ${targetDate}.`)

        if (!dbBills || dbBills.length === 0) {
            console.log('ℹ️ No bills to process.')
            return
        }

        // 3. Get all existing bill numbers to check for collisions
        const { data: existingNums } = await supabase.from('bills').select('billNumber');
        const existingNumSet = new Set(existingNums?.map(b => b.billNumber) || []);

        let successCount = 0
        let matchCount = 0
        let ambiguousCount = 0
        let noMatchCount = 0

        for (const dbBill of dbBills) {
            let finalMatch: BackupBill | null = null

            if (dbBill.orderId) {
                finalMatch = backupBills.find(bb => bb.id === dbBill.orderId) || null;
            }

            if (!finalMatch) {
                const possibleMatches = backupBills.filter(bb =>
                    Math.abs(bb.total - dbBill.grandTotal) < 0.1 ||
                    Math.abs(bb.rounded - dbBill.grandTotal) < 0.1
                )

                if (possibleMatches.length === 1) {
                    finalMatch = possibleMatches[0]
                } else if (possibleMatches.length > 1) {
                    const dbItems = Array.isArray(dbBill.items) ? dbBill.items : JSON.parse(dbBill.items || '[]')
                    const refinedMatches = possibleMatches.filter(bb => {
                        const bbItems = bb.items;
                        if (bbItems.length !== dbItems.length) return false;
                        const sortedBBItems = [...bbItems].sort((a, b) => a.name.localeCompare(b.name));
                        const sortedDBItems = [...dbItems].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                        for (let i = 0; i < sortedBBItems.length; i++) {
                            if (sortedBBItems[i].name !== sortedDBItems[i].name) return false;
                            if (sortedBBItems[i].quantity !== sortedDBItems[i].quantity) return false;
                        }
                        return true;
                    })
                    if (refinedMatches.length === 1) {
                        finalMatch = refinedMatches[0]
                    } else if (refinedMatches.length > 1) {
                        ambiguousCount++
                        continue
                    }
                }
            }

            if (finalMatch) {
                matchCount++
                const originalDate = finalMatch.date
                const dateObj = new Date(originalDate)
                const dateStr = dateObj.toISOString().split('T')[0].replace(/-/g, '')
                let newBillNumber = `BILL-${dateStr}-${String(finalMatch.billNumber).padStart(3, '0')}`

                // Collision detection
                if (existingNumSet.has(newBillNumber) && newBillNumber !== dbBill.billNumber) {
                    newBillNumber = `${newBillNumber}-M`; // M for Migrated/Manual
                    // If still exists, add another level
                    if (existingNumSet.has(newBillNumber)) {
                        newBillNumber = `${newBillNumber}-${dbBill.id.slice(0, 4)}`;
                    }
                }

                const { error } = await supabase
                    .from('bills')
                    .update({
                        createdAt: originalDate,
                        updatedAt: originalDate,
                        billNumber: newBillNumber
                    })
                    .eq('id', dbBill.id)

                if (error) {
                    console.error(`❌ Failed to update bill ${dbBill.id}:`, error.message)
                } else {
                    successCount++
                    existingNumSet.add(newBillNumber);
                }
            } else {
                noMatchCount++
            }
        }

        console.log('\n--- Restoration Summary ---')
        console.log(`Total DB Bills:    ${dbBills.length}`)
        console.log(`Matched:           ${matchCount}`)
        console.log(`No Match:          ${noMatchCount}`)
        console.log(`Ambiguous:         ${ambiguousCount}`)
        console.log(`Successfully Updated: ${successCount}`)
        console.log('---------------------------\n')

    } catch (error: any) {
        console.error('❌ Unexpected error:', error.message)
        process.exit(1)
    }
}

restoreMigratedDates()
