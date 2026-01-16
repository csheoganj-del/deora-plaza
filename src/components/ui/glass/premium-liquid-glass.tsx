"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumLiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'card' | 'container' | 'stats' | 'action';
  animated?: boolean;
  depth?: 'light' | 'medium' | 'heavy';
  delay?: number;
  style?: React.CSSProperties;
}

// Ultra-simple navigation item - NO animations, NO extra layers, FIXED dimensions
function SimpleNavItem({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative rounded-xl',
        'bg-white/8 border border-white/15',
        'backdrop-blur-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Static version for navigation items - NO FRAMER MOTION
function StaticLiquidGlass({
  children,
  className = '',
  variant = 'card',
  depth = 'medium',
  style,
  ...props
}: Omit<PremiumLiquidGlassProps, 'animated' | 'delay'> & React.HTMLAttributes<HTMLDivElement>) {

  // Check if this is a navigation item - use ultra-simple version
  const isNavItem = className?.includes('compact-nav-item');

  if (isNavItem) {
    return (
      <SimpleNavItem className={className} {...props}>
        {children}
      </SimpleNavItem>
    );
  }

  const variantStyles = {
    card: 'rounded-2xl p-6',
    container: 'rounded-3xl p-8',
    stats: 'rounded-2xl p-6',
    action: 'rounded-2xl p-6'
  };

  const depthStyles = {
    light: 'backdrop-blur-lg bg-white/6 border-white/12',
    medium: 'backdrop-blur-xl bg-white/8 border-white/15',
    heavy: 'backdrop-blur-2xl bg-white/12 border-white/20'
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden border',
        'liquid-glass-effect adaptive-card',
        variantStyles[variant],
        depthStyles[depth],
        'shadow-xl',
        className
      )}
      style={style}
      {...props}
    >
      {/* Liquid Glass Background Layers */}
      <div className="absolute inset-0 liquid-glass-bg" />

      {/* Depth Shadow */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 rounded-inherit" />

      {/* Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/10 rounded-inherit" />

      {/* Surface Reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-inherit opacity-60" />

      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>

      {/* Edge Highlight */}
      <div className="absolute inset-0 rounded-inherit ring-1 ring-white/20 ring-inset pointer-events-none z-10" />
    </div>
  );
}

export function PremiumLiquidGlass({
  children,
  className = '',
  variant = 'card',
  animated = true,
  depth = 'medium',
  delay = 0,
  style,
  ...props
}: PremiumLiquidGlassProps & React.HTMLAttributes<HTMLDivElement>) {

  const variantStyles = {
    card: 'rounded-2xl p-6',
    container: 'rounded-3xl p-8',
    stats: 'rounded-2xl p-6',
    action: 'rounded-2xl p-6'
  };

  const depthStyles = {
    light: 'backdrop-blur-lg bg-white/6 border-white/12',
    medium: 'backdrop-blur-xl bg-white/8 border-white/15',
    heavy: 'backdrop-blur-2xl bg-white/12 border-white/20'
  };

  // For navigation items, use completely static version (no Framer Motion at all)
  const isNavItem = className?.includes('compact-nav-item');

  if (isNavItem || !animated) {
    return (
      <StaticLiquidGlass
        className={className}
        variant={variant}
        depth={depth}
        style={style}
        {...props}
      >
        {children}
      </StaticLiquidGlass>
    );
  }

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden border',
        'liquid-glass-effect adaptive-card',
        variantStyles[variant],
        depthStyles[depth],
        'shadow-xl',
        className
      )}
      style={{
        transform: "translateZ(0)",
        ...style
      }}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{
        transition: { duration: 0.2 }
      }}
      {...props}
    >
      {/* Liquid Glass Background Layers - Same as Login */}
      <div className="absolute inset-0 liquid-glass-bg" />

      {/* Depth Shadow */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 rounded-inherit" />

      {/* Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/10 rounded-inherit" />

      {/* Surface Reflection - Same as Login */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-inherit opacity-60" />

      {/* Animated Liquid Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-inherit"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 2,
          delay: delay * 0.5
        }}
      />

      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>

      {/* Edge Highlight - Same as Login */}
      <div className="absolute inset-0 rounded-inherit ring-1 ring-white/20 ring-inset pointer-events-none z-10" />
    </motion.div>
  );
}

// Specialized components for different dashboard elements
// Enhanced Stats Card that can accept specific props OR children
interface PremiumStatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  // Content Props
  title?: string;
  value?: string;
  trend?: string | { value: any; label: string; positive?: boolean };
  trendUp?: boolean;
  icon?: any;
}

export function PremiumStatsCard({
  children,
  className = '',
  delay = 0,
  onClick,
  title,
  value,
  trend,
  trendUp,
  icon
}: PremiumStatsCardProps) {

  // If children are provided, behave as a container (backward compatibility)
  if (children) {
    return (
      <PremiumLiquidGlass
        variant="stats"
        depth="medium"
        delay={delay}
        className={cn(onClick && "cursor-pointer", className)}
        onClick={onClick}
      >
        {children}
      </PremiumLiquidGlass>
    );
  }

  // Helper to extract trend data
  const trendLabel = typeof trend === 'object' ? trend?.label : trend;
  // If trend is object, use its positive property, fallback to trendUp prop
  const isPositive = typeof trend === 'object' ? trend?.positive : trendUp;

  // Otherwise render the standard stats layout
  return (
    <PremiumLiquidGlass
      variant="stats"
      depth="medium"
      delay={delay}
      className={cn("group", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-white/20 transition-colors shadow-inner">
          {React.isValidElement(icon) ? (
            icon
          ) : (
            icon && React.createElement(icon as React.ElementType, { className: "w-6 h-6 text-white/90" })
          )}
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border backdrop-blur-md",
            isPositive
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          )}>
            {trendLabel}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-white/60 mb-1">{title}</h3>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
      </div>
    </PremiumLiquidGlass>
  );
}

export function PremiumActionCard({
  children,
  className = '',
  delay = 0,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <PremiumLiquidGlass
      variant="action"
      depth="medium"
      delay={delay}
      className={cn("group", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      {children}
    </PremiumLiquidGlass>
  );
}

export function PremiumContainer({
  children,
  className = '',
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <PremiumLiquidGlass
      variant="container"
      depth="heavy"
      delay={delay}
      className={className}
    >
      {children}
    </PremiumLiquidGlass>
  );
}