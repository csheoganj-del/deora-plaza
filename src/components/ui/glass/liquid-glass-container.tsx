"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiquidGlassContainerProps {
  children: React.ReactNode;
  className?: string;
  depth?: 'light' | 'medium' | 'heavy';
  animated?: boolean;
}

export function LiquidGlassContainer({
  children,
  className = '',
  depth = 'medium',
  animated = true
}: LiquidGlassContainerProps) {
  const depthClasses = {
    light: 'backdrop-blur-md bg-white/5 border-white/10',
    medium: 'backdrop-blur-xl bg-white/8 border-white/15',
    heavy: 'backdrop-blur-2xl bg-white/12 border-white/20'
  };

  const shadowClasses = {
    light: 'shadow-lg',
    medium: 'shadow-xl',
    heavy: 'shadow-2xl'
  };

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-3xl border',
        'liquid-glass-effect',
        depthClasses[depth],
        shadowClasses[depth],
        className
      )}
      initial={animated ? { opacity: 0, scale: 0.95, y: 20 } : undefined}
      animate={animated ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={animated ? { 
        duration: 0.8, 
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "spring",
        damping: 20,
        stiffness: 300
      } : undefined}
      whileHover={animated ? {
        scale: 1.02,
        y: -2,
        transition: { duration: 0.3 }
      } : undefined}
    >
      {/* Liquid Glass Background Layers */}
      <div className="absolute inset-0 liquid-glass-bg" />
      
      {/* Depth Shadow */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 rounded-3xl" />
      
      {/* Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/10 rounded-3xl" />
      
      {/* Surface Reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl opacity-60" />
      
      {/* Animated Liquid Effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 2
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Edge Highlight */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/20 ring-inset" />
    </motion.div>
  );
}

export function LiquidGlassCard({
  children,
  className = '',
  animated = true
}: {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'backdrop-blur-lg bg-white/6 border border-white/12',
        'shadow-lg',
        className
      )}
      initial={animated ? { opacity: 0, y: 10 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { duration: 0.6, ease: "easeOut" } : undefined}
      whileHover={animated ? {
        scale: 1.01,
        transition: { duration: 0.2 }
      } : undefined}
    >
      {/* Glass Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-white/4 to-white/2 rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-2xl" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Inner Border */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/15 ring-inset" />
    </motion.div>
  );
}