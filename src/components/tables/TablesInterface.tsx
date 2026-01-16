"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Users, Utensils, RotateCcw, Search, Filter, Trash2, Settings, Plus, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DineInOrderDialog } from "@/components/orders/DineInOrderDialog";
import { updateTableStatus, deleteTable } from "@/actions/tables";
import { PasswordDialog } from "@/components/ui/PasswordDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PremiumLiquidGlass, PremiumContainer, PremiumStatsCard } from "@/components/ui/glass/premium-liquid-glass";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableManager } from "./TableManager";
import { TakeawayOrderButton } from "@/components/orders/TakeawayOrderButton";

type Table = {
    id: string;
    tableNumber: string;
    capacity: number;
    status: string;
    customerCount: number;
    businessUnit: string;
    currentOrderId?: string;
};

interface TablesInterfaceProps {
    initialTables: Table[];
    userBusinessUnit: string;
    canSeeAllTables: boolean;
}

export default function TablesInterface({ initialTables, userBusinessUnit, canSeeAllTables }: TablesInterfaceProps) {
    const router = useRouter();
    const [tables, setTables] = useState<Table[]>(initialTables);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single');
    const [tableToDelete, setTableToDelete] = useState<{ id: string, tableNumber: string } | null>(null);
    const [activeTab, setActiveTab] = useState<string>(canSeeAllTables ? 'all' : userBusinessUnit);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setTables(initialTables);
    }, [initialTables]);

    // Realtime subscription for table updates
    useEffect(() => {
        // Initialize Supabase client
        const initSubscription = async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();

            const channel = supabase
                .channel('tables-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'tables',
                    },
                    (payload) => {
                        const updatedTable = payload.new as Table;
                        setTables(currentTables =>
                            currentTables.map(t =>
                                t.id === updatedTable.id ? { ...t, ...updatedTable } : t
                            )
                        );
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanupPromise = initSubscription();
        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, []);

    const filteredTables = useMemo(() => {
        let filtered = tables;

        // Tab filtering
        if (activeTab !== 'all') {
            filtered = filtered.filter(t => t.businessUnit === activeTab);
        }

        // Search filtering
        if (searchTerm) {
            filtered = filtered.filter(t => t.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return filtered.sort((a, b) => {
            // numeric sort if possible
            const numA = parseInt(a.tableNumber) || 0;
            const numB = parseInt(b.tableNumber) || 0;
            if (numA && numB) return numA - numB;
            return a.tableNumber.localeCompare(b.tableNumber);
        });
    }, [tables, activeTab, searchTerm]);

    // Stats
    const stats = useMemo(() => {
        const total = filteredTables.length;
        const occupied = filteredTables.filter(t => t.status === 'occupied').length;
        const available = filteredTables.filter(t => t.status === 'available').length;
        const reserved = filteredTables.filter(t => t.status === 'reserved').length;
        return { total, occupied, available, reserved };
    }, [filteredTables]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "available": return "text-[#22C55E] bg-[#22C55E]/10"; // Green
            case "occupied": return "text-[#EF4444] bg-[#EF4444]/10"; // Red
            case "reserved": return "text-[#F59E0B] bg-[#F59E0B]/10"; // Amber
            default: return "text-white/40 bg-white/5";
        }
    };

    const getCardBorderColor = (status: string, isSelected: boolean) => {
        if (isSelected) return "border-primary ring-1 ring-primary";
        switch (status) {
            case "available": return "border-[#22C55E]/30 hover:border-[#22C55E]/50";
            case "occupied": return "border-[#EF4444]/30 hover:border-[#EF4444]/50";
            case "reserved": return "border-[#F59E0B]/30 hover:border-[#F59E0B]/50";
            default: return "border-white/10 hover:border-white/30";
        }
    };

    const handleTableClick = (table: Table) => {
        setSelectedTable(table);
        setIsDialogOpen(true);
    };

    const handleSingleDelete = (tableId: string, tableNumber: string) => {
        setTableToDelete({ id: tableId, tableNumber });
        setPasswordAction('single');
        setIsPasswordDialogOpen(true);
    };

    const handleBulkDelete = () => {
        if (selectedTables.size === 0) return;
        setPasswordAction('bulk');
        setIsPasswordDialogOpen(true);
    };

    const handlePasswordSuccess = async (password: string) => {
        if (passwordAction === 'single' && tableToDelete) {
            const result = await deleteTable(tableToDelete.id);
            if (result.success) {
                setTables(prev => prev.filter(t => t.id !== tableToDelete.id));
                router.refresh();
            } else {
                alert(`Failed: ${result.error}`);
            }
        } else if (passwordAction === 'bulk') {
            const deletePromises = Array.from(selectedTables).map(id => deleteTable(id));
            const results = await Promise.all(deletePromises);
            const successCount = results.filter((r: any) => r.success).length;

            if (successCount > 0) {
                setTables(prev => prev.filter(t => !selectedTables.has(t.id)));
                setSelectedTables(new Set());
                router.refresh();
            }
        }
        setIsPasswordDialogOpen(false);
        setTableToDelete(null);
    };

    const toggleSelectTable = (tableId: string) => {
        const newSelected = new Set(selectedTables);
        if (newSelected.has(tableId)) {
            newSelected.delete(tableId);
        } else {
            newSelected.add(tableId);
        }
        setSelectedTables(newSelected);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
                            <Utensils className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
                            Tables
                        </h1>
                    </div>
                    <div className="text-white/50 mt-1 pl-[3.5rem] flex items-center gap-2">
                        <span>Manage tables and live orders</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <TakeawayOrderButton businessUnit={userBusinessUnit === 'bar' ? 'bar' : 'cafe'} />

                    <TableManager businessUnit={activeTab === 'all' ? 'cafe' : activeTab} initialTables={tables}>
                        <Button
                            variant="outline"
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                            <Settings className="mr-2 h-4 w-4" /> Manage
                        </Button>
                    </TableManager>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <PremiumStatsCard
                    title="Total Tables"
                    value={stats.total.toString()}
                    icon={<Utensils className="h-4 w-4 text-blue-400" />}
                />
                <PremiumStatsCard
                    title="Available"
                    value={stats.available.toString()}
                    icon={<CheckCircle className="h-4 w-4 text-green-400" />}
                    trend={{ value: 0, label: "Ready to seat", positive: true }}
                />
                <PremiumStatsCard
                    title="Occupied"
                    value={stats.occupied.toString()}
                    icon={<Users className="h-4 w-4 text-red-400" />}
                    trend={{ value: 0, label: "Active orders", positive: false }}
                />
                <PremiumStatsCard
                    title="Reserved"
                    value={stats.reserved.toString()}
                    icon={<RotateCcw className="h-4 w-4 text-amber-400" />}
                />
            </div>

            {/* Tabs / Filters + Grid */}
            <PremiumLiquidGlass className="flex flex-col min-h-[600px]">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    {/* Left: Tabs */}
                    <div className="flex bg-black/20 p-1 rounded-xl">
                        {canSeeAllTables && (
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                            >
                                All
                            </button>
                        )}
                        {(canSeeAllTables || userBusinessUnit === 'cafe') && (
                            <button
                                onClick={() => setActiveTab('cafe')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'cafe' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                            >
                                Cafe
                            </button>
                        )}
                        {(canSeeAllTables || userBusinessUnit === 'bar') && (
                            <button
                                onClick={() => setActiveTab('bar')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'bar' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                            >
                                Bar
                            </button>
                        )}
                    </div>

                    {/* Right: Search & Bulk Action */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                            <input
                                type="text"
                                name="table-search"
                                autoComplete="off"
                                placeholder="Search tables..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 w-full md:w-48"
                            />
                        </div>
                        {selectedTables.size > 0 && (
                            <Button
                                onClick={handleBulkDelete}
                                variant="destructive"
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete ({selectedTables.size})
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredTables.map(table => {
                        const isSelected = selectedTables.has(table.id);
                        return (
                            <div
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={`
                            group relative p-4 rounded-2xl cursor-pointer transition-all duration-300
                            bg-white/5 border
                            ${getCardBorderColor(table.status, isSelected)}
                            ${isSelected ? 'shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]' : 'hover:bg-white/10'}
                        `}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 rounded-lg bg-white/5">
                                        <span className="text-xl font-bold text-white">{table.tableNumber}</span>
                                    </div>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); toggleSelectTable(table.id); }}
                                        className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-white/20 hover:border-white/40'}`}
                                    >
                                        {isSelected && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-white/40 flex items-center gap-1"><Users className="h-3 w-3" /> Capacity</span>
                                        <span className="text-white font-medium">{table.capacity} P</span>
                                    </div>

                                    <div className={`px-2 py-1 rounded-md text-center text-xs font-bold uppercase tracking-wider ${getStatusColor(table.status)}`}>
                                        {table.status}
                                    </div>

                                    {table.status === 'occupied' && (
                                        <div className="text-xs text-white/50 text-center mt-2 flex items-center justify-center gap-1">
                                            <Utensils className="h-3 w-3" />
                                            <span>{table.customerCount || 2} Guests</span>
                                        </div>
                                    )}
                                </div>

                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                    {table.status === 'occupied' ? (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" className="bg-white text-black hover:bg-white/90" onClick={(e) => { e.stopPropagation(); handleTableClick(table); }}>
                                                Open Order
                                            </Button>
                                            <Button size="icon" variant="outline" className="h-9 w-9 bg-white/10 text-white border-white/20 hover:bg-red-500 hover:text-white" onClick={async (e) => { e.stopPropagation(); if (confirm(`Clear Table ${table.tableNumber}?`)) { await updateTableStatus(table.id, 'available'); router.refresh(); } }}>
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={(e) => { e.stopPropagation(); handleTableClick(table); }}>
                                                New Order
                                            </Button>
                                            <Button size="icon" variant="destructive" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); handleSingleDelete(table.id, table.tableNumber); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </PremiumLiquidGlass>

            {/* Dialogs */}
            {selectedTable && (
                <DineInOrderDialog
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setSelectedTable(null);
                    }}
                    businessUnit={selectedTable.businessUnit}
                    tableId={selectedTable.id}
                    tableNumber={selectedTable.tableNumber}
                    status={selectedTable.status}
                    orderId={selectedTable.currentOrderId}
                />
            )}

            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordSuccess}
                title={passwordAction === 'bulk' ? "Delete Selected Tables" : "Delete Table"}
                description={'Confirm deletion'}
            />
        </div>
    );
}
