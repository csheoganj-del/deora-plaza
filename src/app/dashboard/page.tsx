import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDashboardStats } from "@/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Users,
    ShoppingBag,
    IndianRupee,
    Activity,
    Coffee,
    Wine,
    Hotel,
    Flower2,
    ArrowRight,
    Clock
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    const stats = await getDashboardStats()

    const businessUnits = [
        { name: "Cafe", icon: Coffee, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", link: "/dashboard/tables" },
        { name: "Bar", icon: Wine, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", link: "/dashboard/bar" },
        { name: "Hotel", icon: Hotel, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", link: "/dashboard/hotel" },
        { name: "Garden", icon: Flower2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", link: "/dashboard/garden" },
    ]

    return (
        <div className="space-y-8 p-6 bg-black/95 min-h-screen text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Welcome back, {session?.user?.username}
                    </h1>
                    <p className="text-gray-400 mt-1">Here's what's happening at Deora Plaza today.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-400">System Operational</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-green-400 mt-1">+12% from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Active Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.activeOrders}</div>
                        <p className="text-xs text-blue-400 mt-1">Currently processing</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.totalCustomers}</div>
                        <p className="text-xs text-purple-400 mt-1">Registered members</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">System Status</CardTitle>
                        <Activity className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">98%</div>
                        <p className="text-xs text-orange-400 mt-1">Operational efficiency</p>
                    </CardContent>
                </Card>
            </div>

            {/* Business Units & Recent Activity */}
            <div className="grid gap-8 md:grid-cols-7">
                {/* Business Units */}
                <div className="md:col-span-4 space-y-6">
                    <h2 className="text-xl font-semibold text-white">Business Units</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {businessUnits.map((unit) => (
                            <Link key={unit.name} href={unit.link}>
                                <div className={`p-6 rounded-xl border ${unit.border} ${unit.bg} hover:opacity-80 transition-all cursor-pointer group`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <unit.icon className={`h-8 w-8 ${unit.color}`} />
                                        <ArrowRight className={`h-5 w-5 ${unit.color} opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1`} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{unit.name}</h3>
                                    <p className="text-sm text-gray-400 mt-1">Manage operations</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="md:col-span-3 space-y-6">
                    <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                        <CardContent className="p-0">
                            <div className="divide-y divide-white/10">
                                {stats.recentOrders.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">No recent activity</div>
                                ) : (
                                    stats.recentOrders.map((order) => (
                                        <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${order.businessUnit === 'bar' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'
                                                    }`}>
                                                    {order.businessUnit === 'bar' ? <Wine className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {order.type === 'dine-in' ? `Table ${order.table?.tableNumber || '?'}` : 'Takeaway'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">#{order.orderNumber}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-white">₹{order.totalAmount}</p>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
