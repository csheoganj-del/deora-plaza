"use client";

import { useState } from 'react';
import { X, Receipt, DollarSign } from 'lucide-react';
import { useMultiTableState } from '@/hooks/useMultiTableState';
import dynamic from 'next/dynamic';

const TakeawayOrderDialog = dynamic(
    () => import('@/components/orders/TakeawayOrderDialog').then((mod) => mod.TakeawayOrderDialog),
    { ssr: false }
)

interface MultiTableManagerProps {
    businessUnit: string;
    onTableSelect?: (tableId: string) => void;
}

export function MultiTableManager({ businessUnit, onTableSelect }: MultiTableManagerProps) {
    const {
        activeTables,
        currentTableId,
        currentTable,
        openTable,
        closeTable,
        switchToTable,
    } = useMultiTableState();

    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

    const handleTabClick = (tableId: string) => {
        switchToTable(tableId);
        onTableSelect?.(tableId);
    };

    const handleCloseTab = (tableId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Close table ${activeTables.find(t => t.tableId === tableId)?.tableNumber}?`)) {
            closeTable(tableId);
        }
    };

    const getTableTotal = (cart: any) => {
        return Object.values(cart || {}).reduce(
            (sum: number, item: any) => sum + (item.item.price * item.qty),
            0
        );
    };

    if (activeTables.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 bg-white/[0.02] rounded-xl border border-white/10">
                <div className="text-center">
                    <Receipt className="h-12 w-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No active tables</p>
                    <p className="text-white/20 text-xs mt-1">Click on a table to start</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                    {activeTables.map((table) => {
                        const total = getTableTotal(table.cart);
                        const itemCount = Object.values(table.cart).reduce(
                            (sum, item: any) => sum + item.qty,
                            0
                        );
                        const isActive = table.tableId === currentTableId;

                        return (
                            <button
                                key={table.tableId}
                                onClick={() => handleTabClick(table.tableId)}
                                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-[#2fd180] text-[#0a0a0a] shadow-[0_0_20px_rgba(47,209,128,0.3)]'
                                    : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] border border-white/10'
                                    }`}
                            >
                                <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black uppercase tracking-wider">
                                            Table {table.tableNumber}
                                        </span>
                                        {itemCount > 0 && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#0a0a0a]/20' : 'bg-white/10'
                                                }`}>
                                                {itemCount} items
                                            </span>
                                        )}
                                    </div>
                                    {total > 0 && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <DollarSign className="h-3 w-3" />
                                            <span className="text-[10px] font-bold">₹{total.toFixed(0)}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => handleCloseTab(table.tableId, e)}
                                    className={`p-1 rounded-full transition-all active:scale-90 ${isActive
                                        ? 'hover:bg-[#0a0a0a]/20 text-[#0a0a0a]'
                                        : 'hover:bg-white/10 text-white/40'
                                        }`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </button>
                        );
                    })}
                </div>

                {/* Current Table Content */}
                {currentTable && (
                    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    Table {currentTable.tableNumber}
                                </h3>
                                <p className="text-xs text-white/40 mt-1">
                                    {Object.keys(currentTable.cart).length === 0
                                        ? 'No items added yet'
                                        : `${Object.values(currentTable.cart).reduce((sum, item: any) => sum + item.qty, 0)} items in cart`}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOrderDialogOpen(true)}
                                className="px-4 py-2 bg-[#2fd180] text-[#0a0a0a] rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(47,209,128,0.4)] transition-all active:scale-95"
                            >
                                Add Items / Generate Bill
                            </button>
                        </div>

                        {/* Cart items preview */}
                        {Object.keys(currentTable.cart).length > 0 && (
                            <div className="space-y-2">
                                {Object.values(currentTable.cart).map((cartItem: any) => (
                                    <div
                                        key={cartItem.item.id}
                                        className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/5"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-white">{cartItem.item.name}</p>
                                            <p className="text-xs text-white/40 mt-0.5">₹{cartItem.item.price} × {cartItem.qty}</p>
                                        </div>
                                        <span className="text-sm font-bold text-[#2fd180]">
                                            ₹{(cartItem.item.price * cartItem.qty).toFixed(0)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Order Dialog */}
            {currentTable && (
                <TakeawayOrderDialog
                    isOpen={isOrderDialogOpen}
                    onClose={() => setIsOrderDialogOpen(false)}
                    businessUnit={businessUnit}
                />
            )}
        </>
    );
}
