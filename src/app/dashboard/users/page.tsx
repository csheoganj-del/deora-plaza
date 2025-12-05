"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Eye, EyeOff, Edit, Trash2, Key, Loader2, UserPlus } from "lucide-react"
import { createUser, getUsers, updateUser, deleteUser, resetUserPassword, toggleUserStatus, type User, type AuthMethod, type UserRole, type BusinessUnit } from "@/actions/user-management"

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Create user form state
    const [createForm, setCreateForm] = useState({
        authMethod: 'password' as AuthMethod,
        username: '',
        password: '',
        phoneNumber: '',
        role: 'staff' as UserRole,
        businessUnit: 'cafe' as BusinessUnit,
        name: ''
    })

    // Edit user form state
    const [editForm, setEditForm] = useState({
        role: 'staff' as UserRole,
        businessUnit: 'cafe' as BusinessUnit,
        name: ''
    })

    // Reset password form state
    const [resetPasswordForm, setResetPasswordForm] = useState({
        newPassword: ''
    })

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        setLoading(true)
        const data = await getUsers()
        setUsers(data)
        setLoading(false)
    }

    const handleCreateUser = async () => {
        setSubmitting(true)
        const result = await createUser(createForm)

        if (result.success) {
            setIsCreateDialogOpen(false)
            setCreateForm({
                authMethod: 'password',
                username: '',
                password: '',
                phoneNumber: '',
                role: 'staff',
                businessUnit: 'cafe',
                name: ''
            })
            loadUsers()
        } else {
            alert(`Error: ${result.error}`)
        }
        setSubmitting(false)
    }

    const handleEditUser = async () => {
        if (!selectedUser) return

        setSubmitting(true)
        const result = await updateUser(selectedUser.id, editForm)

        if (result.success) {
            setIsEditDialogOpen(false)
            setSelectedUser(null)
            loadUsers()
        } else {
            alert(`Error: ${result.error}`)
        }
        setSubmitting(false)
    }

    const handleResetPassword = async () => {
        if (!selectedUser) return

        setSubmitting(true)
        const result = await resetUserPassword(selectedUser.id, resetPasswordForm.newPassword)

        if (result.success) {
            setIsResetPasswordDialogOpen(false)
            setSelectedUser(null)
            setResetPasswordForm({ newPassword: '' })
        } else {
            alert(`Error: ${result.error}`)
        }
        setSubmitting(false)
    }

    const handleDeleteUser = async () => {
        if (!selectedUser) return

        setSubmitting(true)
        const result = await deleteUser(selectedUser.id)

        if (result.success) {
            setIsDeleteDialogOpen(false)
            // Optimistically remove the user from the UI
            setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));
            setSelectedUser(null)
            // Re-fetch users to ensure consistency with backend
            loadUsers()
        } else {
            alert(`Error: ${result.error}`)
        }
        setSubmitting(false)
    }

    const handleToggleStatus = async (userId: string) => {
        await toggleUserStatus(userId)
        loadUsers()
    }

    const openEditDialog = (user: any) => {
        setSelectedUser(user)
        setEditForm({
            role: user.role,
            businessUnit: user.businessUnit,
            name: user.name
        })
        setIsEditDialogOpen(true)
    }

    const openResetPasswordDialog = (user: any) => {
        setSelectedUser(user)
        setIsResetPasswordDialogOpen(true)
    }

    const openDeleteDialog = (user: any) => {
        setSelectedUser(user)
        setIsDeleteDialogOpen(true)
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {users.map((user) => (
                                <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2 bg-muted/20">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{user.name || user.username || user.id}</CardTitle>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {user.authMethod === 'password' ? `@${user.username}` : user.phoneNumber}
                                                </div>
                                            </div>
                                            <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-600" : ""}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {user.role}
                                            </Badge>
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 capitalize">
                                                {user.businessUnit}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} title="Edit User">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {user.authMethod === 'password' && (
                                                <Button variant="ghost" size="icon" onClick={() => openResetPasswordDialog(user)} title="Reset Password">
                                                    <Key className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleToggleStatus(user.id)}
                                                title={user.isActive ? 'Deactivate' : 'Activate'}
                                                className={user.isActive ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                            >
                                                {user.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDeleteDialog(user)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                title="Delete User"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to the system with their authentication method and role.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Authentication Method</Label>
                            <Tabs value={createForm.authMethod} onValueChange={(value) => setCreateForm({ ...createForm, authMethod: value as AuthMethod })}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="password">Username/Password</TabsTrigger>
                                    <TabsTrigger value="phone">Phone OTP</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {createForm.authMethod === 'password' ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        value={createForm.username}
                                        onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                                        placeholder="Enter username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={createForm.password}
                                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                            placeholder="Enter password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input
                                    id="phoneNumber"
                                    value={createForm.phoneNumber}
                                    onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                                    placeholder="+91XXXXXXXXXX"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                placeholder="Enter full name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value as UserRole })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessUnit">Business Unit</Label>
                            <Select value={createForm.businessUnit} onValueChange={(value) => setCreateForm({ ...createForm, businessUnit: value as BusinessUnit })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="cafe">Cafe</SelectItem>
                                    <SelectItem value="bar">Bar</SelectItem>
                                    <SelectItem value="hotel">Hotel</SelectItem>
                                    <SelectItem value="garden">Garden</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateUser} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value as UserRole })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-businessUnit">Business Unit</Label>
                            <Select value={editForm.businessUnit} onValueChange={(value) => setEditForm({ ...editForm, businessUnit: value as BusinessUnit })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="cafe">Cafe</SelectItem>
                                    <SelectItem value="bar">Bar</SelectItem>
                                    <SelectItem value="hotel">Hotel</SelectItem>
                                    <SelectItem value="garden">Garden</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditUser} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for {selectedUser?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={resetPasswordForm.newPassword}
                                    onChange={(e) => setResetPasswordForm({ newPassword: e.target.value })}
                                    placeholder="Enter new password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleResetPassword} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold">{selectedUser?.name || selectedUser?.username || 'this user'}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteUser} disabled={submitting} className="bg-red-500 hover:bg-red-600 text-white">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
