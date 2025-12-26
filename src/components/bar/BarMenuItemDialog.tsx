"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createDocument, updateDocument } from "@/lib/supabase/database"

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  description: string | null
  isAvailable: boolean
  businessUnit: string
  measurement?: string | null
  measurementUnit?: string | null
  baseMeasurement?: number | null
}

interface BarMenuItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem: MenuItem | null
  businessUnit: string
  onSuccess: () => void
}

export function BarMenuItemDialog({
  open,
  onOpenChange,
  editingItem,
  businessUnit,
  onSuccess
}: BarMenuItemDialogProps) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [isAvailable, setIsAvailable] = useState(true)
  const [measurementType, setMeasurementType] = useState<"unit" | "ml">("unit")
  const [measurement, setMeasurement] = useState("")
  const [measurementUnit, setMeasurementUnit] = useState("")
  const [baseMeasurement, setBaseMeasurement] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name)
      setPrice(editingItem.price.toString())
      setCategory(editingItem.category)
      setDescription(editingItem.description || "")
      setIsAvailable(editingItem.isAvailable)

      // Set measurement values
      if (editingItem.measurement) {
        setMeasurement(editingItem.measurement)
        setMeasurementType("ml")
      } else {
        setMeasurement("")
        setMeasurementType("unit")
      }

      setMeasurementUnit(editingItem.measurementUnit || "")
      setBaseMeasurement(editingItem.baseMeasurement?.toString() || "")
    } else {
      setName("")
      setPrice("")
      setCategory("")
      setDescription("")
      setIsAvailable(true)
      setMeasurementType("unit")
      setMeasurement("")
      setMeasurementUnit("")
      setBaseMeasurement("")
    }
  }, [editingItem, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const itemData = {
        name,
        price: parseFloat(price),
        category,
        description: description || null,
        isAvailable,
        businessUnit: businessUnit === 'drinks' ? 'bar' : 'cafe',
        // explicitly set to null if not using ml measurements to clear existing values
        measurement: measurementType === "ml" ? (measurement || null) : null,
        measurementUnit: measurementType === "ml" ? (measurementUnit || null) : null,
        baseMeasurement: measurementType === "ml" && baseMeasurement ? parseFloat(baseMeasurement) : null
      }

      if (editingItem) {
        await updateDocument('menu_items', editingItem.id, itemData)
      } else {
        await createDocument('menu_items', itemData)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error("Error saving menu item:", err)
      setError("Failed to save menu item. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
          <DialogDescription>
            {editingItem
              ? "Edit the details of this menu item."
              : "Add a new item to the menu."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            {/* Measurement Type Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Serving Type
              </Label>
              <div className="col-span-3 flex gap-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="unit-serving"
                    name="measurement-type"
                    checked={measurementType === "unit"}
                    onChange={() => setMeasurementType("unit")}
                    className="mr-2"
                  />
                  <Label htmlFor="unit-serving" className="text-sm font-normal">
                    Full Unit (Bottle/Can)
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="ml-serving"
                    name="measurement-type"
                    checked={measurementType === "ml"}
                    onChange={() => setMeasurementType("ml")}
                    className="mr-2"
                  />
                  <Label htmlFor="ml-serving" className="text-sm font-normal">
                    Measured (ml)
                  </Label>
                </div>
              </div>
            </div>

            {/* ML Measurement Fields (only shown when ml serving is selected) */}
            {measurementType === "ml" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="measurement" className="text-right">
                    Measurement
                  </Label>
                  <Input
                    id="measurement"
                    value={measurement}
                    onChange={(e) => setMeasurement(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., 30ml, 60ml, 150ml"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="measurement-unit" className="text-right">
                    Unit
                  </Label>
                  <Input
                    id="measurement-unit"
                    value={measurementUnit}
                    onChange={(e) => setMeasurementUnit(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., ml, oz"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="base-measurement" className="text-right">
                    Base Size
                  </Label>
                  <Input
                    id="base-measurement"
                    type="number"
                    step="0.1"
                    value={baseMeasurement}
                    onChange={(e) => setBaseMeasurement(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., 750 for 750ml bottle"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="available" className="text-right">
                Available
              </Label>
              <Checkbox
                id="available"
                checked={isAvailable}
                onCheckedChange={(checked) => setIsAvailable(checked as boolean)}
                className="col-span-3 justify-start"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-[#FEE2E2]0 mb-4">{error}</div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

