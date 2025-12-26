"use client";

import { useEffect } from "react";
import { PhysicsGlassCard } from "./physics-glass-card";
import { dynamicAccentSystem } from "@/lib/dynamic-accent-system";
import { useSmoothScrolling } from "@/hooks/useSmoothScrolling";

interface NextGenDashboardProps {
  children: React.ReactNode;
  enablePhysics?: boolean;
  enableDynamicAccent?: boolean;
  enableSmoothScroll?: boolean;
  accentMode?: 'time' | 'business' | 'seasonal' | 'ai';
  businessMetrics?: {
    revenue: number;
    previousRevenue: number;
  };
}

/**
 * Next-Gen Dashboard Wrapper
 * Integrates all flagship features: Physics, Dynamic Accent, Smooth Scroll
 */
export function NextGenDashboard({
  children,
  enablePhysics = true,
  enableDynamicAccent = true,
  enableSmoothScroll = true,
  accentMode = 'time',
  businessMetrics
}: NextGenDashboardProps) {
  
  // Initialize smooth scrolling
  const { stop: stopScrolling } = useSmoothScrolling({
    enabled: enableSmoothScroll,
    friction: 0.85,
    maxVelocity: 50
  });

  // Initialize dynamic accent system
  useEffect(() => {
    if (!enableDynamicAccent) return;

    const initializeAccent = () => {
      switch (accentMode) {
        case 'time':
          dynamicAccentSystem.setTimeBasedAccent();
          break;
        case 'business':
          if (businessMetrics) {
            dynamicAccentSystem.setBusinessAccent(
              businessMetrics.revenue,
              businessMetrics.previousRevenue
            );
          }
          break;
        case 'seasonal':
          dynamicAccentSystem.setSeasonalAccent();
          break;
        case 'ai':
          dynamicAccentSystem.setAIAccent({
            timeOfDay: true,
            businessMetrics,
            seasonal: true
          });
          break;
        default:
          dynamicAccentSystem.setAccent('primary');
      }
    };

    initializeAccent();

    // Update accent every 30 minutes for time-based mode
    if (accentMode === 'time' || accentMode === 'ai') {
      const interval = setInterval(initializeAccent, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [enableDynamicAccent, accentMode, businessMetrics]);

  return (
    <div className="next-gen-dashboard" data-dashboard>
      {children}
    </div>
  );
}

/**
 * Enhanced Stats Card with Physics
 */
interface NextGenStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  delay?: number;
  enableFloat?: boolean;
  className?: string;
}

export function NextGenStatsCard({
  title,
  value,
  subtitle,
  icon,
  delay = 0,
  enableFloat = false,
  className = ""
}: NextGenStatsCardProps) {
  return (
    <PhysicsGlassCard 
      delay={delay} 
      enableFloat={enableFloat}
      className={className}
    >
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-[#9CA3AF]">{title}</h3>
        {icon}
      </div>
      <div className="pt-2">
        <div className="text-2xl font-bold text-[#111827]">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-[#9CA3AF] pt-1">
            {subtitle}
          </p>
        )}
      </div>
    </PhysicsGlassCard>
  );
}

/**
 * Enhanced Quick Access Card with Physics
 */
interface NextGenQuickAccessCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  delay?: number;
  className?: string;
}

// Card Content Component (moved outside render)
function CardContent({ 
  title, 
  subtitle, 
  icon, 
  delay, 
  className 
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  delay: number;
  className: string;
}) {
  return (
    <PhysicsGlassCard 
      delay={delay} 
      enableFloat={true}
      enableGravity={true}
      className={`cursor-pointer ${className}`}
    >
      <div className="flex flex-col items-center space-y-4 p-6 text-center">
        <div className="icon-container p-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg text-[#111827] mb-1">
            {title}
          </h3>
          <p className="text-sm text-[#9CA3AF]">
            {subtitle}
          </p>
        </div>
      </div>
    </PhysicsGlassCard>
  );
}

export function NextGenQuickAccessCard({
  title,
  subtitle,
  icon,
  href,
  onClick,
  delay = 0,
  className = ""
}: NextGenQuickAccessCardProps) {
  if (href) {
    return (
      <a href={href}>
        <CardContent 
          title={title}
          subtitle={subtitle}
          icon={icon}
          delay={delay}
          className={className}
        />
      </a>
    );
  }

  return (
    <div onClick={onClick}>
      <CardContent 
        title={title}
        subtitle={subtitle}
        icon={icon}
        delay={delay}
        className={className}
      />
    </div>
  );
}