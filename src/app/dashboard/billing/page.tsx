"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUnbilledOrders, deleteBill, getBills } from "@/actions/billing"
import { deleteOrder } from "@/actions/orders"
import BillGenerator from "@/components/billing/BillGenerator"
import ReprintBill from "@/components/billing/ReprintBill"
import { Loader2, Receipt, Trash2, CheckSquare, Square, Printer } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { playBeep, showToast } from "@/lib/utils"

export default function BillingPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<any[]>([])
    const [bills, setBills] = useState<any[]>([])
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedBills, setSelectedBills] = useState<string[]>([])
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletePassword, setDeletePassword] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{ type: 'bill' | 'order', id: string } | null>(null)

    const [reprintBill, setReprintBill] = useState<any>(null)

    const fetchData = async () => {
        setLoading(true)
        const [unbilledOrders, allBills] = await Promise.all([
            getUnbilledOrders(),
            getBills()
        ])
        setOrders(unbilledOrders)
        setBills(allBills)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleBillGenerated = () => {
        setSelectedOrder(null)
        fetchData()
        playBeep(1100, 160)
        showToast("Bill generated successfully", 'success')
    }

    const toggleBillSelection = (billId: string) => {
        setSelectedBills(prev =>
            prev.includes(billId)
                ? prev.filter(id => id !== billId)
                : [...prev, billId]
        )
    }

    const handleDelete = async () => {
        setIsDeleting(true)

        if (itemToDelete?.type === 'order') {
            // Check password locally for consistency with other modules, though server checks too
            if (deletePassword !== "KappuLokuHimu#1006") {
                alert("Incorrect password")
                setIsDeleting(false)
                return
            }

            try {
                await deleteOrder(itemToDelete.id, deletePassword)
                setDeleteDialogOpen(false)
                setDeletePassword("")
                setItemToDelete(null)
                fetchData()
                alert("Order deleted successfully")
            } catch (error) {
                alert("Failed to delete order")
            }
        } else if (selectedBills.length > 0 || itemToDelete?.type === 'bill') {
            let successCount = 0
            let failCount = 0

            const billsToDelete = itemToDelete?.type === 'bill' ? [itemToDelete.id] : selectedBills

            for (const billId of billsToDelete) {
                const result = await deleteBill(billId, deletePassword)
                if (result.success) {
                    successCount++
                } else {
                    failCount++
                }
            }

            setDeleteDialogOpen(false)
            setDeletePassword("")
            setSelectedBills([])
            setItemToDelete(null)
            fetchData()

            if (failCount > 0) {
                playBeep(500, 160)
                showToast(`Deleted ${successCount} bills. Failed to delete ${failCount} bills.`, 'error')
            } else {
                playBeep(900, 160)
                showToast(`Successfully deleted ${successCount} bills.`, 'success')
            }
        }

        setIsDeleting(false)
    }

    const initiateDeleteOrder = (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation()
        setItemToDelete({ type: 'order', id: orderId })
        setDeleteDialogOpen(true)
    }

    const initiateDeleteBill = (billId: string) => {
        setItemToDelete({ type: 'bill', id: billId })
        setDeleteDialogOpen(true)
    }

    const initiateBulkDeleteBills = () => {
        setItemToDelete(null)
        setDeleteDialogOpen(true)
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4 overflow-hidden p-4">
            <div className="flex-1 overflow-y-auto">
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Billing & Payments</h1>
                        <p className="text-muted-foreground">Manage orders and bills</p>
                    </div>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">Pending Orders ({orders.length})</TabsTrigger>
                        <TabsTrigger value="bills">Generated Bills ({bills.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-4">
                        {orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Receipt className="h-12 w-12 mb-4 opacity-20" />
                                <p>No pending orders for billing</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="tilt-3d"
                                        onMouseMove={(e) => {
                                            const t = e.currentTarget as HTMLElement
                                            const r = t.getBoundingClientRect()
                                            const x = e.clientX - r.left
                                            const y = e.clientY - r.top
                                            const cx = r.width / 2
                                            const cy = r.height / 2
                                            const ry = ((x - cx) / cx) * 5
                                            const rx = -((y - cy) / cy) * 5
                                            t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                                        }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "" }}
                                    >
                                    <Card
                                        className={`cursor-pointer transition-all hover:shadow-md elevation-1 ${selectedOrder?.id === order.id ? 'border-primary ring-1 ring-primary' : ''}`}
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base">
                                                    {order.table ? `Table ${order.table.tableNumber}` : "Takeaway"}
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">#{order.orderNumber}</Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={(e) => initiateDeleteOrder(e, order.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-sm text-muted-foreground mb-2">
                                                {new Date(order.createdAt).toLocaleTimeString()}
                                            </div>
                                            <div className="font-bold text-lg">
                                                ₹{order.totalAmount.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {order.items.length} items
                                            </div>
                                        </CardContent>
                                    </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="bills" className="mt-4">
                        <div className="mb-4 flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                {selectedBills.length} selected
                            </div>
                            {selectedBills.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={initiateBulkDeleteBills}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Selected
                                </Button>
                            )}
                        </div>

                        {bills.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Receipt className="h-12 w-12 mb-4 opacity-20" />
                                <p>No generated bills found</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {bills.map((bill) => (
                                    <div
                                        key={bill.id}
                                        className="tilt-3d"
                                        onMouseMove={(e) => {
                                            const t = e.currentTarget as HTMLElement
                                            const r = t.getBoundingClientRect()
                                            const x = e.clientX - r.left
                                            const y = e.clientY - r.top
                                            const cx = r.width / 2
                                            const cy = r.height / 2
                                            const ry = ((x - cx) / cx) * 3
                                            const rx = -((y - cy) / cy) * 3
                                            t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                                        }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "" }}
                                    >
                                    <Card className="flex items-center p-4 hover:bg-accent/50 transition-colors elevation-1">
                                        <div className="mr-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => toggleBillSelection(bill.id)}
                                            >
                                                {selectedBills.includes(bill.id) ? (
                                                    <CheckSquare className="h-5 w-5 text-primary" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
                                            <div className="md:col-span-1">
                                                <div className="font-bold">{bill.billNumber}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(bill.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="md:col-span-1">
                                                <div className="text-sm font-medium">{bill.customerName || 'Guest'}</div>
                                                <div className="text-xs text-muted-foreground">{bill.customerMobile || 'No Mobile'}</div>
                                            </div>
                                            <div className="md:col-span-1">
                                                <div className="font-bold">₹{bill.grandTotal.toFixed(2)}</div>
                                                <Badge variant="secondary" className="text-xs capitalize">{bill.paymentMethod}</Badge>
                                            </div>
                                            <div className="text-right md:col-span-1">
                                                <Badge variant="outline" className="capitalize">{bill.source || 'dine-in'}</Badge>
                                            </div>
                                            <div className="text-right md:col-span-1">
                                                <Button variant="outline" size="sm" onClick={() => setReprintBill(bill)}>
                                                    <Printer className="h-3 w-3 mr-1" /> Reprint
                                                </Button>
                                            </div>
                                            <div className="text-right md:col-span-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => initiateDeleteBill(bill.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Bill Generator Dialog */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent
                    className="max-w-2xl max-h-[90vh] overflow-hidden p-0 elevation-1 tilt-3d"
                    onMouseMove={(e) => {
                        const t = e.currentTarget as HTMLElement
                        const r = t.getBoundingClientRect()
                        const x = e.clientX - r.left
                        const y = e.clientY - r.top
                        const cx = r.width / 2
                        const cy = r.height / 2
                        const ry = ((x - cx) / cx) * 5
                        const rx = -((y - cy) / cy) * 5
                        t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                    }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "" }}
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>Generate Bill</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <BillGenerator
                            order={selectedOrder}
                            onClose={handleBillGenerated}
                            onAddItems={() => {
                                // Navigate to tables to add more items
                                setSelectedOrder(null)
                                setTimeout(() => {
                                    router.push('/dashboard/tables')
                                }, 300)
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Reprint Bill Dialog */}
            <Dialog open={!!reprintBill} onOpenChange={(open) => !open && setReprintBill(null)}>
                <DialogContent
                    className="max-w-3xl h-[80vh] overflow-y-auto elevation-1 tilt-3d"
                    onMouseMove={(e) => {
                        const t = e.currentTarget as HTMLElement
                        const r = t.getBoundingClientRect()
                        const x = e.clientX - r.left
                        const y = e.clientY - r.top
                        const cx = r.width / 2
                        const cy = r.height / 2
                        const ry = ((x - cx) / cx) * 5
                        const rx = -((y - cy) / cy) * 5
                        t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                    }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "" }}
                >
                    <DialogHeader>
                        <DialogTitle>Reprint Bill</DialogTitle>
                    </DialogHeader>
                    {reprintBill && (
                        <ReprintBill bill={reprintBill} onClose={() => setReprintBill(null)} />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent
                    className="elevation-1 tilt-3d"
                    onMouseMove={(e) => {
                        const t = e.currentTarget as HTMLElement
                        const r = t.getBoundingClientRect()
                        const x = e.clientX - r.left
                        const y = e.clientY - r.top
                        const cx = r.width / 2
                        const cy = r.height / 2
                        const ry = ((x - cx) / cx) * 5
                        const rx = -((y - cy) / cy) * 5
                        t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                    }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "" }}
                >
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            {itemToDelete?.type === 'order'
                                ? "Are you sure you want to delete this pending order?"
                                : `Are you sure you want to delete ${selectedBills.length > 0 ? selectedBills.length : 'this'} bill(s)?`
                            }
                            This action cannot be undone. Please enter the admin password to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="password">Admin Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || !deletePassword}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete {itemToDelete?.type === 'order' ? 'Order' : 'Bill(s)'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
