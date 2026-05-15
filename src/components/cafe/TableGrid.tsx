"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Users, Armchair, Utensils } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2 } from "lucide-react"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { deleteTable } from "@/actions/tables"

type Table = {
    id: string
    tableNumber: string
    capacity: number
    status: string
    customerCount: number
}

export default function TableGrid({ initialTables }: { initialTables: Table[] }) {
    const router = useRouter()
    const [tables, setTables] = useState<Table[]>(initialTables)
    const [selectedTables, setSelectedTables] = useState<string[]>([])
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single')
    const [tableToDelete, setTableToDelete] = useState<{ id: string, tableNumber: string } | null>(null)

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "available":
                return {
                    badge: "bg-[#DCFCE7] text-[#16A34A] border-emerald-200",
                    card: "bg-white border-[#E5E7EB] hover:border-emerald-300 hover:shadow-emerald-100",
                    icon: "text-[#DCFCE7]0",
                    title: "text-[#111827]"
                }
            case "occupied":
                return {
                    badge: "bg-[#FEE2E2] text-[#DC2626] border-rose-200",
                    card: "bg-[#FEE2E2]/30 border-rose-200 hover:border-rose-300",
                    icon: "text-[#FEE2E2]0",
                    title: "text-[#111827]"
                }
            case "reserved":
                return {
                    badge: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20/20200",
                    card: "bg-[#F59E0B]/10/30 border-[#F59E0B]/20/20200 hover:border-[#F59E0B]/20/20300",
                    icon: "text-[#F59E0B]",
                    title: "text-[#111827]"
                }
            default:
                return {
                    badge: "bg-[#F1F5F9] text-[#9CA3AF] border-[#E5E7EB]",
                    card: "bg-[#F8FAFC] border-[#E5E7EB]",
                    icon: "text-[#9CA3AF]",
                    title: "text-[#9CA3AF]"
                }
        }
    }

    const handleTableClick = (table: Table) => {
        router.push(`/dashboard/orders/new?tableId=${table.id}&tableNumber=${table.tableNumber}`)
    }

    const handleSingleDelete = (tableId: string, tableNumber: string) => {
        setTableToDelete({ id: tableId, tableNumber })
        setPasswordAction('single')
        setIsPasswordDialogOpen(true)
    }

    const handleBulkDelete = () => {
        if (selectedTables.length === 0) return
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
            const deletePromises = selectedTables.map(id => deleteTable(id))
            const results = await Promise.all(deletePromises)
            
            const successCount = results.filter(r => r.success).length
            
            if (successCount > 0) {
                setTables(prevTables => prevTables.filter(t => !selectedTables.includes(t.id)))
                setSelectedTables([])
                router.refresh()
            }
            
            if (results.some(r => !r.success)) {
                const errors = results.filter(r => !r.success).map(r => r.error).join(', ')
                alert(`Some tables failed to delete: ${errors}`)
            }
        }
        
        setIsPasswordDialogOpen(false)
        setTableToDelete(null)
        setPasswordAction('single')
    }

    const toggleSelectTable = (tableId: string) => {
        setSelectedTables(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId]
        )
    }

    const toggleSelectAll = () => {
        if (selectedTables.length === tables.length) {
            setSelectedTables([])
        } else {
            setSelectedTables(tables.map(table => table.id))
        }
    }

    return (
        <div>
            {/* Bulk Actions Bar */}
            {selectedTables.length > 0 && (
                <div className="flex justify-between items-center mb-4 p-4 bg-[#F8FAFC] rounded-lg">
                    <div className="text-sm text-[#111827]">
                        {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} selected
                    </div>
                    <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleBulkDelete}
                        className="bg-[#EF4444] hover:bg-[#DC2626]"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                    </Button>
                </div>
            )}
            
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tables.map((table) => {
                    const styles = getStatusStyles(table.status)
                    return (
                        <div key={table.id} className="group relative flex flex-col text-left transition-all duration-300 hover:-translate-y-1 w-full">
                            <div className="absolute top-2 left-2 z-10">
                                <Checkbox
                                    checked={selectedTables.includes(table.id)}
                                    onCheckedChange={() => toggleSelectTable(table.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            
                            <button
                                onClick={() => handleTableClick(table)}
                                className="group relative flex flex-col text-left transition-all duration-300 hover:-translate-y-1 w-full"
                            >
                                <div className={cn(
                                    "premium-card relative w-full overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md border",
                                    styles.card
                                )}>
                                    <div className="p-8 border-b border-[#E5E7EB] pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-[#9CA3AF] uppercase tracking-wider font-semibold">Table</span>
                                                <h2 className={cn("text-3xl font-bold font-serif", styles.title)}>{table.tableNumber}</h2>
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
                                                <Utensils className={cn("h-5 w-5", styles.icon)} />
                                            ) : (
                                                <Armchair className={cn("h-5 w-5", styles.icon)} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                            
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 text-[#FEE2E2]0 hover:text-[#DC2626] hover:bg-[#FEE2E2] opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleSingleDelete(table.id, table.tableNumber)
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )
                })}
            </div>
            
            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordSuccess}
                title={passwordAction === 'bulk' ? "Delete Selected Tables" : "Delete Table"}
                description={passwordAction === 'bulk' 
                    ? `Are you sure you want to delete ${selectedTables.length} tables?` 
                    : `Are you sure you want to delete table ${tableToDelete?.tableNumber}?`}
            />
        </div>
    )
}

