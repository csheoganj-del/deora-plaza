"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/hybrid/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/hybrid/table";
import { Badge } from "@/components/ui/hybrid/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/hybrid/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/hybrid/tabs";
import {
  Printer,
  IndianRupee,
  Calendar,
  Clock,
  User,
  Building2,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Plus,
  FileText,
  TrendingUp
} from "lucide-react";
import { getBills, deleteBill } from "@/actions/billing";
import { getHotelBookings } from "@/actions/hotel";
import { getGardenBookings } from "@/actions/garden";
import { printHotelReceipt, printGardenReceipt } from "@/lib/print-utils";
import { deleteHotelBooking } from "@/actions/hotel";
import { deleteGardenBooking } from "@/actions/garden";
import { format } from "date-fns";
import ReprintBill from "@/components/billing/ReprintBill";
import { PasswordDialog } from "@/components/ui/PasswordDialog";
import EditBillDialog from "@/components/billing/EditBillDialog";
import { Pencil } from "lucide-react";
import { useServerAuth } from "@/hooks/useServerAuth";

type Bill = {
  id: string;
  billNumber: string;
  orderId: string;
  businessUnit: string;
  customerName?: string;
  customerMobile?: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  paymentMethod?: string;
  paymentStatus: string;
  source?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
};

export default function HybridBillingPage() {
  const { data: session } = useServerAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [gardenBookings, setGardenBookings] = useState<any[]>([]);
  const [view, setView] = useState<'bills' | 'hotel' | 'garden'>('bills');
  const [bookingToDelete, setBookingToDelete] = useState<{ id: string; type: 'hotel' | 'garden'; title: string } | null>(null);
  const [isBookingPasswordOpen, setIsBookingPasswordOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showReprint, setShowReprint] = useState(false);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"billed" | "pending">("billed");
  const [passwordProtection, setPasswordProtection] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const unitParam = searchParams?.get('unit') || undefined;
    const userRole = (session?.user as any)?.role;
    const isSuperUser = ['super_admin', 'owner'].includes(userRole);
    const userBusinessUnit = isSuperUser ? undefined : (session?.user?.businessUnit || undefined);
    const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;

    loadBills(effectiveUnit);

    if (!effectiveUnit || effectiveUnit === 'hotel' || effectiveUnit === 'garden') {
      loadBookings();
    }

    if ((unitParam || '').toLowerCase() === 'all') {
      setView('bills');
    }
  }, [searchParams, session, session?.user?.businessUnit, session?.user]);

  const loadBills = async (unit?: string) => {
    setLoading(true);
    try {
      const data = await getBills(unit);
      setBills(data);
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const hotel = await getHotelBookings();
      const gardenRes = await getGardenBookings();
      setHotelBookings(hotel || []);
      setGardenBookings(((gardenRes as any)?.bookings ?? []) as any[]);
    } catch (error) {
      console.error('Error loading bookings for combined view:', error);
    }
  };

  const handleReprint = (bill: Bill) => {
    setSelectedBill(bill);
    setShowReprint(true);
  };

  const handleEdit = (bill: Bill) => {
    setBillToEdit(bill);
    setShowEditDialog(true);
  };

  const handleBillUpdated = () => {
    const unitParam = searchParams?.get('unit') || undefined;
    const userBusinessUnit = session?.user?.businessUnit || undefined;
    const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;
    loadBills(effectiveUnit);
  };

  const handleDelete = (billId: string) => {
    setBillToDelete(billId);
    if (passwordProtection) {
      setIsPasswordDialogOpen(true);
    } else {
      handlePasswordSuccess("");
    }
  };

  const handlePasswordSuccess = async (password: string) => {
    if (billToDelete) {
      const result = await deleteBill(billToDelete, password);
      if (result.success) {
        setBills(bills.filter(bill => bill.id !== billToDelete));
        if (selectedBills.includes(billToDelete)) {
          setSelectedBills(selectedBills.filter(id => id !== billToDelete));
        }
      } else {
        alert(`Failed to delete bill: ${result.error}`);
      }
    } else if (selectedBills.length > 0) {
      const { bulkDeleteBills } = await import("@/actions/billing");
      const result = await bulkDeleteBills(selectedBills, password);

      if (result.success) {
        setBills(bills.filter(bill => !selectedBills.includes(bill.id)));
        setSelectedBills([]);
      } else {
        alert(`Failed to delete bills: ${result.error}`);
      }
    }

    setIsPasswordDialogOpen(false);
    setBillToDelete(null);
  };

  const toggleBillSelection = (billId: string) => {
    setSelectedBills(prev =>
      prev.includes(billId)
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const toggleSelectAll = () => {
    const allBillIds = bills.map(bill => bill.id);
    if (selectedBills.length === allBillIds.length && allBillIds.length > 0) {
      setSelectedBills([]);
    } else {
      setSelectedBills(allBillIds);
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(bills, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `bills-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getBusinessUnitColor = (unit: string) => {
    switch (unit) {
      case "hotel": return "default";
      case "restaurant": return "success";
      case "cafe": return "warning";
      case "bar": return "default";
      case "garden": return "success";
      default: return "secondary";
    }
  };

  const filteredBills = activeTab === "billed"
    ? bills.filter(bill => bill.paymentStatus === "paid")
    : bills.filter(bill => bill.paymentStatus !== "paid");

  const billedCount = bills.filter(bill => bill.paymentStatus === "paid").length;
  const pendingCount = bills.filter(bill => bill.paymentStatus !== "paid").length;

  // Calculate summary metrics
  const totalRevenue = bills.filter(bill => bill.paymentStatus === "paid")
    .reduce((sum, bill) => sum + bill.grandTotal, 0);
  const pendingAmount = bills.filter(bill => bill.paymentStatus !== "paid")
    .reduce((sum, bill) => sum + bill.grandTotal, 0);

  if (loading) {
    return (
      <div className="ga-p-6">
        <div className="ga-skeleton h-12 w-64 mb-6" />
        <div className="ga-grid ga-grid-4 ga-gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ga-skeleton h-32" />
          ))}
        </div>
        <div className="ga-skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="ga-p-6 space-y-6">
      {/* Page Header */}
      <div className="ga-flex ga-items-center ga-justify-between">
        <div>
          <h1 className="ga-text-display text-[var(--text-primary)]">
            Billing & Treasury
          </h1>
          <p className="ga-text-body-secondary mt-1">
            Manage bills, payments, and financial records
          </p>
        </div>
        
        <div className="ga-flex ga-items-center ga-gap-3">
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4" />
            New Bill
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="ga-grid ga-grid-4 ga-gap-6">
        <Card interactive>
          <CardContent className="ga-p-6">
            <div className="ga-flex ga-items-center ga-justify-between">
              <div>
                <p className="ga-text-caption text-[var(--text-secondary)] mb-1">
                  Total Revenue
                </p>
                <p className="ga-text-h1 font-semibold text-[var(--text-primary)]">
                  ₹{totalRevenue.toLocaleString()}
                </p>
                <div className="ga-flex ga-items-center ga-gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
                  <span className="ga-text-small font-medium text-[var(--color-success)]">
                    {billedCount} bills
                  </span>
                </div>
              </div>
              
              <div className="w-12 h-12 rounded-lg bg-[var(--color-success-light)] ga-flex ga-items-center justify-center">
                <IndianRupee className="w-6 h-6 text-[var(--color-success)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card interactive>
          <CardContent className="ga-p-6">
            <div className="ga-flex ga-items-center ga-justify-between">
              <div>
                <p className="ga-text-caption text-[var(--text-secondary)] mb-1">
                  Pending Amount
                </p>
                <p className="ga-text-h1 font-semibold text-[var(--text-primary)]">
                  ₹{pendingAmount.toLocaleString()}
                </p>
                <div className="ga-flex ga-items-center ga-gap-1 mt-2">
                  <Clock className="w-4 h-4 text-[var(--color-warning)]" />
                  <span className="ga-text-small font-medium text-[var(--color-warning)]">
                    {pendingCount} pending
                  </span>
                </div>
              </div>
              
              <div className="w-12 h-12 rounded-lg bg-[var(--color-warning-light)] ga-flex ga-items-center justify-center">
                <Clock className="w-6 h-6 text-[var(--color-warning)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card interactive>
          <CardContent className="ga-p-6">
            <div className="ga-flex ga-items-center ga-justify-between">
              <div>
                <p className="ga-text-caption text-[var(--text-secondary)] mb-1">
                  Total Bills
                </p>
                <p className="ga-text-h1 font-semibold text-[var(--text-primary)]">
                  {bills.length}
                </p>
                <div className="ga-flex ga-items-center ga-gap-1 mt-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  <span className="ga-text-small font-medium text-[var(--color-primary)]">
                    Today
                  </span>
                </div>
              </div>
              
              <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-light)] ga-flex ga-items-center justify-center">
                <FileText className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card interactive>
          <CardContent className="ga-p-6">
            <div className="ga-flex ga-items-center ga-justify-between">
              <div>
                <p className="ga-text-caption text-[var(--text-secondary)] mb-1">
                  Avg Bill Value
                </p>
                <p className="ga-text-h1 font-semibold text-[var(--text-primary)]">
                  ₹{bills.length > 0 ? Math.round(totalRevenue / billedCount || 0) : 0}
                </p>
                <div className="ga-flex ga-items-center ga-gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
                  <span className="ga-text-small font-medium text-[var(--color-success)]">
                    Per order
                  </span>
                </div>
              </div>
              
              <div className="w-12 h-12 rounded-lg bg-[var(--color-success-light)] ga-flex ga-items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[var(--color-success)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)} className="space-y-6">
        {(searchParams?.get('unit') || '').toLowerCase() === 'all' && (
          <TabsList>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="hotel">Hotel Bookings</TabsTrigger>
            <TabsTrigger value="garden">Garden Bookings</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="bills">
          <Card>
            <CardHeader>
              <div className="ga-flex ga-items-center ga-justify-between">
                <div>
                  <CardTitle>Bills Management</CardTitle>
                  <p className="ga-text-body-secondary mt-1">
                    View and manage all billing records
                  </p>
                </div>
                
                <div className="ga-flex ga-items-center ga-gap-3">
                  <Button variant="secondary" size="sm" onClick={exportToJSON}>
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => {
                    const unitParam = searchParams?.get('unit') || undefined;
                    const userBusinessUnit = session?.user?.businessUnit || undefined;
                    const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;
                    loadBills(effectiveUnit);
                  }}>
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Tab Navigation */}
              <div className="ga-flex ga-gap-4 mb-6">
                <button
                  onClick={() => setActiveTab("billed")}
                  className={`ga-flex ga-items-center ga-gap-2 ga-px-4 ga-py-2 rounded-lg transition-colors ${
                    activeTab === "billed"
                      ? "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success)]"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  Billed ({billedCount})
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`ga-flex ga-items-center ga-gap-2 ga-px-4 ga-py-2 rounded-lg transition-colors ${
                    activeTab === "pending"
                      ? "bg-[var(--color-warning-light)] text-[var(--color-warning)] border border-[var(--color-warning)]"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  Pending ({pendingCount})
                </button>
              </div>

              {/* Bulk Actions Bar */}
              {selectedBills.length > 0 && (
                <div className="ga-flex ga-justify-between ga-items-center mb-4 ga-p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <div className="ga-text-body">
                    {selectedBills.length} bill{selectedBills.length !== 1 ? 's' : ''} selected
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsPasswordDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </div>
              )}

              {filteredBills.length === 0 ? (
                <div className="text-center ga-py-12">
                  <IndianRupee className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
                  <h3 className="mt-2 ga-text-h3 text-[var(--text-primary)]">
                    No {activeTab} bills found
                  </h3>
                  <p className="mt-1 ga-text-body-secondary">
                    {activeTab === "billed"
                      ? "Billed orders will appear here once payments are completed."
                      : "Pending orders will appear here awaiting payment processing."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <input
                          type="checkbox"
                          checked={selectedBills.length === filteredBills.length && filteredBills.length > 0}
                          onChange={toggleSelectAll}
                          className="ga-focus-visible"
                        />
                      </TableHead>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedBills.includes(bill.id)}
                            onChange={() => toggleBillSelection(bill.id)}
                            className="ga-focus-visible"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                        <TableCell>
                          <div className="ga-flex ga-items-center ga-gap-1 ga-text-small text-[var(--text-secondary)]">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(bill.createdAt), "dd/MM/yyyy")}
                            <Clock className="h-4 w-4 ml-2" />
                            {format(new Date(bill.createdAt), "HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBusinessUnitColor(bill.businessUnit) as any}>
                            <Building2 className="h-3 w-3 mr-1" />
                            {bill.businessUnit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="ga-flex ga-items-center ga-gap-1 ga-text-body">
                            <User className="h-4 w-4 text-[var(--text-secondary)]" />
                            {bill.customerName || "Walk-in Customer"}
                            {bill.customerMobile && (
                              <span className="text-[var(--text-secondary)] ga-text-small">
                                ({bill.customerMobile})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{bill.grandTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={bill.paymentStatus === "paid" ? "success" : "warning"}
                          >
                            {bill.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="ga-flex ga-items-center ga-gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(bill)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReprint(bill)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(bill.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotel">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Bookings</CardTitle>
              <p className="ga-text-body-secondary">Manage hotel reservations and payments</p>
            </CardHeader>
            <CardContent>
              {hotelBookings.length === 0 ? (
                <div className="text-center ga-py-12">
                  <Building2 className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
                  <h3 className="mt-2 ga-text-h3 text-[var(--text-primary)]">No hotel bookings found</h3>
                  <p className="mt-1 ga-text-body-secondary">Bookings will appear here once created.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotelBookings.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.guestName || 'Guest'}</TableCell>
                        <TableCell>{b.customerMobile || '-'}</TableCell>
                        <TableCell>{b.roomNumber || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(b.startDate), 'PP')} - {format(new Date(b.endDate), 'PP')}</TableCell>
                        <TableCell>₹{(b.totalAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{(b.totalPaid || 0).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="secondary">{b.paymentStatus || b.status}</Badge></TableCell>
                        <TableCell>
                          <div className="ga-flex ga-gap-2">
                            <Button size="sm" variant="secondary" onClick={() => printHotelReceipt(b, b.paymentStatus === 'completed' ? 'full' : 'advance')}>
                              Print
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                              setBookingToDelete({ id: b.id, type: 'hotel', title: `Delete Booking for ${b.guestName || 'Guest'}` });
                              setIsBookingPasswordOpen(true);
                            }}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="garden">
          <Card>
            <CardHeader>
              <CardTitle>Garden Bookings</CardTitle>
              <p className="ga-text-body-secondary">Manage garden event bookings and payments</p>
            </CardHeader>
            <CardContent>
              {gardenBookings.length === 0 ? (
                <div className="text-center ga-py-12">
                  <Building2 className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
                  <h3 className="mt-2 ga-text-h3 text-[var(--text-primary)]">No garden bookings found</h3>
                  <p className="mt-1 ga-text-body-secondary">Bookings will appear here once created.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gardenBookings.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.customerName || 'Customer'}</TableCell>
                        <TableCell>{b.customerMobile || '-'}</TableCell>
                        <TableCell>{b.eventType || '-'}</TableCell>
                        <TableCell>{format(new Date(b.startDate), 'PP')} - {format(new Date(b.endDate), 'PP')}</TableCell>
                        <TableCell>₹{(b.totalAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{(b.totalPaid || 0).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="secondary">{b.paymentStatus || b.status}</Badge></TableCell>
                        <TableCell>
                          <div className="ga-flex ga-gap-2">
                            <Button size="sm" variant="secondary" onClick={() => printGardenReceipt(b, b.paymentStatus === 'completed' ? 'full' : 'advance')}>
                              Print
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                              setBookingToDelete({ id: b.id, type: 'garden', title: `Delete Booking for ${b.customerName || 'Customer'}` });
                              setIsBookingPasswordOpen(true);
                            }}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PasswordDialog
        isOpen={isBookingPasswordOpen}
        onClose={() => { setIsBookingPasswordOpen(false); setBookingToDelete(null); }}
        onConfirm={async (pwd) => {
          if (!bookingToDelete) return;
          try {
            if (bookingToDelete.type === 'hotel') {
              await deleteHotelBooking(bookingToDelete.id, pwd);
            } else {
              await deleteGardenBooking(bookingToDelete.id, pwd);
            }
            await loadBookings();
            setIsBookingPasswordOpen(false);
            setBookingToDelete(null);
          } catch (error) {
            console.error('Failed to delete booking:', error);
          }
        }}
        title={bookingToDelete?.title || 'Delete Booking'}
        description={'Enter admin password to confirm deletion'}
      />

      {showReprint && selectedBill && (
        <div className="fixed inset-0 bg-black/50 ga-flex ga-items-center justify-center z-50 ga-p-4">
          <div className="ga-card max-w-md w-full max-h-[90vh] overflow-y-auto">
            <ReprintBill
              bill={selectedBill}
              onClose={() => {
                setShowReprint(false);
                setSelectedBill(null);
              }}
            />
          </div>
        </div>
      )}

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setBillToDelete(null);
        }}
        onConfirm={handlePasswordSuccess}
        title={billToDelete ? "Delete Bill" : "Delete Selected Bills"}
        description={
          billToDelete
            ? "Are you sure you want to delete this bill? This action cannot be undone."
            : `Are you sure you want to delete ${selectedBills.length} bills? This action cannot be undone.`
        }
      />

      {billToEdit && (
        <EditBillDialog
          bill={billToEdit}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onBillUpdated={handleBillUpdated}
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        className="hidden"
      />
    </div>
  );
}