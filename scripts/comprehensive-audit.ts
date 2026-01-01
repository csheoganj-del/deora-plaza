import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function audit() {
    console.log('--- Comprehensive Bill Audit ---')

    const { data: bills, error } = await supabase.from('bills').select('id, createdAt, grandTotal, businessUnit, paymentStatus, billNumber')

    if (error) {
        console.error('Error fetching bills:', error)
        return
    }

    console.log(`Total Bills Found: ${bills.length}`)

    const statsByDate: Record<string, { count: number, revenue: number, units: Record<string, number> }> = {}

    bills.forEach(b => {
        const date = b.createdAt.split('T')[0]
        if (!statsByDate[date]) {
            statsByDate[date] = { count: 0, revenue: 0, units: {} }
        }
        statsByDate[date].count++
        statsByDate[date].revenue += b.grandTotal || 0
        const unit = b.businessUnit || 'NULL'
        statsByDate[date].units[unit] = (statsByDate[date].units[unit] || 0) + 1
    })

    const sortedDates = Object.keys(statsByDate).sort()

    console.log('\n--- Distribution by Date ---')
    sortedDates.forEach(date => {
        const s = statsByDate[date]
        console.log(`${date}: Count=${s.count}, Revenue=${s.revenue.toFixed(2)}, Units=${JSON.stringify(s.units)}`)
    })

    console.log('\n--- Specific Check for Dec 30 ---')
    if (statsByDate['2025-12-30']) {
        const dec30Bills = bills.filter(b => b.createdAt.startsWith('2025-12-30'))
        console.log('Dec 30 Bills:', dec30Bills.map(b => `${b.billNumber} (${b.id.slice(0, 8)})`).join(', '))
    } else {
        console.log('No bills found on 2025-12-30')
    }
}

audit()
