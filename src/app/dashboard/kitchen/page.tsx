"use client";
import KitchenBoard from "@/components/kitchen/KitchenBoard";
import { ChefHat } from "lucide-react";


export const dynamic = "force-dynamic";

export default function KitchenPage() {
  return (
    <div className="flex h-screen bg-slate-950 relative overflow-hidden text-white">
      <div className="flex-1 flex flex-col p-6 overflow-hidden relative z-10 w-full">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8 text-white" />
              <h2 className="text-3xl font-bold tracking-tight">Kitchen Display System</h2>
            </div>
            <p className="text-[#9CA3AF] font-medium italic pl-11 opacity-80">
              Live Preparation Feed
            </p>
          </div>
          <div className="flex gap-4"></div>
        </div>
        <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-2xl">
          <KitchenBoard />
        </div>
      </div>
    </div>
  );
}

