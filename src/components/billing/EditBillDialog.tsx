"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateBill } from "@/actions/billing"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface EditBillDialogProps {
  bill: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onBillUpdated: () => void
}

export default function EditBillDialog({ bill, open, onOpenChange, onBillUpdated }: EditBillDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: bill.customerName || "",
    customerMobile: bill.customerMobile || "",
    subtotal: bill.subtotal || 0,
    discountPercent: bill.discountPercent || 0,
    discountAmount: bill.discountAmount || 0,
    gstPercent: bill.gstPercent || 0,
    gstAmount: bill.gstAmount || 0,
    grandTotal: bill.grandTotal || 0,
    address: bill.address || "",
    items: bill.items ? (Array.isArray(bill.items) ? JSON.stringify(bill.items, null, 2) : bill.items) : "[]"
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: id.includes('Amount') || id.includes('Percent') || id.includes('Total') ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Parse items if they're in JSON format
      let items = formData.items
      try {
        items = JSON.parse(formData.items)
      } catch (e) {
        // If parsing fails, keep as string
      }
      
      const updateData = {
        customerName: formData.customerName,
        customerMobile: formData.customerMobile,
        subtotal: formData.subtotal,
        discountPercent: formData.discountPercent,
        discountAmount: formData.discountAmount,
        gstPercent: formData.gstPercent,
        gstAmount: formData.gstAmount,
        grandTotal: formData.grandTotal,
        address: formData.address,
        items: items
      }
      
      const result = await updateBill(bill.id, updateData)
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Bill updated successfully!",
        })
        onBillUpdated()
        onOpenChange(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update bill",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Bill</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerMobile">Customer Mobile</Label>
            <Input
              id="customerMobile"
              value={formData.customerMobile}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subtotal">Subtotal</Label>
            <Input
              id="subtotal"
              type="number"
              step="0.01"
              value={formData.subtotal}
              onChange={handleChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountPercent">Discount %</Label>
              <Input
                id="discountPercent"
                type="number"
                step="0.01"
                value={formData.discountPercent}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount Amount</Label>
              <Input
                id="discountAmount"
                type="number"
                step="0.01"
                value={formData.discountAmount}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gstPercent">GST %</Label>
              <Input
                id="gstPercent"
                type="number"
                step="0.01"
                value={formData.gstPercent}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gstAmount">GST Amount</Label>
              <Input
                id="gstAmount"
                type="number"
                step="0.01"
                value={formData.gstAmount}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="grandTotal">Grand Total</Label>
            <Input
              id="grandTotal"
              type="number"
              step="0.01"
              value={formData.grandTotal}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="items">Items (JSON)</Label>
            <Textarea
              id="items"
              value={formData.items}
              onChange={handleChange}
              rows={6}
              className="font-mono text-xs"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

