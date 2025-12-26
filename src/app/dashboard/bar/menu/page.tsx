import { requireAuth, requireRole } from "@/lib/auth-helpers"
import { getBarMenu } from "@/actions/bar"
import BarMenuManagement from "@/components/bar/BarMenuManagement"

export const dynamic = "force-dynamic"

export default async function BarMenuPage() {
  const session = await requireRole(["bar_manager", "super_admin", "owner"])
  
  // Get bar menu items
  const { drinks, food } = await getBarMenu()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Bar Menu Management</h2>
      </div>
      <BarMenuManagement initialDrinks={drinks} initialFood={food} />
    </div>
  )
}

