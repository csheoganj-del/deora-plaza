"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateBill } from "@/actions/billing"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, Plus, Calculator } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

interface EditBillDialogProps {
  bill: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onBillUpdated: () => void
  businessUnit?: string
}

export default function EditBillDialog({ bill, open, onOpenChange, onBillUpdated, businessUnit }: EditBillDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // State for form data
  const [formData, setFormData] = useState({
    customerName: bill.customerName || "",
    customerMobile: bill.customerMobile || "",
    subtotal: bill.subtotal || 0,
    discountPercent: bill.discountPercent || 0,
    discountAmount: bill.discountAmount || 0,
    gstPercent: bill.gstPercent || 0,
    gstAmount: bill.gstAmount || 0,
    grandTotal: bill.grandTotal || 0,
    // address: bill.address || "", // Removed address from form data
  })

  // State for items
  const [items, setItems] = useState<any[]>([])

  // Load items on mount
  useEffect(() => {
    if (bill && open) {
      let parsedItems = []
      try {
        if (typeof bill.items === 'string') {
          try {
            parsedItems = JSON.parse(bill.items)
          } catch {
            parsedItems = []
          }
        } else if (Array.isArray(bill.items)) {
          parsedItems = bill.items
        } else {
          parsedItems = []
        }

        // Double check if the PARSED result is still a string (double-encoded JSON issue)
        if (typeof parsedItems === 'string') {
          try {
            parsedItems = JSON.parse(parsedItems)
          } catch {
            parsedItems = []
          }
        }
      } catch (e) {
        console.error("Failed to parse items:", e)
        parsedItems = []
      }
      setItems(Array.isArray(parsedItems) ? parsedItems : [])

      setFormData({
        customerName: bill.customerName || "",
        customerMobile: bill.customerMobile || "",
        subtotal: bill.subtotal || 0,
        discountPercent: bill.discountPercent || 0,
        discountAmount: bill.discountAmount || 0,
        gstPercent: bill.gstPercent || 0,
        gstAmount: bill.gstAmount || 0,
        grandTotal: bill.grandTotal || 0,
        // address: bill.address || "", // Removed address from form data
      })
    }
  }, [bill, open])

  // Auto-calculation effect
  useEffect(() => {
    // 1. Calculate Subtotal from items
    const calculatedSubtotal = items.reduce((sum, item) => {
      // Robust Check: Handle 'price' or 'unitPrice' or 'total'
      // If price is missing but total exists, infer price? No, usually price * qty.
      const price = parseFloat(item.price) || parseFloat(item.unitPrice) || 0
      const qty = parseFloat(item.quantity) || parseFloat(item.count) || 0
      return sum + (price * qty)
    }, 0)

    // If items are empty, we MIGHT want to keep the existing subtotal if it was set manually
    // But since we are calculating, we should probably respect the items.
    // However, if parsing failed, subtotal becomes 0.
    // If calculatedSubtotal is 0 and formData.subtotal is > 0 and items is empty, maybe keep it?
    // Let's stick to strict calculation for now to ensure consistency.

    // 2. Calculate Discount Amount
    let newDiscountAmount = formData.discountAmount
    if (formData.discountPercent > 0) {
      newDiscountAmount = calculatedSubtotal * (formData.discountPercent / 100)
    }

    // 3. Calculate GST
    // GST is calculated on (Subtotal - Discount)
    const taxableAmount = Math.max(0, calculatedSubtotal - newDiscountAmount)
    const newGstAmount = taxableAmount * (formData.gstPercent / 100)

    // 4. Grand Total
    const newGrandTotal = taxableAmount + newGstAmount

    setFormData(prev => ({
      ...prev,
      subtotal: parseFloat(calculatedSubtotal.toFixed(2)),
      discountAmount: parseFloat(newDiscountAmount.toFixed(2)),
      gstAmount: parseFloat(newGstAmount.toFixed(2)),
      grandTotal: Math.round(newGrandTotal)
    }))

  }, [items, formData.discountPercent, formData.gstPercent])


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: id.includes('Percent') ? parseFloat(value) || 0 : value
    }))
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData = {
        customerName: formData.customerName,
        customerMobile: formData.customerMobile,
        subtotal: formData.subtotal,
        discountPercent: formData.discountPercent,
        discountAmount: formData.discountAmount,
        gstPercent: formData.gstPercent,
        gstAmount: formData.gstAmount,
        grandTotal: formData.grandTotal,
        // Remove address from update
        // address: formData.address, // We keep it in state but maybe user wants it removed? Data integrity says keep if exists.
        // But user said "why we need customer address". 
        // If I remove the input, I can just default to existing or empty string.
        items: JSON.stringify(items)
      }

      const result = await updateBill(bill.id, updateData, businessUnit || bill.businessUnit)

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0 bg-zinc-950/95 backdrop-blur-xl border-zinc-800 text-zinc-100">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-800/50">
          <DialogTitle className="text-xl font-light tracking-wide text-zinc-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            Edit Bill Details
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Modify items and taxes. Totals are auto-calculated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Native scroll container for better reliability */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <div className="space-y-8">

              {/* Customer Details Section - Simplified */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-zinc-400">Name</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="bg-zinc-900/50 border-zinc-800 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerMobile" className="text-zinc-400">Mobile</Label>
                    <Input
                      id="customerMobile"
                      value={formData.customerMobile}
                      onChange={handleInputChange}
                      className="bg-zinc-900/50 border-zinc-800 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-zinc-800/50" />

              {/* Items Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider flex justify-between items-center">
                  Order Items
                  <span className="text-xs text-zinc-500 font-normal normal-case">(Edit qty/price to update total)</span>
                </h3>

                <div className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900/30">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                        <TableHead className="text-zinc-400 w-[40%]">Item</TableHead>
                        <TableHead className="text-zinc-400 w-[20%] text-center">Qty</TableHead>
                        <TableHead className="text-zinc-400 w-[20%] text-right">Price</TableHead>
                        <TableHead className="text-zinc-400 w-[10%] text-right">Total</TableHead>
                        <TableHead className="w-[10%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index} className="border-zinc-800/50 hover:bg-zinc-900/50">
                          <TableCell className="font-medium text-zinc-200">
                            {item.name || "Unknown Item"}
                            {item.variant && <span className="text-xs text-zinc-500 block">{item.variant}</span>}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || item.count || 0}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                              className="h-8 w-20 mx-auto text-center bg-zinc-950 border-zinc-800 focus:ring-indigo-500/20"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              value={item.price || item.unitPrice || 0}
                              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                              className="h-8 w-24 ml-auto text-right bg-zinc-950 border-zinc-800 focus:ring-indigo-500/20"
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono text-zinc-300">
                            {(
                              ((parseFloat(item.price) || parseFloat(item.unitPrice) || 0) *
                                (parseFloat(item.quantity) || parseFloat(item.count) || 0))
                            ).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-amber-500/50">⚠ No items found or parsing failed.</span>
                              <span className="text-xs">Subtotal will be 0.</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator className="bg-zinc-800/50" />

              {/* Calculation Section - Simplified Inputs */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Taxes & Discounts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountPercent" className="text-zinc-400 text-xs">Discount %</Label>
                    <Input
                      id="discountPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercent}
                      onChange={handleInputChange}
                      className="bg-zinc-900/50 border-zinc-800 text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstPercent" className="text-zinc-400 text-xs">GST %</Label>
                    <Input
                      id="gstPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.gstPercent}
                      onChange={handleInputChange}
                      className="bg-zinc-900/50 border-zinc-800 text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Calculations Pinned */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-xs text-zinc-400 flex gap-4">
                <span>Sub: <span className="text-zinc-200">₹{formData.subtotal}</span></span>
                <span>Disc: <span className="text-emerald-400">-₹{formData.discountAmount}</span></span>
                <span>GST: <span className="text-zinc-200">+₹{formData.gstAmount}</span></span>
              </div>
              <div className="text-lg font-bold text-indigo-400">
                Total: ₹{formData.grandTotal.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

