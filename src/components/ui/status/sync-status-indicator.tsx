"use client";

/**
 * 🔄 Sync Status Indicator
 * 
 * Small component to show sync status in the UI
 */

import { useSyncStatus } from '@/lib/database/sync-hooks';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Database } from 'lucide-react';

interface SyncStatusIndicatorProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'icon' | 'full';
}

export function SyncStatusIndicator({ 
  showText = false, 
  size = 'md',
  variant = 'badge'
}: SyncStatusIndicatorProps) {
  const { 
    isRunning, 
    isInitialized, 
    errorCount, 
    totalRecordsSynced,
    lastSync 
  } = useSyncStatus();

  const getStatus = () => {
    if (!isInitialized) return 'not-initialized';
    if (errorCount > 0) return 'error';
    if (isRunning) return 'running';
    return 'stopped';
  };

  const getStatusConfig = () => {
    const status = getStatus();
    
    switch (status) {
      case 'running':
        return {
          color: 'default' as const,
          icon: CheckCircle,
          text: 'Sync Active',
          description: `Database sync is running. ${totalRecordsSynced} records synced.`
        };
      case 'stopped':
        return {
          color: 'secondary' as const,
          icon: XCircle,
          text: 'Sync Stopped',
          description: 'Database sync is currently stopped.'
        };
      case 'error':
        return {
          color: 'destructive' as const,
          icon: AlertTriangle,
          text: 'Sync Errors',
          description: `${errorCount} sync errors detected. Check the sync dashboard.`
        };
      case 'not-initialized':
        return {
          color: 'outline' as const,
          icon: Loader2,
          text: 'Initializing',
          description: 'Database sync is initializing...'
        };
      default:
        return {
          color: 'outline' as const,
          icon: Database,
          text: 'Unknown',
          description: 'Sync status unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size];

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Icon 
                className={`${iconSize} ${
                  getStatus() === 'running' ? 'text-green-500' :
                  getStatus() === 'error' ? 'text-red-500' :
                  getStatus() === 'not-initialized' ? 'text-yellow-500 animate-spin' :
                  'text-gray-500'
                }`} 
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{config.text}</p>
              <p className="text-sm">{config.description}</p>
              {lastSync && (
                <p className="text-xs text-muted-foreground">
                  Last sync: {new Date(lastSync).toLocaleString()}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'full') {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Icon 
          className={`${iconSize} ${
            getStatus() === 'running' ? 'text-green-500' :
            getStatus() === 'error' ? 'text-red-500' :
            getStatus() === 'not-initialized' ? 'text-yellow-500 animate-spin' :
            'text-gray-500'
          }`} 
        />
        <span>{config.text}</span>
        {totalRecordsSynced > 0 && (
          <span className="text-muted-foreground">
            ({totalRecordsSynced.toLocaleString()} synced)
          </span>
        )}
      </div>
    );
  }

  // Default badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.color} className="flex items-center space-x-1">
            <Icon 
              className={`${iconSize} ${
                getStatus() === 'not-initialized' ? 'animate-spin' : ''
              }`} 
            />
            {showText && <span>{config.text}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{config.text}</p>
            <p className="text-sm">{config.description}</p>
            {lastSync && (
              <p className="text-xs text-muted-foreground">
                Last sync: {new Date(lastSync).toLocaleString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}