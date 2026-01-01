"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface HolographicLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export function HolographicLogo({ 
  className, 
  size = "md",
  ...props 
}: HolographicLogoProps) {
  const sizeClasses = {
    sm: "w-16 h-16 text-2xl",
    md: "w-24 h-24 text-4xl",
    lg: "w-32 h-32 text-6xl"
  }

  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center rounded-full",
        "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",
        "shadow-2xl",
        sizeClasses[size],
        className
      )}
      initial={{ opacity: 0, scale: 0.8, rotateY: -180 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotateY: 0,
      }}
      transition={{ 
        duration: 1.2, 
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{ 
        scale: 1.1,
        rotateY: 15,
        rotateX: 15,
      }}
      style={{
        background: `
          linear-gradient(45deg, 
            #3b82f6 0%, 
            #8b5cf6 25%, 
            #ec4899 50%, 
            #f59e0b 75%, 
            #3b82f6 100%
          )`,
        backgroundSize: '200% 200%',
        animation: 'holographic-shift 4s ease-in-out infinite',
      }}
      {...props}
    >
      {/* Inner glow */}
      <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm" />
      
      {/* Logo text */}
      <motion.div
        className="relative z-10 font-bold text-white drop-shadow-lg"
        animate={{ 
          textShadow: [
            "0 0 10px rgba(255,255,255,0.8)",
            "0 0 20px rgba(59,130,246,0.8)",
            "0 0 30px rgba(139,92,246,0.8)",
            "0 0 20px rgba(236,72,153,0.8)",
            "0 0 10px rgba(255,255,255,0.8)",
          ]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        D
      </motion.div>
      
      {/* Holographic reflection */}
      <div 
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `
            linear-gradient(135deg, 
              transparent 0%, 
              rgba(255,255,255,0.3) 45%, 
              rgba(255,255,255,0.1) 55%, 
              transparent 100%
            )`,
        }}
      />
      
      <style jsx>{`
        @keyframes holographic-shift {
          0%, 100% { 
            background-position: 0% 50%;
            filter: hue-rotate(0deg);
          }
          25% { 
            background-position: 100% 50%;
            filter: hue-rotate(90deg);
          }
          50% { 
            background-position: 100% 100%;
            filter: hue-rotate(180deg);
          }
          75% { 
            background-position: 0% 100%;
            filter: hue-rotate(270deg);
          }
        }
      `}</style>
    </motion.div>
  )
}