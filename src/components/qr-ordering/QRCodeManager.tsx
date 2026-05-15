"use client";

import { useState, useEffect } from "react";
import { TableQRCode, generateTableQRCode } from "@/lib/qr-code";
import { BusinessUnitType } from "@/lib/business-units";
import { QRCodeDisplay, QRCodeGrid } from "./QRCodeDisplay";

interface Table {
  id: string;
  number: string;
  businessUnit: BusinessUnitType;
  capacity: number;
  isActive: boolean;
}

export function QRCodeManager() {
  const [tables, setTables] = useState<Table[]>([]);
  const [qrCodes, setQrCodes] = useState<TableQRCode[]>([]);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<BusinessUnitType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [newTable, setNewTable] = useState({
    number: '',
    businessUnit: BusinessUnitType.RESTAURANT,
    capacity: 4
  });

  useEffect(() => {
    loadTables();
    loadQRCodes();
  }, []);

  const loadTables = async () => {
    // Mock data - in real app, this would fetch from API
    const mockTables: Table[] = [
      { id: 'table_1', number: '1', businessUnit: BusinessUnitType.RESTAURANT, capacity: 4, isActive: true },
      { id: 'table_2', number: '2', businessUnit: BusinessUnitType.RESTAURANT, capacity: 4, isActive: true },
      { id: 'table_3', number: '3', businessUnit: BusinessUnitType.RESTAURANT, capacity: 6, isActive: true },
      { id: 'table_4', number: '4', businessUnit: BusinessUnitType.CAFE, capacity: 2, isActive: true },
      { id: 'table_5', number: '5', businessUnit: BusinessUnitType.CAFE, capacity: 2, isActive: true },
      { id: 'table_6', number: '6', businessUnit: BusinessUnitType.BAR, capacity: 4, isActive: true },
    ];
    setTables(mockTables);
    setLoading(false);
  };

  const loadQRCodes = async () => {
    // Mock data - in real app, this would fetch from API
    const mockQRCodes: TableQRCode[] = [];
    setQrCodes(mockQRCodes);
  };

  const handleGenerateQRCode = async (table: Table) => {
    try {
      const restaurantId = 'main_restaurant'; // This would come from config
      const qrCode = await generateTableQRCode(table.id, table.businessUnit, restaurantId);
      setQrCodes([...qrCodes, qrCode]);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleGenerateAllForBusinessUnit = async (businessUnit: BusinessUnitType) => {
    const businessUnitTables = tables.filter(table => table.businessUnit === businessUnit);
    for (const table of businessUnitTables) {
      await handleGenerateQRCode(table);
    }
  };

  const handleAddTable = () => {
    const newTableData: Table = {
      id: `table_${Date.now()}`,
      number: newTable.number,
      businessUnit: newTable.businessUnit,
      capacity: newTable.capacity,
      isActive: true
    };
    setTables([...tables, newTableData]);
    setNewTable({ number: '', businessUnit: BusinessUnitType.RESTAURANT, capacity: 4 });
    setShowGenerateForm(false);
  };

  const filteredTables = tables.filter(table => 
    selectedBusinessUnit === 'all' || table.businessUnit === selectedBusinessUnit
  );

  const businessUnits = ['all', BusinessUnitType.RESTAURANT, BusinessUnitType.CAFE, BusinessUnitType.BAR, BusinessUnitType.HOTEL, BusinessUnitType.MARRIAGE_GARDEN] as const;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827] mb-2">QR Code Management</h1>
        <p className="text-[#6B7280]">Generate and manage QR codes for table-side ordering</p>
      </div>

      {/* Business Unit Filter */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {businessUnits.map(unit => (
            <button
              key={unit}
              onClick={() => setSelectedBusinessUnit(unit)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedBusinessUnit === unit
                  ? 'bg-[#6D5DFB] text-white'
                  : 'bg-white text-[#111827] hover:bg-[#F1F5F9] border'
              }`}
            >
              {unit === 'all' ? 'All Units' : unit.charAt(0).toUpperCase() + unit.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setShowGenerateForm(true)}
          className="px-4 py-2 bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90 transition-colors"
        >
          Add Table
        </button>
        {selectedBusinessUnit !== 'all' && (
          <button
            onClick={() => handleGenerateAllForBusinessUnit(selectedBusinessUnit as BusinessUnitType)}
            className="px-4 py-2 bg-[#22C55E] text-white rounded hover:bg-[#16A34A] transition-colors"
          >
            Generate QR Codes for All {selectedBusinessUnit.charAt(0).toUpperCase() + selectedBusinessUnit.slice(1)} Tables
          </button>
        )}
      </div>

      {/* Add Table Form */}
      {showGenerateForm && (
        <div className="mb-6 p-4 bg-white border rounded-lg">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Add New Table</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Table Number"
              value={newTable.number}
              onChange={(e) => setNewTable({...newTable, number: e.target.value})}
              className="px-3 py-2 border rounded"
            />
            <select
              value={newTable.businessUnit}
              onChange={(e) => setNewTable({...newTable, businessUnit: e.target.value as BusinessUnitType})}
              className="px-3 py-2 border rounded"
            >
              <option value={BusinessUnitType.RESTAURANT}>Restaurant</option>
              <option value={BusinessUnitType.CAFE}>Cafe</option>
              <option value={BusinessUnitType.BAR}>Bar</option>
              <option value={BusinessUnitType.HOTEL}>Hotel</option>
              <option value={BusinessUnitType.MARRIAGE_GARDEN}>Garden</option>
            </select>
            <input
              type="number"
              placeholder="Capacity"
              value={newTable.capacity}
              onChange={(e) => setNewTable({...newTable, capacity: parseInt(e.target.value) || 4})}
              className="px-3 py-2 border rounded"
            />
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleAddTable}
              disabled={!newTable.number}
              className="px-4 py-2 bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90 disabled:bg-[#9CA3AF]"
            >
              Add Table
            </button>
            <button
              onClick={() => setShowGenerateForm(false)}
              className="px-4 py-2 bg-[#6B7280] text-white rounded hover:bg-[#111827]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tables List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-[#111827]">Tables</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading tables...</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#6B7280]">No tables found for this business unit</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTables.map(table => {
              const hasQRCode = qrCodes.some(qr => qr.tableNumber === table.number);
              return (
                <div key={table.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <h3 className="font-medium text-[#111827]">Table {table.number}</h3>
                      <span className="px-2 py-1 text-xs bg-[#F1F5F9] text-[#111827] rounded capitalize">
                        {table.businessUnit}
                      </span>
                      <span className="text-sm text-[#6B7280]">Capacity: {table.capacity}</span>
                      {table.isActive && (
                        <span className="px-2 py-1 text-xs bg-[#BBF7D0] text-[#16A34A] rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasQRCode ? (
                      <>
                        <span className="text-sm text-[#22C55E]">QR Code Generated</span>
                        <button
                          onClick={() => {
                            const qr = qrCodes.find(q => q.tableNumber === table.number);
                            if (qr) {
                              const link = document.createElement('a');
                              link.download = `qr-table-${table.number}.png`;
                              link.href = qr.qrCodeUrl;
                              link.click();
                            }
                          }}
                          className="px-3 py-1 text-sm bg-[#6B7280] text-white rounded hover:bg-[#111827]"
                        >
                          Download
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleGenerateQRCode(table)}
                        className="px-3 py-1 text-sm bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90"
                      >
                        Generate QR Code
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Codes Grid */}
      {qrCodes.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">Generated QR Codes</h2>
            <p className="text-[#6B7280]">Print these QR codes and place them on tables</p>
          </div>
          <QRCodeGrid 
            tables={qrCodes.map(qr => ({
              id: qr.id,
              number: qr.tableNumber,
              businessUnit: qr.businessUnit as BusinessUnitType
            }))}
            restaurantId="main_restaurant"
          />
        </div>
      )}
    </div>
  );
}

