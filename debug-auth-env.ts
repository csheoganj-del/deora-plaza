
import { adminDb } from './src/lib/firebase/admin'

async function debugEnv() {
    console.log('--- Checking Environment Variables ---')
    console.log('FIREBASE_SERVICE_ACCOUNT_KEY present:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    console.log('FIREBASE_PROJECT_ID present:', !!process.env.FIREBASE_PROJECT_ID)
    console.log('FIREBASE_CLIENT_EMAIL present:', !!process.env.FIREBASE_CLIENT_EMAIL)
    console.log('FIREBASE_PRIVATE_KEY present:', !!process.env.FIREBASE_PRIVATE_KEY)
    console.log('DEFAULT_ADMIN_USERNAME present:', !!process.env.DEFAULT_ADMIN_USERNAME)
    console.log('DEFAULT_ADMIN_PASSWORD present:', !!process.env.DEFAULT_ADMIN_PASSWORD)

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log('FIREBASE_SERVICE_ACCOUNT_KEY length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length)
        try {
            const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            console.log('FIREBASE_SERVICE_ACCOUNT_KEY parsed successfully')
            console.log('project_id in JSON:', parsed.project_id)
        } catch (e: any) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e)
        }
    }

    try {
        console.log('Attempting Firestore connection...')
        const snapshot = await adminDb.collection('users').limit(1).get()
        console.log('Firestore connection validation successful. Docs found:', snapshot.size)
    } catch (error: any) {
        console.error('Firestore connection validation failed:', error)
    } finally {
        process.exit()
    }
}

debugEnv()
