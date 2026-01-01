import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function audit() {
    console.log('--- Orders Distribution Audit ---')

    const { data: orders, error } = await supabase.from('orders').select('id, createdAt, status, businessUnit')

    if (error) {
        console.error('Error fetching orders:', error)
        return
    }

    console.log(`Total Orders Found: ${orders.length}`)

    const statsByDate: Record<string, { count: number, statuses: Record<string, number> }> = {}

    orders.forEach(o => {
        const date = o.createdAt.split('T')[0]
        if (!statsByDate[date]) {
            statsByDate[date] = { count: 0, statuses: {} }
        }
        statsByDate[date].count++
        const status = o.status || 'NULL'
        statsByDate[date].statuses[status] = (statsByDate[date].statuses[status] || 0) + 1
    })

    const sortedDates = Object.keys(statsByDate).sort()

    console.log('\n--- Orders by Date ---')
    sortedDates.forEach(date => {
        const s = statsByDate[date]
        console.log(`${date}: Count=${s.count}, Statuses=${JSON.stringify(s.statuses)}`)
    })
}

audit()
