
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const cafeItems = await prisma.menuItem.findMany({
        where: { businessUnit: 'cafe' },
    })
    console.log('--- CAFE ITEMS ---')
    cafeItems.forEach(item => console.log(`${item.name} (${item.businessUnit})`))

    const barItems = await prisma.menuItem.findMany({
        where: { businessUnit: 'bar' },
    })
    console.log('\n--- BAR ITEMS ---')
    barItems.forEach(item => console.log(`${item.name} (${item.businessUnit})`))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
