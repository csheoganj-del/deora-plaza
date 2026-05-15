"use client";

import { SimplifiedGlassCard } from "@/components/ui/simplified-glass-card";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import { cn } from "@/lib/utils";

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  delay?: number;
  className?: string;
  onClick?: () => void;
}

export function EnhancedStatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  delay = 0,
  className,
  onClick
}: EnhancedStatsCardProps) {
  return (
    <SimplifiedGlassCard 
      variant="stats" 
      delay={delay}
      enableHover={!!onClick}
      className={cn("p-6", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-text">{title}</h3>
        {icon && (
          <div className="simplified-icon-container">
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-2xl font-bold text-high-contrast">
          {value}
        </div>
        
        <div className="flex items-center justify-between">
          {subtitle && (
            <p className="text-xs text-neutral-text">
              {subtitle}
            </p>
          )}
          
          {trend && (
            <TrendIndicator 
              value={trend.value}
              label={trend.label}
              className="ml-auto"
            />
          )}
        </div>
      </div>
    </SimplifiedGlassCard>
  );
}