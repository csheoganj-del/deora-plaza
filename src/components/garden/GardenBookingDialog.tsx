"use client";

import { useState, useEffect } from "react";
import { updateGardenBooking, createGardenBooking } from "@/actions/garden";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { printGardenReceipt } from "@/lib/print-utils";
import { getBusinessSettings } from "@/actions/businessSettings";
import CustomerLookup from "@/components/cafe/CustomerLookup";

interface GardenBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  booking?: any; // Optional booking for editing
}

export function GardenBookingDialog({
  isOpen,
  onClose,
  onSuccess,
  booking
}: GardenBookingDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  // Form State
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [eventType, setEventType] = useState("marriage");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:00");
  const [guestCount, setGuestCount] = useState("");
  const [notes, setNotes] = useState("");

  // Billing State
  const [basePrice, setBasePrice] = useState("");
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstPercentage, setGstPercentage] = useState("18");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [advancePayment, setAdvancePayment] = useState("");

  const isEditing = !!booking;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getBusinessSettings();
        if (settings) {
          setBusinessSettings(settings);
        }
      } catch (error) {
        console.error("Failed to load business settings", error);
      }
    };
    loadSettings();
  }, []);

  // Initialize form when booking prop changes
  useEffect(() => {
    if (booking && isOpen) {
      setCustomerMobile(booking.customerMobile || "");
      setCustomerName(booking.customerName || "");
      setEventType(booking.eventType || "marriage");
      setGuestCount(booking.guestCount?.toString() || "");
      setNotes(booking.notes || "");

      // Parse dates
      if (booking.startDate) {
        const start = new Date(booking.startDate);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
      }
      if (booking.endDate) {
        const end = new Date(booking.endDate);
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));
      }

      setBasePrice(booking.basePrice?.toString() || "");
      setGstEnabled(booking.gstEnabled ?? true);
      setGstPercentage(booking.gstPercentage?.toString() || "18");
      setDiscountPercent(booking.discountPercent?.toString() || "0");
      // Advance payment is not editable in update mode usually, or strictly reflects payments made. 
      // For update, we might hide advance payment input or just show total paid as read-only.
      // But for simplicity, we'll leave it empty to avoid confusion as payments are tracked separately.
      setAdvancePayment("");
    } else if (!booking && isOpen) {
      // Reset form for new booking
      setCustomerMobile("");
      setCustomerName("");
      setEventType("marriage");
      setStartDate("");
      setStartTime("09:00");
      setEndDate("");
      setEndTime("23:00");
      setGuestCount("");
      setNotes("");
      setBasePrice("");
      setGstEnabled(true);
      setGstPercentage("18");
      setDiscountPercent("0");
      setAdvancePayment("");
    }
  }, [booking, isOpen]);

  // Handle Customer Selection
  const handleCustomerSelect = (customer: any) => {
    if (customer) {
      setCustomerMobile(customer.mobileNumber);
      setCustomerName(customer.name);

      // Auto-apply tier-based discount
      const tier = customer.discountTier || 'none';
      let discount = 0;

      // Apply discount based on tier
      if (customer.customDiscountPercent) {
        discount = customer.customDiscountPercent;
      } else {
        switch (tier) {
          case 'gold':
            discount = 15;
            break;
          case 'silver':
            discount = 10;
            break;
          case 'bronze':
            discount = 5;
            break;
          default:
            discount = 0;
        }
      }

      setDiscountPercent(discount.toString());

      // Show toast notification if discount applied
      if (discount > 0 && tier && tier !== 'none') {
        toast({
          title: "Discount Applied!",
          description: `${tier.toUpperCase()} tier customer - ${discount}% discount automatically applied`,
        });
      }
    }
  };

  // Calculations
  const calculateTotals = () => {
    const price = parseFloat(basePrice) || 0;
    const discount = parseFloat(discountPercent) || 0;
    const gstRate = parseFloat(gstPercentage) || 0;

    const discountedPrice = price - price * (discount / 100);
    const gstAmount = gstEnabled ? discountedPrice * (gstRate / 100) : 0;
    const totalAmount = discountedPrice + gstAmount;

    // For editing, remaining balance calculation is diff because payments are already in DB
    // But this local calc is for the "proposed" totals.
    const paidAlready = booking?.totalPaid || 0;
    const newAdvance = parseFloat(advancePayment) || 0;

    return {
      subtotal: price,
      discountAmount: price * (discount / 100),
      gstAmount,
      totalAmount,
      remainingBalance: totalAmount - paidAlready - newAdvance,
    };
  };

  const { subtotal, discountAmount, gstAmount, totalAmount, remainingBalance } =
    calculateTotals();

  const handleSubmit = async () => {
    if (
      !customerName ||
      !customerMobile ||
      !startDate ||
      !endDate ||
      !basePrice
    ) {
      toast({
        title: "Missing Information",
        description:
          "Please fill in all required fields (Customer, Dates, Price)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      if (startDateTime >= endDateTime) {
        throw new Error("End time must be after start time");
      }

      const payload = {
        customerName,
        customerMobile,
        eventType,
        startDate: startDateTime,
        endDate: endDateTime,
        basePrice: parseFloat(basePrice),
        gstEnabled,
        gstPercentage: parseFloat(gstPercentage),
        discountPercent: parseFloat(discountPercent),
        totalAmount,
        notes,
        guestCount: parseInt(guestCount) || 0,
      };

      if (isEditing) {
        const result = await updateGardenBooking(booking.id, payload);
        if (result.success) {
          toast({ title: "Booking Updated", description: "Changes saved successfully" });
          onSuccess?.();
          onClose();
        } else {
          throw new Error(result.error || "Failed to update booking");
        }
      } else {
        const result = await createGardenBooking({
          ...payload,
          advancePayment: parseFloat(advancePayment) || 0,
        });

        if ('booking' in result && result.booking) {
          toast({
            title: "Booking Created",
            description: `Event scheduled for ${customerName}`,
          });

          // Print receipt if advance payment was made
          if (parseFloat(advancePayment) > 0) {
            // Fetch fresh settings right before printing to avoid stale data
            getBusinessSettings().then(freshSettings => {
              setTimeout(() => {
                printGardenReceipt(result.booking, freshSettings || businessSettings);
              }, 500);
            }).catch(() => {
              setTimeout(() => {
                printGardenReceipt(result.booking, businessSettings);
              }, 500);
            });
          }

          onSuccess?.();
          onClose();
        } else if ('error' in result) {
          throw new Error(result.error || "Failed to create booking");
        }
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !loading && !open && onClose()}
    >
      <DialogContent className="max-w-[70vw] max-h-[90vh] overflow-y-auto bg-black/90 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-400">
            {isEditing ? "Update Garden Booking" : "New Garden Booking"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
          {/* LEFT COLUMN: Event Details */}
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="bg-emerald-500/20 p-1 rounded text-emerald-400 border border-emerald-500/30">
                  1
                </span>
                Customer Details
              </h3>

              <CustomerLookup onSelectCustomer={handleCustomerSelect} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name" className="text-white/70">Name *</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Guest Name"
                    className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-mobile" className="text-white/70">Mobile *</Label>
                  <Input
                    id="customer-mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="Mobile Number"
                    className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="bg-emerald-500/20 p-1 rounded text-emerald-400 border border-emerald-500/30">
                  2
                </span>
                Event Information
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-type" className="text-white/70">Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger id="event-type" className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10 text-white">
                        <SelectItem value="marriage">Marriage</SelectItem>
                        <SelectItem value="reception">Reception</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="birthday">Birthday Party</SelectItem>
                        <SelectItem value="anniversary">Anniversary</SelectItem>
                        <SelectItem value="corporate">Corporate Event</SelectItem>
                        <SelectItem value="conference">Conference/Seminar</SelectItem>
                        <SelectItem value="get-together">Get Together</SelectItem>
                        <SelectItem value="cultural">Cultural Event</SelectItem>
                        <SelectItem value="religious">Religious Ceremony</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guest-count" className="text-white/70">Total Guests</Label>
                    <Input
                      id="guest-count"
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      placeholder="Ex: 500"
                      className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-white/70">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-emerald-500/50 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-white/70">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-emerald-500/50 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-white/70">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-emerald-500/50 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="text-white/70">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-emerald-500/50 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-white/70">Notes / Special Requests</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Decorations, catering preferences, etc."
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Billing & Payment */}
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 h-full flex flex-col">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="bg-emerald-500/20 p-1 rounded text-emerald-400 border border-emerald-500/30">
                  3
                </span>
                Billing & Payment
              </h3>

              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor="base-price" className="text-base text-white/90">
                    Base Hall Price (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-white/50 font-bold">
                      ₹
                    </span>
                    <Input
                      id="base-price"
                      type="number"
                      className="pl-8 text-lg font-bold bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between border border-white/10 p-3 rounded-md bg-white/5">
                    <Label htmlFor="gst-toggle" className="text-white/90">Apply GST?</Label>
                    <Switch
                      id="gst-toggle"
                      checked={gstEnabled}
                      onCheckedChange={setGstEnabled}
                    />
                  </div>
                  <div
                    className={`space-y-2 ${!gstEnabled ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <Label htmlFor="gst-percentage" className="text-white/70">GST %</Label>
                    <Input
                      id="gst-percentage"
                      type="number"
                      value={gstPercentage}
                      onChange={(e) => setGstPercentage(e.target.value)}
                      disabled={!gstEnabled}
                      placeholder="Enter GST %"
                      min="0"
                      max="100"
                      step="0.01"
                      className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-percent" className="text-white/70">Discount (%)</Label>
                  <Input
                    id="discount-percent"
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="0"
                    className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50"
                  />
                </div>

                <div className="my-4 border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Subtotal:</span>
                    <span className="text-white">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-300">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/50">
                    <span>GST ({gstPercentage}%):</span>
                    <span>₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-white border-t border-white/10 pt-2 mt-2">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {!isEditing && (
                  <div className="space-y-2 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                    <Label htmlFor="advance-payment" className="text-emerald-400">
                      Advance Payment Received (₹)
                    </Label>
                    <Input
                      id="advance-payment"
                      type="number"
                      className="border-emerald-500/30 focus:ring-emerald-500/30 bg-black/20 text-white"
                      value={advancePayment}
                      onChange={(e) => setAdvancePayment(e.target.value)}
                      placeholder="0.00"
                    />
                    <div className="flex justify-between text-sm font-medium mt-1">
                      <span className="text-emerald-400">Remaining Balance:</span>
                      <span
                        className={
                          remainingBalance > 0
                            ? "text-red-400"
                            : "text-emerald-400"
                        }
                      >
                        ₹{remainingBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="p-3 bg-white/5 rounded border border-white/10 text-sm">
                    <span className="text-white/60">Note: </span>
                    <span className="text-white/80">Updating amounts will adjust the remaining balance calculated against total payments made so far (₹{booking?.totalPaid}).</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto border-0"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditing ? "Update Booking" : `Confirm Booking (${eventType})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

