
import { adminDb } from './src/lib/firebase/admin'
import bcrypt from 'bcryptjs'

async function migrate() {
    console.log('Starting migration...')

    try {
        // Create Super Admin User
        const hashedPassword = await bcrypt.hash('Kalpesh!1006', 10)
        await adminDb.collection('users').doc('kalpeshdeora').set({
            username: 'kalpeshdeora',
            password: hashedPassword,
            role: 'super_admin',
            businessUnit: 'all',
            name: 'Kalpesh Deora',
            createdAt: new Date()
        })
        console.log('✅ Super Admin user created')

        // Create Hotel Manager User
        const hotelPassword = await bcrypt.hash('Hotel123!', 10)
        await adminDb.collection('users').doc('hotelmanager').set({
            username: 'hotelmanager',
            password: hotelPassword,
            role: 'manager',
            businessUnit: 'hotel',
            name: 'Hotel Manager',
            createdAt: new Date()
        })
        console.log('✅ Hotel Manager user created')

    } catch (error) {
        console.error('Migration failed:', error)
    } finally {
        process.exit()
    }
}

migrate()
