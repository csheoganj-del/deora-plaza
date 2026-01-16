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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black/90 border-white/10 text-white" aria-label="Record payment">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white">Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-white/5 p-3 sm:p-4 rounded-lg border border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="text-sm text-white/50">Customer</p>
                <p className="font-medium text-white">{booking?.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/50">Event</p>
                <p className="font-medium capitalize text-white">{booking?.eventType}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/50">Total Amount</p>
              <p className="font-medium text-white">₹{booking?.totalAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-white/50">Remaining Balance</p>
              <p className={`font-medium ${remainingBalance > 0 ? "text-red-400" : "text-emerald-400"}`}>
                ₹{remainingBalance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white/70">Payment Amount (₹)*</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-white/50" aria-hidden="true" />
              <Input
                id="amount"
                type="number"
                className="pl-8 bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50"
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
            <p id="amount-help" className="text-xs text-white/40">
              Max: ₹{remainingBalance.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-type" className="text-white/70">Payment Type</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger id="payment-type" className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10 text-white">
                <SelectItem value="advance">Advance Payment</SelectItem>
                <SelectItem value="partial">Partial Payment</SelectItem>
                <SelectItem value="final">Final Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white/70">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Payment notes or reference..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50"
              aria-describedby="notes-help"
            />
            <p id="notes-help" className="text-xs text-white/40">
              Optional
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white" aria-label="Cancel payment recording">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
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

