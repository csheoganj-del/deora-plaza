"use client";

import { useState, useEffect } from "react";
import { createGardenBooking } from "@/actions/garden";
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
import CustomerLookup from "@/components/cafe/CustomerLookup";

interface GardenBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GardenBookingDialog({
  isOpen,
  onClose,
  onSuccess,
}: GardenBookingDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => { console.error(error); }
      );
    }
  }, []);

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

    return {
      subtotal: price,
      discountAmount: price * (discount / 100),
      gstAmount,
      totalAmount,
      remainingBalance: totalAmount - (parseFloat(advancePayment) || 0),
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

      const result = await createGardenBooking({
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
        advancePayment: parseFloat(advancePayment) || 0,
        notes,
        guestCount: parseInt(guestCount) || 0,
        location
      });

      if ('booking' in result && result.booking) {
        toast({
          title: "Booking Created",
          description: `Event scheduled for ${customerName}`,
        });

        // Print receipt if advance payment was made
        if (parseFloat(advancePayment) > 0) {
          setTimeout(() => {
            printGardenReceipt(result.booking, "advance");
          }, 500);
        }

        onSuccess?.();
        onClose();
      } else if ('error' in result) {
        throw new Error(result.error || "Failed to create booking");
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
      <DialogContent className="max-w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900">
            New Garden Booking
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
          {/* LEFT COLUMN: Event Details */}
          <div className="space-y-6">
            <div className="bg-[#F8FAFC] p-6 rounded-lg border border-[#E5E7EB]">
              <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                <span className="bg-[#BBF7D0] p-1 rounded text-[#22C55E]">
                  1
                </span>
                Customer Details
              </h3>

              <CustomerLookup onSelectCustomer={handleCustomerSelect} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Name *</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Guest Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-mobile">Mobile *</Label>
                  <Input
                    id="customer-mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="Mobile Number"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-6 rounded-lg border border-[#E5E7EB]">
              <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                <span className="bg-[#BBF7D0] p-1 rounded text-[#22C55E]">
                  2
                </span>
                Event Information
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger id="event-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Label htmlFor="guest-count">Total Guests</Label>
                    <Input
                      id="guest-count"
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      placeholder="Ex: 500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes / Special Requests</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Decorations, catering preferences, etc."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Billing & Payment */}
          <div className="space-y-6">
            <div className="bg-[#F8FAFC] p-6 rounded-lg border border-[#E5E7EB] h-full flex flex-col">
              <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                <span className="bg-[#BBF7D0] p-1 rounded text-[#22C55E]">
                  3
                </span>
                Billing & Payment
              </h3>

              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor="base-price" className="text-base">
                    Base Hall Price (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#9CA3AF] font-bold">
                      ₹
                    </span>
                    <Input
                      id="base-price"
                      type="number"
                      className="pl-8 text-lg font-bold"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between border p-3 rounded-md bg-white">
                    <Label htmlFor="gst-toggle">Apply GST?</Label>
                    <Switch
                      id="gst-toggle"
                      checked={gstEnabled}
                      onCheckedChange={setGstEnabled}
                    />
                  </div>
                  <div
                    className={`space-y-2 ${!gstEnabled ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <Label htmlFor="gst-percentage">GST %</Label>
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-percent">Discount (%)</Label>
                  <Input
                    id="discount-percent"
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="my-4 border-t border-[#E5E7EB] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#FEE2E2]0">
                    <span>Discount ({discountPercent}%):</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#9CA3AF]">
                    <span>GST ({gstPercentage}%):</span>
                    <span>₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-[#111827] border-t pt-2 mt-2">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2 bg-[#DCFCE7] p-3 rounded-lg border border-[#BBF7D0]">
                  <Label htmlFor="advance-payment" className="text-emerald-800">
                    Advance Payment Received (₹)
                  </Label>
                  <Input
                    id="advance-payment"
                    type="number"
                    className="border-emerald-300 focus:ring-[#DCFCE7]0"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(e.target.value)}
                    placeholder="0.00"
                  />
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span className="text-[#16A34A]">Remaining Balance:</span>
                    <span
                      className={
                        remainingBalance > 0
                          ? "text-[#EF4444]"
                          : "text-[#22C55E]"
                      }
                    >
                      ₹{remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#22C55E] hover:bg-[#16A34A] w-full sm:w-auto"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm Booking ({eventType})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

