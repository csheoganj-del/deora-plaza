"use client"

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { IOSButton, IOSInput, IOSCard, IOSActivityIndicator } from './ios-components'
import { Eye, EyeOff, FaceId, TouchId } from 'lucide-react'

interface IOSLoginProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<void>
  loading?: boolean
  error?: string
  className?: string
}

export function IOSLogin({ onLogin, loading = false, error, className }: IOSLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [biometricAvailable] = useState(true) // In real app, check device capabilities

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading) {
      await onLogin({ username, password })
    }
  }

  const handleBiometricLogin = () => {
    // In real app, trigger biometric authentication
  }

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-4',
      'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      className
    )}>
      {/* Background blur effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <IOSCard variant="control-center" className="relative w-full max-w-sm">
        <div className="text-center space-y-6">
          {/* App Icon */}
          <div className="mx-auto w-20 h-20 ios-app-icon flex items-center justify-center">
            <div className="text-2xl font-bold text-white">D</div>
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <h1 className="ios-large-title text-white font-bold">DEORA Plaza</h1>
            <p className="ios-subhead ios-secondary-label">Restaurant Management System</p>
          </div>

          {/* Divider */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-14 bg-ios-red/10 border border-ios-red/20">
              <p className="ios-callout text-ios-red text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <IOSInput
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
            />

            <div className="relative">
              <IOSInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-9 p-1 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 ios-tertiary-label" />
                ) : (
                  <Eye className="w-5 h-5 ios-tertiary-label" />
                )}
              </button>
            </div>

            <div className="pt-2">
              <IOSButton
                type="submit"
                variant="primary"
                size="large"
                disabled={loading || !username || !password}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <IOSActivityIndicator />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </IOSButton>
            </div>
          </form>

          {/* Biometric Login */}
          {biometricAvailable && !loading && (
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="flex-1 h-px bg-white/20" />
                <span className="ios-caption-1 ios-tertiary-label">or</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <button
                onClick={handleBiometricLogin}
                className="mx-auto flex items-center space-x-2 p-3 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
              >
                <FaceId className="w-6 h-6 text-white" />
                <TouchId className="w-6 h-6 text-white" />
              </button>
              <p className="ios-caption-2 ios-tertiary-label text-center">
                Use Face ID or Touch ID
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 space-y-2">
            <button className="ios-callout text-ios-blue hover:opacity-80 transition-opacity">
              Forgot Password?
            </button>
            <p className="ios-caption-2 ios-quaternary-label text-center">
              Secure login powered by iOS-style authentication
            </p>
          </div>
        </div>
      </IOSCard>
    </div>
  )
}

// iOS-style Dashboard Preview
export function IOSDashboardPreview() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <div className="w-6 h-6 bg-ios-blue rounded" />, badge: 0 },
    { id: 'orders', label: 'Orders', icon: <div className="w-6 h-6 bg-ios-green rounded" />, badge: 5 },
    { id: 'menu', label: 'Menu', icon: <div className="w-6 h-6 bg-ios-orange rounded" />, badge: 0 },
    { id: 'analytics', label: 'Analytics', icon: <div className="w-6 h-6 bg-ios-purple rounded" />, badge: 0 },
    { id: 'settings', label: 'Settings', icon: <div className="w-6 h-6 bg-ios-red rounded" />, badge: 0 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Bar */}
      <div className="ios-navbar">
        <h1 className="ios-navbar-title">DEORA Plaza</h1>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 pb-24 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <IOSCard variant="widget" className="text-center">
            <div className="space-y-2">
              <p className="ios-caption-1 ios-secondary-label">Today's Sales</p>
              <p className="ios-title-1 text-white">₹24,580</p>
              <p className="ios-caption-2 text-ios-green">+12.5%</p>
            </div>
          </IOSCard>
          
          <IOSCard variant="widget" className="text-center">
            <div className="space-y-2">
              <p className="ios-caption-1 ios-secondary-label">Active Orders</p>
              <p className="ios-title-1 text-white">18</p>
              <p className="ios-caption-2 text-ios-orange">5 pending</p>
            </div>
          </IOSCard>
        </div>

        {/* Quick Actions */}
        <IOSCard variant="default">
          <div className="space-y-4">
            <h2 className="ios-headline text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <IOSButton variant="secondary" size="medium" className="w-full">
                New Order
              </IOSButton>
              <IOSButton variant="secondary" size="medium" className="w-full">
                View Menu
              </IOSButton>
            </div>
          </div>
        </IOSCard>

        {/* Recent Activity */}
        <IOSCard variant="default">
          <div className="space-y-4">
            <h2 className="ios-headline text-white">Recent Activity</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center space-x-3 p-2 rounded-10 hover:bg-white/5">
                  <div className="w-8 h-8 bg-ios-blue rounded-full flex items-center justify-center">
                    <span className="ios-caption-1 text-white font-semibold">{item}</span>
                  </div>
                  <div className="flex-1">
                    <p className="ios-callout text-white">Order #{1000 + item} completed</p>
                    <p className="ios-caption-2 ios-secondary-label">Table {item} • 2 min ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </IOSCard>
      </div>

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="ios-tabbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                'ios-tab-item',
                activeTab === tab.id && 'active'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge > 0 && (
                  <div className="absolute -top-1 -right-1 bg-ios-red text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {tab.badge}
                  </div>
                )}
              </div>
              <span className="ios-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}