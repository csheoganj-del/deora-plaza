"use client";

import { useState, useEffect } from "react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Star,
  ShoppingCart,
  MapPin,
  Clock,
  Eye,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  joinDate: string;
  lastVisit: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyPoints: number;
  preferredBusinessUnit: string;
  status: 'active' | 'inactive' | 'vip';
  notes?: string;
  tags: string[];
  orderHistory: {
    id: string;
    date: string;
    businessUnit: string;
    amount: number;
    items: number;
  }[];
}

export function CustomerDatabase() {
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState('all');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    preferredBusinessUnit: '',
    notes: '',
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        // Mock data - replace with actual API call
        const mockCustomers: Customer[] = [
          {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+91 9876543210',
            address: '123 Main St, Mumbai',
            joinDate: '2023-01-15',
            lastVisit: '2024-01-14',
            totalOrders: 45,
            totalSpent: 12500,
            averageOrderValue: 278,
            loyaltyPoints: 1250,
            preferredBusinessUnit: 'restaurant',
            status: 'vip',
            tags: ['regular', 'foodie'],
            orderHistory: [
              { id: '1', date: '2024-01-14', businessUnit: 'restaurant', amount: 450, items: 3 },
              { id: '2', date: '2024-01-10', businessUnit: 'cafe', amount: 180, items: 2 },
              { id: '3', date: '2024-01-05', businessUnit: 'bar', amount: 320, items: 4 },
            ],
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '+91 9876543211',
            joinDate: '2023-03-20',
            lastVisit: '2024-01-13',
            totalOrders: 28,
            totalSpent: 6800,
            averageOrderValue: 243,
            loyaltyPoints: 680,
            preferredBusinessUnit: 'cafe',
            status: 'active',
            tags: ['coffee-lover'],
            orderHistory: [
              { id: '4', date: '2024-01-13', businessUnit: 'cafe', amount: 120, items: 2 },
              { id: '5', date: '2024-01-08', businessUnit: 'cafe', amount: 85, items: 1 },
            ],
          },
          {
            id: '3',
            name: 'Mike Johnson',
            email: 'mike.johnson@example.com',
            phone: '+91 9876543212',
            joinDate: '2023-06-10',
            lastVisit: '2024-01-12',
            totalOrders: 15,
            totalSpent: 3200,
            averageOrderValue: 213,
            loyaltyPoints: 320,
            preferredBusinessUnit: 'bar',
            status: 'active',
            tags: ['night-owl'],
            orderHistory: [
              { id: '6', date: '2024-01-12', businessUnit: 'bar', amount: 280, items: 3 },
              { id: '7', date: '2024-01-06', businessUnit: 'bar', amount: 150, items: 2 },
            ],
          },
          {
            id: '4',
            name: 'Sarah Wilson',
            email: 'sarah.wilson@example.com',
            phone: '+91 9876543213',
            joinDate: '2023-02-28',
            lastVisit: '2023-12-20',
            totalOrders: 8,
            totalSpent: 4500,
            averageOrderValue: 563,
            loyaltyPoints: 450,
            preferredBusinessUnit: 'hotel',
            status: 'inactive',
            tags: ['business'],
            orderHistory: [
              { id: '8', date: '2023-12-20', businessUnit: 'hotel', amount: 1200, items: 1 },
              { id: '9', date: '2023-11-15', businessUnit: 'hotel', amount: 800, items: 1 },
            ],
          },
        ];
        setCustomers(mockCustomers);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'vip':
        return <Badge variant="default" className="bg-[#EDEBFF] text-purple-800">VIP</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-[#BBF7D0] text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="default" className="bg-[#F1F5F9] text-[#111827]">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysSinceLastVisit = (lastVisit: string) => {
    const last = new Date(lastVisit);
    const now = new Date();
    return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    const matchesBusinessUnit = selectedBusinessUnit === 'all' || 
                               customer.preferredBusinessUnit === selectedBusinessUnit;
    return matchesSearch && matchesStatus && matchesBusinessUnit;
  });

  const handleAddCustomer = () => {
    const customer: Customer = {
      id: Date.now().toString(),
      ...newCustomer,
      joinDate: new Date().toISOString().split('T')[0],
      lastVisit: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      loyaltyPoints: 0,
      status: 'active',
      tags: [],
      orderHistory: [],
    };
    setCustomers([...customers, customer]);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      preferredBusinessUnit: '',
      notes: '',
    });
    setShowAddCustomer(false);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter(customer => customer.id !== id));
  };

  const businessUnits = ['cafe', 'restaurant', 'bar', 'hotel', 'marriage_garden'];
  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
    vipCustomers: customers.filter(c => c.status === 'vip').length,
    averageSpent: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length 
      : 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Customer Database</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div className="premium-card" key={i}>
              <div className="p-8 border-b border-[#E5E7EB]">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="p-8">
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-8">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Customer Database</h2>
        <Button onClick={() => setShowAddCustomer(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Total Customers</h2>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Active Customers</h2>
            <TrendingUp className="h-4 w-4 text-[#DCFCE7]0" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#22C55E]">{stats.activeCustomers}</div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">VIP Customers</h2>
            <Star className="h-4 w-4 text-[#EDEBFF]0" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#C084FC]">{stats.vipCustomers}</div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Avg Order Value</h2>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">{formatCurrency(stats.averageSpent)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Filters</h2>
        </div>
        <div className="p-8">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="businessUnit">Preferred Unit</Label>
              <select
                id="businessUnit"
                value={selectedBusinessUnit}
                onChange={(e) => setSelectedBusinessUnit(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Units</option>
                {businessUnits.map(unit => (
                  <option key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Customers</h2>
        </div>
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Orders</th>
                  <th className="text-left p-2">Total Spent</th>
                  <th className="text-left p-2">Last Visit</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.preferredBusinessUnit.charAt(0).toUpperCase() + 
                           customer.preferredBusinessUnit.slice(1).replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-center">
                        <div className="font-medium">{customer.totalOrders}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.averageOrderValue > 0 && formatCurrency(customer.averageOrderValue)} avg
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.loyaltyPoints} points
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(customer.lastVisit)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getDaysSinceLastVisit(customer.lastVisit)} days ago
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{getStatusBadge(customer.status)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowOrderHistory(true)}
                        >
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="premium-card w-full max-w-md">
            <div className="p-8 border-b border-[#E5E7EB]">
              <h2 className="text-3xl font-bold text-[#111827]">Add New Customer</h2>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="preferredBusinessUnit">Preferred Business Unit</Label>
                <select
                  id="preferredBusinessUnit"
                  value={newCustomer.preferredBusinessUnit}
                  onChange={(e) => setNewCustomer({...newCustomer, preferredBusinessUnit: e.target.value})}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select Unit</option>
                  {businessUnits.map(unit => (
                    <option key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Optional notes..."
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCustomer}>
                  Add Customer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="premium-card w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-8 border-b border-[#E5E7EB]">
              <h2 className="text-3xl font-bold text-[#111827] flex items-center justify-between">
                Customer Details
                <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                  X
                </Button>
              </h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedCustomer.status)}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedCustomer.email}
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedCustomer.phone}
                  </div>
                </div>
                {selectedCustomer.address && (
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedCustomer.address}
                    </div>
                  </div>
                )}
                <div>
                  <Label>Join Date</Label>
                  <p>{formatDate(selectedCustomer.joinDate)}</p>
                </div>
                <div>
                  <Label>Last Visit</Label>
                  <p>{formatDate(selectedCustomer.lastVisit)}</p>
                </div>
                <div>
                  <Label>Total Orders</Label>
                  <p className="font-medium">{selectedCustomer.totalOrders}</p>
                </div>
                <div>
                  <Label>Total Spent</Label>
                  <p className="font-medium">{formatCurrency(selectedCustomer.totalSpent)}</p>
                </div>
                <div>
                  <Label>Loyalty Points</Label>
                  <p className="font-medium">{selectedCustomer.loyaltyPoints}</p>
                </div>
                <div>
                  <Label>Preferred Unit</Label>
                  <p>{selectedCustomer.preferredBusinessUnit.charAt(0).toUpperCase() + 
                      selectedCustomer.preferredBusinessUnit.slice(1).replace('_', ' ')}</p>
                </div>
              </div>
              
              {selectedCustomer.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {selectedCustomer.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedCustomer.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.notes}</p>
                </div>
              )}

              <div>
                <Label>Order History</Label>
                <div className="space-y-2 mt-2">
                  {selectedCustomer.orderHistory.map((order) => (
                    <div key={order.id} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{formatDate(order.date)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.businessUnit.charAt(0).toUpperCase() + 
                             order.businessUnit.slice(1).replace('_', ' ')} • {order.items} items
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(order.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

