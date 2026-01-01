"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { createUser, updateUser, type User, type UserRole, type BusinessUnit, type AuthMethod } from "@/actions/user-management"
import { toast } from "@/hooks/use-toast"

interface UserManagementDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    editingUser?: User | null
}

const roleOptions: { value: UserRole; label: string }[] = [
    { value: "super_admin", label: "Super Admin" },
    { value: "owner", label: "Owner" },
    { value: "manager", label: "Manager" },
    { value: "cafe_manager", label: "Cafe Manager" },
    { value: "bar_manager", label: "Bar Manager" },
    { value: "hotel_manager", label: "Hotel Manager" },
    { value: "garden_manager", label: "Garden Manager" },
    { value: "waiter", label: "Waiter" },
    { value: "kitchen", label: "Kitchen Staff" },
    { value: "bartender", label: "Bartender" },
    { value: "reception", label: "Reception" },
    { value: "hotel_reception", label: "Hotel Reception" },
]

const businessUnitOptions: { value: BusinessUnit; label: string }[] = [
    { value: "all", label: "All Units" },
    { value: "cafe", label: "Cafe & Restaurant" },
    { value: "bar", label: "Bar" },
    { value: "hotel", label: "Hotel" },
    { value: "garden", label: "Garden" },
]

export function UserManagementDialog({ isOpen, onClose, onSuccess, editingUser }: UserManagementDialogProps) {
    const [authMethod, setAuthMethod] = useState<AuthMethod>("password")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [name, setName] = useState("")
    const [role, setRole] = useState<UserRole>("waiter")
    const [businessUnit, setBusinessUnit] = useState<BusinessUnit>("cafe")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Reset form when dialog opens/closes or editing user changes
    useEffect(() => {
        if (isOpen) {
            if (editingUser) {
                setAuthMethod(editingUser.authMethod)
                setUsername(editingUser.username || "")
                setPhoneNumber(editingUser.phoneNumber || "")
                setName(editingUser.name)
                setRole(editingUser.role)
                setBusinessUnit(editingUser.businessUnit)
                setPassword("") // Don't show existing password
            } else {
                setAuthMethod("password")
                setUsername("")
                setPassword("")
                setPhoneNumber("")
                setName("")
                setRole("waiter")
                setBusinessUnit("cafe")
            }
            setShowPassword(false)
        }
    }, [isOpen, editingUser])

    const handleSubmit = async () => {
        // Validation
        if (!name.trim()) {
            toast({ title: "Error", description: "Please enter a name", variant: "destructive" })
            return
        }

        if (authMethod === "password") {
            if (!username.trim()) {
                toast({ title: "Error", description: "Please enter a username", variant: "destructive" })
                return
            }
            if (!editingUser && !password.trim()) {
                toast({ title: "Error", description: "Please enter a password", variant: "destructive" })
                return
            }
        } else {
            if (!phoneNumber.trim()) {
                toast({ title: "Error", description: "Please enter a phone number", variant: "destructive" })
                return
            }
        }

        setIsLoading(true)

        try {
            if (editingUser) {
                // Update existing user
                const result = await updateUser(editingUser.id, {
                    name,
                    role,
                    businessUnit,
                    password: password || undefined, // Send password if user entered one
                })

                if (result.success) {
                    toast({ title: "Success", description: "User updated successfully" })
                    onSuccess()
                    onClose()
                } else {
                    toast({ title: "Error", description: result.error || "Failed to update user", variant: "destructive" })
                }
            } else {
                // Create new user
                const result = await createUser({
                    authMethod,
                    username: authMethod === "password" ? username : undefined,
                    password: authMethod === "password" ? password : undefined,
                    phoneNumber: authMethod === "phone" ? phoneNumber : undefined,
                    name,
                    role,
                    businessUnit,
                })

                if (result.success) {
                    toast({ title: "Success", description: "User created successfully" })
                    onSuccess()
                    onClose()
                } else {
                    toast({ title: "Error", description: result.error || "Failed to create user", variant: "destructive" })
                }
            }
        } catch (error) {
            console.error("Error saving user:", error)
            toast({ title: "Error", description: "An error occurred while saving the user", variant: "destructive" })
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Auth Method - Only show when creating new user */}
                    {!editingUser && (
                        <div className="grid gap-2">
                            <Label>Authentication Method</Label>
                            <Select value={authMethod} onValueChange={(value) => setAuthMethod(value as AuthMethod)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="password">Username & Password</SelectItem>
                                    <SelectItem value="phone">Phone Number (OTP)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter full name"
                        />
                    </div>

                    {/* Username - Only for password auth */}
                    {authMethod === "password" && (
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username *</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                disabled={!!editingUser}
                            />
                        </div>
                    )}

                    {/* Password */}
                    {authMethod === "password" && (
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                {editingUser ? "New Password (Optional)" : "Password *"}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={editingUser ? "Leave empty to keep current" : "Enter password"}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Phone Number - Only for phone auth */}
                    {authMethod === "phone" && (
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter phone number"
                                disabled={!!editingUser}
                            />
                        </div>
                    )}

                    {/* Role */}
                    <div className="grid gap-2">
                        <Label>Role *</Label>
                        <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {roleOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Business Unit */}
                    <div className="grid gap-2">
                        <Label>Business Unit *</Label>
                        <Select value={businessUnit} onValueChange={(value) => setBusinessUnit(value as BusinessUnit)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {businessUnitOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingUser ? "Update User" : "Create User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

