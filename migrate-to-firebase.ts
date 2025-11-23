import { PrismaClient } from '@prisma/client'
import { adminDb } from './src/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

const prisma = new PrismaClient()

async function migrateData() {
    console.log('🔥 Starting data migration from SQLite to Firebase...\n')

    try {
        // Migrate Users
        console.log('👤 Migrating users...')
        const users = await prisma.user.findMany()
        for (const user of users) {
            await adminDb.collection('users').doc(user.username).set({
                id: user.id,
                username: user.username,
                password: user.password, // Hashed password
                role: user.role,
                businessUnit: user.businessUnit,
                profile: user.profile,
                permissions: user.permissions,
                isActive: user.isActive,
                createdAt: Timestamp.fromDate(user.createdAt),
                lastLogin: user.lastLogin ? Timestamp.fromDate(user.lastLogin) : null
            })
        }
        console.log(`✅ Migrated ${users.length} users\n`)

        // Migrate Menu Items
        console.log('📋 Migrating menu items...')
        const menuItems = await prisma.menuItem.findMany()
        for (const item of menuItems) {
            await adminDb.collection('menuItems').add({
                name: item.name,
                description: item.description,
                price: item.price,
                category: item.category,
                businessUnit: item.businessUnit,
                isAvailable: item.isAvailable,
                createdAt: Timestamp.fromDate(item.createdAt),
                updatedAt: Timestamp.fromDate(item.updatedAt)
            })
        }
        console.log(`✅ Migrated ${menuItems.length} menu items\n`)

        // Migrate Tables
        console.log('🪑 Migrating tables...')
        const tables = await prisma.table.findMany()
        for (const table of tables) {
            await adminDb.collection('tables').add({
                tableNumber: table.tableNumber,
                businessUnit: table.businessUnit,
                capacity: table.capacity,
                status: table.status,
                customerCount: table.customerCount,
                createdAt: Timestamp.fromDate(table.lastUpdated), // Fallback to lastUpdated
                updatedAt: Timestamp.fromDate(table.lastUpdated)
            })
        }
        console.log(`✅ Migrated ${tables.length} tables\n`)

        // Migrate Rooms
        console.log('🏨 Migrating rooms...')
        const rooms = await prisma.room.findMany()
        for (const room of rooms) {
            await adminDb.collection('rooms').add({
                roomNumber: room.roomNumber,
                type: room.type,
                pricePerNight: room.pricePerNight,
                status: room.status,
                createdAt: Timestamp.now(), // No date field in schema
                updatedAt: Timestamp.now()
            })
        }
        console.log(`✅ Migrated ${rooms.length} rooms\n`)

        // Migrate Customers
        console.log('👥 Migrating customers...')
        const customers = await prisma.customer.findMany()
        for (const customer of customers) {
            await adminDb.collection('customers').doc(customer.mobileNumber).set({
                mobileNumber: customer.mobileNumber,
                name: customer.name,
                email: customer.email,
                visitCount: customer.visitCount,
                totalSpent: customer.totalSpent,
                discountTier: customer.discountTier,
                notes: customer.notes,
                preferredBusiness: customer.preferredBusiness,
                createdAt: Timestamp.fromDate(customer.createdAt),
                updatedAt: Timestamp.fromDate(customer.updatedAt),
                lastVisit: customer.lastVisit ? Timestamp.fromDate(customer.lastVisit) : null
            })
        }
        console.log(`✅ Migrated ${customers.length} customers\n`)

        console.log('🎉 Migration completed successfully!')
        console.log('\n📝 Next steps:')
        console.log('1. Replace old action files with Firebase versions')
        console.log('2. Test each module')
        console.log('3. Deploy to Vercel')

    } catch (error) {
        console.error('❌ Migration failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

migrateData()
