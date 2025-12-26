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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Table" : "Add New Table"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="tableNumber">Table Number</Label>
                        <Controller
                            name="tableNumber"
                            control={control}
                            render={({ field }) => <Input id="tableNumber" {...field} />}
                        />
                        {errors.tableNumber && <p className="text-[#FEE2E2]0 text-sm mt-1">{(errors.tableNumber as any)?.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Controller
                            name="capacity"
                            control={control}
                            render={({ field }) => <Input id="capacity" type="number" {...field} />}
                        />
                        {errors.capacity && <p className="text-[#FEE2E2]0 text-sm mt-1">{(errors.capacity as any)?.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

