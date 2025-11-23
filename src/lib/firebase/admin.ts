import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin (server-side)
const apps = getApps()

let adminApp
if (apps.length === 0) {
    // For development, you can use a service account key
    // For production, use environment variables or Google Cloud default credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            adminApp = initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
            })
        } catch (error) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error)
            // Fallback to default credentials if parsing fails
            adminApp = initializeApp()
        }
    } else {
        // Use default credentials (works in Google Cloud environment)
        adminApp = initializeApp()
    }
} else {
    adminApp = apps[0]
}

const adminAuth = getAuth(adminApp)
const adminDb = getFirestore(adminApp)

export { adminApp, adminAuth, adminDb }
