"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Search, Percent, Tag, Calendar, ShoppingBag, Edit, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount, Discount } from "@/actions/discounts"
import { formatDate } from "@/lib/utils"

export default function DiscountsPage() {
    const { toast } = useToast()
    const [discounts, setDiscounts] = useState<Discount[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
    const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active')

    // Form State
    const [formData, setFormData] = useState({
        code: "",
        type: "percentage",
        value: "",
        description: "",
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: "",
        maxUsage: "",
        minOrderValue: "0",
        applicableBusinessUnits: ["all"]
    })

    useEffect(() => {
        fetchDiscounts()
    }, [])

    const fetchDiscounts = async () => {
        setLoading(true)
        const data = await getDiscounts(false)
        setDiscounts(data)
        setLoading(false)
    }

    const handleCreate = async () => {
        try {
            if (!formData.code || !formData.value) {
                toast({ title: "Validation Error", description: "Code and Value are required", variant: "destructive" })
                return
            }

            const payload = {
                code: formData.code,
                type: formData.type as 'percentage' | 'fixed',
                value: Number(formData.value),
                description: formData.description,
                isActive: true,
                validFrom: new Date(formData.validFrom).toISOString(),
                validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
                maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
                minOrderValue: Number(formData.minOrderValue),
                applicableBusinessUnits: formData.applicableBusinessUnits
            }

            const result = await createDiscount(payload)

            if (result.success) {
                toast({ title: "Success", description: "Discount created successfully" })
                setIsCreateModalOpen(false)
                resetForm()
                fetchDiscounts()
            } else {
                toast({ title: "Error", description: result.error as string, variant: "destructive" })
            }
        } catch (error) {
            console.error("Create error:", error)
            toast({ title: "Error", description: "Failed to create discount", variant: "destructive" })
        }
    }

    const handleUpdate = async () => {
        if (!editingDiscount) return

        try {
            const payload = {
                code: formData.code,
                type: formData.type as 'percentage' | 'fixed',
                value: Number(formData.value),
                description: formData.description,
                isActive: editingDiscount.isActive, // Preserve active state or add toggle in form
                validFrom: new Date(formData.validFrom).toISOString(),
                validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
                maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
                minOrderValue: Number(formData.minOrderValue),
                applicableBusinessUnits: formData.applicableBusinessUnits
            }

            const result = await updateDiscount(editingDiscount.id, payload)

            if (result.success) {
                toast({ title: "Success", description: "Discount updated successfully" })
                setEditingDiscount(null)
                setIsCreateModalOpen(false)
                resetForm()
                fetchDiscounts()
            } else {
                toast({ title: "Error", description: result.error as string, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update discount", variant: "destructive" })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this discount?")) return

        const result = await deleteDiscount(id)
        if (result.success) {
            toast({ title: "Success", description: "Discount deleted" })
            fetchDiscounts()
        } else {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
        }
    }

    const handleEdit = (discount: Discount) => {
        setEditingDiscount(discount)
        setFormData({
            code: discount.code,
            type: discount.type,
            value: discount.value.toString(),
            description: discount.description || "",
            validFrom: new Date(discount.validFrom).toISOString().split('T')[0],
            validUntil: discount.validUntil ? new Date(discount.validUntil).toISOString().split('T')[0] : "",
            maxUsage: discount.maxUsage ? discount.maxUsage.toString() : "",
            minOrderValue: discount.minOrderValue ? discount.minOrderValue.toString() : "0",
            applicableBusinessUnits: Array.isArray(discount.applicableBusinessUnits) ? discount.applicableBusinessUnits : [discount.applicableBusinessUnits]
        })
        setIsCreateModalOpen(true)
    }

    const handleToggleStatus = async (discount: Discount) => {
        const result = await updateDiscount(discount.id, { isActive: !discount.isActive })
        if (result.success) {
            fetchDiscounts()
            toast({ title: "Success", description: `Discount ${!discount.isActive ? 'activated' : 'deactivated'}` })
        }
    }

    const resetForm = () => {
        setFormData({
            code: "",
            type: "percentage",
            value: "",
            description: "",
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: "",
            maxUsage: "",
            minOrderValue: "0",
            applicableBusinessUnits: ["all"]
        })
    }

    const filteredDiscounts = discounts.filter(d => {
        const matchesSearch = d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))

        if (activeTab === 'active') {
            const now = new Date()
            const isNotExpired = !d.validUntil || new Date(d.validUntil) > now
            return matchesSearch && d.isActive && isNotExpired
        } else {
            const now = new Date()
            const isExpired = d.validUntil && new Date(d.validUntil) <= now
            return matchesSearch && (!d.isActive || isExpired)
        }
    })

    return (
        <div className="space-y-6 min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#111827] to-[#6B7280] dark:from-white dark:to-[#9CA3AF]">
                        Discounts & Offers
                    </h1>
                    <p className="text-[#9CA3AF] dark:text-[#9CA3AF] mt-1">
                        Manage promotional codes and automated discounts
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm()
                        setEditingDiscount(null)
                        setIsCreateModalOpen(true)
                    }}
                    className="gap-2 bg-[#6D5DFB] hover:bg-[#6D5DFB]/90 text-white shadow-lg  shadow-[#6D5DFB]/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Create Discount
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <Input
                        placeholder="Search discounts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 glass-card/50 dark:bg-black/20  border-[#E5E7EB]/50 dark:border-white/10"
                    />
                </div>
                <div className="flex glass-card/50 dark:bg-black/20 p-1 rounded-lg border border-[#E5E7EB]/50 dark:border-white/10 ">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'active'
                            ? 'bg-[#6D5DFB] text-white shadow-md'
                            : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-black/5 dark:hover:glass-card/5'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('expired')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'expired'
                            ? 'bg-[#EF4444] text-white shadow-md'
                            : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-black/5 dark:hover:glass-card/5'
                            }`}
                    >
                        Expired / Inactive
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredDiscounts.map((discount) => (
                        <motion.div
                            key={discount.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                        >
                            <div className="premium-card">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(discount)}>
                                        <Edit className="w-4 h-4 text-[#9CA3AF]" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-[#FEE2E2]0" onClick={() => handleDelete(discount.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold font-mono tracking-wider text-[#6D5DFB] dark:text-[#EDEBFF]">
                                                    {discount.code}
                                                </h3>
                                                <Badge variant={discount.isActive ? "success" : "secondary"}>
                                                    {discount.type === 'percentage' ? `${discount.value}% OFF` : `₹${discount.value} OFF`}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-[#9CA3AF] dark:text-[#9CA3AF] mt-1 line-clamp-2">
                                                {discount.description || 'No description'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-[#6B7280] dark:text-[#9CA3AF]">
                                            <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                                            <span>
                                                {discount.validUntil
                                                    ? `Ends ${formatDate(discount.validUntil)}`
                                                    : 'No expiry'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#6B7280] dark:text-[#9CA3AF]">
                                            <Tag className="w-4 h-4 text-[#9CA3AF]" />
                                            <span>
                                                {discount.usageCount || 0} uses
                                                {discount.maxUsage ? ` / ${discount.maxUsage}` : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#6B7280] dark:text-[#9CA3AF] col-span-2">
                                            <ShoppingBag className="w-4 h-4 text-[#9CA3AF]" />
                                            <span>Min. Order: ₹{discount.minOrderValue || 0}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-[#F1F5F9] dark:border-white/5 flex justify-between items-center">
                                        <span className="text-xs font-mono text-[#9CA3AF]">
                                            Applies to: {Array.isArray(discount.applicableBusinessUnits) ? discount.applicableBusinessUnits.join(', ') : discount.applicableBusinessUnits}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleStatus(discount)}
                                            className={discount.isActive ? "text-[#22C55E]" : "text-[#9CA3AF]"}
                                        >
                                            {discount.isActive ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                                            {discount.isActive ? 'Active' : 'Inactive'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E5E7EB] dark:border-white/10"
                    >
                        <div className="p-6 border-b border-[#F1F5F9] dark:border-white/5">
                            <h2 className="text-xl font-bold">
                                {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                            </h2>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Discount Code</Label>
                                    <Input
                                        placeholder="SALE50"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select discount type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Value {formData.type === 'percentage' ? '(%)' : '(₹)'}</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    placeholder="Special offer for..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Valid From</Label>
                                    <Input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valid Until</Label>
                                    <Input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Min Order Value (₹)</Label>
                                    <Input
                                        type="number"
                                        value={formData.minOrderValue}
                                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Usage (Optional)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Unlimited"
                                        value={formData.maxUsage}
                                        onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-[#F8FAFC] dark:bg-black/20 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={editingDiscount ? handleUpdate : handleCreate} className="bg-[#6D5DFB] text-white">
                                {editingDiscount ? 'Update Discount' : 'Create Discount'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

