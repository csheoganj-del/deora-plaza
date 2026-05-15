import React from "react"

// Jharokha Frame - Traditional Rajasthani window arch
export const JharokhaFrame = ({
    className,
    opacity = 0.2,
    color = "#D4AF7A"
}: {
    className?: string
    opacity?: number
    color?: string
}) => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
                <pattern id="jharokha-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                    {/* Arch shape */}
                    <path
                        d="M 50 150 Q 50 100, 100 100 Q 150 100, 150 150 L 150 200 L 50 200 Z"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                    />
                    {/* Decorative details */}
                    <circle cx="100" cy="110" r="3" fill={color} />
                    <path d="M 70 150 L 70 180" stroke={color} strokeWidth="1" />
                    <path d="M 100 150 L 100 180" stroke={color} strokeWidth="1" />
                    <path d="M 130 150 L 130 180" stroke={color} strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#jharokha-pattern)" />
        </svg>
    </div>
)

// Decorated Elephant - Traditional Rajasthani elephant motif
export const DecoratedElephant = ({
    className,
    opacity = 0.04
}: {
    className?: string
    opacity?: number
}) => (
    <div className={`absolute pointer-events-none ${className}`} style={{ opacity }}>
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Elephant body */}
            <ellipse cx="100" cy="120" rx="50" ry="40" fill="#D4A89A" />
            {/* Head */}
            <circle cx="70" cy="100" r="25" fill="#D4A89A" />
            {/* Trunk */}
            <path d="M 60 110 Q 50 130, 45 150" stroke="#D4A89A" strokeWidth="8" fill="none" strokeLinecap="round" />
            {/* Legs */}
            <rect x="80" y="150" width="10" height="30" fill="#D4A89A" rx="5" />
            <rect x="110" y="150" width="10" height="30" fill="#D4A89A" rx="5" />
            {/* Decorative saddle */}
            <path d="M 80 110 Q 100 105, 120 110 L 120 130 L 80 130 Z" fill="#D4AF7A" />
            {/* Decorative patterns on saddle */}
            <circle cx="90" cy="120" r="3" fill="#F5F0E8" />
            <circle cx="100" cy="120" r="3" fill="#F5F0E8" />
            <circle cx="110" cy="120" r="3" fill="#F5F0E8" />
            {/* Ear */}
            <ellipse cx="65" cy="95" rx="8" ry="12" fill="#D4A89A" />
            {/* Eye */}
            <circle cx="72" cy="98" r="2" fill="#404040" />
        </svg>
    </div>
)

// Decorated Camel - Rajasthani camel with traditional ornaments
export const DecoratedCamel = ({
    className,
    opacity = 0.04
}: {
    className?: string
    opacity?: number
}) => (
    <div className={`absolute pointer-events-none ${className}`} style={{ opacity }}>
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <ellipse cx="110" cy="130" rx="45" ry="30" fill="#D4A89A" />
            {/* Hump */}
            <ellipse cx="100" cy="110" rx="20" ry="25" fill="#D4A89A" />
            {/* Neck */}
            <path d="M 85 115 Q 75 100, 70 80" stroke="#D4A89A" strokeWidth="15" fill="none" strokeLinecap="round" />
            {/* Head */}
            <ellipse cx="68" cy="75" rx="12" ry="15" fill="#D4A89A" />
            {/* Legs */}
            <rect x="90" y="150" width="8" height="35" fill="#D4A89A" rx="4" />
            <rect x="120" y="150" width="8" height="35" fill="#D4A89A" rx="4" />
            {/* Decorative saddle */}
            <path d="M 90 120 L 130 120 L 125 135 L 95 135 Z" fill="#D4AF7A" />
            {/* Saddle decorations */}
            <circle cx="100" cy="127" r="2.5" fill="#F5F0E8" />
            <circle cx="110" cy="127" r="2.5" fill="#F5F0E8" />
            <circle cx="120" cy="127" r="2.5" fill="#F5F0E8" />
            {/* Tail */}
            <path d="M 150 130 Q 160 135, 165 145" stroke="#D4A89A" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Eye */}
            <circle cx="70" cy="73" r="1.5" fill="#404040" />
        </svg>
    </div>
)

