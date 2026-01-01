"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff } from "lucide-react"

interface PasswordDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (password: string) => Promise<void>
    title?: string
    description?: string
}

export function PasswordDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    description = "Please confirm this action."
}: PasswordDialogProps) {
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [show, setShow] = useState(false)

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setPassword("")
            setIsLoading(false)
        }
    }, [isOpen])

    const handleConfirm = async () => {
        if (!password) return

        setIsLoading(true)
        try {
            await onConfirm(password)
            // Note: Caller is responsible for closing dialog on success
            // But we'll reset password just in case
            setPassword("")
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && !isLoading) {
                onClose()
            }
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="password">Admin Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={show ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && password) {
                                    handleConfirm()
                                }
                            }}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShow(!show)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                            aria-label={show ? 'Hide password' : 'Show password'}
                        >
                            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!password || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

