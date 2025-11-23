import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Passwords
    const adminPassword = await bcrypt.hash('Kalpesh!1006', 10)
    const cafeManagerPassword = await bcrypt.hash('ManageCafe123', 10)
    const waiterPassword = await bcrypt.hash('ServeTables123', 10)
    const kitchenPassword = await bcrypt.hash('CookFood123', 10)
    const barManagerPassword = await bcrypt.hash('ManageBar123', 10)
    const barStaffPassword = await bcrypt.hash('ServeDrinks123', 10)
    const hotelManagerPassword = await bcrypt.hash('ManageHotel123', 10)
    const hotelReceptionPassword = await bcrypt.hash('CheckIn123', 10)
    const gardenManagerPassword = await bcrypt.hash('ManageGarden123', 10)
    const ownerPassword = await bcrypt.hash('Owner@2024', 10)

    // 1. Super Admin
    await prisma.user.upsert({
        where: { username: 'kalpeshdeora' },
        update: {},
        create: {
            username: 'kalpeshdeora',
            password: adminPassword,
            role: 'super_admin',
            businessUnit: 'all',
            profile: JSON.stringify({ name: 'Kalpesh Deora', mobile: '9001160228' }),
            permissions: JSON.stringify(['all']),
        },
    })

    // 2. Owner (Business Partner)
    await prisma.user.upsert({
        where: { username: 'owner_gupta' },
        update: {},
        create: {
            username: 'owner_gupta',
            password: ownerPassword,
            role: 'owner',
            businessUnit: 'all',
            profile: JSON.stringify({ name: 'Mr. Gupta', mobile: '9876543210' }),
            permissions: JSON.stringify(['view_financials', 'view_reports']),
        },
    })

    // 3. Cafe Manager
    await prisma.user.upsert({
        where: { username: 'cafe_manager' },
        update: {},
        create: {
            username: 'cafe_manager',
            password: cafeManagerPassword,
            role: 'cafe_manager',
            businessUnit: 'cafe',
            profile: JSON.stringify({ name: 'Cafe Manager' }),
            permissions: JSON.stringify(['manage_cafe']),
        },
    })

    // 3. Cafe Waiter
    await prisma.user.upsert({
        where: { username: 'waiter_rahul' },
        update: {},
        create: {
            username: 'waiter_rahul',
            password: waiterPassword,
            role: 'waiter',
            businessUnit: 'cafe',
            profile: JSON.stringify({ name: 'Rahul' }),
            permissions: JSON.stringify(['take_orders']),
        },
    })

    // 4. Kitchen Staff
    await prisma.user.upsert({
        where: { username: 'kitchen_chef' },
        update: {},
        create: {
            username: 'kitchen_chef',
            password: kitchenPassword,
            role: 'kitchen',
            businessUnit: 'cafe', // Handles cafe food primarily
            profile: JSON.stringify({ name: 'Head Chef' }),
            permissions: JSON.stringify(['view_kitchen']),
        },
    })

    // 5. Bar Manager
    await prisma.user.upsert({
        where: { username: 'bar_manager' },
        update: {},
        create: {
            username: 'bar_manager',
            password: barManagerPassword,
            role: 'bar_manager',
            businessUnit: 'bar',
            profile: JSON.stringify({ name: 'Bar Manager' }),
            permissions: JSON.stringify(['manage_bar']),
        },
    })

    // 6. Bar Staff
    await prisma.user.upsert({
        where: { username: 'bartender_sam' },
        update: {},
        create: {
            username: 'bartender_sam',
            password: barStaffPassword,
            role: 'bartender',
            businessUnit: 'bar',
            profile: JSON.stringify({ name: 'Sam' }),
            permissions: JSON.stringify(['serve_drinks']),
        },
    })

    // 7. Hotel Manager
    await prisma.user.upsert({
        where: { username: 'hotel_manager' },
        update: {},
        create: {
            username: 'hotel_manager',
            password: hotelManagerPassword,
            role: 'hotel_manager',
            businessUnit: 'hotel',
            profile: JSON.stringify({ name: 'Hotel Manager' }),
            permissions: JSON.stringify(['manage_hotel']),
        },
    })

    // 8. Hotel Reception
    await prisma.user.upsert({
        where: { username: 'hotel_reception' },
        update: {},
        create: {
            username: 'hotel_reception',
            password: hotelReceptionPassword,
            role: 'hotel_reception',
            businessUnit: 'hotel',
            profile: JSON.stringify({ name: 'Receptionist' }),
            permissions: JSON.stringify(['check_in']),
        },
    })

    // 9. Garden Manager
    await prisma.user.upsert({
        where: { username: 'garden_manager' },
        update: {},
        create: {
            username: 'garden_manager',
            password: gardenManagerPassword,
            role: 'garden_manager',
            businessUnit: 'garden',
            profile: JSON.stringify({ name: 'Garden Manager' }),
            permissions: JSON.stringify(['manage_garden']),
        },
    })

    // Create Tables for Cafe (6 tables)
    for (let i = 1; i <= 6; i++) {
        await prisma.table.upsert({
            where: { id: `cafe-table-${i}` }, // Using deterministic IDs for seeding
            update: {},
            create: {
                id: `cafe-table-${i}`,
                tableNumber: `${i}`,
                businessUnit: 'cafe',
                capacity: 4,
                status: 'available',
            },
        })
    }

    // Seed Menu Items
    const menuItems = [
        // Cafe Items
        { name: 'Cold Coffee', price: 149, category: 'Beverage', businessUnit: 'cafe', description: 'Chilled coffee with ice cream' },
        { name: 'Veg Burger', price: 159, category: 'Snack', businessUnit: 'cafe', description: 'Veggie patty with fresh veggies' },
        { name: 'French Fries', price: 99, category: 'Snack', businessUnit: 'cafe', description: 'Crispy golden fries' },
        { name: 'Pizza Margherita', price: 299, category: 'Main Course', businessUnit: 'cafe', description: 'Classic cheese pizza' },
        { name: 'Paneer Tikka', price: 249, category: 'Starter', businessUnit: 'cafe', description: 'Grilled cottage cheese' },
        { name: 'Garlic Naan', price: 49, category: 'Bread', businessUnit: 'cafe', description: 'Soft naan with garlic' },

        // Bar Items (Drinks)
        { name: 'Mojito', price: 199, category: 'Mocktail', businessUnit: 'bar', description: 'Fresh mint and lime' },
        { name: 'Beer (Pint)', price: 250, category: 'Beer', businessUnit: 'bar', description: 'Chilled draft beer' },
        { name: 'Whiskey (30ml)', price: 350, category: 'Spirits', businessUnit: 'bar', description: 'Premium whiskey' },
        { name: 'Vodka (30ml)', price: 300, category: 'Spirits', businessUnit: 'bar', description: 'Premium vodka' },
        { name: 'Rum (30ml)', price: 280, category: 'Spirits', businessUnit: 'bar', description: 'Dark rum' },
        { name: 'Long Island Iced Tea', price: 450, category: 'Cocktail', businessUnit: 'bar', description: 'Classic cocktail' },
        { name: 'Margarita', price: 400, category: 'Cocktail', businessUnit: 'bar', description: 'Tequila based cocktail' },
        { name: 'Blue Lagoon', price: 380, category: 'Cocktail', businessUnit: 'bar', description: 'Vodka and blue curacao' },
        { name: 'Virgin Pina Colada', price: 220, category: 'Mocktail', businessUnit: 'bar', description: 'Coconut and pineapple' },
        { name: 'Fresh Lime Soda', price: 120, category: 'Mocktail', businessUnit: 'bar', description: 'Sweet or salty' },
    ]

    for (const item of menuItems) {
        await prisma.menuItem.create({
            data: item,
        })
    }

    // Seed Hotel Rooms
    const rooms = [
        { roomNumber: "101", type: "Single", pricePerNight: 2000, status: "available" },
        { roomNumber: "102", type: "Single", pricePerNight: 2000, status: "available" },
        { roomNumber: "103", type: "Double", pricePerNight: 3500, status: "available" },
        { roomNumber: "104", type: "Double", pricePerNight: 3500, status: "available" },
        { roomNumber: "201", type: "Suite", pricePerNight: 5000, status: "available" },
        { roomNumber: "202", type: "Suite", pricePerNight: 5000, status: "available" },
    ]

    for (const room of rooms) {
        await prisma.room.upsert({
            where: { roomNumber: room.roomNumber },
            update: {},
            create: room,
        })
    }

    console.log('Seeding completed.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