// Geometric Pattern - Traditional Rajasthani geometric motifs
export const GeometricPattern = ({
    className,
    opacity = 0.06
}: {
    className?: string
    opacity?: number
}) => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="geometric-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                    {/* Diamond shape */}
                    <path d="M 40 10 L 60 40 L 40 70 L 20 40 Z" fill="none" stroke="#D4AF7A" strokeWidth="1" />
                    {/* Inner diamond */}
                    <path d="M 40 25 L 50 40 L 40 55 L 30 40 Z" fill="none" stroke="#D4A89A" strokeWidth="0.8" />
                    {/* Dots */}
                    <circle cx="40" cy="40" r="2" fill="#D4AF7A" />
                    <circle cx="40" cy="10" r="1.5" fill="#D4A89A" />
                    <circle cx="60" cy="40" r="1.5" fill="#D4A89A" />
                    <circle cx="40" cy="70" r="1.5" fill="#D4A89A" />
                    <circle cx="20" cy="40" r="1.5" fill="#D4A89A" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
        </svg>
    </div>
)

// Lotus Flower - Sacred lotus motif for dividers
export const LotusFlower = ({
    className,
    color = "#D4AF7A",
    size = 40
}: {
    className?: string
    color?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Center */}
        <circle cx="50" cy="50" r="8" fill={color} />
        {/* Petals */}
        <ellipse cx="50" cy="35" rx="8" ry="18" fill="none" stroke={color} strokeWidth="1.5" />
        <ellipse cx="50" cy="65" rx="8" ry="18" fill="none" stroke={color} strokeWidth="1.5" />
        <ellipse cx="35" cy="50" rx="18" ry="8" fill="none" stroke={color} strokeWidth="1.5" />
        <ellipse cx="65" cy="50" rx="18" ry="8" fill="none" stroke={color} strokeWidth="1.5" />
        <ellipse cx="38" cy="38" rx="12" ry="12" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(-45 38 38)" />
        <ellipse cx="62" cy="38" rx="12" ry="12" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(45 62 38)" />
        <ellipse cx="38" cy="62" rx="12" ry="12" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(45 38 62)" />
        <ellipse cx="62" cy="62" rx="12" ry="12" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(-45 62 62)" />
    </svg>
)

// Soft Mandala - Simplified, lighter mandala for backgrounds
export const SoftMandala = ({
    className,
    opacity = 0.05
}: {
    className?: string
    opacity?: number
}) => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="soft-mandala" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
                    {/* Outer circle */}
                    <circle cx="75" cy="75" r="40" fill="none" stroke="#D4AF7A" strokeWidth="0.8" />
                    {/* Inner circles */}
                    <circle cx="75" cy="75" r="30" fill="none" stroke="#D4A89A" strokeWidth="0.6" />
                    <circle cx="75" cy="75" r="20" fill="none" stroke="#D4AF7A" strokeWidth="0.6" />
                    {/* Petal shapes */}
                    <path d="M 75 35 Q 85 55, 75 75 Q 65 55, 75 35" fill="none" stroke="#D4AF7A" strokeWidth="0.5" />
                    <path d="M 115 75 Q 95 85, 75 75 Q 95 65, 115 75" fill="none" stroke="#D4AF7A" strokeWidth="0.5" />
                    <path d="M 75 115 Q 65 95, 75 75 Q 85 95, 75 115" fill="none" stroke="#D4AF7A" strokeWidth="0.5" />
                    <path d="M 35 75 Q 55 65, 75 75 Q 55 85, 35 75" fill="none" stroke="#D4AF7A" strokeWidth="0.5" />
                    {/* Center dot */}
                    <circle cx="75" cy="75" r="3" fill="#D4AF7A" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#soft-mandala)" />
        </svg>
    </div>
)

