"use client"

import { useState, useEffect } from "react"
import { getAllStaff, createStaff, toggleStaffStatus, deleteStaff } from "@/actions/staff"


import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, UserX, UserCheck, Trash2 } from "lucide-react"

export default function StaffPage() {
    const [staff, setStaff] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newStaff, setNewStaff] = useState({
        username: "",
        password: "",
        role: "waiter",
        businessUnit: "cafe",
        name: "",
        mobile: ""
    })

    const fetchStaff = async () => {
        const data = await getAllStaff()
        setStaff(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchStaff()
    }, [])

    const handleCreate = async () => {
        if (!newStaff.username || !newStaff.password || !newStaff.name) {
            alert("Please fill all required fields")
            return
        }

        const result = await createStaff(newStaff)
        if (result.success) {
            setIsAddOpen(false)
            setNewStaff({
                username: "",
                password: "",
                role: "waiter",
                businessUnit: "cafe",
                name: "",
                mobile: ""
            })
            fetchStaff()
        } else {
            alert("Failed to create staff member")
        }
    }

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        const result = await toggleStaffStatus(userId, !currentStatus)
        if (result.success) {
            fetchStaff()
        }
    }

    const handleDelete = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            return
        }

        const result = await deleteStaff(userId)
        if (result.success) {
            fetchStaff()
        } else {
            alert("Failed to delete user")
        }
    }

    const getRoleBadge = (role: string) => {
        const colors: any = {
            super_admin: "bg-[#EDEBFF] text-purple-800",
            owner: "bg-[#EDEBFF]/30 text-[#6D5DFB]",
            cafe_manager: "bg-[#BBF7D0] text-green-800",
            waiter: "bg-[#F59E0B]/10 text-[#F59E0B]800",
            kitchen: "bg-orange-100 text-orange-800",
            bar_manager: "bg-[#FEE2E2] text-red-800",
            bartender: "bg-[#FBCFE8] text-pink-800",
            hotel_manager: "bg-[#EDEBFF]/30 text-[#6D5DFB]",
            hotel_reception: "bg-cyan-100 text-cyan-800",
            garden_manager: "bg-lime-100 text-lime-800",
        }
        return colors[role] || "bg-[#F1F5F9] text-[#111827]"
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Full Name *</Label>
                                <Input
                                    value={newStaff.name}
                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Username *</Label>
                                <Input
                                    value={newStaff.username}
                                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                    placeholder="john_doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password *</Label>
                                <Input
                                    type="password"
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Mobile</Label>
                                <Input
                                    value={newStaff.mobile}
                                    onChange={(e) => setNewStaff({ ...newStaff, mobile: e.target.value })}
                                    placeholder="9876543210"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role *</Label>
                                    <Select value={newStaff.role} onValueChange={(val) => setNewStaff({ ...newStaff, role: val })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="waiter">Waiter</SelectItem>
                                            <SelectItem value="kitchen">Kitchen</SelectItem>
                                            <SelectItem value="cafe_manager">Cafe Manager</SelectItem>
                                            <SelectItem value="bartender">Bartender</SelectItem>
                                            <SelectItem value="bar_manager">Bar Manager</SelectItem>
                                            <SelectItem value="hotel_reception">Hotel Reception</SelectItem>
                                            <SelectItem value="hotel_manager">Hotel Manager</SelectItem>
                                            <SelectItem value="garden_manager">Garden Manager</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Business Unit *</Label>
                                    <Select value={newStaff.businessUnit} onValueChange={(val) => setNewStaff({ ...newStaff, businessUnit: val })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cafe">Cafe</SelectItem>
                                            <SelectItem value="bar">Bar</SelectItem>
                                            <SelectItem value="hotel">Hotel</SelectItem>
                                            <SelectItem value="garden">Garden</SelectItem>
                                            <SelectItem value="all">All</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleCreate}>Create Staff Member</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827]">All Staff Members ({staff.length})</h2>
                </div>
                <div className="p-8">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Business Unit</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.map((member) => {
                                const profile = JSON.parse(member.profile || '{}')
                                return (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{profile.name || "N/A"}</TableCell>
                                        <TableCell>{member.username}</TableCell>
                                        <TableCell>
                                            <Badge className={getRoleBadge(member.role)}>
                                                {member.role.replace(/_/g, " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize">{member.businessUnit}</TableCell>
                                        <TableCell>
                                            {member.isActive ? (
                                                <Badge variant="secondary" className="bg-[#BBF7D0] text-green-800">Active</Badge>
                                            ) : (
                                                <Badge variant="destructive">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleToggleStatus(member.id, member.isActive)}
                                            >
                                                {member.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(member.id, member.username)}
                                                disabled={member.role === "super_admin"}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}

