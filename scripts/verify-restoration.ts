import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function verify() {
    console.log('--- Database Verification ---')

    // Check Cafe bills on Dec 30
    const { count: cafe30 } = await supabase.from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('businessUnit', 'cafe')
        .gte('createdAt', '2025-12-30T00:00:00.000Z')
        .lte('createdAt', '2025-12-30T23:59:59.999Z')

    // Check ALL bills on Dec 30
    const { count: all30 } = await supabase.from('bills')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', '2025-12-30T00:00:00.000Z')
        .lte('createdAt', '2025-12-30T23:59:59.999Z')

    // Check Cafe bills in Oct/Nov
    const { count: cafeRestored } = await supabase.from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('businessUnit', 'cafe')
        .gte('createdAt', '2025-10-01T00:00:00.000Z')
        .lte('createdAt', '2025-11-30T23:59:59.999Z')

    // Breakdown for Dec 30 by unit
    const { data: breakdown } = await supabase.from('bills')
        .select('businessUnit')
        .gte('createdAt', '2025-12-30T00:00:00.000Z')
        .lte('createdAt', '2025-12-30T23:59:59.999Z')

    const units = (breakdown || []).reduce((acc: any, b) => {
        acc[b.businessUnit] = (acc[b.businessUnit] || 0) + 1
        return acc
    }, {})

    console.log('Cafe Bills on 2025-12-30:', cafe30)
    console.log('Total Bills on 2025-12-30:', all30)
    console.log('Unit Breakdown on 2025-12-30:', units)
    console.log('Cafe Bills in Oct/Nov 2025:', cafeRestored)
}

verify()
