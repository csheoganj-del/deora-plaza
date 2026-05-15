"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Server, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncEngine } from '@/lib/realtime/sync-engine';
import { useAudioNotifications } from '@/lib/audio/notification-system';

interface RealtimeStatusProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showDetails?: boolean;
  className?: string;
}

export function RealtimeStatus({ 
  position = 'top-right',
  showDetails = false,
  className 
}: RealtimeStatusProps) {
  const syncEngine = useSyncEngine();
  const { playNotification } = useAudioNotifications();
  const [status, setStatus] = useState(syncEngine.getServerStatus());
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(syncEngine.getServerStatus());
    };

    // Listen to sync engine events
    syncEngine.on('health-check-complete', updateStatus);
    syncEngine.on('failover-complete', (data) => {
      updateStatus();
      playNotification({
        type: 'warning',
        title: 'Server Failover',
        message: `Switched from ${data.from} to ${data.to}`,
        priority: 'high'
      });
    });
    syncEngine.on('all-servers-down', () => {
      updateStatus();
      playNotification({
        type: 'error',
        title: 'All Servers Down',
        message: 'System offline - check connection',
        priority: 'critical'
      });
    });
    syncEngine.on('online', () => {
      updateStatus();
      playNotification({
        type: 'success',
        title: 'Back Online',
        message: 'Connection restored',
        priority: 'medium'
      });
    });
    syncEngine.on('offline', () => {
      updateStatus();
      playNotification({
        type: 'warning',
        title: 'Connection Lost',
        message: 'Working offline',
        priority: 'high'
      });
    });

    // Initial status check
    updateStatus();

    return () => {
      syncEngine.removeAllListeners();
    };
  }, [syncEngine, playNotification]);

  const getStatusInfo = () => {
    if (!status.isOnline) {
      return {
        icon: WifiOff,
        color: 'text-[#FEE2E2]0',
        bgColor: 'bg-[#FEE2E2]0/20',
        borderColor: 'border-[#FEE2E2]0/30',
        label: 'Offline',
        description: 'Working offline mode'
      };
    }

    const activeServerConfig = status.servers.find(s => s.id === status.activeServer);
    
    if (!activeServerConfig?.isActive) {
      return {
        icon: AlertTriangle,
        color: 'text-[#F59E0B]',
        bgColor: 'bg-[#F59E0B]/100/20',
        borderColor: 'border-[#FEF3C7]0/30',
        label: 'Degraded',
        description: 'Some servers unavailable'
      };
    }

    if (status.queuedOperations > 0) {
      return {
        icon: Clock,
        color: 'text-[#EFF6FF]0',
        bgColor: 'bg-[#EFF6FF]0/20',
        borderColor: 'border-[#EFF6FF]0/30',
        label: 'Syncing',
        description: `${status.queuedOperations} operations pending`
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-[#DCFCE7]0',
      bgColor: 'bg-[#DCFCE7]0/20',
      borderColor: 'border-[#DCFCE7]0/30',
      label: 'Online',
      description: 'All systems operational'
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <motion.div
      className={cn(
        'fixed z-50',
        positionClasses[position],
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Status Indicator */}
        <motion.div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl glass-morphism border',
            statusInfo.bgColor,
            statusInfo.borderColor,
            showDetails ? 'min-w-[120px]' : 'w-auto'
          )}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Animated Icon */}
          <motion.div
            className={cn('relative', statusInfo.color)}
            animate={{
              rotate: statusInfo.label === 'Syncing' ? 360 : 0,
            }}
            transition={{
              duration: 2,
              repeat: statusInfo.label === 'Syncing' ? Infinity : 0,
              ease: "linear"
            }}
          >
            <Icon size={16} />
            
            {/* Pulse Effect */}
            <motion.div
              className={cn(
                'absolute inset-0 rounded-full',
                statusInfo.bgColor
              )}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Status Text */}
          {showDetails && (
            <motion.span
              className={cn('text-sm font-medium', statusInfo.color)}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              {statusInfo.label}
            </motion.span>
          )}
        </motion.div>

        {/* Detailed Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              className={cn(
                'absolute z-10 p-3 rounded-xl glass-morphism-heavy border border-white/20',
                'min-w-[200px] text-sm',
                position.includes('right') ? 'right-0' : 'left-0',
                position.includes('top') ? 'top-full mt-2' : 'bottom-full mb-2'
              )}
              initial={{ opacity: 0, y: position.includes('top') ? -10 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: position.includes('top') ? -10 : 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={statusInfo.color} />
                  <span className="font-medium">{statusInfo.label}</span>
                </div>
                
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  {statusInfo.description}
                </p>
                
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Active Server:</span>
                    <span className="font-mono">{status.activeServer}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span>Queue:</span>
                    <span className="font-mono">{status.queuedOperations}</span>
                  </div>
                  
                  {status.servers.map(server => (
                    <div key={server.id} className="flex justify-between text-xs">
                      <span>{server.id}:</span>
                      <div className="flex items-center gap-1">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            server.isActive ? 'bg-[#DCFCE7]0' : 'bg-[#FEE2E2]0'
                          )}
                        />
                        <span className="font-mono">
                          {server.isActive ? `${server.latency}ms` : 'down'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function ServerHealthIndicator({ serverId }: { serverId: string }) {
  const syncEngine = useSyncEngine();
  const [serverStatus, setServerStatus] = useState(
    syncEngine.getServerStatus().servers.find(s => s.id === serverId)
  );

  useEffect(() => {
    const updateStatus = () => {
      const status = syncEngine.getServerStatus();
      setServerStatus(status.servers.find(s => s.id === serverId));
    };

    syncEngine.on('health-check-complete', updateStatus);
    updateStatus();

    return () => {
      syncEngine.removeListener('health-check-complete', updateStatus);
    };
  }, [syncEngine, serverId]);

  if (!serverStatus) return null;

  return (
    <motion.div
      className="flex items-center gap-2 text-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={cn(
          'w-3 h-3 rounded-full',
          serverStatus.isActive ? 'bg-[#DCFCE7]0' : 'bg-[#FEE2E2]0'
        )}
        animate={{
          scale: serverStatus.isActive ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: serverStatus.isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      
      <span className="font-medium">{serverId}</span>
      
      <span className="text-[#9CA3AF] font-mono text-xs">
        {serverStatus.isActive ? `${serverStatus.latency}ms` : 'offline'}
      </span>
    </motion.div>
  );
}