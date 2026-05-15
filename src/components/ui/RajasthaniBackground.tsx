import React from 'react'

type BackgroundStyle = 'palace' | 'textile' | 'miniature' | 'fresco' | 'garden'

interface RajasthaniBackgroundProps {
    style: BackgroundStyle
    className?: string
}

export function RajasthaniBackground({ style, className = '' }: RajasthaniBackgroundProps) {
    const backgrounds = {
        palace: (
            <div className={`fixed inset-0 -z-10 ${className}`}>
                {/* Marble inlay pattern base */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#F5E6D3] via-[#F0DCC4] to-[#EBD2B5]" />

                {/* Geometric marble patterns */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="palace-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                            <circle cx="100" cy="100" r="40" fill="none" stroke="#D4AF37" strokeWidth="2" />
                            <circle cx="100" cy="100" r="30" fill="none" stroke="#D4AF37" strokeWidth="1" />
                            <path d="M 100 60 L 120 80 L 100 100 L 80 80 Z" fill="#D4AF37" opacity="0.3" />
                            <path d="M 100 140 L 120 120 L 100 100 L 80 120 Z" fill="#D4AF37" opacity="0.3" />
                            <path d="M 60 100 L 80 120 L 100 100 L 80 80 Z" fill="#D4AF37" opacity="0.3" />
                            <path d="M 140 100 L 120 120 L 100 100 L 120 80 Z" fill="#D4AF37" opacity="0.3" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#palace-pattern)" />
                </svg>

                {/* Subtle texture overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.1)_100%)]" />
            </div>
        ),

        textile: (
            <div className={`fixed inset-0 -z-10 ${className}`}>
                {/* Bandhani/tie-dye base */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#F5DEB3] via-[#F0E5C9] to-[#EBD9B4]" />

                {/* Bandhani dots pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="bandhani-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="6" fill="none" stroke="#D4704A" strokeWidth="1.5" />
                            <circle cx="20" cy="20" r="3" fill="#D4704A" opacity="0.4" />
                            <circle cx="0" cy="0" r="4" fill="#E8A735" opacity="0.3" />
                            <circle cx="40" cy="0" r="4" fill="#E8A735" opacity="0.3" />
                            <circle cx="0" cy="40" r="4" fill="#E8A735" opacity="0.3" />
                            <circle cx="40" cy="40" r="4" fill="#E8A735" opacity="0.3" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#bandhani-pattern)" />
                </svg>

                {/* Fabric texture */}
                <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
            </div>
        ),

        miniature: (
            <div className={`fixed inset-0 -z-10 ${className}`}>
                {/* Miniature painting parchment */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4E4C1] via-[#EDD9B0] to-[#E6CEA0]" />

                {/* Decorative border patterns */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.1]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="miniature-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            {/* Paisley-inspired motif */}
                            <path d="M 50 30 Q 60 35 60 45 Q 60 55 50 60 Q 45 58 43 53 Q 42 48 43 43 Q 45 38 50 30 Z"
                                fill="#C97B84" opacity="0.5" />
                            <circle cx="52" cy="45" r="2" fill="#D4AF37" />

                            {/* Small decorative elements */}
                            <circle cx="30" cy="30" r="3" fill="#4A7C7E" opacity="0.4" />
                            <circle cx="70" cy="70" r="3" fill="#4A7C7E" opacity="0.4" />
                            <path d="M 25 75 L 30 70 L 25 65" stroke="#D4704A" strokeWidth="1" fill="none" opacity="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#miniature-pattern)" />
                </svg>

                {/* Aged paper effect */}
                <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(139,90,43,0.2)_100%)]" />
            </div>
        ),

        fresco: (
            <div className={`fixed inset-0 -z-10 ${className}`}>
                {/* Fresco wall base */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#E8D5C4] via-[#DCC9B5] to-[#D0BDA6]" />

                {/* Architectural elements */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.09]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="fresco-pattern" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
                            {/* Arch motif */}
                            <path d="M 75 50 Q 50 50 50 75 L 50 100 L 100 100 L 100 75 Q 100 50 75 50 Z"
                                fill="none" stroke="#8B7355" strokeWidth="2" opacity="0.6" />
                            <path d="M 60 100 L 60 120 M 90 100 L 90 120" stroke="#8B7355" strokeWidth="1.5" opacity="0.5" />

                            {/* Decorative elements */}
                            <circle cx="75" cy="60" r="5" fill="#D4AF37" opacity="0.4" />
                            <path d="M 65 75 L 75 70 L 85 75" stroke="#C97B84" strokeWidth="1" fill="none" opacity="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#fresco-pattern)" />
                </svg>

                {/* Cracked plaster texture */}
                <div className="absolute inset-0 opacity-[0.06] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCwwIEwxMDAsMTAwIE0xMDAsMCBMMCwxMDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]" />
            </div>
        ),

        garden: (
            <div className={`fixed inset-0 -z-10 ${className}`}>
                {/* Garden/nature base */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#F0E8D8] via-[#E8DFC8] to-[#E0D6B8]" />

                {/* Floral patterns */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.11]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="garden-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                            {/* Lotus flower */}
                            <g transform="translate(60, 60)">
                                <ellipse cx="0" cy="0" rx="20" ry="8" fill="#C97B84" opacity="0.4" transform="rotate(0)" />
                                <ellipse cx="0" cy="0" rx="20" ry="8" fill="#C97B84" opacity="0.4" transform="rotate(45)" />
                                <ellipse cx="0" cy="0" rx="20" ry="8" fill="#C97B84" opacity="0.4" transform="rotate(90)" />
                                <ellipse cx="0" cy="0" rx="20" ry="8" fill="#C97B84" opacity="0.4" transform="rotate(135)" />
                                <circle cx="0" cy="0" r="6" fill="#E8A735" opacity="0.5" />
                            </g>

                            {/* Leaves */}
                            <path d="M 20 20 Q 15 25 20 30" stroke="#4A7C7E" strokeWidth="2" fill="none" opacity="0.4" />
                            <path d="M 100 100 Q 95 105 100 110" stroke="#4A7C7E" strokeWidth="2" fill="none" opacity="0.4" />

                            {/* Small flowers */}
                            <circle cx="30" cy="90" r="4" fill="#D4AF37" opacity="0.4" />
                            <circle cx="90" cy="30" r="4" fill="#D4AF37" opacity="0.4" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#garden-pattern)" />
                </svg>

                {/* Soft vignette */}
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(76,124,76,0.15)_100%)]" />
            </div>
        )
    }

    return backgrounds[style]
}
