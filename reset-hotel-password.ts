
import { adminDb } from './src/lib/firebase/admin'
import bcrypt from 'bcryptjs'

async function resetPassword() {
    console.log('--- STARTING PASSWORD RESET ---')

    try {
        const username = 'hotelmanager'
        const password = 'Hotel123!'

        console.log(`Hashing password: ${password}`)
        const hashedPassword = await bcrypt.hash(password, 10)
        console.log(`Generated Hash: ${hashedPassword}`)

        console.log(`Updating user: ${username}`)
        await adminDb.collection('users').doc(username).set({
            username: 'hotelmanager',
            password: hashedPassword,
            role: 'manager',
            businessUnit: 'hotel',
            name: 'Hotel Manager',
            updatedAt: new Date()
        }, { merge: true })

        console.log('✅ Password updated successfully in Firestore.')

        // Verify immediately
        const doc = await adminDb.collection('users').doc(username).get()
        const data = doc.data()
        const isMatch = await bcrypt.compare(password, data?.password)
        console.log(`Immediate verification match: ${isMatch ? 'YES' : 'NO'}`)

    } catch (error) {
        console.error('Reset failed:', error)
    } finally {
        console.log('--- FINISHED ---')
        process.exit()
    }
}

resetPassword()
