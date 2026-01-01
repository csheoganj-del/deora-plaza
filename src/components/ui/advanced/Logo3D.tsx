"use client"

import React from 'react'
import { cn } from "@/lib/utils"

interface Logo3DProps {
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    animated?: boolean
}

export function Logo3D({ className, size = 'lg', animated = true }: Logo3DProps) {
    const sizeClasses = {
        sm: 'w-12 h-12 text-xl',
        md: 'w-20 h-20 text-3xl',
        lg: 'w-32 h-32 text-6xl',
        xl: 'w-48 h-48 text-8xl'
    }

    return (
        <div className={cn("relative perspective-1000", sizeClasses[size], className)}>
            <div className={cn(
                "w-full h-full relative preserve-3d transition-transform duration-1000",
                animated ? "animate-[spin-3d-complex_8s_linear_infinite]" : "animate-[float-3d_6s_ease-in-out_infinite]"
            )}>
                {/* Center Core */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6D5DFB] to-[#EDEBFF] rounded-[22%] flex items-center justify-center shadow-lg transform translate-z-0">
                    <span className="font-bold text-white font-sans drop-shadow-md">D</span>
                </div>

                {/* Front Glass Layer */}
                <div className="absolute inset-0 rounded-[22%] bg-gradient-to-br from-white/40 to-transparent backdrop-blur-[2px] border border-white/30 translate-z-[12px] shadow-xl" />

                {/* Back Glass Layer */}
                <div className="absolute inset-0 rounded-[22%] bg-[#6D5DFB]/30 backdrop-blur-[1px] border border-white/10 translate-z-[-12px]" />

                {/* Side Layers (Simulating depth) */}
                <div className="absolute inset-[2px] rounded-[20%] bg-[#6D5DFB]/20 translate-z-[6px]" />
                <div className="absolute inset-[2px] rounded-[20%] bg-[#6D5DFB]/20 translate-z-[-6px]" />

                {/* Floating Particles / Orbits */}
                <div className="absolute -inset-8 rounded-full border border-[#6D5DFB]/20 rotate-x-90 translate-y-8 animate-[spin_4s_linear_infinite]" />
                <div className="absolute -inset-12 rounded-full border border-[#EDEBFF]/20 rotate-y-90 translate-x-12 animate-[spin_5s_linear_infinite_reverse]" />
            </div>
        </div>
    )
}

