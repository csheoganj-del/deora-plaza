"use client";

import { useCallback, useEffect, useRef } from 'react';
import { getAudioSystem, AudioNotificationType } from '@/lib/audio/notification-system';

/**
 * Hook for playing notification sounds throughout the app
 * Provides easy access to the audio notification system
 */
export function useNotificationSound() {
  const audioSystemRef = useRef<ReturnType<typeof getAudioSystem> | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Initialize audio system on client side only
    if (typeof window !== 'undefined' && !isInitializedRef.current) {
      audioSystemRef.current = getAudioSystem();
      isInitializedRef.current = true;
    }
  }, []);

  const playSound = useCallback((type: AudioNotificationType, options?: {
    priority?: 'low' | 'medium' | 'high' | 'critical';
    title?: string;
    message?: string;
  }) => {
    if (!audioSystemRef.current) return;

    audioSystemRef.current.playNotification({
      id: crypto.randomUUID(),
      type,
      title: options?.title || type.replace(/_/g, ' '),
      message: options?.message,
      priority: options?.priority || 'medium',
    });
  }, []);

  // Convenience methods for common notifications
  const playOrderNew = useCallback(() => playSound('order_new', { priority: 'high', title: 'New Order' }), [playSound]);
  const playOrderReady = useCallback(() => playSound('order_ready', { priority: 'high', title: 'Order Ready' }), [playSound]);
  const playOrderDelivered = useCallback(() => playSound('order_delivered', { priority: 'medium', title: 'Order Delivered' }), [playSound]);
  const playPaymentSuccess = useCallback(() => playSound('payment_success', { priority: 'medium', title: 'Payment Success' }), [playSound]);
  const playPaymentFailed = useCallback(() => playSound('payment_failed', { priority: 'high', title: 'Payment Failed' }), [playSound]);
  const playBookingNew = useCallback(() => playSound('booking_new', { priority: 'high', title: 'New Booking' }), [playSound]);
  const playBookingConfirmed = useCallback(() => playSound('booking_confirmed', { priority: 'medium', title: 'Booking Confirmed' }), [playSound]);
  const playSuccess = useCallback(() => playSound('success', { priority: 'low', title: 'Success' }), [playSound]);
  const playWarning = useCallback(() => playSound('warning', { priority: 'medium', title: 'Warning' }), [playSound]);
  const playError = useCallback(() => playSound('error', { priority: 'high', title: 'Error' }), [playSound]);
  const playInfo = useCallback(() => playSound('info', { priority: 'low', title: 'Info' }), [playSound]);
  const playKitchenAlert = useCallback(() => playSound('kitchen_alert', { priority: 'critical', title: 'Kitchen Alert' }), [playSound]);
  const playTableReady = useCallback(() => playSound('table_ready', { priority: 'medium', title: 'Table Ready' }), [playSound]);

  const setVolume = useCallback((volume: number) => {
    audioSystemRef.current?.setMasterVolume(volume);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    audioSystemRef.current?.setEnabled(enabled);
  }, []);

  const stopAll = useCallback(() => {
    audioSystemRef.current?.stopAllNotifications();
  }, []);

  return {
    playSound,
    playOrderNew,
    playOrderReady,
    playOrderDelivered,
    playPaymentSuccess,
    playPaymentFailed,
    playBookingNew,
    playBookingConfirmed,
    playSuccess,
    playWarning,
    playError,
    playInfo,
    playKitchenAlert,
    playTableReady,
    setVolume,
    setEnabled,
    stopAll,
  };
}

/**
 * Sound settings component for user preferences
 */
export function useSoundSettings() {
  const { setVolume, setEnabled } = useNotificationSound();

  useEffect(() => {
    // Load saved preferences
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('deora-sound-volume');
      const savedEnabled = localStorage.getItem('deora-sound-enabled');
      
      if (savedVolume) {
        setVolume(parseFloat(savedVolume));
      }
      
      if (savedEnabled !== null) {
        setEnabled(savedEnabled === 'true');
      }
    }
  }, [setVolume, setEnabled]);

  const updateVolume = useCallback((volume: number) => {
    setVolume(volume);
    if (typeof window !== 'undefined') {
      localStorage.setItem('deora-sound-volume', volume.toString());
    }
  }, [setVolume]);

  const updateEnabled = useCallback((enabled: boolean) => {
    setEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('deora-sound-enabled', enabled.toString());
    }
  }, [setEnabled]);

  return {
    updateVolume,
    updateEnabled,
  };
}
