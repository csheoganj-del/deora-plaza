"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bed, UtensilsCrossed } from "lucide-react";

type Room = { id?: string; number: string };
interface RoomServiceDialogProps { isOpen: boolean; onClose: () => void; room: Room | null }

export default function RoomServiceDialogFixed({ isOpen, onClose, room }: RoomServiceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Room Service{room?.number ? ` — Room ${room.number}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#111827]">
            <UtensilsCrossed className="h-5 w-5" />
            <span>To place an order, use the POS and select this room.</span>
          </div>
          <div className="flex items-center gap-2 text-[#9CA3AF]">
            <Bed className="h-5 w-5" />
            <span>Orders will appear in Room Service Orders.</span>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

