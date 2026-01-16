import { useState, useEffect } from "react";
import { Room } from "@/actions/hotel";
import {
  GlassButton,
  GlassInput,
  GlassLabel,
  GlassSelect,
  GlassTextarea
} from "@/components/ui/glass/GlassFormComponents";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, IndianRupee, Percent, CreditCard, User, Users, Calendar } from "lucide-react";
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

import { HotelBooking } from "@/actions/hotel";

type HotelBookingFormProps = {
  rooms: Room[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  initialRoomId?: string;
  existingBooking?: HotelBooking;
};

export default function HotelBookingForm({
  rooms,
  onSubmit,
  onCancel,
  loading = false,
  initialRoomId,
  existingBooking
}: HotelBookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    getValues
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestName: existingBooking?.guestName || "",
      guestMobile: existingBooking?.customerMobile || "",
      roomId: existingBooking?.roomId || initialRoomId || "",
      startDate: existingBooking?.startDate ? format(new Date(existingBooking.startDate), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: existingBooking?.endDate ? format(new Date(existingBooking.endDate), "yyyy-MM-dd'T'HH:mm") : format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      adults: existingBooking?.guestCount || 1,
      children: 0,
      advancePayment: existingBooking?.advancePayment || 0,
      advancePaymentMethod: "cash",
      notes: existingBooking?.notes || "",
      discountPercent: existingBooking?.discountPercent || 0,
    }
  });

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
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

  // Force set default dates on mount if not present
  useEffect(() => {
    if (!existingBooking) {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Ensure format matches datetime-local (YYYY-MM-DDTHH:mm)
      if (!getValues("startDate")) {
        setValue("startDate", format(now, "yyyy-MM-dd'T'HH:mm"));
      }
      if (!getValues("endDate")) {
        setValue("endDate", format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
      }
    }
  }, [existingBooking, setValue]);

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
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN: Input Details */}
          <div className="space-y-6">

            {/* Guest Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                Guest Details
              </h3>

              <div className="bg-white/5 rounded-xl p-4 space-y-4 border border-white/5">
                <CustomerAutocomplete
                  onCustomerSelect={handleCustomerSelect}
                  onNameChange={(name) => setValue("guestName", name)}
                  onMobileChange={(mobile) => setValue("guestMobile", mobile)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <GlassLabel htmlFor="guestName">Guest Name *</GlassLabel>
                    <GlassInput
                      id="guestName"
                      {...register("guestName")}
                      placeholder="Name"
                      icon={<User className="w-4 h-4" />}
                    />
                    {errors.guestName && <p className="text-xs text-rose-400">{errors.guestName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <GlassLabel htmlFor="guestMobile">Mobile *</GlassLabel>
                    <GlassInput
                      id="guestMobile"
                      {...register("guestMobile")}
                      placeholder="Number"
                      icon={<User className="w-4 h-4" />}
                    />
                    {errors.guestMobile && <p className="text-xs text-rose-400">{errors.guestMobile.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" />
                Stay Details
              </h3>

              <div className="bg-white/5 rounded-xl p-4 space-y-4 border border-white/5">
                <div className="space-y-1.5">
                  <GlassLabel htmlFor="roomId">Room Selection *</GlassLabel>
                  <GlassSelect id="roomId" {...register("roomId")}>
                    <option value="" className="bg-[#1a1a1a]">Select Room</option>
                    {rooms
                      .filter(room => room.status === 'available' || room.id === initialRoomId)
                      .map((room) => (
                        <option key={room.id} value={room.id!} className="bg-[#1a1a1a] text-white">
                          Room {room.number} - {room.type} (₹{room.price})
                        </option>
                      ))}
                  </GlassSelect>
                  {errors.roomId && <p className="text-xs text-rose-400">{errors.roomId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <GlassLabel htmlFor="startDate">Check-in *</GlassLabel>
                    <GlassInput
                      id="startDate"
                      type="datetime-local"
                      {...register("startDate")}
                    />
                    {errors.startDate && <p className="text-xs text-rose-400">{errors.startDate.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <GlassLabel htmlFor="endDate">Check-out *</GlassLabel>
                    <GlassInput
                      id="endDate"
                      type="datetime-local"
                      {...register("endDate")}
                    />
                    {errors.endDate && <p className="text-xs text-rose-400">{errors.endDate.message}</p>}
                  </div>
                </div>
                {conflictMessage && (
                  <div className="rounded border border-red-500/50 bg-red-500/10 text-red-200 p-2 text-xs">
                    {conflictMessage}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <GlassLabel htmlFor="adults">Adults</GlassLabel>
                    <GlassInput
                      id="adults"
                      type="number"
                      min="1"
                      {...register("adults", { valueAsNumber: true })}
                      icon={<Users className="w-4 h-4" />}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <GlassLabel htmlFor="children">Children</GlassLabel>
                    <GlassInput
                      id="children"
                      type="number"
                      min="0"
                      {...register("children", { valueAsNumber: true })}
                      icon={<Users className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Financials & Payment */}
          <div className="space-y-6">

            {/* Financial Summary */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 h-fit">
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
                Payment Breakdown
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-white/60">
                  <span>Room Charges ({nights} nights)</span>
                  <span>₹{basePrice?.toLocaleString()}</span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">Discount</span>
                    <div className="w-20">
                      <GlassInput
                        type="number"
                        min="0" max="100"
                        className="h-7 text-xs px-2"
                        value={discountPercent}
                        onChange={(e: any) => {
                          const val = parseFloat(e.target.value) || 0;
                          setDiscountPercent(val);
                          setValue("discountPercent", val);
                        }}
                        placeholder="%"
                      />
                    </div>
                  </div>
                  <span className="text-emerald-400">- ₹{discountAmount.toFixed(2)}</span>
                </div>

                {/* GST */}
                <div className="flex items-start justify-between gap-4 py-2 border-t border-white/5 border-b">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="gstEnabled"
                        checked={gstEnabled}
                        onCheckedChange={(c) => setGstEnabled(!!c)}
                        className="data-[state=checked]:bg-emerald-500 border-white/20 w-4 h-4"
                      />
                      <label htmlFor="gstEnabled" className="text-white/80 cursor-pointer select-none">GST ({gstPercentage}%)</label>
                    </div>
                  </div>
                  <span className="text-white/80">+ ₹{gstAmount.toFixed(2)}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold text-white">Grand Total</span>
                  <span className="text-2xl font-bold text-emerald-400">₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Advance Payment */}
              <div className="mt-6 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-3">
                <div className="space-y-1.5">
                  <GlassLabel htmlFor="advancePayment" className="text-emerald-200">Advance Payment</GlassLabel>
                  <GlassInput
                    id="advancePayment"
                    type="number"
                    className="border-emerald-500/20 focus:border-emerald-500/50 bg-emerald-500/5"
                    {...register("advancePayment", { valueAsNumber: true })}
                    icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
                  />
                </div>
                <div className="space-y-1.5">
                  <GlassLabel className="text-emerald-200">Payment Method</GlassLabel>
                  <GlassSelect id="advancePaymentMethod" {...register("advancePaymentMethod")} className="border-emerald-500/20 bg-emerald-500/5 text-emerald-100">
                    <option value="" className="bg-[#0f1f15]">Select Method</option>
                    <option value="cash" className="bg-[#0f1f15]">Cash</option>
                    <option value="card" className="bg-[#0f1f15]">Card</option>
                    <option value="upi" className="bg-[#0f1f15]">UPI</option>
                    <option value="bank_transfer" className="bg-[#0f1f15]">Bank Transfer</option>
                  </GlassSelect>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <GlassLabel htmlFor="notes">Additional Notes</GlassLabel>
              <GlassTextarea
                id="notes"
                {...register("notes")}
                placeholder="Special requests..."
                className="h-20"
              />
            </div>

          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-[#1a1a1a]/50 backdrop-blur-xl">
        <GlassButton type="button" variant="secondary" onClick={onCancel} className="w-32">
          Cancel
        </GlassButton>
        <GlassButton type="submit" variant="primary" disabled={loading || !!conflictMessage} className="w-48">
          {loading ? "Creating..." : "Confirm Booking"}
        </GlassButton>
      </div>
    </form>
  );
}

