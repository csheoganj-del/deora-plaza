"use client";

import { useState, useEffect } from "react";
import { unifiedInventoryManager, InventoryItem, Supplier, InventoryCategory } from "@/lib/unified-inventory";
import { BusinessUnitType } from "@/lib/business-units";

interface InventoryFormProps {
  item?: InventoryItem;
  onSuccess?: (item: InventoryItem) => void;
  onCancel?: () => void;
}

export function InventoryForm({ item, onSuccess, onCancel }: InventoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'FOOD' as keyof InventoryCategory,
    sku: '',
    barcode: '',
    unit: 'piece',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    unitCost: 0,
    sellingPrice: 0,
    supplier: '',
    location: '',
    expiryDate: '',
    batchNumber: '',
    isActive: true,
    businessUnits: [] as BusinessUnitType[],
    tags: ''
  });

  const categories = [
    { value: 'FOOD', label: 'Food' },
    { value: 'BEVERAGE', label: 'Beverage' },
    { value: 'CLEANING', label: 'Cleaning' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'FURNITURE', label: 'Furniture' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'SUPPLIES', label: 'Supplies' },
    { value: 'LINEN', label: 'Linen' },
    { value: 'DECORATION', label: 'Decoration' },
    { value: 'UTILITY', label: 'Utility' }
  ];

  const units = [
    'piece', 'kg', 'liter', 'ml', 'g', 'box', 'bottle', 'pack', 'set', 'meter', 'roll'
  ];

  const businessUnits = [
    { value: BusinessUnitType.CAFE, label: 'Cafe' },
    { value: BusinessUnitType.RESTAURANT, label: 'Restaurant' },
    { value: BusinessUnitType.BAR, label: 'Bar' },
    { value: BusinessUnitType.HOTEL, label: 'Hotel' },
    { value: BusinessUnitType.MARRIAGE_GARDEN, label: 'Marriage Garden' }
  ];

  useEffect(() => {
    loadSuppliers();
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        category: item.category as keyof InventoryCategory,
        sku: item.sku,
        barcode: item.barcode || '',
        unit: item.unit,
        currentStock: item.currentStock,
        minStock: item.minStock,
        maxStock: item.maxStock,
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        unitCost: item.unitCost,
        sellingPrice: item.sellingPrice || 0,
        supplier: item.supplier || '',
        location: item.location || '',
        expiryDate: item.expiryDate || '',
        batchNumber: item.batchNumber || '',
        isActive: item.isActive,
        businessUnits: item.businessUnits.map((bu) => (BusinessUnitType as any)[bu]),
        tags: item.tags.join(', ')
      });
    }
  }, [item]);

  const loadSuppliers = () => {
    const supplierList = unifiedInventoryManager.getSuppliers({ activeOnly: true });
    setSuppliers(supplierList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        category: formData.category as keyof InventoryCategory,
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        unit: formData.unit,
        currentStock: formData.currentStock,
        minStock: formData.minStock,
        maxStock: formData.maxStock,
        reorderPoint: formData.reorderPoint,
        reorderQuantity: formData.reorderQuantity,
        unitCost: formData.unitCost,
        sellingPrice: formData.sellingPrice || undefined,
        supplier: formData.supplier || undefined,
        location: formData.location || undefined,
        expiryDate: formData.expiryDate || undefined,
        batchNumber: formData.batchNumber || undefined,
        isActive: formData.isActive,
        businessUnits: formData.businessUnits.map((bu) => (bu as string).toUpperCase()) as any[],
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      let result: InventoryItem;
      if (item) {
        // Update existing item
        const success = unifiedInventoryManager.updateItem(item.id, itemData);
        if (!success) {
          throw new Error('Failed to update item');
        }
        result = unifiedInventoryManager.getItemById(item.id)!;
      } else {
        // Create new item
        result = unifiedInventoryManager.createItem(itemData);
      }

      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessUnitToggle = (businessUnit: BusinessUnitType) => {
    setFormData(prev => ({
      ...prev,
      businessUnits: prev.businessUnits.includes(businessUnit)
        ? prev.businessUnits.filter(bu => bu !== businessUnit)
        : [...prev.businessUnits, businessUnit]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-[#111827] mb-6">
        {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-[#FEE2E2] border border-red-200 rounded-md">
          <p className="text-[#DC2626] text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value as keyof InventoryCategory})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Unit *
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            >
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">Stock Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Current Stock *
              </label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({...formData, currentStock: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Minimum Stock *
              </label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({...formData, minStock: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Maximum Stock *
              </label>
              <input
                type="number"
                value={formData.maxStock}
                onChange={(e) => setFormData({...formData, maxStock: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Reorder Point *
              </label>
              <input
                type="number"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Reorder Quantity *
              </label>
              <input
                type="number"
                value={formData.reorderQuantity}
                onChange={(e) => setFormData({...formData, reorderQuantity: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                placeholder="Storage location"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Unit Cost *
              </label>
              <input
                type="number"
                value={formData.unitCost}
                onChange={(e) => setFormData({...formData, unitCost: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Selling Price
              </label>
              <input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({...formData, sellingPrice: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Supplier
              </label>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Batch Number
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                placeholder="Comma-separated tags"
              />
            </div>
          </div>
        </div>

        {/* Business Units */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">Business Units</h3>
          <div className="space-y-2">
            {businessUnits.map(bu => (
              <label key={bu.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.businessUnits.includes(bu.value)}
                  onChange={() => handleBusinessUnitToggle(bu.value)}
                  className="mr-2"
                />
                <span className="text-sm text-[#111827]">{bu.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="border-t pt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm text-[#111827]">Item is active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-[#111827] bg-[#E5E7EB] rounded-md hover:bg-[#9CA3AF] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#6D5DFB] text-white rounded-md hover:bg-[#6D5DFB]/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
          </button>
        </div>
      </form>
    </div>
  );
}

