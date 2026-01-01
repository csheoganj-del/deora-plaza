"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, Check } from 'lucide-react'

// iOS-style Card Component
interface IOSCardProps {
  children: React.ReactNode
  variant?: 'default' | 'widget' | 'control-center' | 'app-icon'
  className?: string
  onClick?: () => void
}

export function IOSCard({ 
  children, 
  variant = 'default', 
  className, 
  onClick 
}: IOSCardProps) {
  const variants = {
    default: 'glass-strong',
    widget: 'ios-widget',
    'control-center': 'ios-control-center',
    'app-icon': 'ios-app-icon'
  }

  return (
    <div 
      className={cn(
        variants[variant],
        'p-6 transition-all duration-200 ease-out',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// iOS-style Button Component
interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive'
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
}

export function IOSButton({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  className, 
  ...props 
}: IOSButtonProps) {
  const variants = {
    primary: 'ios-button-primary text-white',
    secondary: 'ios-button-secondary text-ios-blue',
    destructive: 'ios-button-destructive text-white'
  }

  const sizes = {
    small: 'px-4 py-2 text-15 min-h-[36px]',
    medium: 'px-6 py-3 text-17 min-h-[44px]',
    large: 'px-8 py-4 text-17 min-h-[50px]'
  }

  return (
    <button
      className={cn(
        variants[variant],
        sizes[size],
        'font-semibold transition-all duration-200 ease-out',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// iOS-style Input Component
interface IOSInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function IOSInput({ 
  label, 
  error, 
  className, 
  id, 
  ...props 
}: IOSInputProps) {
  const inputId = id || `ios-input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block ios-footnote ios-secondary-label font-medium"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'ios-input w-full',
          error && 'border-ios-red focus:border-ios-red focus:shadow-red-200/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="ios-caption-1 text-ios-red">{error}</p>
      )}
    </div>
  )
}

// iOS-style List Component
interface IOSListProps {
  children: React.ReactNode
  className?: string
}

interface IOSListItemProps {
  children: React.ReactNode
  onClick?: () => void
  showChevron?: boolean
  selected?: boolean
  className?: string
}

export function IOSList({ children, className }: IOSListProps) {
  return (
    <div className={cn('ios-list', className)}>
      {children}
    </div>
  )
}

export function IOSListItem({ 
  children, 
  onClick, 
  showChevron = false, 
  selected = false,
  className 
}: IOSListItemProps) {
  return (
    <div 
      className={cn(
        'ios-list-item flex items-center justify-between',
        onClick && 'cursor-pointer',
        selected && 'bg-ios-blue/10',
        className
      )}
      onClick={onClick}
    >
      <div className="flex-1">{children}</div>
      {showChevron && (
        <ChevronRight className="w-5 h-5 ios-tertiary-label ml-2" />
      )}
      {selected && (
        <Check className="w-5 h-5 text-ios-blue ml-2" />
      )}
    </div>
  )
}

// iOS-style Toggle/Switch Component
interface IOSToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function IOSToggle({ 
  checked, 
  onChange, 
  disabled = false, 
  className 
}: IOSToggleProps) {
  return (
    <button
      className={cn(
        'ios-toggle',
        checked && 'active',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
    />
  )
}

// iOS-style Navigation Bar Component
interface IOSNavBarProps {
  title: string
  leftButton?: React.ReactNode
  rightButton?: React.ReactNode
  className?: string
}

export function IOSNavBar({ 
  title, 
  leftButton, 
  rightButton, 
  className 
}: IOSNavBarProps) {
  return (
    <div className={cn('ios-navbar', className)}>
      <div className="flex items-center justify-between w-full">
        <div className="flex-1 flex justify-start">
          {leftButton}
        </div>
        <h1 className="ios-navbar-title flex-1 text-center">{title}</h1>
        <div className="flex-1 flex justify-end">
          {rightButton}
        </div>
      </div>
    </div>
  )
}

// iOS-style Tab Bar Component
interface IOSTabBarProps {
  tabs: Array<{
    id: string
    label: string
    icon: React.ReactNode
    badge?: number
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function IOSTabBar({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className 
}: IOSTabBarProps) {
  return (
    <div className={cn('ios-tabbar', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            'ios-tab-item',
            activeTab === tab.id && 'active'
          )}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="relative">
            {tab.icon}
            {tab.badge && tab.badge > 0 && (
              <div className="absolute -top-1 -right-1 bg-ios-red text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {tab.badge > 99 ? '99+' : tab.badge}
              </div>
            )}
          </div>
          <span className="ios-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

// iOS-style Alert/Modal Component
interface IOSAlertProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  actions: Array<{
    label: string
    style?: 'default' | 'cancel' | 'destructive'
    onPress: () => void
  }>
}

export function IOSAlert({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  actions 
}: IOSAlertProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Alert */}
      <div className="relative bg-white/10 backdrop-blur-40 rounded-14 border border-white/20 p-6 max-w-sm w-full mx-4">
        <div className="text-center space-y-4">
          <h2 className="ios-headline text-white font-semibold">{title}</h2>
          {message && (
            <p className="ios-body ios-secondary-label">{message}</p>
          )}
          
          <div className="space-y-2 pt-2">
            {actions.map((action, index) => (
              <button
                key={index}
                className={cn(
                  'w-full py-3 px-4 rounded-10 ios-body font-medium transition-colors',
                  action.style === 'destructive' && 'text-ios-red',
                  action.style === 'cancel' && 'ios-secondary-label',
                  action.style === 'default' && 'text-ios-blue',
                  'hover:bg-white/10'
                )}
                onClick={() => {
                  action.onPress()
                  onClose()
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// iOS-style Progress Indicator
interface IOSProgressProps {
  value: number // 0-100
  className?: string
}

export function IOSProgress({ value, className }: IOSProgressProps) {
  return (
    <div className={cn('w-full h-1 bg-white/20 rounded-full overflow-hidden', className)}>
      <div 
        className="h-full bg-ios-blue rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

// iOS-style Activity Indicator (Spinner)
export function IOSActivityIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('inline-block', className)}>
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
    </div>
  )
}