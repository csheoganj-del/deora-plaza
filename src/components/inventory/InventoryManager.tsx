"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Bell,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitCost: number;
  lastRestocked: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  businessUnit: string;
}

export function InventoryManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: '',
    unitCost: 0,
    businessUnit: '',
  });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        // Mock data - replace with actual API call
        const mockInventory: InventoryItem[] = [
          {
            id: '1',
            name: 'Coffee Beans',
            category: 'Beverages',
            currentStock: 45,
            minStock: 20,
            maxStock: 100,
            unit: 'kg',
            unitCost: 250,
            lastRestocked: '2024-01-10',
            status: 'in-stock',
            businessUnit: 'cafe',
          },
          {
            id: '2',
            name: 'Milk',
            category: 'Dairy',
            currentStock: 8,
            minStock: 15,
            maxStock: 50,
            unit: 'liters',
            unitCost: 45,
            lastRestocked: '2024-01-09',
            status: 'low-stock',
            businessUnit: 'cafe',
          },
          {
            id: '3',
            name: 'Bread',
            category: 'Bakery',
            currentStock: 0,
            minStock: 10,
            maxStock: 30,
            unit: 'pieces',
            unitCost: 25,
            lastRestocked: '2024-01-08',
            status: 'out-of-stock',
            businessUnit: 'restaurant',
          },
          {
            id: '4',
            name: 'Wine',
            category: 'Beverages',
            currentStock: 120,
            minStock: 30,
            maxStock: 200,
            unit: 'bottles',
            unitCost: 850,
            lastRestocked: '2024-01-11',
            status: 'in-stock',
            businessUnit: 'bar',
          },
          {
            id: '5',
            name: 'Chicken',
            category: 'Meat',
            currentStock: 12,
            minStock: 10,
            maxStock: 40,
            unit: 'kg',
            unitCost: 180,
            lastRestocked: '2024-01-10',
            status: 'in-stock',
            businessUnit: 'restaurant',
          },
        ];
        setInventory(mockInventory);
        
        // Check for low stock alerts
        const alerts = mockInventory
          .filter(item => item.status === 'low-stock' || item.status === 'out-of-stock')
          .map(item => `${item.name} is ${item.status.replace('-', ' ')} in ${item.businessUnit}`);
        setNotifications(alerts);
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock':
        return 'bg-[#DCFCE7]0';
      case 'low-stock':
        return 'bg-[#F59E0B]/100';
      case 'out-of-stock':
        return 'bg-[#FEE2E2]0';
      default:
        return 'bg-[#F8FAFC]';
    }
  };

  const getStatusBadge = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock':
        return <Badge variant="default" className="bg-[#BBF7D0] text-green-800">In Stock</Badge>;
      case 'low-stock':
        return <Badge variant="default" className="bg-[#F59E0B]/10 text-[#F59E0B]800">Low Stock</Badge>;
      case 'out-of-stock':
        return <Badge variant="default" className="bg-[#FEE2E2] text-red-800">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(inventory.map(item => item.category))];

  const handleAddItem = () => {
    const item: InventoryItem = {
      id: Date.now().toString(),
      ...newItem,
      lastRestocked: new Date().toISOString().split('T')[0],
      status: newItem.currentStock === 0 ? 'out-of-stock' : 
              newItem.currentStock <= newItem.minStock ? 'low-stock' : 'in-stock',
    };
    setInventory([...inventory, item]);
    setNewItem({
      name: '',
      category: '',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unit: '',
      unitCost: 0,
      businessUnit: '',
    });
    setShowAddItem(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    
    const updatedItem: InventoryItem = {
      ...(editingItem as InventoryItem),
      status: editingItem.currentStock === 0 ? 'out-of-stock' : 
              editingItem.currentStock <= editingItem.minStock ? 'low-stock' : 'in-stock',
    };
    
    setInventory(inventory.map(item => item.id === editingItem.id ? updatedItem : item));
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <Button onClick={() => setShowAddItem(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="premium-card border-[#F59E0B]/20/20200 bg-[#F59E0B]/10">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2 text-[#F59E0B]800">
              <AlertTriangle className="h-5 w-5" />
              Stock Alerts
            </h2>
          </div>
          <div className="p-8">
            <ul className="space-y-1">
              {notifications.map((notification, index) => (
                <li key={index} className="text-sm text-[#F59E0B]">
                  {notification}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Total Items</h2>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">{inventory.length}</div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">In Stock</h2>
            <TrendingUp className="h-4 w-4 text-[#DCFCE7]0" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#22C55E]">
              {inventory.filter(item => item.status === 'in-stock').length}
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Low Stock</h2>
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#F59E0B]">
              {inventory.filter(item => item.status === 'low-stock').length}
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Out of Stock</h2>
            <TrendingDown className="h-4 w-4 text-[#FEE2E2]0" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#EF4444]">
              {inventory.filter(item => item.status === 'out-of-stock').length}
            </div>
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
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Inventory Items</h2>
        </div>
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Stock</th>
                  <th className="text-left p-2">Min/Max</th>
                  <th className="text-left p-2">Unit Cost</th>
                  <th className="text-left p-2">Business Unit</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2 font-medium">{item.name}</td>
                    <td className="p-2">{item.category}</td>
                    <td className="p-2">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {item.minStock}/{item.maxStock}
                    </td>
                    <td className="p-2">{formatCurrency(item.unitCost)}</td>
                    <td className="p-2">{item.businessUnit}</td>
                    <td className="p-2">{getStatusBadge(item.status)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteItem(item.id)}
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

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="premium-card w-full max-w-md">
            <div className="p-8 border-b border-[#E5E7EB]">
              <h2 className="text-3xl font-bold text-[#111827]">Add New Item</h2>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentStock">Current Stock</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({...newItem, currentStock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem({...newItem, minStock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="maxStock">Max Stock</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={newItem.maxStock}
                    onChange={(e) => setNewItem({...newItem, maxStock: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unitCost">Unit Cost</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({...newItem, unitCost: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="businessUnit">Business Unit</Label>
                  <Input
                    id="businessUnit"
                    value={newItem.businessUnit}
                    onChange={(e) => setNewItem({...newItem, businessUnit: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddItem(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>
                  <Save className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="premium-card w-full max-w-md">
            <div className="p-8 border-b border-[#E5E7EB]">
              <h2 className="text-3xl font-bold text-[#111827]">Edit Item</h2>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-currentStock">Current Stock</Label>
                <Input
                  id="edit-currentStock"
                  type="number"
                  value={editingItem.currentStock}
                  onChange={(e) => setEditingItem({...editingItem, currentStock: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-minStock">Min Stock</Label>
                  <Input
                    id="edit-minStock"
                    type="number"
                    value={editingItem.minStock}
                    onChange={(e) => setEditingItem({...editingItem, minStock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-maxStock">Max Stock</Label>
                  <Input
                    id="edit-maxStock"
                    type="number"
                    value={editingItem.maxStock}
                    onChange={(e) => setEditingItem({...editingItem, maxStock: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-unitCost">Unit Cost</Label>
                <Input
                  id="edit-unitCost"
                  type="number"
                  value={editingItem.unitCost}
                  onChange={(e) => setEditingItem({...editingItem, unitCost: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleUpdateItem}>
                  <Save className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

