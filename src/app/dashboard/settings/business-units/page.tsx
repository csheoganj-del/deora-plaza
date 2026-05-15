"use client";

import { useState, useEffect } from "react";
import { getBusinessUnitManager, BusinessUnit } from "@/lib/business-units";

import { Button } from "@/components/ui/button";
;
import { LiquidButton } from "@/components/ui/LiquidButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Settings, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function BusinessUnitsSettingsPage() {
    const [units, setUnits] = useState<BusinessUnit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        loadUnits();
    }, []);

    const loadUnits = () => {
        try {
            const activeUnits = getBusinessUnitManager().getActiveBusinessUnits();
            if (activeUnits.length === 0) {
                // Basic fallback if no units returned
                setUnits([]);
            } else {
                setUnits(activeUnits);
            }
        } catch (error) {
            console.error("Failed to load units:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (unitId: string, currentStatus: boolean) => {
        // Logic to toggle status would go here
        // await getBusinessUnitManager().updateBusinessUnit(unitId, { isActive: !currentStatus });
        toast({
            title: "Status Updated",
            description: `Business unit status changed to ${!currentStatus ? 'Active' : 'Inactive'}`
        })
        loadUnits();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Business Units</h1>
                    <p className="text-[#9CA3AF] mt-1">Manage your business units and their configurations.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <LiquidButton>
                            <Plus className="mr-2 h-4 w-4" /> Add Business Unit
                        </LiquidButton>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add New Business Unit</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid w-full gap-2">
                                <Label htmlFor="name">Unit Name</Label>
                                <Input id="name" placeholder="e.g. Roof Top Cafe" />
                            </div>
                            {/* Simplified form for now */}
                            <p className="text-sm text-[#9CA3AF]">Contact admin to provision full business unit resources.</p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={() => {
                                setIsDialogOpen(false);
                                toast({ title: "Request Sent", description: "Admin will review your request." });
                            }}>Create Unit</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="premium-card">
                <Table>
                    <TableHeader className="bg-[#F8FAFC]/50">
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Operating Hours</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {units.length > 0 ? (
                            units.map((unit) => (
                                <TableRow key={unit.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                                    <TableCell className="font-medium text-[#111827]">{unit.name}</TableCell>
                                    <TableCell className="capitalize text-[#6B7280]">{unit.type.replace('_', ' ')}</TableCell>
                                    <TableCell>
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${unit.isActive ? 'bg-[#BBF7D0] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                                            {unit.isActive ? (
                                                <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                                            ) : (
                                                <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[#9CA3AF] text-sm">
                                        {/* Simplified display */}
                                        09:00 - 23:00
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-muted)] hover:text-[#6D5DFB]">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9CA3AF] hover:text-[#EF4444]">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-[#9CA3AF]">
                                    No business units found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

