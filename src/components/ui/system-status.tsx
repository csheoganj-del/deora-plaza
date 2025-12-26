"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemStatusProps {
  className?: string;
}

type SystemHealth = {
  status: 'online' | 'warning' | 'offline' | 'loading';
  message: string;
  lastChecked?: Date;
};

export function SystemStatus({ className }: SystemStatusProps) {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'loading',
    message: 'Checking system status...'
  });

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        // Simulate system health check
        // In real implementation, this would check backend health, database connectivity, etc.
        const response = await fetch('/api/health', { 
          method: 'GET',
          cache: 'no-store'
        }).catch(() => null);

        if (response?.ok) {
          setHealth({
            status: 'online',
            message: 'All Systems Operational',
            lastChecked: new Date()
          });
        } else {
          setHealth({
            status: 'warning',
            message: 'Some Services Degraded',
            lastChecked: new Date()
          });
        }
      } catch (error) {
        setHealth({
          status: 'offline',
          message: 'System Check Failed',
          lastChecked: new Date()
        });
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    online: {
      icon: CheckCircle,
      color: "text-success-data",
      bgColor: "bg-success-data/10",
      dotColor: "bg-success-data"
    },
    warning: {
      icon: AlertCircle,
      color: "text-warning-data",
      bgColor: "bg-warning-data/10",
      dotColor: "bg-warning-data"
    },
    offline: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      dotColor: "bg-red-500"
    },
    loading: {
      icon: Loader2,
      color: "text-neutral-text",
      bgColor: "bg-neutral-500/10",
      dotColor: "bg-neutral-500"
    }
  };

  const config = statusConfig[health.status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", config.bgColor, className)}>
      <div className="relative flex items-center">
        <div className={cn("w-2 h-2 rounded-full", config.dotColor)}>
          {health.status === 'online' && (
            <div className={cn("w-2 h-2 rounded-full animate-ping absolute", config.dotColor, "opacity-75")} />
          )}
        </div>
      </div>
      <Icon className={cn("h-4 w-4", config.color, health.status === 'loading' && "animate-spin")} />
      <span className={cn("text-sm font-medium", config.color)}>
        {health.message}
      </span>
      {health.lastChecked && (
        <span className="text-xs text-neutral-text ml-auto">
          {health.lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}