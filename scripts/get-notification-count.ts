import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getCount() {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Total notifications (Service):', count)
    }
}

getCount()
