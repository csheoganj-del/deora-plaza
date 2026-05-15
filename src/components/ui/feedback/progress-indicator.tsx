"use client";

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  value: number;
  className?: string;
  showValue?: boolean;
}

export function ProgressIndicator({ 
  value, 
  className,
  showValue = false 
}: ProgressIndicatorProps) {
  // Don't render if value is 0 or not provided
  if (!value || value <= 0) {
    return null;
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200/20",
      className
    )}>
      <div 
        className="h-full bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
      {showValue && (
        <div className="absolute top-2 right-4 text-xs text-white/70">
          {Math.round(value)}%
        </div>
      )}
    </div>
  );
}