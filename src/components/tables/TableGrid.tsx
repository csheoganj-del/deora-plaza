"use client";

import { useState, useEffect } from "react"


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
          badge: "bg-[#DCFCE7] text-[#16A34A] border-emerald-200",
          cardVariant: "default" as const,
          cardClass: "border-[#DCFCE7]0/30 hover:border-[#DCFCE7]0 hover:shadow-emerald-500/10 bg-white/80",
          icon: "text-[#DCFCE7]0",
          title: "text-emerald-900"
        }
      case "occupied":
        return {
          badge: "bg-[#FEE2E2] text-[#DC2626] border-rose-200",
          cardVariant: "jharokha" as const,
          cardClass: "border-[#FEE2E2]0/50 hover:border-[#EF4444] bg-[#FEE2E2]/40",
          icon: "text-[#FEE2E2]0",
          title: "text-rose-900"
        }
      case "reserved":
        return {
          badge: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20/20200",
          cardVariant: "default" as const,
          cardClass: "border-[#F59E0B]/20/20 hover:border-[#F59E0B]/20 bg-[#F59E0B]/10/40",
          icon: "text-[#F59E0B]",
          title: "text-[#F59E0B]900"
        }
      default:
        return {
          badge: "bg-[#F1F5F9] text-[#9CA3AF] border-[#E5E7EB]",
          cardVariant: "default" as const,
          cardClass: "bg-[#F8FAFC] border-[#E5E7EB]",
          icon: "text-[#9CA3AF]",
          title: "text-[#9CA3AF]"
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
          <Button variant="outline">
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
        {tables.map((table) => {
          const styles = getStatusStyles(table.status)
          return (
            <div key={table.id} className="group relative flex flex-col text-left transition-all duration-300 w-full h-full">
              <div className="premium-card cursor-pointer" onClick={() => handleTableClick(table)}>
                {/* Status Watermark */}
                {table.status === 'occupied' && (
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 opacity-10 pointer-events-none rotate-12">
                    <img src="/assets/icons/turban.svg" alt="" className="w-full h-full" />
                  </div>
                )}
                {table.status === 'available' && (
                  <div className="absolute top-2 right-2 w-16 h-16 opacity-5 pointer-events-none">
                    <img src="/assets/icons/paisley.svg" alt="" className="w-full h-full" />
                  </div>
                )}
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedTables.has(table.id)}
                    onCheckedChange={() => toggleSelectTable(table.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="p-8 border-b border-[#E5E7EB] pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#9CA3AF] uppercase tracking-wider font-semibold">Table</span>
                      <h2 className={cn("text-3xl font-bold font-serif text-[#111827]", styles.title)}>{table.tableNumber}</h2>
                    </div>
                    <Badge variant="outline" className={cn("capitalize font-medium", styles.badge)}>
                      {table.status}
                    </Badge>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                      <Users className="h-4 w-4" />
                      <span>
                        {table.status === "occupied"
                          ? `${table.customerCount} Guests`
                          : `Capacity: ${table.capacity}`}
                      </span>
                    </div>
                    {table.status === "occupied" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEE2E2]"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Clear Table ${table.tableNumber}? This will mark it as available.`)) {
                              await updateTableStatus(table.id, 'available', 0);
                              router.refresh();
                            }
                          }}
                          title="Clear Table"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Utensils className={cn("h-5 w-5", styles.icon)} />
                      </div>
                    ) : (
                      <Armchair className={cn("h-5 w-5", styles.icon)} />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-[#FEE2E2]0 hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleDelete(table.id, table.tableNumber);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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

