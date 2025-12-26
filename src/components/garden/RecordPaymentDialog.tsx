"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, IndianRupee } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addGardenBookingPayment } from "@/actions/garden"

interface RecordPaymentDialogProps {
  booking: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: (booking?: any) => void
}

export function RecordPaymentDialog({
  booking,
  isOpen,
  onClose,
  onSuccess
}: RecordPaymentDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentType, setPaymentType] = useState("partial")
  const [notes, setNotes] = useState("")

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      })
      return
    }

    const paymentAmount = parseFloat(amount)
    if (paymentAmount > booking.remainingBalance) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount cannot exceed remaining balance",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const result = await addGardenBookingPayment(booking.id, paymentAmount, paymentType as any)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Payment Recorded",
        description: `₹${paymentAmount.toLocaleString()} payment recorded successfully`
      })

      onSuccess?.(result.booking)
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const remainingBalance = booking?.remainingBalance || 0

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && amount && parseFloat(amount) > 0) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-label="Record payment">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-[#F8FAFC] p-3 sm:p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="text-sm text-[#9CA3AF]">Customer</p>
                <p className="font-medium">{booking?.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#9CA3AF]">Event</p>
                <p className="font-medium capitalize">{booking?.eventType}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#9CA3AF]">Total Amount</p>
              <p className="font-medium">₹{booking?.totalAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[#9CA3AF]">Remaining Balance</p>
              <p className={`font-medium ${remainingBalance > 0 ? "text-[#EF4444]" : "text-[#22C55E]"}`}>
                ₹{remainingBalance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (₹)*</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-[#9CA3AF]" aria-hidden="true" />
              <Input
                id="amount"
                type="number"
                className="pl-8"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                max={remainingBalance}
                step="0.01"
                onKeyDown={handleKeyDown}
                aria-describedby="amount-help"
              />
            </div>
            <p id="amount-help" className="text-xs text-[#9CA3AF]">
              Max: ₹{remainingBalance.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-type">Payment Type</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger id="payment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advance">Advance Payment</SelectItem>
                <SelectItem value="partial">Partial Payment</SelectItem>
                <SelectItem value="final">Final Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Payment notes or reference..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              aria-describedby="notes-help"
            />
            <p id="notes-help" className="text-xs text-[#9CA3AF]">
              Optional
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} aria-label="Cancel payment recording">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="bg-[#22C55E] hover:bg-[#16A34A]"
            aria-label="Record payment"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

