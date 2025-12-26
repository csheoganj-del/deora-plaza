"use client";

import React from "react";
import { GlassMorphismDemo } from "@/components/ui/GlassMorphismDemo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GlassDemoPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <GlassMorphismDemo />
      </div>
    </div>
  );
}

