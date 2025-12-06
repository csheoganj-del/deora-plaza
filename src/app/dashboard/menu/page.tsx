import { getMenuItems } from "@/actions/menu"
import MenuManagement from "@/components/menu/MenuManagement"
export const dynamic = "force-dynamic"

export default async function MenuPage() {
    const items = await getMenuItems()

    return (
        <div className="flex-1 min-h-screen bg-gray-50 p-8">
            <MenuManagement initialItems={items} />
        </div>
    )
}
