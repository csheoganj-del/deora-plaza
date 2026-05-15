"use client"

import React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit } from "lucide-react"

const formSchema = z.object({
    tableNumber: z.string().min(1, "Table number is required"),
    capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
})

interface TableFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => void
    initialData?: any
}

export function TableForm({ isOpen, onClose, onSubmit, initialData }: TableFormProps) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || { tableNumber: "", capacity: 1 },
    })

    const handleFormSubmit = (data: any) => {
        onSubmit(data)
    }

    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset(initialData);
            } else {
                reset({ tableNumber: "", capacity: 1 });
            }
        }
    }, [initialData, isOpen, reset]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md glass-adaptive border-glass border-0 shadow-2xl overflow-hidden p-0 gap-0 [&>button]:text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 pointer-events-none" />

                <DialogHeader className="p-6 border-b border-white/10 relative">
                    <DialogTitle className="text-2xl font-bold text-white drop-shadow-sm flex items-center gap-3">
                        <Edit className="h-6 w-6 text-amber-500" />
                        {initialData ? "Edit Table" : "Add New Table"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 p-6 relative">
                    <div className="space-y-2">
                        <Label htmlFor="tableNumber" className="text-sm font-semibold text-white">Table Number</Label>
                        <Controller
                            name="tableNumber"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="tableNumber"
                                    placeholder="e.g. T-01, VIP-1"
                                    className="glass-input bg-white/5 border-white/10 focus:border-amber-500/50 transition-all duration-300"
                                    {...field}
                                />
                            )}
                        />
                        {errors.tableNumber && <p className="text-red-400 text-xs mt-1">{(errors.tableNumber as any)?.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="capacity" className="text-sm font-semibold text-white">Guest Capacity</Label>
                        <Controller
                            name="capacity"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="capacity"
                                    type="number"
                                    className="glass-input bg-white/5 border-white/10 focus:border-amber-500/50 transition-all duration-300"
                                    {...field}
                                />
                            )}
                        />
                        {errors.capacity && <p className="text-red-400 text-xs mt-1">{(errors.capacity as any)?.message}</p>}
                    </div>
                    <DialogFooter className="pt-4 gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-adaptive-secondary hover:text-adaptive-primary hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/20 px-8"
                        >
                            {initialData ? "Save Changes" : "Create Table"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

