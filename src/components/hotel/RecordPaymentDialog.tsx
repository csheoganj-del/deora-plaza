"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { IndianRupee, Loader2, CreditCard, Wallet } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { addHotelPayment } from "@/actions/hotel"
import { GlassButton, GlassInput, GlassSelect } from "@/components/ui/glass/GlassFormComponents"
import { PremiumLiquidGlass } from "@/components/ui/glass/premium-liquid-glass"

type PaymentType = 'advance' | 'full' | 'partial' | 'settlement'

interface RecordPaymentDialogProps {
  booking: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: (updatedBooking?: any) => void
}

export function RecordPaymentDialog({
  booking,
  isOpen,
  onClose,
  onSuccess
}: RecordPaymentDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentType, setPaymentType] = useState<PaymentType>("partial")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [notes, setNotes] = useState("")
  const [remainingBalance, setRemainingBalance] = useState(booking?.remainingBalance || 0)

  // Reset form when dialog opens/closes or booking changes
  useEffect(() => {
    if (isOpen && booking) {
      setRemainingBalance(booking.remainingBalance || 0)
      // Set default amount to remaining balance if it's a full payment
      if (paymentType === 'full') {
        setAmount(booking.remainingBalance.toString())
      } else {
        setAmount("")
      }
    }
  }, [isOpen, booking, paymentType])

  const handleSubmit = async () => {
    if (!booking?.id) {
      toast({
        title: "Error",
        description: "No booking selected",
        variant: "destructive"
      })
      return
    }

    const paymentAmount = parseFloat(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      })
      return
    }

    if (paymentAmount > remainingBalance) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount cannot exceed remaining balance",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Create payment object
      const payment = {
        amount: paymentAmount,
        type: paymentType,
        method: paymentMethod,
        notes: notes || undefined,
        date: new Date().toISOString()
      }

      console.log('[RecordPaymentDialog] Submitting payment:', payment)
      const result = await addHotelPayment(booking.id, payment)
      console.log('[RecordPaymentDialog] Payment result:', result)

      if (result.error) {
        console.error('[RecordPaymentDialog] Payment failed with error:', result.error)
        throw new Error(String(result.error || 'Unknown error'))
      }

      if (!result.success) {
        console.error('[RecordPaymentDialog] Payment failed - success is false')
        throw new Error('Payment recording failed')
      }

      // Calculate if this payment completes the booking
      const newRemainingBalance = remainingBalance - paymentAmount
      const isFullyPaid = newRemainingBalance <= 0

      console.log('[RecordPaymentDialog] Payment successful, isFullyPaid:', isFullyPaid)

      toast({
        title: "Payment Recorded",
        description: `Successfully recorded payment of ₹${paymentAmount.toLocaleString()}${isFullyPaid ? ' - Booking completed & checked out!' : ''}`,
      })

      // AUTO-PRINT FULL RECEIPT if payment is completed
      if (isFullyPaid && result.booking) {
        console.log('[RecordPaymentDialog] Auto-printing full receipt')
        try {
          // Import settings and print utils
          const { getBusinessSettings } = await import("@/actions/businessSettings")
          const { printHotelReceipt } = await import("@/lib/print-utils")
          const settings = await getBusinessSettings()

          // Print full receipt
          printHotelReceipt(result.booking, settings, 'full')

          // Pass updated booking to parent
          onSuccess?.(result.booking)
        } catch (printError) {
          console.error("Error printing receipt:", printError)
          // Still call onSuccess with updated booking
          onSuccess?.(result.booking)
        }
      } else {
        // Notify success for partial payment
        console.log('[RecordPaymentDialog] Partial payment, calling onSuccess')
        onSuccess?.(result.booking)
      }

      // Close the dialog
      onClose()
    } catch (error: any) {
      console.error("[RecordPaymentDialog] FATAL ERROR:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentTypeChange = (value: string) => {
    setPaymentType(value as PaymentType)

    // If changing to full payment, auto-fill the remaining balance
    if (value === 'full' && remainingBalance > 0) {
      setAmount(remainingBalance.toString())
    } else if (value === 'advance' && !amount) {
      // Suggest a common advance amount if empty
      setAmount("")
    }
  }

  if (!booking) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a]/95 backdrop-blur-xl border-white/10 text-white overflow-hidden">
        <PremiumLiquidGlass className="absolute inset-0 opacity-30" />

        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center border border-emerald-500/20">
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </div>
            Record Payment
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-6 relative z-10">
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-white/80 font-medium flex items-center justify-between">
              <span>Amount (₹)</span>
              <span className="text-sm text-white/40">
                Remaining: ₹{remainingBalance.toLocaleString()}
              </span>
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <IndianRupee className="h-4 w-4 text-white/40" />
              </div>
              <GlassInput
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg font-semibold"
                placeholder="Enter amount"
                min={0}
                max={remainingBalance}
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="paymentType" className="text-white/80 font-medium">Payment Type</Label>
              <GlassSelect
                id="paymentType"
                value={paymentType}
                onChange={(e) => handlePaymentTypeChange(e.target.value)}
              >
                <option value="advance">Advance</option>
                <option value="partial">Partial</option>
                <option value="full">Full Settlement</option>
                <option value="settlement">Final Settlement</option>
              </GlassSelect>
            </div>

            <div className="space-y-3">
              <Label htmlFor="paymentMethod" className="text-white/80 font-medium">Payment Method</Label>
              <GlassSelect
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </GlassSelect>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-white/80 font-medium">Notes (Optional)</Label>
            <GlassInput
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes"
            />
          </div>

          {paymentType === 'full' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Wallet className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-amber-400">Full Settlement</p>
                  <p className="mt-1 text-sm text-white/60">
                    This will mark the booking as fully paid. Remaining balance: ₹{remainingBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="relative z-10 gap-2">
          <GlassButton
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          >
            {isLoading ? 'Processing...' : `Record Payment (₹${amount ? parseFloat(amount).toLocaleString() : '0'})`}
          </GlassButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

