"use client";

import { useState } from "react";
import { createCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddCustomerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddCustomerDialog({
    isOpen,
    onClose,
    onSuccess,
}: AddCustomerDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [notes, setNotes] = useState("");

    const resetForm = () => {
        setName("");
        setMobile("");
        setEmail("");
        setNotes("");
    };

    const handleSubmit = async () => {
        if (!name || !mobile) {
            toast({
                title: "Missing Information",
                description: "Please provide customer name and mobile number",
                variant: "destructive",
            });
            return;
        }

        if (mobile.length !== 10) {
            toast({
                title: "Invalid Mobile",
                description: "Mobile number must be exactly 10 digits",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const result = await createCustomer({
                name,
                mobileNumber: mobile,
                email: email || undefined,
                notes: notes || undefined,
            });

            if (result.success) {
                toast({
                    title: "Customer Added",
                    description: `${name} has been added to the database`,
                });
                resetForm();
                onSuccess?.();
                onClose();
            } else {
                throw new Error("Failed to create customer");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add customer",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => !loading && !open && onClose()}
        >
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Add New Customer
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="customer-name">Name *</Label>
                        <Input
                            id="customer-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Customer Name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer-mobile">Mobile Number *</Label>
                        <Input
                            id="customer-mobile"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            type="tel"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer-email">Email (Optional)</Label>
                        <Input
                            id="customer-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="customer@example.com"
                            type="email"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer-notes">Notes (Optional)</Label>
                        <Textarea
                            id="customer-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional information..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Add Customer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

