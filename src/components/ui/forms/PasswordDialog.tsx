"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock } from "lucide-react"
import { GlassButton } from "@/components/ui/glass/GlassFormComponents"

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

    const handleConfirm = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();

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
            <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl p-6 gap-6">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-white/60 text-sm">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="space-y-3">
                        <Label htmlFor="password" className="text-sm font-medium text-white/70">Admin Password</Label>
                        <div className="relative group">
                            {/* Glass Input Style matched manually to support right-side button */}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
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
                                className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 py-2 text-sm text-white shadow-sm transition-all duration-200 placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:bg-white/10 focus-visible:border-emerald-500/50 hover:bg-white/8 hover:border-white/15"
                            />
                            <button
                                type="button"
                                onClick={() => setShow(!show)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                                aria-label={show ? 'Hide password' : 'Show password'}
                            >
                                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-3 sm:justify-end">
                    <GlassButton
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-white/60 hover:text-white"
                    >
                        Cancel
                    </GlassButton>
                    <GlassButton
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!password || isLoading}
                        isLoading={isLoading}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                        Confirm
                    </GlassButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

