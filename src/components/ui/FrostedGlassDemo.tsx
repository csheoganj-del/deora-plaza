'use client';

import React from 'react';
;


/**
 * FrostedGlassDemo - Visual demonstration of all frosted glass variants
 * Showcases the dusted/frosted glass effect with different intensities
 */

export function FrostedGlassDemo() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F8FAFC] to-[#F8FAFC] dark:from-[#111827] dark:via-[#6D5DFB] dark:to-[#EDEBFF] p-8">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-bold text-gradient-liquid">
                        Frosted Glass Effect
                    </h1>
                    <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">
                        Premium dusted glass effect with three intensity levels
                    </p>
                </div>

                {/* Intensity Comparison */}
                <section className="space-y-6">
                    <h2 className="text-3xl font-semibold text-[#111827] dark:text-white">
                        Intensity Levels
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Light */}
                        <div className="premium-card">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
                                    Light
                                </h3>
                                <span className="text-sm px-3 py-1 bg-[#6D5DFB]/20 text-[#6D5DFB] dark:text-[#EDEBFF] rounded-full">
                                    16px blur
                                </span>
                            </div>
                            <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                                Subtle frosted effect with 50% opacity. Perfect for overlays and subtle backgrounds.
                            </p>
                            <div className="flex gap-2">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#6D5DFB] to-[#EDEBFF]" />
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#EDEBFF] to-[#6D5DFB]/80" />
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#6D5DFB]/80 to-[#EDEBFF]/80" />
                            </div>
                        </div>

                        {/* Medium */}
                        <div className="premium-card">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
                                    Medium
                                </h3>
                                <span className="text-sm px-3 py-1 bg-[#EDEBFF]0/20 text-[#A855F7] dark:text-purple-300 rounded-full">
                                    20px blur
                                </span>
                            </div>
                            <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                                Balanced frosted effect with 60% opacity. Ideal for cards and panels.
                            </p>
                            <div className="flex gap-2">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#6D5DFB] to-[#EDEBFF]" />
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#EDEBFF] to-[#6D5DFB]/80" />
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#6D5DFB]/80 to-[#EDEBFF]/80" />
                            </div>
                        </div>

                        {/* Heavy */}
                        <div className="premium-card">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
                                    Heavy
                                </h3>
                                <span className="text-sm px-3 py-1 bg-[#FCE7F3]0/20 text-[#DB2777] dark:text-pink-300 rounded-full">
                                    24px blur
                                </span>
                            </div>
                            <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                                Intense frosted effect with 70% opacity. Great for modals and prominent elements.
                            </p>
                            <div className="flex gap-2">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#6D5DFB] to-[#EDEBFF]" />
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#EDEBFF] to-[#6D5DFB]/80" />
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#6D5DFB]/80 to-[#EDEBFF]/80" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Interactive Examples */}
                <section className="space-y-6">
                    <h2 className="text-3xl font-semibold text-[#111827] dark:text-white">
                        Interactive Cards
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="premium-card">
                            <div className="flex items-center gap-3">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#6D5DFB] to-[#EDEBFF] flex items-center justify-center text-white text-2xl font-bold">
                                    🎨
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#111827] dark:text-white">
                                        Design System
                                    </h3>
                                    <p className="text-sm text-[#9CA3AF] dark:text-[#9CA3AF]">
                                        Hover to interact
                                    </p>
                                </div>
                            </div>
                            <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                                This card demonstrates the interactive frosted glass effect with smooth animations.
                            </p>
                        </div>

                        <div className="premium-card">
                            <div className="flex items-center gap-3">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#FCE7F3]0 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                                    ✨
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#111827] dark:text-white">
                                        Premium UI
                                    </h3>
                                    <p className="text-sm text-[#9CA3AF] dark:text-[#9CA3AF]">
                                        Heavy intensity
                                    </p>
                                </div>
                            </div>
                            <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                                Heavy frosted glass creates a more prominent, premium appearance.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Practical Use Cases */}
                <section className="space-y-6">
                    <h2 className="text-3xl font-semibold text-[#111827] dark:text-white">
                        Practical Examples
                    </h2>

                    {/* Dashboard Card */}
                    <div className="premium-card">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
                                    Dashboard Stats
                                </h3>
                                <button className="px-4 py-2 bg-[#6D5DFB] text-white rounded-lg hover:bg-[#6D5DFB]/90 transition-colors">
                                    View Details
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-[#9CA3AF] dark:text-[#9CA3AF]">Total Revenue</p>
                                    <p className="text-3xl font-bold text-[#111827] dark:text-white">₹45,231</p>
                                    <p className="text-sm text-[#22C55E]">+12.5%</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-[#9CA3AF] dark:text-[#9CA3AF]">Orders</p>
                                    <p className="text-3xl font-bold text-[#111827] dark:text-white">1,234</p>
                                    <p className="text-sm text-[#22C55E]">+8.2%</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-[#9CA3AF] dark:text-[#9CA3AF]">Customers</p>
                                    <p className="text-3xl font-bold text-[#111827] dark:text-white">567</p>
                                    <p className="text-sm text-[#6D5DFB]">+5.1%</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-[#9CA3AF] dark:text-[#9CA3AF]">Avg. Order</p>
                                    <p className="text-3xl font-bold text-[#111827] dark:text-white">₹367</p>
                                    <p className="text-sm text-[#22C55E]">+3.8%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['Analytics', 'Reports', 'Settings'].map((feature, idx) => (
                            <div key={idx} className="premium-card">
                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${idx === 0 ? 'from-[#6D5DFB] to-[#EDEBFF]' :
                                        idx === 1 ? 'from-[#EDEBFF] to-[#6D5DFB]/80' :
                                            'from-orange-400 to-red-400'
                                    } flex items-center justify-center text-white text-xl font-bold`}>
                                    {idx === 0 ? '📊' : idx === 1 ? '📈' : '⚙️'}
                                </div>
                                <h4 className="text-xl font-bold text-[#111827] dark:text-white">
                                    {feature}
                                </h4>
                                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                    Manage your {feature.toLowerCase()} with ease using our intuitive interface.
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Texture Comparison */}
                <section className="space-y-6">
                    <h2 className="text-3xl font-semibold text-[#111827] dark:text-white">
                        With & Without Texture
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="premium-card">
                            <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
                                Without Texture
                            </h3>
                            <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                                Smooth frosted glass without the noise overlay. Clean and minimal appearance.
                            </p>
                        </div>

                        <div className="premium-card">
                            <h3 className="text-2xl font-bold text-[#111827] dark:text-white">
                                With Texture ✨
                            </h3>
                            <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                                Dusted frosted glass with subtle noise overlay. Premium, textured appearance.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}

