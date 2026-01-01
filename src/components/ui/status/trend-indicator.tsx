"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function TrendIndicator({ 
  value, 
  label, 
  showIcon = true, 
  className 
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  
  const colorClass = isNeutral 
    ? "text-neutral-500" 
    : isPositive 
      ? "text-success-data" 
      : "text-red-500";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {showIcon && <Icon className={cn("h-4 w-4", colorClass)} />}
      <span className={cn("text-sm font-medium", colorClass)}>
        {isPositive && "+"}
        {value.toFixed(1)}%
      </span>
      {label && (
        <span className="text-xs text-neutral-text">
          {label}
        </span>
      )}
    </div>
  );
}