import { getMenuItems } from "@/actions/menu"
import MenuManagement from "@/components/menu/MenuManagement"

export const dynamic = "force-dynamic"

export default async function MenuPage() {
    const items = await getMenuItems()

    return (
        <div className="flex h-screen bg-white relative overflow-hidden">
            {/* Clean Admin Background */}
            <div className="absolute inset-0 bg-[#F8FAFC]/50 pointer-events-none" />

            <div className="flex-1 flex flex-col p-6 overflow-hidden relative z-10 w-full max-w-7xl mx-auto">
                <div className="flex-1 overflow-y-auto">
                    <MenuManagement initialItems={items} />
                </div>
            </div>
        </div>
    )
}

