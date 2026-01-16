"use client";

import { useState, useEffect } from 'react';

interface TableCart {
    [itemId: string]: {
        item: any;
        qty: number;
    };
}

interface TableState {
    tableId: string;
    tableNumber: string;
    cart: TableCart;
    lastModified: number;
}

export function useMultiTableState() {
    const [activeTables, setActiveTables] = useState<Map<string, TableState>>(new Map());
    const [currentTableId, setCurrentTableId] = useState<string | null>(null);

    // Load state from sessionStorage on mount
    useEffect(() => {
        const savedState = sessionStorage.getItem('multi-table-state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                const tablesMap = new Map(Object.entries(parsed.tables || {}));
                setActiveTables(tablesMap);
                setCurrentTableId(parsed.currentTableId || null);
            } catch (error) {
                console.error('Failed to load multi-table state:', error);
            }
        }
    }, []);

    // Save state to sessionStorage whenever it changes
    useEffect(() => {
        const stateToSave = {
            tables: Object.fromEntries(activeTables),
            currentTableId,
        };
        sessionStorage.setItem('multi-table-state', JSON.stringify(stateToSave));
    }, [activeTables, currentTableId]);

    const openTable = (tableId: string, tableNumber: string) => {
        setActiveTables(prev => {
            const newMap = new Map(prev);
            if (!newMap.has(tableId)) {
                newMap.set(tableId, {
                    tableId,
                    tableNumber,
                    cart: {},
                    lastModified: Date.now(),
                });
            }
            return newMap;
        });
        setCurrentTableId(tableId);
    };

    const closeTable = (tableId: string) => {
        setActiveTables(prev => {
            const newMap = new Map(prev);
            newMap.delete(tableId);
            return newMap;
        });

        // Switch to another table if current is closed
        if (currentTableId === tableId) {
            const remaining = Array.from(activeTables.keys()).filter(id => id !== tableId);
            setCurrentTableId(remaining[0] || null);
        }
    };

    const updateTableCart = (tableId: string, cart: TableCart) => {
        setActiveTables(prev => {
            const newMap = new Map(prev);
            const tableState = newMap.get(tableId);
            if (tableState) {
                newMap.set(tableId, {
                    ...tableState,
                    cart,
                    lastModified: Date.now(),
                });
            }
            return newMap;
        });
    };

    const getTableState = (tableId: string): TableState | undefined => {
        return activeTables.get(tableId);
    };

    const switchToTable = (tableId: string) => {
        if (activeTables.has(tableId)) {
            setCurrentTableId(tableId);
        }
    };

    const clearAllTables = () => {
        setActiveTables(new Map());
        setCurrentTableId(null);
        sessionStorage.removeItem('multi-table-state');
    };

    return {
        activeTables: Array.from(activeTables.values()),
        currentTableId,
        currentTable: currentTableId ? activeTables.get(currentTableId) : null,
        openTable,
        closeTable,
        updateTableCart,
        getTableState,
        switchToTable,
        clearAllTables,
        hasActiveTables: activeTables.size > 0,
    };
}
