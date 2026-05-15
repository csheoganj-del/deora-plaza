"use client"

import React, { useState } from "react"
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { PlusCircle, MoreHorizontal, Trash2, Edit, RotateCcw } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableForm } from "./TableForm"
import { createTable, updateTable, deleteTable, updateTableStatus } from "@/actions/tables"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { toast } from "@/hooks/use-toast"

interface TableManagerProps {
    businessUnit: string
    initialTables: any[]
    children: React.ReactNode
}

export function TableManager({ businessUnit, initialTables, children }: TableManagerProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false)
    const [editingTable, setEditingTable] = useState<any>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedTables, setSelectedTables] = useState<string[]>([])
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [tableToDelete, setTableToDelete] = useState<string | null>(null)
    const [isBulkDelete, setIsBulkDelete] = useState(false)

    const handleAdd = () => {
        setEditingTable(null)
        setIsFormOpen(true)
    }

    const handleEdit = (table: any) => {
        setEditingTable(table)
        setIsFormOpen(true)
    }

    const initiateDelete = (tableId: string) => {
        setTableToDelete(tableId)
        setIsBulkDelete(false)
        setIsPasswordDialogOpen(true)
    }

    const initiateBulkDelete = () => {
        if (selectedTables.length === 0) return
        setIsBulkDelete(true)
        setIsPasswordDialogOpen(true)
    }

    const handleConfirmDelete = async (password: string) => {
        // Password validation handled server-side
        // }

        if (isBulkDelete) {
            // Bulk delete
            let successCount = 0
            let errorCount = 0

            for (const id of selectedTables) {
                const result = await deleteTable(id, password)
                if (result.success) {
                    successCount++
                } else {
                    errorCount++
                }
            }

            if (successCount > 0) {
                router.refresh()
                setSelectedTables([])
            }

            if (errorCount > 0) {
                alert(`Failed to delete ${errorCount} tables.`)
            }
        } else if (tableToDelete) {
            // Single delete
            const result = await deleteTable(tableToDelete, password)
            if (result.success) {
                router.refresh()
            } else {
                alert(result.error || "Failed to delete table.")
            }
        }

        setIsPasswordDialogOpen(false)
        setTableToDelete(null)
        setIsBulkDelete(false)
    }

    const handleReset = async (tableId: string) => {
        if (confirm("Reset this table to 'Available'? This will clear current guest count.")) {
            const result = await updateTableStatus(tableId, 'available', 0)
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || "Failed to reset table.")
            }
        }
    }

    const handleFormSubmit = async (data: any) => {
        let result;
        if (editingTable) {
            result = await updateTable(editingTable.id, data)
        } else {
            result = await createTable({ ...data, businessUnit })
        }

        if (result.success) {
            router.refresh();
            setIsFormOpen(false)
            setEditingTable(null)
            if (!editingTable) {
                setOpen(false);
            }
            toast({
                title: "Success",
                description: editingTable ? "Table updated successfully" : "Table created successfully",
            })
        } else {
            toast({
                title: "Error",
                description: result.error || "An unknown error occurred.",
                variant: "destructive",
            })
        }
    }

    const toggleSelectAll = () => {
        if (selectedTables.length === initialTables.length) {
            setSelectedTables([])
        } else {
            setSelectedTables(initialTables.map(t => t.id))
        }
    }

    const toggleSelect = (id: string) => {
        if (selectedTables.includes(id)) {
            setSelectedTables(selectedTables.filter(t => t !== id))
        } else {
            setSelectedTables([...selectedTables, id])
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="max-w-2xl glass-adaptive border-glass border-0 shadow-2xl overflow-hidden p-0 gap-0 [&>button]:text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 pointer-events-none" />

                    <DialogHeader className="p-6 border-b border-white/10 relative">
                        <DialogTitle className="text-2xl font-bold text-white drop-shadow-sm flex items-center gap-3">
                            <PlusCircle className="h-6 w-6 text-amber-500" />
                            Manage {businessUnit.charAt(0).toUpperCase() + businessUnit.slice(1)} Tables
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-between p-6 items-center relative gap-4">
                        <div>
                            {selectedTables.length > 0 && (
                                <Button
                                    variant="destructive"
                                    onClick={initiateBulkDelete}
                                    className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40 hover:text-red-300 shadow-lg transition-all duration-300"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedTables.length})
                                </Button>
                            )}
                        </div>
                        <Button
                            onClick={handleAdd}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/20 transition-all duration-300"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Table
                        </Button>
                    </div>

                    <div className="mx-6 mb-6 border border-white/10 rounded-xl max-h-[60vh] overflow-y-auto relative bg-black/20 custom-scrollbar">
                        <Table>
                            <TableHeader className="bg-white/10 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead className="w-[50px] py-4">
                                        <Checkbox
                                            checked={initialTables.length > 0 && selectedTables.length === initialTables.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-white/20 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                        />
                                    </TableHead>
                                    <TableHead className="text-white uppercase text-[10px] tracking-widest font-bold">Table Number</TableHead>
                                    <TableHead className="text-white uppercase text-[10px] tracking-widest font-bold">Capacity</TableHead>
                                    <TableHead className="w-[50px] text-right text-white uppercase text-[10px] tracking-widest font-bold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialTables.map((table: any) => (
                                    <TableRow key={table.id} className="group hover:bg-white/5 border-white/5 transition-colors duration-200">
                                        <TableCell className="py-4">
                                            <Checkbox
                                                checked={selectedTables.includes(table.id)}
                                                onCheckedChange={() => toggleSelect(table.id)}
                                                className="border-white/20 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                            />
                                        </TableCell>
                                        <TableCell className="text-white font-medium">{table.tableNumber}</TableCell>
                                        <TableCell className="text-white/70">{table.capacity} Guests</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2 scroll-pb-2 opacity-100 transition-opacity duration-200">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full"
                                                    onClick={() => initiateDelete(table.id)}
                                                    title="Delete Table"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="relative">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-adaptive-secondary hover:text-adaptive-primary hover:bg-white/10 rounded-full"
                                                            >
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="z-[10001] bg-[#1c1c21] border border-white/20 min-w-[160px] p-1 text-white shadow-2xl">
                                                            <DropdownMenuItem onClick={() => handleEdit(table)} className="flex items-center gap-3 p-2.5 cursor-pointer focus:bg-white/10 transition-colors">
                                                                <Edit className="h-4 w-4 text-amber-500" />
                                                                <span className="text-sm font-medium">Edit Details</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleReset(table.id)} className="flex items-center gap-3 p-2.5 cursor-pointer focus:bg-white/10 transition-colors">
                                                                <RotateCcw className="h-4 w-4 text-blue-400" />
                                                                <span className="text-sm font-medium">Reset Status</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {initialTables.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-adaptive-secondary italic">
                                            No tables configured for this unit.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            <TableForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingTable}
            />

            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title={isBulkDelete ? "Confirm Bulk Deletion" : "Confirm Deletion"}
                description={isBulkDelete ? `Are you sure you want to delete ${selectedTables.length} tables? This action cannot be undone.` : "Are you sure you want to delete this table? This action cannot be undone."}
            />
        </>
    )
}

