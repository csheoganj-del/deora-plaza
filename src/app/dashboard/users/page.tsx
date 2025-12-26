"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
;

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Search, Trash2, Edit, Power, PowerOff, Users } from "lucide-react";
import { UserManagementDialog } from "@/components/security/UserManagementDialog";
import { PasswordDialog } from "@/components/ui/PasswordDialog";
import {
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  type User,
  type UserRole,
  type BusinessUnit,
} from "@/actions/user-management";
import { toast } from "@/hooks/use-toast";

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  owner: "Owner",
  manager: "Manager",
  cafe_manager: "Cafe Manager",
  bar_manager: "Bar Manager",
  hotel_manager: "Hotel Manager",
  garden_manager: "Garden Manager",
  waiter: "Waiter",
  kitchen: "Kitchen Staff",
  bartender: "Bartender",
  reception: "Reception",
  hotel_reception: "Hotel Reception",
};

const businessUnitLabels: Record<BusinessUnit, string> = {
  all: "All Units",
  cafe: "Cafe & Restaurant",
  bar: "Bar",
  hotel: "Hotel",
  garden: "Garden",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<"single" | "bulk">("single");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success && result.data) {
      setUsers(result.data as User[]);
    } else {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSingleDelete = (userId: string) => {
    setUserToDelete(userId);
    setPasswordAction("single");
    setIsPasswordDialogOpen(true);
  };

  const handleBulkDelete = () => {
    setPasswordAction("bulk");
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    // SECURE: Get deletion password from environment variables only
    const DELETION_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_DELETION_PASSWORD;

    if (!DELETION_PASSWORD) {
      toast({ title: "Error", description: "Deletion password not configured in environment", variant: "destructive" });
      return;
    }

    if (password !== DELETION_PASSWORD) {
      toast({ title: "Error", description: "Invalid admin password", variant: "destructive" });
      return;
    }

    if (passwordAction === "single" && userToDelete) {
      const result = await deleteUser(userToDelete);
      if (result.success) {
        toast({ title: "Success", description: "User deleted successfully" });
        fetchUsers();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete user", variant: "destructive" });
      }
    } else if (passwordAction === "bulk") {
      const deletePromises = Array.from(selectedUsers).map((id) => deleteUser(id));
      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        toast({ title: "Success", description: `${successCount} user(s) deleted successfully` });
        setSelectedUsers(new Set());
        fetchUsers();
      }

      const failedCount = results.filter((r) => !r.success).length;
      if (failedCount > 0) {
        toast({ title: "Error", description: `${failedCount} user(s) failed to delete`, variant: "destructive" });
      }
    }

    setIsPasswordDialogOpen(false);
    setUserToDelete(null);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const result = await toggleUserStatus(userId, !currentStatus);
    if (result.success) {
      toast({ title: "Success", description: `User ${!currentStatus ? "activated" : "deactivated"} successfully` });
      fetchUsers();
    } else {
      toast({ title: "Error", description: result.error || "Failed to update user status", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber?.includes(searchQuery);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesBusinessUnit =
      businessUnitFilter === "all" || user.businessUnit === businessUnitFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesBusinessUnit && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
          <Users className="h-7 w-7" />
          User Management
        </h1>
        <p className="text-[#6B7280] text-base">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-3xl font-bold text-[#111827]">Users ({filteredUsers.length})</h2>
            <Button onClick={handleAddUser} className="bg-[#6D5DFB] hover:bg-[#5B4EE5] text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>
        <div className="p-8">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Business Unit Filter */}
            <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Units</SelectItem>
                {Object.entries(businessUnitLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mb-4 p-3 bg-[#EDEBFF]/20 border border-[#EDEBFF]/30 rounded-lg flex items-center justify-between">
              <span className="text-sm text-[#6D5DFB] font-medium">
                {selectedUsers.size} user(s) selected
              </span>
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="bg-[#EF4444] hover:bg-[#DC2626]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-8 text-[#6B7280]">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              No users found matching your filters.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.size === filteredUsers.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Username/Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        {user.authMethod === "password" ? (
                          <span className="text-[#6B7280]">@{user.username}</span>
                        ) : (
                          <span className="text-[#6B7280]">{user.phoneNumber}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {businessUnitLabels[user.businessUnit]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-[#BBF7D0] text-[#16A34A] hover:bg-[#BBF7D0]">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2]">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                          className="h-8 w-8 text-[#6D5DFB] hover:text-[#6D5DFB] hover:bg-[#EDEBFF]/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={`h-8 w-8 ${user.isActive
                            ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            : "text-[#22C55E] hover:text-[#16A34A] hover:bg-[#DCFCE7]"
                            }`}
                        >
                          {user.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSingleDelete(user.id)}
                          className="h-8 w-8 text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <UserManagementDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={fetchUsers}
        editingUser={editingUser}
      />

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onConfirm={handlePasswordConfirm}
        title="Confirm Deletion"
        description={
          passwordAction === "single"
            ? "Please enter admin password to delete this user."
            : `Please enter admin password to delete ${selectedUsers.size} selected user(s).`
        }
      />
    </div>
  );
}

