import React from 'react'

interface SkipToMainProps {
  className?: string
}

export function SkipToMain({ className }: SkipToMainProps) {
  return (
    <a
      href="#main-content"
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white px-4 py-2 rounded-md shadow-lg text-black font-medium ${className}`}
    >
      Skip to main content
    </a>
  )
}