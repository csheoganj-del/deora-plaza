"use client"

import React from 'react'

interface LoadingElephantProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingElephant({ message = "Loading...", size = 'md' }: LoadingElephantProps) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 200 200"
          className="walking-elephant"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Elephant Body */}
          <ellipse cx="100" cy="100" rx="60" ry="45" fill="hsl(var(--soft-gold))" opacity="0.3" />

          {/* Elephant Head */}
          <circle cx="140" cy="85" r="30" fill="hsl(var(--soft-gold))" opacity="0.3" />

          {/* Trunk - animated */}
          <path
            d="M 160 85 Q 180 90 185 110 Q 188 120 185 130"
            stroke="hsl(var(--soft-gold))"
            strokeWidth="8"
            fill="none"
            opacity="0.4"
            className="elephant-trunk"
          />

          {/* Decorative Saddle */}
          <rect x="70" y="75" width="50" height="30" rx="5" fill="hsl(var(--terracotta-soft))" opacity="0.4" />
          <path d="M 75 75 L 115 75 L 110 85 L 80 85 Z" fill="hsl(var(--dusty-rose))" opacity="0.3" />

          {/* Decorative Patterns on Saddle */}
          <circle cx="85" cy="90" r="3" fill="hsl(var(--soft-gold))" opacity="0.6" />
          <circle cx="95" cy="90" r="3" fill="hsl(var(--soft-gold))" opacity="0.6" />
          <circle cx="105" cy="90" r="3" fill="hsl(var(--soft-gold))" opacity="0.6" />

          {/* Legs - animated */}
          <g className="elephant-legs">
            <rect x="75" y="130" width="10" height="40" rx="5" fill="hsl(var(--soft-gold))" opacity="0.3" className="leg leg-1" />
            <rect x="95" y="130" width="10" height="40" rx="5" fill="hsl(var(--soft-gold))" opacity="0.3" className="leg leg-2" />
            <rect x="115" y="130" width="10" height="40" rx="5" fill="hsl(var(--soft-gold))" opacity="0.3" className="leg leg-3" />
            <rect x="135" y="130" width="10" height="40" rx="5" fill="hsl(var(--soft-gold))" opacity="0.3" className="leg leg-4" />
          </g>

          {/* Ear */}
          <ellipse cx="155" cy="75" rx="15" ry="25" fill="hsl(var(--soft-gold))" opacity="0.25" />

          {/* Eye */}
          <circle cx="150" cy="80" r="3" fill="hsl(var(--charcoal-text))" opacity="0.5" />

          {/* Tail */}
          <path
            d="M 40 100 Q 30 105 25 115"
            stroke="hsl(var(--soft-gold))"
            strokeWidth="4"
            fill="none"
            opacity="0.3"
          />
        </svg>
      </div>

      <p className="text-lg font-medium text-[hsl(var(--soft-gold))] animate-pulse">
        {message}
      </p>

      <style jsx>{`
        .walking-elephant {
          animation: gentle-bounce 2s ease-in-out infinite;
        }
        
        .elephant-trunk {
          animation: trunk-swing 3s ease-in-out infinite;
          transform-origin: 160px 85px;
        }
        
        .elephant-legs .leg {
          animation: leg-walk 1s ease-in-out infinite;
        }
        
        .elephant-legs .leg-1 {
          animation-delay: 0s;
        }
        
        .elephant-legs .leg-2 {
          animation-delay: 0.5s;
        }
        
        .elephant-legs .leg-3 {
          animation-delay: 0.25s;
        }
        
        .elephant-legs .leg-4 {
          animation-delay: 0.75s;
        }
        
        @keyframes gentle-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        @keyframes trunk-swing {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }
        
        @keyframes leg-walk {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  )
}

