
import { adminDb } from './src/lib/firebase/admin'
import bcrypt from 'bcryptjs'

async function forceResetAdmin() {
    console.log('--- Force Resetting Admin User ---')
    const username = 'admin'
    const password = 'admin123'

    try {
        console.log(`Hashing password for: ${username}`)
        const hashedPassword = await bcrypt.hash(password, 10)

        console.log('Updating Firestore...')
        await adminDb.collection('users').doc(username).set({
            username: username,
            password: hashedPassword,
            role: 'super_admin',
            businessUnit: 'all',
            name: 'Super Admin',
            isActive: true,
            authMethod: 'password',
            lockedUntil: null, // Clear any locks
            failedLoginCount: 0,
            updatedAt: new Date()
        }, { merge: true })

        console.log('✅ Admin user reset successfully!')
        console.log('Username: admin')
        console.log('Password: admin123')

    } catch (error) {
        console.error('❌ Error resetting admin:', error)
    }
    process.exit() // Ensure script terminates
}

forceResetAdmin()
