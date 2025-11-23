"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StockUpdateDialog } from "./StockUpdateDialog"

type InventoryTableProps = {
    items: any[]
    onUpdate: () => void
}

export default function InventoryTable({ items, onUpdate }: InventoryTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                No items in inventory.
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell>
                                    {item.quantity <= item.minThreshold ? (
                                        <Badge variant="destructive">Low Stock</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <StockUpdateDialog item={item} onUpdate={onUpdate} />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
