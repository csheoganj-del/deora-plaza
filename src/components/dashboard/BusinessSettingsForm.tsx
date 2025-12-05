"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBusinessSettings, updateBusinessSettings } from "@/actions/businessSettings"
import { Loader2 } from "lucide-react"

interface BusinessSettingsFormProps {
    onSaveSuccess?: () => void;
    onClose: () => void;
}

export function BusinessSettingsForm({ onSaveSuccess, onClose }: BusinessSettingsFormProps) {
    const [settings, setSettings] = useState({
        name: "",
        address: "",
        mobile: "",
    })
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true)
            const currentSettings = await getBusinessSettings()
            if (currentSettings) {
                setSettings(currentSettings)
            }
            setLoading(false)
        }
        fetchSettings()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setSettings(prev => ({ ...prev, [id]: value }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        console.log("Saving business settings:", settings) // Debugging log
        const result = await updateBusinessSettings(settings)
        if (result.success) {
            onSaveSuccess?.()
            onClose()
        } else {
            setError(result.error || "Failed to save settings.")
        }
        setIsSaving(false)
    }

    if (loading) {
        return (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Business Settings</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                </div>
            </DialogContent>
        )
    }

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Business Settings</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Business Name
                    </Label>
                    <Input
                        id="name"
                        value={settings.name}
                        onChange={handleChange}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                        Address
                    </Label>
                    <Input
                        id="address"
                        value={settings.address}
                        onChange={handleChange}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobile" className="text-right">
                        Mobile Number
                    </Label>
                    <Input
                        id="mobile"
                        value={settings.mobile}
                        onChange={handleChange}
                        className="col-span-3"
                    />
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save changes
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}
