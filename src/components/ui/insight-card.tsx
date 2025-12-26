"use client";

import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimplifiedGlassCard } from "./simplified-glass-card";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertCircle
};

const colorMap = {
  info: "text-blue-500",
  warning: "text-warning-data",
  success: "text-success-data",
  error: "text-red-500"
};

export function InsightCard({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className
}: InsightCardProps) {
  const Icon = iconMap[type];
  const iconColor = colorMap[type];

  return (
    <SimplifiedGlassCard variant="insight" className={cn("p-4", className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-high-contrast text-sm mb-1">
            {title}
          </h4>
          <p className="text-sm text-neutral-text mb-3">
            {description}
          </p>
          {actionLabel && onAction && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onAction}
              className="h-8 px-3 text-xs"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </SimplifiedGlassCard>
  );
}