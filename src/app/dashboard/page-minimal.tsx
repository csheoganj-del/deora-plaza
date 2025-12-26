export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DEORA Plaza Dashboard</h1>
          <p className="text-white/70">Restaurant Management System</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Today's Revenue</h3>
            <p className="text-2xl font-bold text-green-400">₹45,680</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Active Orders</h3>
            <p className="text-2xl font-bold text-blue-400">12</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Customers Today</h3>
            <p className="text-2xl font-bold text-purple-400">156</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Tables Occupied</h3>
            <p className="text-2xl font-bold text-orange-400">8/15</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a 
            href="/dashboard/orders" 
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-colors"
          >
            <h3 className="text-white text-lg font-semibold mb-2">📋 Orders</h3>
            <p className="text-white/70">Manage customer orders</p>
          </a>
          
          <a 
            href="/dashboard/menu" 
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-colors"
          >
            <h3 className="text-white text-lg font-semibold mb-2">🍽️ Menu</h3>
            <p className="text-white/70">Update menu items</p>
          </a>
          
          <a 
            href="/dashboard/tables" 
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-colors"
          >
            <h3 className="text-white text-lg font-semibold mb-2">🪑 Tables</h3>
            <p className="text-white/70">Manage table bookings</p>
          </a>
          
          <a 
            href="/dashboard/customers" 
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-colors"
          >
            <h3 className="text-white text-lg font-semibold mb-2">👥 Customers</h3>
            <p className="text-white/70">Customer management</p>
          </a>
          
          <a 
            href="/dashboard/billing" 
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-colors"
          >
            <h3 className="text-white text-lg font-semibold mb-2">💳 Billing</h3>
            <p className="text-white/70">Process payments</p>
          </a>
          
          <a 
            href="/dashboard/reports" 
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-colors"
          >
            <h3 className="text-white text-lg font-semibold mb-2">📊 Reports</h3>
            <p className="text-white/70">View analytics</p>
          </a>
        </div>

        {/* System Status */}
        <div className="mt-8">
          <div className="bg-green-500/20 border border-green-500/30 text-green-300 p-4 rounded-xl">
            <h3 className="font-semibold mb-2">✅ System Status: Operational</h3>
            <p className="text-sm">All systems are running normally. Database sync active.</p>
          </div>
        </div>
      </div>
    </div>
  );
}