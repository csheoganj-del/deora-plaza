
import { adminDb } from './src/lib/firebase/admin'

async function debugKey() {
    console.log('--- Checking Key Metadata ---')
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            console.log('client_email present:', !!parsed.client_email)
            console.log('project_id present:', !!parsed.project_id)
            if (parsed.client_email) console.log('client_email:', parsed.client_email) // usually safe to show email
            if (parsed.project_id) console.log('project_id:', parsed.project_id)

            if (process.env.FIREBASE_PROJECT_ID) {
                console.log('Env FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID)
                console.log('Match?', parsed.project_id === process.env.FIREBASE_PROJECT_ID)
            }

        } catch (e) {
            console.error('Error parsing:', e.message)
        }
    }
    process.exit()
}

debugKey()
