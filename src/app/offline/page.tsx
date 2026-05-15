"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { EtherealCard } from '@/components/ui/ethereal-card';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { HolographicLogo } from '@/components/ui/holographic-logo';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [queuedOperations, setQueuedOperations] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate queued operations (in real app, get from IndexedDB)
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setQueuedOperations(prev => prev + Math.floor(Math.random() * 3));
      } else {
        setQueuedOperations(0);
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EDEBFF] via-white to-[#EDEBFF] dark:from-[#111827] dark:via-[#111827] dark:to-[#4C3FB8] flex items-center justify-center p-4">
      {/* Ambient Background */}
      <div className="absolute inset-0 particle-system opacity-20" />
      
      <motion.div
        className="max-w-md w-full space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="text-center">
          <HolographicLogo size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold holographic-text">DEORA Plaza</h1>
        </div>

        {/* Status Card */}
        <EtherealCard variant="glass" intensity="heavy" className="p-6 text-center">
          <motion.div
            className="mb-6"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {isOnline ? (
              <CheckCircle className="w-16 h-16 text-[#DCFCE7]0 mx-auto" />
            ) : (
              <WifiOff className="w-16 h-16 text-[#FEE2E2]0 mx-auto" />
            )}
          </motion.div>

          <h2 className="text-xl font-semibold mb-2">
            {isOnline ? 'Back Online!' : 'You\'re Offline'}
          </h2>

          <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-6">
            {isOnline 
              ? 'Your connection has been restored. All queued operations will sync automatically.'
              : 'Don\'t worry! You can still use DEORA Plaza. Your changes will sync when you\'re back online.'
            }
          </p>

          {/* Status Indicators */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 rounded-lg glass-morphism-light">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-[#DCFCE7]0' : 'bg-[#FEE2E2]0'}`} />
                <span className="text-sm font-medium">Connection Status</span>
              </div>
              <span className="text-sm text-[#9CA3AF]">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {queuedOperations > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg glass-morphism-light">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-[#EFF6FF]0" />
                  <span className="text-sm font-medium">Queued Operations</span>
                </div>
                <span className="text-sm text-[#9CA3AF]">
                  {queuedOperations}
                </span>
              </div>
            )}

            {lastSync && (
              <div className="flex items-center justify-between p-3 rounded-lg glass-morphism-light">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 text-[#DCFCE7]0" />
                  <span className="text-sm font-medium">Last Sync</span>
                </div>
                <span className="text-sm text-[#9CA3AF]">
                  {lastSync.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isOnline ? (
              <MagneticButton
                variant="primary"
                size="lg"
                onClick={handleGoToDashboard}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4" />
                Go to Dashboard
              </MagneticButton>
            ) : (
              <MagneticButton
                variant="secondary"
                size="lg"
                onClick={handleRetry}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </MagneticButton>
            )}
          </div>
        </EtherealCard>

        {/* Offline Features */}
        {!isOnline && (
          <EtherealCard variant="ambient" intensity="light" className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              Available Offline Features
            </h3>
            <ul className="space-y-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#DCFCE7]0 rounded-full" />
                View cached menu items
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#DCFCE7]0 rounded-full" />
                Take orders (will sync later)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#DCFCE7]0 rounded-full" />
                View table status
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#DCFCE7]0 rounded-full" />
                Access customer information
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#F59E0B]/100 rounded-full" />
                Limited reporting features
              </li>
            </ul>
          </EtherealCard>
        )}

        {/* Tips */}
        <div className="text-center text-sm text-[#9CA3AF]">
          <p>💡 Tip: Keep the app open to automatically sync when connection returns</p>
        </div>
      </motion.div>
    </div>
  );
}