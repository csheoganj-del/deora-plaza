import { adminDb } from './src/lib/firebase/admin'
import bcrypt from 'bcryptjs'

async function checkUser() {
    console.log('=== CHECKING USER ===')

    try {
        // Check hotelmanager
        const hotelDoc = await adminDb.collection('users').doc('hotelmanager').get()
        console.log('\n--- hotelmanager ---')
        console.log('Exists:', hotelDoc.exists)
        if (hotelDoc.exists) {
            const data = hotelDoc.data()
            console.log('Data:', JSON.stringify(data, null, 2))

            const testPassword = 'Hotel123!'
            const match = await bcrypt.compare(testPassword, data?.password || '')
            console.log(`Password '${testPassword}' matches:`, match)
        }

        // Check kalpeshdeora
        const adminDoc = await adminDb.collection('users').doc('kalpeshdeora').get()
        console.log('\n--- kalpeshdeora ---')
        console.log('Exists:', adminDoc.exists)
        if (adminDoc.exists) {
            const data = adminDoc.data()
            console.log('Data:', JSON.stringify(data, null, 2))

            const testPassword = 'Kalpesh!1006'
            const match = await bcrypt.compare(testPassword, data?.password || '')
            console.log(`Password '${testPassword}' matches:`, match)
        }

        // List all users
        console.log('\n--- ALL USERS ---')
        const snapshot = await adminDb.collection('users').get()
        console.log('Total users:', snapshot.size)
        snapshot.forEach(doc => {
            console.log(`- ${doc.id}: role=${doc.data().role}, businessUnit=${doc.data().businessUnit}`)
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        process.exit()
    }
}

checkUser()
