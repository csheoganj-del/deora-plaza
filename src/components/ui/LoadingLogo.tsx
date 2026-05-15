import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingLogo({ 
  className, 
  size = 'md',
  text = 'Loading...'
}: LoadingLogoProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn(
      "flex items-center justify-center gap-2",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-[var(--warm-amber-500)]",
        sizeClasses[size]
      )} />
      {text && (
        <span className="apple-text-caption text-[var(--text-muted)]">
          {text}
        </span>
      )}
    </div>
  )
}