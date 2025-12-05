import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDashboardStats } from "@/actions/dashboard"
import { getAllBookings } from "@/actions/bookings"
import DashboardContent from "@/components/dashboard/DashboardContent"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    const stats = await getDashboardStats()
    const allBookings = await getAllBookings()

    return (
        <DashboardContent
            initialStats={stats}
            initialBookings={allBookings}
            userName={session?.user?.name || 'Admin'}
            firebaseToken={session?.firebaseToken}
        />
    )
}
