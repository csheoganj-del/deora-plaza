import { adminDb } from './src/lib/firebase/admin'
import bcrypt from 'bcryptjs'

async function createAdminUser() {
    console.log('Creating admin user...')

    try {
        const hashedPassword = await bcrypt.hash('Kalpesh!1006', 10)

        await adminDb.collection('users').doc('kalpeshdeora').set({
            username: 'kalpeshdeora',
            password: hashedPassword,
            authMethod: 'password',
            role: 'super_admin',
            businessUnit: 'all',
            name: 'Kalpesh Deora',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        console.log('✅ Admin user created successfully!')
        console.log('Username: kalpeshdeora')
        console.log('Password: Kalpesh!1006')

    } catch (error) {
        console.error('Error creating admin user:', error)
    } finally {
        process.exit()
    }
}

createAdminUser()
