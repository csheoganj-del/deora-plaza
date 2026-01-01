"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentCustomUser, logoutCustomUser } from "@/actions/custom-auth";
import { getDashboardStats } from "@/actions/dashboard";
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
  Plus,
  RefreshCw
} from "lucide-react";

export function UnifiedDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Add body class for CSS targeting
    document.body.classList.add('dashboard-page');

    return () => {
      document.body.classList.remove('dashboard-page');
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [currentUser, dashboardStats] = await Promise.all([
        getCurrentCustomUser(),
        getDashboardStats()
      ]);

      setUser(currentUser);
      setStats(dashboardStats);

      // Role-based persistent redirection for operational roles
      if (currentUser?.role === 'cafe_manager' || currentUser?.role === 'waiter') {
        router.push('/dashboard/tables');
        return;
      }

      if (currentUser?.role === 'bar_manager' || currentUser?.role === 'bartender') {
        router.push('/dashboard/bar/tables');
        return;
      }

      if (currentUser?.role === 'hotel_manager' || currentUser?.role === 'hotel_reception' || currentUser?.role === 'reception') {
        router.push('/dashboard/hotel');
        return;
      }

      if (currentUser?.role === 'garden_manager') {
        router.push('/dashboard/garden');
        return;
      }

      // Set clean dashboard background
      if (typeof document !== 'undefined') {
        document.body.classList.remove('lock-screen');
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      // Don't redirect on stats error, only on user error if critical
      // Removed user dependency to prevent infinite loops
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []); // Empty dependency array to run only once

  const handleNavigation = (path: string, label: string) => {
    if (!mounted) {
      return;
    }

    try {
      router.push(path);
    } catch (error) {
      console.error(`Navigation failed for ${path}:`, error);
      window.location.href = path;
    }
  };

  const handleRefresh = () => {
    if (!mounted) return;
    loadData();
  };

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
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <div className="h-8 w-8 border-2 border-transparent border-t-amber-500 rounded-full animate-spin" style={{ borderTopColor: 'var(--accent-amber)' }}></div>
        </div>
      </div>
    );
  }

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="dashboard-content-wrapper">
      {/* Header */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="apple-text-display dashboard-page-title">Dashboard Overview</h1>
          <p className="apple-text-body dashboard-page-subtitle">Welcome back, {user?.name || 'User'}</p>
        </div>
        <button
          onClick={handleRefresh}
          className={`apple-interactive dashboard-refresh-button ${refreshing ? 'dashboard-refresh-loading' : ''}`}
          title="Refresh Data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        {/* Total Revenue */}
        <button
          className="apple-glass-card dashboard-stat-card apple-interactive dashboard-stat-clickable"
          onClick={() => handleNavigation('/dashboard/billing?filter=paid', 'Paid Bills')}
          style={{ cursor: 'pointer' }}
        >
          <div className="dashboard-stat-content">
            <div>
              <p className="apple-text-caption dashboard-stat-label">Total Revenue</p>
              <p className="apple-text-heading dashboard-stat-value">
                ₹{stats?.totalRevenue?.toLocaleString() || '0'}
              </p>
            </div>
            <IndianRupee className="dashboard-stat-icon dashboard-stat-icon-green" />
          </div>
          <p className="apple-text-caption dashboard-stat-description">All paid bills</p>
        </button>

        {/* Pending Revenue */}
        <button
          className="apple-glass-card dashboard-stat-card apple-interactive dashboard-stat-clickable"
          onClick={() => handleNavigation('/dashboard/billing?filter=pending', 'Pending Bills')}
          style={{ cursor: 'pointer' }}
        >
          <div className="dashboard-stat-content">
            <div>
              <p className="apple-text-caption dashboard-stat-label">Pending Revenue</p>
              <p className="apple-text-heading dashboard-stat-value">
                ₹{stats?.pendingRevenue?.toLocaleString() || '0'}
              </p>
            </div>
            <Clock className="dashboard-stat-icon dashboard-stat-icon-orange" />
          </div>
          <p className="apple-text-caption dashboard-stat-description">Unpaid bills & dues</p>
        </button>

        {/* Active Bookings */}
        <button
          className="apple-glass-card dashboard-stat-card apple-interactive dashboard-stat-clickable"
          onClick={() => handleNavigation('/dashboard/bookings?filter=active', 'Active Bookings')}
          style={{ cursor: 'pointer' }}
        >
          <div className="dashboard-stat-content">
            <div>
              <p className="apple-text-caption dashboard-stat-label">Active Bookings</p>
              <p className="apple-text-heading dashboard-stat-value">
                {stats?.activeBookings || '0'}
              </p>
            </div>
            <Calendar className="dashboard-stat-icon dashboard-stat-icon-blue" />
          </div>
          <p className="apple-text-caption dashboard-stat-description">Hotel & Garden bookings</p>
        </button>

        {/* Active Orders */}
        <button
          className="apple-glass-card dashboard-stat-card apple-interactive dashboard-stat-clickable"
          onClick={() => handleNavigation('/dashboard/orders?filter=active', 'Active Orders')}
          style={{ cursor: 'pointer' }}
        >
          <div className="dashboard-stat-content">
            <div>
              <p className="apple-text-caption dashboard-stat-label">Active Orders</p>
              <p className="apple-text-heading dashboard-stat-value">
                {stats?.activeOrders || '0'}
              </p>
            </div>
            <LayoutDashboard className="dashboard-stat-icon dashboard-stat-icon-purple" />
          </div>
          <p className="apple-text-caption dashboard-stat-description">Orders in progress</p>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="apple-text-heading dashboard-section-title">Quick Actions</h2>
        <div className="dashboard-actions-grid">
          {/* Hotel Management */}
          <button
            className="apple-glass-card apple-interactive dashboard-action-card"
            onClick={() => handleNavigation('/dashboard/hotel', 'Hotel Management')}
          >
            <div className="dashboard-action-content">
              <Building2 className="dashboard-action-icon dashboard-action-icon-blue" />
              <div>
                <h3 className="apple-text-subheading dashboard-action-title">Hotel Management</h3>
                <p className="apple-text-caption dashboard-action-description">Manage rooms, bookings, and guest services</p>
              </div>
            </div>
          </button>

          {/* Bar & POS */}
          <button
            className="apple-glass-card apple-interactive dashboard-action-card"
            onClick={() => handleNavigation('/dashboard/bar', 'Bar & POS')}
          >
            <div className="dashboard-action-content">
              <Wine className="dashboard-action-icon dashboard-action-icon-purple" />
              <div>
                <h3 className="apple-text-subheading dashboard-action-title">Bar & POS</h3>
                <p className="apple-text-caption dashboard-action-description">Handle bar orders and point of sale</p>
              </div>
            </div>
          </button>

          {/* Garden Events */}
          <button
            className="apple-glass-card apple-interactive dashboard-action-card"
            onClick={() => handleNavigation('/dashboard/garden', 'Garden Events')}
          >
            <div className="dashboard-action-content">
              <Flower2 className="dashboard-action-icon dashboard-action-icon-green" />
              <div>
                <h3 className="apple-text-subheading dashboard-action-title">Garden Events</h3>
                <p className="apple-text-caption dashboard-action-description">Manage event bookings and catering</p>
              </div>
            </div>
          </button>

          {/* Cafe Operations */}
          <button
            className="apple-glass-card apple-interactive dashboard-action-card"
            onClick={() => handleNavigation('/dashboard/tables', 'Cafe Operations')}
          >
            <div className="dashboard-action-content">
              <UtensilsCrossed className="dashboard-action-icon dashboard-action-icon-orange" />
              <div>
                <h3 className="apple-text-subheading dashboard-action-title">Cafe Operations</h3>
                <p className="apple-text-caption dashboard-action-description">Handle table orders and quick service</p>
              </div>
            </div>
          </button>

          {/* Customer Management */}
          <button
            className="apple-glass-card apple-interactive dashboard-action-card"
            onClick={() => handleNavigation('/dashboard/customers', 'Customer Management')}
          >
            <div className="dashboard-action-content">
              <Users className="dashboard-action-icon dashboard-action-icon-blue" />
              <div>
                <h3 className="apple-text-subheading dashboard-action-title">Customer Management</h3>
                <p className="apple-text-caption dashboard-action-description">View and manage customer profiles</p>
              </div>
            </div>
          </button>

          {/* Financial Reports */}
          <button
            className="apple-glass-card apple-interactive dashboard-action-card"
            onClick={() => handleNavigation('/dashboard/statistics', 'Financial Reports')}
          >
            <div className="dashboard-action-content">
              <TrendingUp className="dashboard-action-icon dashboard-action-icon-green" />
              <div>
                <h3 className="apple-text-subheading dashboard-action-title">Financial Reports</h3>
                <p className="apple-text-caption dashboard-action-description">View revenue and performance analytics</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div className="dashboard-section">
          <h2 className="apple-text-heading dashboard-section-title">Recent Orders</h2>
          <div className="apple-glass-card dashboard-table-container">
            <div className="dashboard-table-scroll">
              <table className="dashboard-table">
                <thead className="dashboard-table-header">
                  <tr>
                    <th className="apple-text-caption dashboard-table-th">Order ID</th>
                    <th className="apple-text-caption dashboard-table-th">Type</th>
                    <th className="apple-text-caption dashboard-table-th">Status</th>
                    <th className="apple-text-caption dashboard-table-th">Amount</th>
                    <th className="apple-text-caption dashboard-table-th">Time</th>
                  </tr>
                </thead>
                <tbody className="dashboard-table-body">
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="dashboard-table-row">
                      <td className="apple-text-body dashboard-table-td dashboard-table-td-primary">#{order.id.toString().slice(-4)}</td>
                      <td className="apple-text-body dashboard-table-td dashboard-table-td-capitalize">{order.type || 'Dine-in'}</td>
                      <td className="dashboard-table-td">
                        <span className={`apple-text-caption dashboard-status-badge ${order.status === 'completed' ? 'dashboard-status-success' :
                            order.status === 'cancelled' ? 'dashboard-status-error' :
                              'dashboard-status-info'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="apple-text-body dashboard-table-td dashboard-table-td-amount">₹{order.totalAmount?.toLocaleString() || '0'}</td>
                      <td className="apple-text-caption dashboard-table-td dashboard-table-td-time">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}