"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

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
    description = "Please enter your password to confirm this action."
}: PasswordDialogProps) {
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleConfirm = async () => {
        if (!password) {
            setError("Password is required")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await onConfirm(password)
            // Note: It's up to the parent to close the dialog on success
            // or we could close it here if onConfirm returns true/false
        } catch (err) {
            console.error("Password confirmation failed:", err)
            setError("An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setPassword("")
                setError(null)
                onClose()
            }
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleConfirm()
                                }
                            }}
                        />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
