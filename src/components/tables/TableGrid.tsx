"use client";

import { useState, useEffect, useMemo, memo } from "react"


import { Badge } from "@/components/ui/badge"
import { Users, Armchair, Utensils, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { TableManager } from "./TableManager"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { DineInOrderDialog } from "@/components/orders/DineInOrderDialog"
import { updateTableStatus, deleteTable } from "@/actions/tables"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

type Table = {
  id: string
  tableNumber: string
  capacity: number
  status: string
  customerCount: number
  businessUnit: string
}

export default function TableGrid({ initialTables, businessUnit }: { initialTables: Table[], businessUnit: string }) {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single')
  const [tableToDelete, setTableToDelete] = useState<{ id: string, tableNumber: string } | null>(null)

  useEffect(() => {
    setTables(initialTables)
  }, [initialTables])

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "available":
        return {
          badge: "bg-[#1E8E3E] text-white border-transparent",
          cardVariant: "default" as const,
          cardClass: "border-[#E0E0E0] bg-white hover:border-[#1E8E3E]",
          statusColor: "#1E8E3E",
          statusText: "Available"
        }
      case "occupied":
        return {
          badge: "bg-[#D93025] text-white border-transparent",
          cardVariant: "default" as const,
          cardClass: "border-[#E0E0E0] bg-white hover:border-[#D93025]",
          statusColor: "#D93025",
          statusText: "Occupied"
        }
      case "reserved":
        return {
          badge: "bg-[#F9AB00] text-[#202124] border-transparent",
          cardVariant: "default" as const,
          cardClass: "border-[#E0E0E0] bg-white hover:border-[#F9AB00]",
          statusColor: "#F9AB00",
          statusText: "Reserved"
        }
      default:
        return {
          badge: "bg-[#9AA0A6] text-white border-transparent",
          cardVariant: "default" as const,
          cardClass: "border-[#E0E0E0] bg-[#F8F9FA]",
          statusColor: "#9AA0A6",
          statusText: "Unknown"
        }
    }
  }

  const handleTableClick = (table: Table) => {
    setSelectedTable(table)
    setIsDialogOpen(true)
  }

  const handleSingleDelete = (tableId: string, tableNumber: string) => {
    setTableToDelete({ id: tableId, tableNumber })
    setPasswordAction('single')
    setIsPasswordDialogOpen(true)
  }

  const handleBulkDelete = () => {
    if (selectedTables.size === 0) return
    setPasswordAction('bulk')
    setIsPasswordDialogOpen(true)
  }

  const handlePasswordSuccess = async (password: string) => {
    if (passwordAction === 'single' && tableToDelete) {
      const result = await deleteTable(tableToDelete.id)
      if (result.success) {
        setTables(prevTables => prevTables.filter(t => t.id !== tableToDelete.id))
        router.refresh()
      } else {
        alert(`Failed to delete table: ${result.error || 'Unknown error'}`)
      }
    } else if (passwordAction === 'bulk') {
      const deletePromises = Array.from(selectedTables).map(id => deleteTable(id))
      const results = await Promise.all(deletePromises)

      const successCount = results.filter((r: any) => r.success).length

      if (successCount > 0) {
        setTables(prevTables => prevTables.filter(t => !selectedTables.has(t.id)))
        setSelectedTables(new Set())
        router.refresh()
      }

      if (results.some((r: any) => !r.success)) {
        const errors = results.filter((r: any) => !r.success).map((r: any) => r.error).join(', ')
        alert(`Some tables failed to delete: ${errors}`)
      }
    }

    setIsPasswordDialogOpen(false)
    setTableToDelete(null)
    setPasswordAction('single')
  }

  const toggleSelectAll = () => {
    if (selectedTables.size === tables.length) {
      setSelectedTables(new Set())
    } else {
      setSelectedTables(new Set(tables.map(table => table.id)))
    }
  }

  const toggleSelectTable = (tableId: string) => {
    const newSelected = new Set(selectedTables)
    if (newSelected.has(tableId)) {
      newSelected.delete(tableId)
    } else {
      newSelected.add(tableId)
    }
    setSelectedTables(newSelected)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <TableManager businessUnit={businessUnit} initialTables={initialTables}>
          <Button
            variant="secondary"
            className="bg-[#D3E3FD] hover:bg-[#C2D9FB] text-[#001D35] border-none shadow-none font-medium rounded-full h-10 px-6"
          >
            <Settings className="mr-2 h-4 w-4" /> Manage Tables
          </Button>
        </TableManager>

        {selectedTables.size > 0 && (
          <Button
            onClick={handleBulkDelete}
            variant="destructive"
            className="bg-[#EF4444] hover:bg-[#DC2626] shadow-lg"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete {selectedTables.size} Selected
          </Button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            styles={getStatusStyles(table.status)}
            onTableClick={handleTableClick}
            isSelected={selectedTables.has(table.id)}
            onToggleSelect={toggleSelectTable}
            onDelete={handleSingleDelete}
          />
        ))}
      </div>
      {selectedTable && (
        <DineInOrderDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedTable(null)
          }}
          businessUnit={businessUnit}
          tableId={selectedTable.id}
          tableNumber={selectedTable.tableNumber}
        />
      )
      }

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onConfirm={handlePasswordSuccess}
        title={passwordAction === 'bulk' ? "Delete Selected Tables" : "Delete Table"}
        description={passwordAction === 'bulk' ? `Are you sure you want to delete ${selectedTables.size} tables?` : `Are you sure you want to delete table ${tableToDelete?.tableNumber}?`}
      />
    </div >
  )
}

