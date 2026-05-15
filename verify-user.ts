
import { adminDb } from './src/lib/firebase/admin'
import bcrypt from 'bcryptjs'

async function verifyUser() {
    console.log('Verifying user...')

    try {
        const username = 'hotelmanager'
        const password = 'Hotel123!'

        const doc = await adminDb.collection('users').doc(username).get()

        if (!doc.exists) {
            console.log('❌ User document does not exist!')
        } else {
            console.log('✅ User document found.')
            const data = doc.data()
            console.log('User Data:', JSON.stringify(data, null, 2))

            if (data?.password) {
                const isMatch = await bcrypt.compare(password, data.password)
                console.log(`Password match for '${password}': ${isMatch ? '✅ YES' : '❌ NO'}`)
            } else {
                console.log('❌ No password field in document.')
            }
        }

    } catch (error) {
        console.error('Verification failed:', error)
    } finally {
        process.exit()
    }
}

verifyUser()
