"use client";
import KitchenBoard from "@/components/kitchen/KitchenBoard";
import { ChefHat } from "lucide-react";


export const dynamic = "force-dynamic";

export default function KitchenPage() {
  return (
    <div className="pb-20">
      <KitchenBoard />
    </div>
  );
}

