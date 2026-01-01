"use client"

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Scan, Fingerprint } from 'lucide-react'

interface IOSLockScreenProps {
  onUnlock: (credentials?: { username: string; password: string }) => Promise<void>
  loading?: boolean
  error?: string
  className?: string
}

export function IOSLockScreen({ onUnlock, loading = false, error, className }: IOSLockScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Format time like iOS
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    })
  }

  // Format date like iOS
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  // Handle swipe to unlock
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartY === null) return
    
    const swipeEndY = e.changedTouches[0].clientY
    const swipeDistance = swipeStartY - swipeEndY
    
    // Swipe up to unlock (minimum 100px)
    if (swipeDistance > 100) {
      setShowAuthForm(true)
    }
    
    setSwipeStartY(null)
  }

  // Handle mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setSwipeStartY(e.clientY)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (swipeStartY === null) return
    
    const swipeDistance = swipeStartY - e.clientY
    
    if (swipeDistance > 100) {
      setShowAuthForm(true)
    }
    
    setSwipeStartY(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading && username && password) {
      await onUnlock({ username, password })
    }
  }

  const handleBiometricAuth = async () => {
    if (!loading) {
      // In real app, trigger biometric authentication
      await onUnlock()
    }
  }

  if (showAuthForm) {
    return (
      <div className={cn('lock-container min-h-screen flex items-center justify-center p-4', className)}>
        <div className="ios-glass w-full max-w-sm p-8">
          <div className="text-center space-y-6">
            {/* App Icon */}
            <div className="mx-auto w-16 h-16 rounded-22 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <div className="text-xl font-bold text-white">D</div>
            </div>

            {/* Brand */}
            <div className="space-y-1">
              <h1 className="ios-brand">DEORA Plaza</h1>
              <p className="ios-subtitle">Restaurant Management</p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-14 bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-14 text-white placeholder-white/50 text-17 font-400 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={loading}
                required
              />
              
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-14 text-white placeholder-white/50 text-17 font-400 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={loading}
                required
              />

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-14 text-white font-600 text-17 transition-all active:scale-95"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Biometric */}
            <div className="flex items-center justify-center space-x-4 pt-2">
              <button
                onClick={handleBiometricAuth}
                disabled={loading}
                className="p-3 rounded-full bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-50"
                aria-label="Face ID"
              >
                <Scan className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleBiometricAuth}
                disabled={loading}
                className="p-3 rounded-full bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-50"
                aria-label="Touch ID"
              >
                <Fingerprint className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Back to lock screen */}
            <button
              onClick={() => setShowAuthForm(false)}
              className="text-sm text-white/60 hover:text-white/80 transition-colors"
            >
              Back to Lock Screen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn('lock-bg lock-container min-h-screen flex flex-col items-center justify-center p-4', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Time Display - THE MOST IMPORTANT */}
      <div className="text-center mb-8">
        <div className="ios-time">
          {formatTime(currentTime)}
        </div>
        <div className="ios-date">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Brand - Ambient Identity */}
      <div className="text-center mb-auto">
        <div className="ios-brand">DEORA Plaza</div>
        <div className="ios-subtitle">Restaurant Management System</div>
      </div>

      {/* Swipe to Unlock Hint */}
      <div className="swipe-hint">
        <div className="swipe-bar"></div>
        <span>Swipe up to unlock</span>
      </div>
    </div>
  )
}

// iOS Lock Screen with floating glass panel variant
export function IOSLockScreenGlass({ onUnlock, loading = false, error, className }: IOSLockScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className={cn('lock-bg lock-container min-h-screen flex items-center justify-center p-4', className)}>
      {/* Floating Glass Panel */}
      <div className="ios-glass w-full max-w-md p-12">
        <div className="text-center space-y-8">
          {/* Time Display */}
          <div>
            <div className="ios-time text-center">
              {formatTime(currentTime)}
            </div>
            <div className="ios-date text-center">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Brand */}
          <div>
            <div className="ios-brand text-center">DEORA Plaza</div>
            <div className="ios-subtitle text-center">Restaurant Management System</div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-14 bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Unlock Button */}
          <button
            onClick={() => onUnlock()}
            disabled={loading}
            className="w-full py-4 bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed rounded-14 text-white font-500 text-17 transition-all active:scale-95 border border-white/20"
          >
            {loading ? 'Unlocking...' : 'Tap to Unlock'}
          </button>

          {/* Biometric Options */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={() => onUnlock()}
              disabled={loading}
              className="p-4 rounded-full bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              <FaceId className="w-8 h-8 text-white" />
            </button>
            <button
              onClick={() => onUnlock()}
              disabled={loading}
              className="p-4 rounded-full bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              <TouchId className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for current time
export function useIOSTime() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return {
    time: currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    }),
    date: currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }),
    currentTime
  }
}