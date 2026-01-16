import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inspectNotifications() {
    console.log('--- Inspecting Notifications ---')
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log(JSON.stringify(data, null, 2))
}

inspectNotifications()
