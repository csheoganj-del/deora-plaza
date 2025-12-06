"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getDailyRevenue } from "@/actions/billing"
import { resetAllData, getDataStats, deleteAllGardenBookings, deleteAllBookings } from "@/actions/admin"
import { IndianRupee, TrendingUp, Calendar, Trash2, AlertTriangle, Loader2 } from "lucide-react"

export default function OwnerDashboard() {
    const [revenue, setRevenue] = useState({
        cafe: 0,
        bar: 0,
        hotel: 0,
        garden: 0,
        total: 0
    })
    const [loading, setLoading] = useState(true)
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
    const [resetPassword, setResetPassword] = useState("")
    const [dataStats, setDataStats] = useState<any>(null)
    const [isResetting, setIsResetting] = useState(false)
    const [isDeleteGardenDialogOpen, setIsDeleteGardenDialogOpen] = useState(false)
    const [deleteGardenPassword, setDeleteGardenPassword] = useState("")
    const [isDeletingGarden, setIsDeletingGarden] = useState(false)
    const [gardenBookingsCount, setGardenBookingsCount] = useState(0)
    const [isDeleteAllBookingsDialogOpen, setIsDeleteAllBookingsDialogOpen] = useState(false)
    const [deleteAllBookingsPassword, setDeleteAllBookingsPassword] = useState("")
    const [isDeletingAllBookings, setIsDeletingAllBookings] = useState(false)
    const [allBookingsCount, setAllBookingsCount] = useState(0)

    useEffect(() => {
        async function fetchRevenue() {
            // Fetch revenue for each business unit
            const cafeRev = await getDailyRevenue("cafe")
            const barRev = await getDailyRevenue("bar")
            const hotelRev = await getDailyRevenue("hotel")
            const gardenRev = await getDailyRevenue("garden")

            const total = cafeRev.total + barRev.total + hotelRev.total + gardenRev.total

            setRevenue({
                cafe: cafeRev.total,
                bar: barRev.total,
                hotel: hotelRev.total,
                garden: gardenRev.total,
                total
            })
            setLoading(false)
        }
        fetchRevenue()
    }, [])

    const handleOpenResetDialog = async () => {
        const stats = await getDataStats()
        setDataStats(stats)
        setIsResetDialogOpen(true)
    }

    const handleResetData = async () => {
        if (!resetPassword) {
            alert("Please enter password")
            return
        }

        setIsResetting(true)
        const result = await resetAllData(resetPassword)

        if (result.success) {
            const count = (result as any).deletedCount || 0
            alert(`✅ Success! Deleted ${count} records. The system is now reset.`)
            setIsResetDialogOpen(false)
            setResetPassword("")
            // Refresh the page to show empty state
            window.location.reload()
        } else {
            alert(`❌ Error: ${result.error}`)
        }
        setIsResetting(false)
    }

    const handleOpenDeleteGardenDialog = async () => {
        const stats = await getDataStats();
        if (stats && stats.gardenBookings) {
            setGardenBookingsCount(stats.gardenBookings);
        }
        setIsDeleteGardenDialogOpen(true);
    };

    const handleDeleteGardenBookings = async () => {
        if (!deleteGardenPassword) {
            alert("Please enter password");
            return;
        }

        setIsDeletingGarden(true);
        const result = await deleteAllGardenBookings(deleteGardenPassword);

        if (result.success) {
            alert(`✅ Success! Deleted ${result.deletedCount} garden bookings.`);
            setIsDeleteGardenDialogOpen(false);
            setDeleteGardenPassword("");
            window.location.reload();
        } else {
            alert(`❌ Error: ${result.error}`);
        }
        setIsDeletingGarden(false);
    };

    const handleOpenDeleteAllBookingsDialog = async () => {
        const stats = await getDataStats();
        if (stats && stats.allBookings) {
            setAllBookingsCount(stats.allBookings);
        }
        setIsDeleteAllBookingsDialogOpen(true);
    }

    const handleDeleteAllBookings = async () => {
        if (!deleteAllBookingsPassword) {
            alert("Please enter password");
            return;
        }

        setIsDeletingAllBookings(true);
        const result = await deleteAllBookings(deleteAllBookingsPassword);

        if (result.success) {
            alert(`✅ Success! Deleted ${result.deletedCount} bookings.`);
            setIsDeleteAllBookingsDialogOpen(false);
            setDeleteAllBookingsPassword("");
            window.location.reload();
        } else {
            alert(`❌ Error: ${result.error}`);
        }
        setIsDeletingAllBookings(false);
    }

    const ownerShare = revenue.total * 0.4 // 40% owner share
    const managerShare = revenue.total * 0.6 // 60% manager share

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Today's Revenue
                </div>
            </div>

            {/* Total Revenue Card */}
            <Card className="border-2 border-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Total Revenue (Today)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-primary">
                        ₹{revenue.total.toLocaleString('en-IN')}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-green-50 p-4">
                            <div className="text-sm text-muted-foreground">Your Share (40%)</div>
                            <div className="text-2xl font-bold text-green-600">
                                ₹{ownerShare.toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4">
                            <div className="text-sm text-muted-foreground">Manager Share (60%)</div>
                            <div className="text-2xl font-bold text-blue-600">
                                ₹{managerShare.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Business Unit Breakdown */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cafe</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.cafe.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.cafe * 0.4).toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bar</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.bar.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.bar * 0.4).toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hotel</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.hotel.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.hotel * 0.4).toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Garden</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.garden.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.garden * 0.4).toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Settlement Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Settlement Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        This feature will track monthly settlements and payment status.
                        <br />
                        Coming soon: Settlement history and payment tracking.
                    </div>
                </CardContent>
            </Card>

            {/* Data Reset Section - DANGER ZONE */}
            <Card className="border-rose-200 bg-rose-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose-700">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone - Admin Controls
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        These actions are irreversible. Use with extreme caution.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="destructive"
                            onClick={handleOpenResetDialog}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Reset All Data
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleOpenDeleteGardenDialog}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Garden Bookings
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleOpenDeleteAllBookingsDialog}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete All Bookings
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Reset Confirmation Dialog */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-700">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Data Reset
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All transaction data will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>

                    {dataStats && (
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                            <p className="font-semibold text-sm">Data to be deleted:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Garden Bookings:</div><div className="font-mono">{dataStats.gardenBookings}</div>
                                <div>Hotel Bookings:</div><div className="font-mono">{dataStats.hotelBookings}</div>
                                <div>Bills:</div><div className="font-mono">{dataStats.bills}</div>
                                <div>Orders:</div><div className="font-mono">{dataStats.orders}</div>
                                <div>Customers:</div><div className="font-mono">{dataStats.customers}</div>
                                <div className="font-bold">Total Records:</div><div className="font-mono font-bold">{dataStats.total}</div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="reset-password">Enter Password to Confirm</Label>
                        <Input
                            id="reset-password"
                            type="password"
                            placeholder="Enter password"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            disabled={isResetting}
                        />
                        <p className="text-xs text-muted-foreground">
                            Password: KappuLokuHimu#1006
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsResetDialogOpen(false)
                                setResetPassword("")
                            }}
                            disabled={isResetting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetData}
                            disabled={isResetting}
                            className="gap-2"
                        >
                            {isResetting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Reset All Data
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Garden Bookings Confirmation Dialog */}
            <Dialog open={isDeleteGardenDialogOpen} onOpenChange={setIsDeleteGardenDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-700">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete Garden Bookings
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All garden bookings will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        <p className="font-semibold text-sm">Data to be deleted:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Garden Bookings:</div><div className="font-mono">{gardenBookingsCount}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="delete-garden-password">Enter Password to Confirm</Label>
                        <Input
                            id="delete-garden-password"
                            type="password"
                            placeholder="Enter password"
                            value={deleteGardenPassword}
                            onChange={(e) => setDeleteGardenPassword(e.target.value)}
                            disabled={isDeletingGarden}
                        />
                        <p className="text-xs text-muted-foreground">
                            Password: KappuLokuHimu#1006
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteGardenDialogOpen(false)
                                setDeleteGardenPassword("")
                            }}
                            disabled={isDeletingGarden}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteGardenBookings}
                            disabled={isDeletingGarden}
                            className="gap-2"
                        >
                            {isDeletingGarden ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete Garden Bookings
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete All Bookings Confirmation Dialog */}
            <Dialog open={isDeleteAllBookingsDialogOpen} onOpenChange={setIsDeleteAllBookingsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-700">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete All Bookings
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All hotel and garden bookings will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        <p className="font-semibold text-sm">Data to be deleted:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Total Bookings:</div><div className="font-mono">{allBookingsCount}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="delete-all-bookings-password">Enter Password to Confirm</Label>
                        <Input
                            id="delete-all-bookings-password"
                            type="password"
                            placeholder="Enter password"
                            value={deleteAllBookingsPassword}
                            onChange={(e) => setDeleteAllBookingsPassword(e.target.value)}
                            disabled={isDeletingAllBookings}
                        />
                        <p className="text-xs text-muted-foreground">
                            Password: KappuLokuHimu#1006
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteAllBookingsDialogOpen(false)
                                setDeleteAllBookingsPassword("")
                            }}
                            disabled={isDeletingAllBookings}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAllBookings}
                            disabled={isDeletingAllBookings}
                            className="gap-2"
                        >
                            {isDeletingAllBookings ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete All Bookings
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
