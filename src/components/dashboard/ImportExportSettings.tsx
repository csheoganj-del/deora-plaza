"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, Upload, FileJson, AlertCircle } from "lucide-react"
import { getBusinessSettings, updateBusinessSettings } from "@/actions/businessSettings"
import { useToast } from "@/hooks/use-toast"
import { createBill } from "@/actions/billing"

interface ImportExportSettingsProps {
  onSettingsImported?: () => void
}

export function ImportExportSettings({ onSettingsImported }: ImportExportSettingsProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [importData, setImportData] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleExportSettings = async () => {
    try {
      // Get current business settings
      const settings = await getBusinessSettings()
      
      // Get bills data
      const response = await fetch('/api/bills')
      const bills = await response.json()
      
      // Combine settings and bills
      const exportData = {
        settings,
        bills,
        exportDate: new Date().toISOString(),
        version: "1.0"
      }
      
      // Create download link
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export Successful",
        description: "Settings and bills exported successfully!",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export settings and bills",
        variant: "destructive",
      })
    }
  }

  const handleImportSettings = async () => {
    try {
      setError(null)
      const data = JSON.parse(importData)
      
      // Validate data structure
      if (!data.settings || !data.bills) {
        throw new Error("Invalid data format. Expected 'settings' and 'bills' properties.")
      }
      
      // Import business settings
      const settingsResult = await updateBusinessSettings(data.settings)
      if (!settingsResult.success) {
        throw new Error(`Failed to import settings: ${settingsResult.error}`)
      }
      
      // Import bills
      let importedBills = 0
      for (const bill of data.bills) {
        try {
          // Prepare bill data for import
          const billData = {
            orderId: bill.orderId || '',
            businessUnit: bill.businessUnit || 'cafe',
            customerMobile: bill.customerMobile || null,
            customerName: bill.customerName || null,
            subtotal: bill.subtotal || 0,
            discountPercent: bill.discountPercent || 0,
            discountAmount: bill.discountAmount || 0,
            gstPercent: bill.gstPercent || 0,
            gstAmount: bill.gstAmount || 0,
            grandTotal: bill.grandTotal || 0,
            paymentMethod: bill.paymentMethod || 'cash',
            paymentStatus: bill.paymentStatus || 'paid',
            source: bill.source || 'dine-in',
            address: bill.address || null,
            items: bill.items || []
          }
          
          // Create the bill
          const result = await createBill(billData)
          if (result.success) {
            importedBills++
          }
        } catch (billError) {
          console.warn('Failed to import bill:', billError)
          // Continue with other bills
        }
      }
      
      toast({
        title: "Import Successful",
        description: `Settings and ${importedBills} bills imported successfully!`,
      })
      setIsOpen(false)
      setImportData("")
      onSettingsImported?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Invalid JSON format"
      setError(errorMessage)
      toast({
        title: "Import Failed",
        description: `Import failed: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        setImportData(content)
      } catch (error) {
        setError("Failed to read file")
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileJson className="h-4 w-4 mr-2" />
          Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import/Export Dashboard Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleExportSettings} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            
            <Button 
              onClick={() => {
                // Trigger file input click
                const fileInput = document.getElementById('import-file-input')
                fileInput?.click()
              }}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Settings
            </Button>
            
            <input
              id="import-file-input"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="import-data">Import Data (JSON)</Label>
            <Textarea
              id="import-data"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='Paste JSON data or upload a file...'
              rows={6}
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] text-[#DC2626] rounded-md text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <Button 
            onClick={handleImportSettings}
            disabled={!importData}
          >
            Import Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

