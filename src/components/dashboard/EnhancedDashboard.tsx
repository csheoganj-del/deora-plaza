"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentCustomUser, logoutCustomUser } from "@/actions/custom-auth";
import { 
  LayoutDashboard, 
  Users, 
  IndianRupee, 
  Calendar,
  UtensilsCrossed,
  Wine,
  Building2,
  Flower2,
  TrendingUp,
  Settings,
  LogOut,
  Clock,
  Bell,
  Plus
} from "lucide-react";

// Clean Apple-Level Dashboard (NO BLUR CHAOS) - Updated Version
export function EnhancedDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get current user and set clean dashboard background
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentCustomUser();
        setUser(currentUser);
        
        // Set clean dashboard background
        if (typeof document !== 'undefined') {
          document.body.classList.remove('lock-screen');
          // No need to set background - CSS handles it now
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logoutCustomUser();
    } catch (error) {
      console.error("Logout error:", error);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 shadow-sm">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-slate-800">DEORA</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <div className="bg-blue-500/10 text-blue-700 px-4 py-3 rounded-lg font-medium border border-blue-200/50">
              All Dashboard
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Tables</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span>Orders</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <Building2 className="w-4 h-4" />
              <span>Hotel</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <Flower2 className="w-4 h-4" />
              <span>Garden</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <Wine className="w-4 h-4" />
              <span>Kitchen</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <IndianRupee className="w-4 h-4" />
              <span>Billing</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span>Statistics</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Locations</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <IndianRupee className="w-4 h-4" />
              <span>GST Reports</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Dept. Settlements</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Discounts</span>
            </div>
            <div className="text-slate-600 px-4 py-3 rounded-lg hover:bg-slate-100/70 cursor-pointer flex items-center space-x-3 transition-colors">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Menu</span>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Top Bar */}
        <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/60 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-slate-600">Dashboard</span>
              <span className="text-slate-400">&gt;</span>
              <span className="text-slate-800 font-medium">Overview</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">All Systems Operational</span>
              <span className="text-sm text-slate-800 font-medium">{timeString}</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm">
                <Plus className="w-4 h-4" />
                <span>New Booking</span>
              </button>
              <button className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100/50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100/50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-800 mb-2">Dashboard Overview</h1>
            <p className="text-slate-600">Welcome back, {user?.name || 'Kalpesh Deora'}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-semibold text-slate-800">₹0</p>
                </div>
                <IndianRupee className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-xs text-slate-500">Cash in hand</p>
            </div>

            {/* Pending Revenue */}
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Pending Revenue</p>
                  <p className="text-2xl font-semibold text-slate-800">₹0</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs text-slate-500">Unpaid bookings</p>
            </div>

            {/* Total Bookings */}
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Bookings</p>
                  <p className="text-2xl font-semibold text-slate-800">0</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-xs text-slate-500">Hotel & Garden</p>
            </div>

            {/* Active Orders */}
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Active Orders</p>
                  <p className="text-2xl font-semibold text-slate-800">0</p>
                </div>
                <LayoutDashboard className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-xs text-slate-500">In progress</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Hotel Management */}
              <div 
                className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => router.push('/dashboard/hotel')}
              >
                <div className="flex items-center space-x-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Hotel Management</h3>
                    <p className="text-sm text-slate-600">Manage rooms, bookings, and guest services</p>
                  </div>
                </div>
              </div>

              {/* Bar & POS */}
              <div 
                className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => router.push('/dashboard/bar')}
              >
                <div className="flex items-center space-x-4">
                  <Wine className="w-8 h-8 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Bar & POS</h3>
                    <p className="text-sm text-slate-600">Handle bar orders and point of sale</p>
                  </div>
                </div>
              </div>

              {/* Garden Events */}
              <div 
                className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => router.push('/dashboard/garden')}
              >
                <div className="flex items-center space-x-4">
                  <Flower2 className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Garden Events</h3>
                    <p className="text-sm text-slate-600">Manage event bookings and catering</p>
                  </div>
                </div>
              </div>

              {/* Cafe Operations */}
              <div 
                className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => router.push('/dashboard/tables')}
              >
                <div className="flex items-center space-x-4">
                  <UtensilsCrossed className="w-8 h-8 text-orange-500" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Cafe Operations</h3>
                    <p className="text-sm text-slate-600">Handle table orders and quick service</p>
                  </div>
                </div>
              </div>

              {/* Customer Management */}
              <div 
                className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => router.push('/dashboard/customers')}
              >
                <div className="flex items-center space-x-4">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Customer Management</h3>
                    <p className="text-sm text-slate-600">View and manage customer profiles</p>
                  </div>
                </div>
              </div>

              {/* Financial Reports */}
              <div 
                className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => router.push('/dashboard/analytics')}
              >
                <div className="flex items-center space-x-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Financial Reports</h3>
                    <p className="text-sm text-slate-600">View revenue and performance analytics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}