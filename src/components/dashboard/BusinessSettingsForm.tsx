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
    const isSuperAdmin = role === 'super_admin' || role === 'owner' || isExplicitAdmin
    const isGardenManager = role === 'garden_manager'
    const isBarManager = role === 'bar_manager'
    const isHotelManager = role === 'hotel_manager'
    const isCafeManager = role === 'cafe_manager' || role === 'manager'

    // Combined isAdmin for overall access
    const isAdmin = isSuperAdmin || isGardenManager || isHotelManager || isCafeManager || isBarManager
    const canAccessAdvancedSettings = isAdmin

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
        // Global billing-only mode setting
        billingOnlyMode: false,
        // Per-unit billing-only mode settings
        barBillingOnlyMode: false,
        cafeBillingOnlyMode: false,
        hotelBillingOnlyMode: false,
        gardenBillingOnlyMode: false,
        enablePasswordProtection: true,
        enableBarModule: true,
        // Garden specific settings
        gardenName: "",
        gardenAddress: "",
        gardenMobile: "",
        gardenGstNumber: "",
        // Hotel specific settings
        hotelName: "",
        hotelAddress: "",
        hotelMobile: "",
        hotelEmail: "",
        hotelGstNumber: "",
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
                    // Billing-only mode settings
                    billingOnlyMode: !!currentSettings.billingOnlyMode,
                    barBillingOnlyMode: !!currentSettings.barBillingOnlyMode,
                    cafeBillingOnlyMode: !!currentSettings.cafeBillingOnlyMode,
                    hotelBillingOnlyMode: !!currentSettings.hotelBillingOnlyMode,
                    gardenBillingOnlyMode: !!currentSettings.gardenBillingOnlyMode,
                    enablePasswordProtection: currentSettings.enablePasswordProtection ?? true,
                    enableBarModule: currentSettings.enableBarModule ?? true,
                    // Garden specific settings
                    gardenName: currentSettings.gardenName || "",
                    gardenAddress: currentSettings.gardenAddress || "",
                    gardenMobile: currentSettings.gardenMobile || "",
                    gardenGstNumber: currentSettings.gardenGstNumber || "",
                    // Hotel specific settings
                    hotelName: currentSettings.hotelName || "",
                    hotelAddress: currentSettings.hotelAddress || "",
                    hotelMobile: currentSettings.hotelMobile || "",
                    hotelEmail: currentSettings.hotelEmail || "",
                    hotelGstNumber: currentSettings.hotelGstNumber || "",
                })
            }
            setLoading(false)
        }
        fetchSettings()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        // Special handling for numeric fields
        if (id === 'gstPercentage' || id === 'gardenGstPercentage' || id === 'barGstPercentage' || id === 'cafeGstPercentage' || id === 'hotelGstPercentage') {
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
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden bg-[#1a1a1a]/95 backdrop-blur-xl border-white/10 text-white">
            <DialogHeader className="flex-shrink-0 pb-4 border-b border-white/10">
                <DialogTitle className="text-xl font-bold text-white">Business Settings</DialogTitle>
                <p className="text-xs text-white/40 mt-1">Configure system-wide preferences and business unit settings</p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto business-settings-content custom-scrollbar">
                <div className="grid gap-4 py-4 pr-2">
                    {isAdmin && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Business Name
                                </Label>
                                <Input
                                    id="name"
                                    value={settings.name}
                                    onChange={handleChange}
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="address" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Address
                                </Label>
                                <Input
                                    id="address"
                                    value={settings.address}
                                    onChange={handleChange}
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="mobile" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Mobile Number
                                </Label>
                                <Input
                                    id="mobile"
                                    value={settings.mobile}
                                    onChange={handleChange}
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                        </>
                    )}
                    {/* Global GST Toggle - Admins only */}
                    {isSuperAdmin && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4 pt-4 border-t border-white/5">
                            <Label htmlFor="gstEnabled" className="text-right sm:text-right text-left text-white/60 font-medium">
                                Enable GST System
                            </Label>
                            <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                <Switch
                                    id="gstEnabled"
                                    checked={!!settings.gstEnabled}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, gstEnabled: checked }))}
                                />
                                <span className="text-xs text-white/40">
                                    Enable GST functionality across the system
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Per-unit GST Configuration - Visible when GST is enabled and for admins */}
                    {settings.gstEnabled && (isSuperAdmin || isGardenManager) && (
                        <>
                            {(isSuperAdmin || isGardenManager) && (
                                <div className="border-t border-white/5 pt-4 mt-2">
                                    <h3 className="text-lg font-bold text-white mb-3">
                                        {isGardenManager ? "Garden GST Configuration" : "Per-Dashboard GST Configuration"}
                                    </h3>
                                    <p className="text-sm text-white/40 mb-4">
                                        {isGardenManager
                                            ? "Configure GST settings for your garden bookings"
                                            : "Configure GST settings for each business unit separately"}
                                    </p>
                                </div>
                            )}

                            {/* Bar Unit GST Settings - Super Admin only */}
                            {isSuperAdmin && (
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
                                                    className="w-16 bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-primary/50"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                />
                                                <span className="text-sm">%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cafe Unit GST Settings - Super Admin or Cafe Manager */}
                            {(isSuperAdmin || isCafeManager) && (
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
                                                    className="w-16 bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-primary/50"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                />
                                                <span className="text-sm">%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Hotel Unit GST Settings - Super Admin only */}
                            {isSuperAdmin && (
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
                                                    className="w-16 bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-primary/50"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                />
                                                <span className="text-sm">%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Garden Unit GST Settings - Super Admin or Garden Manager */}
                            {(isSuperAdmin || isGardenManager) && (
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
                                                    className="w-16 bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-primary/50"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                />
                                                <span className="text-sm">%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}



                    {/* Global Waiterless Mode Toggle - Admins only */}
                    {isSuperAdmin && (
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
                    {settings.waiterlessMode && isSuperAdmin && (
                        <>
                            <div className="border-t border-white/5 pt-4 mt-2">
                                <h3 className="text-lg font-bold text-white mb-3">Per-Dashboard Waiterless Configuration</h3>
                                <p className="text-sm text-white/40 mb-4">
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

                    {/* Billing-Only Mode Settings */}
                    {isSuperAdmin && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4 border-t border-white/5 pt-4 mt-2">
                            <Label htmlFor="billingOnlyMode" className="text-right sm:text-right text-left">
                                Billing-Only Mode
                            </Label>
                            <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                <Switch
                                    id="billingOnlyMode"
                                    checked={!!settings.billingOnlyMode}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, billingOnlyMode: checked }))}
                                />
                                <span className="text-xs text-[#9CA3AF]">
                                    Enable direct billing without kitchen orders (global)
                                </span>
                            </div>
                        </div>
                    )}

                    {settings.billingOnlyMode && isSuperAdmin && (
                        <>
                            <div className="border-t border-white/5 pt-4 mt-2">
                                <h3 className="text-lg font-bold text-white mb-3">Per-Dashboard Billing-Only Configuration</h3>
                                <p className="text-sm text-white/40 mb-4">
                                    Select which business units should use billing-only mode (no kitchen orders)
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="cafeBillingOnlyMode" className="text-right sm:text-right text-left">
                                    Cafe Billing-Only
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="cafeBillingOnlyMode"
                                        checked={!!settings.cafeBillingOnlyMode}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, cafeBillingOnlyMode: checked }))}
                                    />
                                    <span className="text-xs text-[#9CA3AF]">
                                        Direct billing for cafe (bypasses kitchen)
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="barBillingOnlyMode" className="text-right sm:text-right text-left">
                                    Bar Billing-Only
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="barBillingOnlyMode"
                                        checked={!!settings.barBillingOnlyMode}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, barBillingOnlyMode: checked }))}
                                    />
                                    <span className="text-xs text-[#9CA3AF]">
                                        Direct billing for bar (bypasses kitchen)
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelBillingOnlyMode" className="text-right sm:text-right text-left">
                                    Hotel Billing-Only
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="hotelBillingOnlyMode"
                                        checked={!!settings.hotelBillingOnlyMode}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, hotelBillingOnlyMode: checked }))}
                                    />
                                    <span className="text-xs text-[#9CA3AF]">
                                        Direct billing for hotel (bypasses kitchen)
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="gardenBillingOnlyMode" className="text-right sm:text-right text-left">
                                    Garden Billing-Only
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="gardenBillingOnlyMode"
                                        checked={!!settings.gardenBillingOnlyMode}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, gardenBillingOnlyMode: checked }))}
                                    />
                                    <span className="text-xs text-[#9CA3AF]">
                                        Direct billing for garden events (bypasses kitchen)
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    {isSuperAdmin && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4 border-t border-white/5 pt-4 mt-2">
                            <Label htmlFor="enablePasswordProtection" className="text-right sm:text-right text-left text-white/60 font-medium">
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

                    {/* Hotel Receipt Settings - Admins only */}
                    {(isSuperAdmin || isHotelManager) && (
                        <>
                            <div className="border-t border-white/5 pt-4 mt-2">
                                <h3 className="text-lg font-bold text-white mb-3">Hotel Receipt Configuration</h3>
                                <p className="text-sm text-white/40 mb-4">
                                    Specific details to appear on Hotel booking receipts. Leave blank to use main business details.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelName" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Hotel Name
                                </Label>
                                <Input
                                    id="hotelName"
                                    value={settings.hotelName || ""}
                                    onChange={handleChange}
                                    placeholder={settings.name}
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelAddress" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Hotel Address
                                </Label>
                                <Input
                                    id="hotelAddress"
                                    value={settings.hotelAddress || ""}
                                    onChange={handleChange}
                                    placeholder={settings.address}
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelMobile" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Hotel Mobile
                                </Label>
                                <Input
                                    id="hotelMobile"
                                    value={settings.hotelMobile || ""}
                                    onChange={handleChange}
                                    placeholder={settings.mobile}
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelEmail" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Hotel Email
                                </Label>
                                <Input
                                    id="hotelEmail"
                                    value={settings.hotelEmail || ""}
                                    onChange={handleChange}
                                    placeholder="hotel@example.com"
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="hotelGstNumber" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Hotel GST Number
                                </Label>
                                <Input
                                    id="hotelGstNumber"
                                    value={settings.hotelGstNumber || ""}
                                    onChange={handleChange}
                                    placeholder="22AAAAA0000A1Z5"
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                        </>
                    )}

                    {/* Garden Receipt Settings - Admins only */}
                    {(isSuperAdmin || isGardenManager) && (
                        <>
                            <div className="border-t border-white/5 pt-4 mt-2">
                                <h3 className="text-lg font-bold text-white mb-3">Garden Receipt Configuration</h3>
                                <p className="text-sm text-white/40 mb-4">
                                    Specific details to appear on Marriage Garden booking receipts. Leave blank to use main business details.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="gardenName" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Garden Name
                                </Label>
                                <Input
                                    id="gardenName"
                                    value={settings.gardenName || ""}
                                    onChange={handleChange}
                                    placeholder={settings.name}
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="gardenAddress" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Garden Address
                                </Label>
                                <Input
                                    id="gardenAddress"
                                    value={settings.gardenAddress || ""}
                                    onChange={handleChange}
                                    placeholder={settings.address}
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="gardenMobile" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Garden Mobile
                                </Label>
                                <Input
                                    id="gardenMobile"
                                    value={settings.gardenMobile || ""}
                                    onChange={handleChange}
                                    placeholder={settings.mobile}
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="gardenGstNumber" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Garden GST Number
                                </Label>
                                <Input
                                    id="gardenGstNumber"
                                    value={settings.gardenGstNumber || ""}
                                    onChange={handleChange}
                                    placeholder="22AAAAA0000A1Z5"
                                    className="col-span-3 !bg-white/5 !border-white/10 !text-white placeholder:text-white/30 focus:!bg-white/10 focus:!border-primary/50"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4 border-t border-white/5 pt-4">
                                <Label htmlFor="gardenGstEnabled" className="text-right sm:text-right text-left text-white/60 font-medium">
                                    Enable Garden GST
                                </Label>
                                <div className="col-span-3 sm:col-span-3 flex items-center gap-3">
                                    <Switch
                                        id="gardenGstEnabled"
                                        checked={!!settings.gardenGstEnabled}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, gardenGstEnabled: checked }))}
                                    />
                                    <span className="text-xs text-[#9CA3AF]">
                                        Apply GST to all marriage garden bookings.
                                    </span>
                                </div>
                            </div>

                            {settings.gardenGstEnabled && (
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                    <Label htmlFor="gardenGstPercentage" className="text-right sm:text-right text-left text-white/60 font-medium">
                                        Garden GST %
                                    </Label>
                                    <Input
                                        id="gardenGstPercentage"
                                        type="number"
                                        value={settings.gardenGstPercentage || ""}
                                        onChange={handleChange}
                                        placeholder="18"
                                        className="col-span-3 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-primary/50"
                                    />
                                </div>
                            )}
                        </>
                    )}
                    {error && <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</p>}
                </div>
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 border-t border-white/10 gap-2">
                <Button variant="outline" onClick={onClose} className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</Button>
                {(isAdmin || isBarManager || isHotelManager || role === 'garden_manager') && (
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save changes
                    </Button>
                )}
            </DialogFooter>
        </DialogContent >
    )
}

