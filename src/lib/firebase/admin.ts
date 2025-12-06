import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

// Initialize Firebase Admin (server-side)
const apps = getApps()

let adminApp
if (apps.length === 0) {
    // 1) JSON service account in single env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            adminApp = initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
            })
        } catch (error: any) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error)
        }
    }

    // 2) Separate env vars (Vercel-style)
    if (!adminApp && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            const projectId = process.env.FIREBASE_PROJECT_ID
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
            const rawKey = process.env.FIREBASE_PRIVATE_KEY as string
            const privateKey = rawKey.replace(/\\n/g, '\n')

            adminApp = initializeApp({
                credential: cert({ projectId, clientEmail, privateKey }),
                projectId
            })
        } catch (error: any) {
            console.error('Error initializing Firebase Admin with separate env vars:', error)
        }
    }

    // 3) Fallback to default credentials (GCP)
    if (!adminApp) {
        adminApp = initializeApp()
    }
} else {
    adminApp = apps[0]
}

const adminAuth = getAuth(adminApp)
const adminDb = getFirestore(adminApp)
const adminMessaging = getMessaging(adminApp)

export { adminApp, adminAuth, adminDb, adminMessaging }
