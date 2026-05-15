import React from "react"

export const RoyalArchway = ({
    className,
    children
}: {
    className?: string
    children?: React.ReactNode
}) => (
    <div className={`relative ${className}`}>
        {/* Archway SVG */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 1440 900"
                preserveAspectRatio="none"
                className="w-full h-full drop-shadow-2xl"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#B8860B" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#B8860B" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Main Arch Structure */}
                <path
                    d="M 0 0 L 0 900 L 100 900 L 100 200 Q 100 100, 200 100 L 500 100 Q 720 250, 940 100 L 1240 100 Q 1340 100, 1340 200 L 1340 900 L 1440 900 L 1440 0 Z"
                    fill="url(#gold-gradient)"
                    opacity="0.9"
                />

                {/* Inner Decorative Border */}
                <path
                    d="M 120 900 L 120 220 Q 120 120, 220 120 L 520 120 Q 720 270, 920 120 L 1220 120 Q 1320 120, 1320 220 L 1320 900"
                    fill="none"
                    stroke="#8B4513"
                    strokeWidth="5"
                />

                {/* Hanging Lamps (Center) */}
                <line x1="720" y1="0" x2="720" y2="180" stroke="#B8860B" strokeWidth="2" />
                <circle cx="720" cy="190" r="10" fill="#FFD700" filter="url(#glow)" />

                {/* Side Pillars Detail */}
                <rect x="20" y="0" width="60" height="900" fill="url(#gold-gradient)" opacity="0.5" />
                <rect x="1360" y="0" width="60" height="900" fill="url(#gold-gradient)" opacity="0.5" />
            </svg>
        </div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center pt-32 pb-20 px-4 md:px-20">
            {children}
        </div>
    </div>
)
