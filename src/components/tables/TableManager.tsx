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
                alert(`Failed to delete ${errorCount} tables. Please check password or try again.`)
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
        } else {
            alert(result.error || "An unknown error occurred.")
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
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Manage {businessUnit.charAt(0).toUpperCase() + businessUnit.slice(1)} Tables</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-between py-4">
                        <div>
                            {selectedTables.length > 0 && (
                                <Button variant="destructive" onClick={initiateBulkDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedTables.length})
                                </Button>
                            )}
                        </div>
                        <Button onClick={handleAdd}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Table
                        </Button>
                    </div>

                    <div className="border rounded-md max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={initialTables.length > 0 && selectedTables.length === initialTables.length}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Table Number</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialTables.map((table: any) => (
                                    <TableRow key={table.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedTables.includes(table.id)}
                                                onCheckedChange={() => toggleSelect(table.id)}
                                            />
                                        </TableCell>
                                        <TableCell>{table.tableNumber}</TableCell>
                                        <TableCell>{table.capacity}</TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => initiateDelete(table.id)}
                                                title="Delete Table"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(table)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleReset(table.id)}>
                                                        <RotateCcw className="mr-2 h-4 w-4" /> Reset Status
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
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
