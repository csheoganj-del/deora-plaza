"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { IndianRupee, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useToast } from "@/hooks/use-toast"
import { addHotelPayment } from "@/actions/hotel"

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

      const result = await addHotelPayment(booking.id, payment)

      if (result.error) {
        throw new Error(String(result.error || 'Unknown error'))
      }

      toast({
        title: "Payment Recorded",
        description: `Successfully recorded payment of ₹${paymentAmount.toLocaleString()}`,
      })

      // Notify success
      onSuccess?.()
      
      // Close the dialog
      onClose()
    } catch (error: any) {
      console.error("Error recording payment:", error)
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount (₹)
              <span className="text-muted-foreground ml-2 text-sm">
                Remaining: ₹{remainingBalance.toLocaleString()}
              </span>
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                placeholder="Enter amount"
                min={0}
                max={remainingBalance}
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select value={paymentType} onValueChange={handlePaymentTypeChange}>
                <SelectTrigger id="paymentType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="full">Full Settlement</SelectItem>
                  <SelectItem value="settlement">Final Settlement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={(value) => setPaymentMethod(value)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes"
            />
          </div>

          {paymentType === 'full' && (
            <div className="p-3 bg-[#F59E0B]/10 text-[#F59E0B]800 rounded-md text-sm">
              <p className="font-medium">Full Settlement</p>
              <p className="mt-1">
                This will mark the booking as fully paid. Remaining balance: ₹{remainingBalance.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Record Payment (₹${parseFloat(amount).toLocaleString()})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