const TableCard = memo(({
  table,
  styles,
  onTableClick,
  isSelected,
  onToggleSelect,
  onDelete
}: {
  table: Table,
  styles: any,
  onTableClick: (table: Table) => void,
  isSelected: boolean,
  onToggleSelect: (id: string) => void,
  onDelete: (id: string, num: string) => void
}) => {
  const router = useRouter();

  return (
    <div
      onClick={() => onTableClick(table)}
      className={cn(
        "group relative flex flex-col p-4 transition-all duration-200 cursor-pointer overflow-hidden",
        "bg-[#F3F6FC] rounded-[16px]", // Surface Container Low + 16px radius
        isSelected ? "ring-2 ring-[#1A73E8]" : ""
      )}
      style={{
        boxShadow: isSelected
          ? '0 4px 8px 3px rgba(60, 64, 67, 0.15), 0 1px 3px 0 rgba(60, 64, 67, 0.3)'
          : '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' // MD3 Elevation 1
      }}
    >
      {/* Top Section: Selection and ID */}
      <div className="flex items-start gap-3 mb-3">
        <div
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(table.id)
          }}
          className="mt-0.5"
        >
          <Checkbox
            checked={isSelected}
            className="h-4 w-4 border-[#DADCE0] data-[state=checked]:bg-[#1A73E8] data-[state=checked]:border-[#1A73E8] rounded-[2px] transition-none shadow-none"
          />
        </div>

        <div className="flex flex-col">
          <span className="text-[14px] font-normal text-[#202124] tracking-tight select-text z-20 relative" onClick={(e) => e.stopPropagation()}>
            TABLE {table.tableNumber}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: styles.statusColor }}
            />
            <span className="text-[12px] font-normal text-[#5F6368]">
              {styles.statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex items-center gap-4 mt-auto">
        <div className="flex items-center gap-1 text-[#5F6368]">
          <Users className="h-3.5 w-3.5" />
          <span className="text-[12px]">{table.capacity}</span>
        </div>
        {table.status === 'occupied' && (
          <div className="flex items-center gap-1 text-[#D93025]">
            <Utensils className="h-3.5 w-3.5" />
            <span className="text-[12px] font-medium">{table.customerCount}</span>
          </div>
        )}
      </div>

      {/* Bottom Actions - Hidden until hover */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {table.status === 'occupied' ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6]"
            onClick={async (e) => {
              e.stopPropagation()
              if (confirm(`Clear Table ${table.tableNumber}?`)) {
                await updateTableStatus(table.id, 'available', 0)
                router.refresh()
              }
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6]"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(table.id, table.tableNumber)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="sm"
          className="h-7 px-3 text-[11px] bg-[#1A73E8] text-white hover:bg-[#1557B0] border-none font-medium"
          onClick={(e) => {
            e.stopPropagation()
            onTableClick(table)
          }}
        >
          {table.status === 'occupied' ? 'Open Order' : 'New Order'}
        </Button>
      </div>
    </div>
  )
})
  ;

TableCard.displayName = "TableCard";
