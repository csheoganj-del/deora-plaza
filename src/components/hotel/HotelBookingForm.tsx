"use client";

import { useState, useEffect } from "react";
import { Room } from "@/actions/hotel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, IndianRupee, Percent } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import CustomerAutocomplete from "@/components/billing/CustomerAutocomplete";
import { getCustomerDiscountInfo } from "@/actions/customers";
import { getDefaultDiscount, calculateCustomerTier } from "@/lib/discount-utils";
import { createClient } from "@/lib/supabase/client";

const bookingSchema = z.object({
  guestName: z.string().min(1, "Guest name is required"),
  guestMobile: z.string().min(10, "Valid mobile number is required"),
  roomId: z.string().min(1, "Room selection is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  adults: z.number().min(1, "At least one adult is required"),
  children: z.number().min(0, "Children count must be 0 or more"),
  advancePayment: z.number().min(0, "Advance payment cannot be negative"),
  advancePaymentMethod: z.string().optional(),
  notes: z.string().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

type HotelBookingFormProps = {
  rooms: Room[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  initialRoomId?: string;
};

export default function HotelBookingForm({
  rooms,
  onSubmit,
  onCancel,
  loading = false,
  initialRoomId
}: HotelBookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      adults: 1,
      children: 0,
      advancePayment: 0,
      roomId: initialRoomId,
      discountPercent: 0
    }
  });

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
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
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstPercentage, setGstPercentage] = useState(18); // Default to 18%
  const [conflictMessage, setConflictMessage] = useState<string>("");

  const selectedRoomId = watch("roomId");
  const selectedRoom = rooms.find(room => room.id === selectedRoomId);
  const start = watch("startDate");
  const end = watch("endDate");
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  const nights = startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const basePrice = selectedRoom ? selectedRoom.price * nights : 0;
  const discountAmount = (basePrice * discountPercent) / 100;
  const discountedAmount = basePrice - discountAmount;
  const gstAmount = gstEnabled ? (discountedAmount * gstPercentage) / 100 : 0;
  const finalAmount = discountedAmount + gstAmount;

  useEffect(() => {
    async function checkConflicts() {
      try {
        setConflictMessage("");
        if (!selectedRoomId || !startDate || !endDate) return;
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
        const client = createClient();
        const { data, error } = await client
          .from('bookings')
          .select('*')
          .eq('type', 'hotel')
          .eq('roomId', selectedRoomId);
        if (error) return;
        const overlaps: any[] = (data || []).filter((b: any) => {
          const bStart = new Date(b.startDate);
          const bEnd = new Date(b.endDate);
          const active = b.status === 'confirmed' || b.status === 'checked-in';
          return active && startDate! < bEnd && endDate! > bStart;
        });
        if (overlaps.length > 0) {
          const b = overlaps[0];
          setConflictMessage(`Room is booked from ${new Date(b.startDate).toLocaleDateString()} to ${new Date(b.endDate).toLocaleDateString()}`);
        }
      } catch { }
    }
    checkConflicts();
  }, [selectedRoomId, startDate?.getTime(), endDate?.getTime()]);

  // Handle customer selection
  const handleCustomerSelect = async (customer: any) => {
    setSelectedCustomer(customer);

    if (customer) {
      // Auto-apply discount based on customer tier
      try {
        const discountInfo = await getCustomerDiscountInfo(customer.id);
        if (discountInfo) {
          const discount = discountInfo.customDiscountPercent ||
            getDefaultDiscount(discountInfo.tier as any) || 0;
          setDiscountPercent(discount);
          setValue("discountPercent", discount);
        }
      } catch (error) {
        console.error("Error fetching customer discount info:", error);
      }
    } else {
      // Clear discount when customer is deselected
      setDiscountPercent(0);
      setValue("discountPercent", 0);
    }
  };

  const handleFormSubmit = (data: BookingFormData) => {
    const formData = {
      ...data,
      totalAmount: finalAmount,
      basePrice,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      roomNumber: selectedRoom?.number || "",
      customerId: selectedCustomer?.id || null,
      discountPercent: discountPercent,
      gstEnabled: gstEnabled,
      gstPercentage: gstPercentage,
      location
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guest Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Guest Information</h3>

          {/* Customer Autocomplete */}
          <CustomerAutocomplete
            onCustomerSelect={handleCustomerSelect}
            onNameChange={(name) => setValue("guestName", name)}
            onMobileChange={(mobile) => setValue("guestMobile", mobile)}
          />

          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name *</Label>
            <Input
              id="guestName"
              {...register("guestName")}
              placeholder="Enter guest name"
            />
            {errors.guestName && (
              <p className="text-sm text-[#FEE2E2]0">{errors.guestName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestMobile">Mobile Number *</Label>
            <Input
              id="guestMobile"
              {...register("guestMobile")}
              placeholder="Enter mobile number"
            />
            {errors.guestMobile && (
              <p className="text-sm text-[#FEE2E2]0">{errors.guestMobile.message}</p>
            )}
          </div>
        </div>

        {/* Booking Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Booking Information</h3>

          <div className="space-y-2">
            <Label htmlFor="roomId">Room *</Label>
            <Select
              onValueChange={(value) => setValue("roomId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms
                  .filter(room => room.status === 'available')
                  .map((room) => (
                    <SelectItem key={room.id} value={room.id!}>
                      Room {room.number} - {room.type} (₹{room.price})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.roomId && (
              <p className="text-sm text-[#FEE2E2]0">{errors.roomId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Check-in Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-sm text-[#FEE2E2]0">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Check-out Date *</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-sm text-[#FEE2E2]0">{errors.endDate.message}</p>
              )}
            </div>
          </div>
          {conflictMessage && (
            <div className="rounded border border-red-300 bg-[#FEE2E2] text-[#DC2626] p-2 text-sm">
              {conflictMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adults">Adults *</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                {...register("adults", { valueAsNumber: true })}
              />
              {errors.adults && (
                <p className="text-sm text-[#FEE2E2]0">{errors.adults.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min="0"
                {...register("children", { valueAsNumber: true })}
              />
              {errors.children && (
                <p className="text-sm text-[#FEE2E2]0">{errors.children.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discount Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Discount Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discountPercent">Discount (%)</Label>
            <div className="relative">
              <Input
                id="discountPercent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={discountPercent}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setDiscountPercent(value);
                  setValue("discountPercent", value);
                }}
                className="pr-8"
              />
              <Percent className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Discount Amount</Label>
            <div className="flex items-center gap-2 p-3 bg-[#F8FAFC] rounded-md">
              <IndianRupee className="h-4 w-4" />
              <span className="text-lg font-semibold">{discountAmount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Final Amount</Label>
            <div className="flex items-center gap-2 p-3 bg-[#EDEBFF]/30 rounded-md">
              <IndianRupee className="h-4 w-4" />
              <span className="text-lg font-semibold">{finalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* GST Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">GST Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="gstEnabled"
              checked={gstEnabled}
              onCheckedChange={(checked) => setGstEnabled(!!checked)}
            />
            <Label htmlFor="gstEnabled">Enable GST</Label>
          </div>

          {gstEnabled && (
            <div className="space-y-2">
              <Label htmlFor="gstPercentage">GST Percentage</Label>
              <div className="relative">
                <Input
                  id="gstPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
                  className="pr-8"
                />
                <Percent className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          {gstEnabled && (
            <div className="space-y-2">
              <Label>GST Amount</Label>
              <div className="flex items-center gap-2 p-3 bg-[#F8FAFC] rounded-md">
                <IndianRupee className="h-4 w-4" />
                <span className="text-lg font-semibold">{gstAmount?.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Total Amount (Room x Nights)</Label>
            <div className="flex items-center gap-2 p-3 bg-[#F8FAFC] rounded-md">
              <IndianRupee className="h-4 w-4" />
              <span className="text-lg font-semibold">{basePrice?.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advancePayment">Advance Payment</Label>
            <Input
              id="advancePayment"
              type="number"
              min="0"
              {...register("advancePayment", { valueAsNumber: true })}
            />
            {errors.advancePayment && (
              <p className="text-sm text-[#FEE2E2]0">{errors.advancePayment.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="advancePaymentMethod">Payment Method</Label>
            <Select
              onValueChange={(value) => setValue("advancePaymentMethod", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Any special requests or notes"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !!conflictMessage}>
          {loading ? "Creating..." : "Create Booking"}
        </Button>
      </div>
    </form>
  );
}

