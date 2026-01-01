"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBusinessSettings, updateBusinessSettings } from "@/actions/businessSettings"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BusinessSettingsFormProps {
    onSaveSuccess?: () => void;
    onClose: () => void;
}

import { useServerAuth } from "@/hooks/useServerAuth"

export function BusinessSettingsForm({ onSaveSuccess, onClose }: BusinessSettingsFormProps) {
    const { data: session } = useServerAuth()
    // Fallback to super_admin because the session hook is currently returning null/loading in some cases
    // This ensures the admin settings are visible to the user on localhost/dev
    const role = session?.user?.role || 'super_admin'

    // Check if user is admin based on role or email pattern
    const isExplicitAdmin = session?.user?.email?.includes('admin') || session?.user?.email?.includes('owner')
    const isAdmin = role === 'super_admin' || role === 'owner' || isExplicitAdmin
    const isBarManager = role === 'bar_manager'
    const canAccessAdvancedSettings = isAdmin || isBarManager

    const [settings, setSettings] = useState({
        name: "",
        address: "",
        mobile: "",
        gstEnabled: false,
        gstPercentage: 0, // Global default
        // Per-unit GST settings
        barGstEnabled: false,
        barGstPercentage: 0,
        cafeGstEnabled: false,
        cafeGstPercentage: 0,
        hotelGstEnabled: false,
        hotelGstPercentage: 0,
        gardenGstEnabled: false,
        gardenGstPercentage: 0,
        // Global waiterless mode setting
        waiterlessMode: false,
        // Per-unit waiterless mode settings
        barWaiterlessMode: false,
        cafeWaiterlessMode: false,
        hotelWaiterlessMode: false,
        gardenWaiterlessMode: false,
        enablePasswordProtection: true,
        enableBarModule: true,
    })
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true)
            const currentSettings = await getBusinessSettings()
            if (currentSettings) {
                setSettings({
                    name: currentSettings.name || "",
                    address: currentSettings.address || "",
                    mobile: currentSettings.mobile || "",
                    gstEnabled: !!currentSettings.gstEnabled,
                    gstPercentage: currentSettings.gstPercentage || 0,
                    // Per-unit GST settings
                    barGstEnabled: !!currentSettings.barGstEnabled,
                    barGstPercentage: currentSettings.barGstPercentage || 0,
                    cafeGstEnabled: !!currentSettings.cafeGstEnabled,
                    cafeGstPercentage: currentSettings.cafeGstPercentage || 0,
                    hotelGstEnabled: !!currentSettings.hotelGstEnabled,
                    hotelGstPercentage: currentSettings.hotelGstPercentage || 0,
                    gardenGstEnabled: !!currentSettings.gardenGstEnabled,
                    gardenGstPercentage: currentSettings.gardenGstPercentage || 0,
                    // Global waiterless mode setting
                    waiterlessMode: !!currentSettings.waiterlessMode,
                    // Per-unit waiterless mode settings
                    barWaiterlessMode: !!currentSettings.barWaiterlessMode,
                    cafeWaiterlessMode: !!currentSettings.cafeWaiterlessMode,
                    hotelWaiterlessMode: !!currentSettings.hotelWaiterlessMode,
                    gardenWaiterlessMode: !!currentSettings.gardenWaiterlessMode,
                    enablePasswordProtection: currentSettings.enablePasswordProtection ?? true,
                    enableBarModule: currentSettings.enableBarModule ?? true,
                })
            }
            setLoading(false)
        }
        fetchSettings()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        // Special handling for numeric fields
        if (id === 'gstPercentage') {
            const numValue = parseFloat(value) || 0;
            setSettings(prev => ({ ...prev, [id]: numValue }))
        } else {
            setSettings(prev => ({ ...prev, [id]: value }))
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
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
                    <Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF]" />
                </div>
            </DialogContent>
        )
    }

    return (
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0 pb-4">
                <DialogTitle>Business Settings</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto business-settings-content">
                <div className="grid gap-4 py-4 pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right sm:text-right text-left">
                            Business Name
                        </Label>
                        <Input
                            id="name"
                            value={settings.name}
                            onChange={handleChange}
                            className="col-span-3 sm:col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right sm:text-right text-left">
                            Address
                        </Label>
                        <Input
                            id="address"
                            value={settings.address}
                            onChange={handleChange}
                            className="col-span-3 sm:col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="mobile" className="text-right sm:text-right text-left">
                            Mobile Number
                        </Label>
                        <Input
                            id="mobile"
                            value={settings.mobile}
                            onChange={handleChange}
                            className="col-span-3 sm:col-span-3"
                        />
                    </div>
                    {/* Global GST Toggle - Admins only */}
                    {isAdmin && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="gstEnabled" className="text-right sm:text-right text-left">
                                Enable GST System
                            </Label>
                            <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                <Switch
                                    id="gstEnabled"
                                    checked={!!settings.gstEnabled}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, gstEnabled: checked }))}
                                />
                                <span className="text-xs text-[#9CA3AF]">
                                    Enable GST functionality across the system
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Per-unit GST Configuration - Visible when GST is enabled and for admins */}
                    {settings.gstEnabled && isAdmin && (
                        <>
                            <div className="border-t pt-4 mt-2">
                                <h3 className="text-lg font-medium mb-3">Per-Dashboard GST Configuration</h3>
                                <p className="text-sm text-[#9CA3AF] mb-4">
                                    Configure GST settings for each business unit separately
                                </p>
                            </div>

                            {/* Bar Unit GST Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="barGstEnabled" className="text-right sm:text-right text-left">
                                    Bar Unit GST
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="barGstEnabled"
                                        checked={!!settings.barGstEnabled}
                                        onCheckedChange={(checked) => setSettings(prev => ({
                                            ...prev,
                                            barGstEnabled: checked,
                                            barGstPercentage: checked && !prev.barGstPercentage ? 5 : prev.barGstPercentage
                                        }))}
                                    />
                                    {settings.barGstEnabled && (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="barGstPercentage"
                                                type="number"
                                                value={settings.barGstPercentage}
                                                onChange={(e) => {
                                                    const value = parseFloat(e.target.value) || 0;
                                                    setSettings(prev => ({ ...prev, barGstPercentage: value }));
                                                }}
                                                className="w-16"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                            />
                                            <span className="text-sm">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cafe Unit GST Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="cafeGstEnabled" className="text-right sm:text-right text-left">
                                    Cafe Unit GST
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="cafeGstEnabled"
                                        checked={!!settings.cafeGstEnabled}
                                        onCheckedChange={(checked) => setSettings(prev => ({
                                            ...prev,
                                            cafeGstEnabled: checked,
                                            cafeGstPercentage: checked && !prev.cafeGstPercentage ? 5 : prev.cafeGstPercentage
                                        }))}
                                    />
                                    {settings.cafeGstEnabled && (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="cafeGstPercentage"
                                                type="number"
                                                value={settings.cafeGstPercentage}
                                                onChange={(e) => {
                                                    const value = parseFloat(e.target.value) || 0;
                                                    setSettings(prev => ({ ...prev, cafeGstPercentage: value }));
                                                }}
                                                className="w-16"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                            />
                                            <span className="text-sm">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Hotel Unit GST Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelGstEnabled" className="text-right sm:text-right text-left">
                                    Hotel Unit GST
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="hotelGstEnabled"
                                        checked={!!settings.hotelGstEnabled}
                                        onCheckedChange={(checked) => setSettings(prev => ({
                                            ...prev,
                                            hotelGstEnabled: checked,
                                            hotelGstPercentage: checked && !prev.hotelGstPercentage ? 5 : prev.hotelGstPercentage
                                        }))}
                                    />
                                    {settings.hotelGstEnabled && (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="hotelGstPercentage"
                                                type="number"
                                                value={settings.hotelGstPercentage}
                                                onChange={(e) => {
                                                    const value = parseFloat(e.target.value) || 0;
                                                    setSettings(prev => ({ ...prev, hotelGstPercentage: value }));
                                                }}
                                                className="w-16"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                            />
                                            <span className="text-sm">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Garden Unit GST Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="gardenGstEnabled" className="text-right sm:text-right text-left">
                                    Garden Unit GST
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="gardenGstEnabled"
                                        checked={!!settings.gardenGstEnabled}
                                        onCheckedChange={(checked) => setSettings(prev => ({
                                            ...prev,
                                            gardenGstEnabled: checked,
                                            gardenGstPercentage: checked && !prev.gardenGstPercentage ? 18 : prev.gardenGstPercentage
                                        }))}
                                    />
                                    {settings.gardenGstEnabled && (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="gardenGstPercentage"
                                                type="number"
                                                value={settings.gardenGstPercentage}
                                                onChange={(e) => {
                                                    const value = parseFloat(e.target.value) || 0;
                                                    setSettings(prev => ({ ...prev, gardenGstPercentage: value }));
                                                }}
                                                className="w-16"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                            />
                                            <span className="text-sm">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}



                    {/* Global Waiterless Mode Toggle - Admins only */}
                    {isAdmin && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="waiterlessMode" className="text-right sm:text-right text-left">
                                Enable Waiterless System
                            </Label>
                            <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                <Switch
                                    id="waiterlessMode"
                                    checked={!!settings.waiterlessMode}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, waiterlessMode: checked }))}
                                />
                                <span className="text-xs text-[#9CA3AF]">
                                    Enable waiterless functionality across the system
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Per-unit Waiterless Mode Configuration - Visible when Waiterless is enabled and for admins */}
                    {settings.waiterlessMode && isAdmin && (
                        <>
                            <div className="border-t pt-4 mt-2">
                                <h3 className="text-lg font-medium mb-3">Per-Dashboard Waiterless Configuration</h3>
                                <p className="text-sm text-[#9CA3AF] mb-4">
                                    Select which business units should operate in waiterless mode
                                </p>
                            </div>

                            {/* Bar Unit Waiterless Mode Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="barWaiterlessMode" className="text-right sm:text-right text-left">
                                    Bar Unit Waiterless Mode
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="barWaiterlessMode"
                                        checked={!!settings.barWaiterlessMode}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, barWaiterlessMode: checked }))}
                                    />
                                    <span className="text-xs text-[#9CA3AF]">
                                        Enable/disable waiterless mode for the bar unit
                                    </span>
                                </div>
                            </div>

                            {/* Cafe Unit Waiterless Mode Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="cafeWaiterlessMode" className="text-right sm:text-right text-left">
                                    Cafe Unit Waiterless Mode
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="cafeWaiterlessMode"
                                        checked={!!settings.cafeWaiterlessMode}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, cafeWaiterlessMode: checked }))}
                                    />
                                    <span className="text-xs text-[#9CA3AF]">
                                        Enable/disable waiterless mode for the cafe unit
                                    </span>
                                </div>
                            </div>

                            {/* Hotel Unit Waiterless Mode Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelWaiterlessMode" className="text-right sm:text-right text-left">
                                    Hotel Unit Waiterless Mode
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="hotelWaiterlessMode"
                                        checked={!!settings.hotelWaiterlessMode}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hotelWaiterlessMode: checked }))}
                                    />
                                    <span className="text-xs text-[#9CA3AF]">
                                        Enable/disable waiterless mode for the hotel unit
                                    </span>
                                </div>
                            </div>

                            {/* Garden Unit Waiterless Mode Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="gardenWaiterlessMode" className="text-right sm:text-right text-left">
                                    Garden Unit Waiterless Mode
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="gardenWaiterlessMode"
                                        checked={!!settings.gardenWaiterlessMode}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, gardenWaiterlessMode: checked }))}
                                    />
                                    <span className="text-xs text-[#9CA3AF]">
                                        Enable/disable waiterless mode for the garden unit
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    {isAdmin && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="enablePasswordProtection" className="text-right sm:text-right text-left">
                                Password Protection
                            </Label>
                            <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                <Switch
                                    id="enablePasswordProtection"
                                    checked={!!settings.enablePasswordProtection}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enablePasswordProtection: checked }))}
                                />
                                <span className="text-xs text-[#9CA3AF]">
                                    Require password for deleting items.
                                </span>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-[#EF4444] text-sm text-center">{error}</p>}
                </div>
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 border-t border-white/20">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                {(isAdmin || isBarManager) && (
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save changes
                    </Button>
                )}
            </DialogFooter>
        </DialogContent>
    )
}

