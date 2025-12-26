"use client";

import React from "react";
import { HeritageCard } from "@/components/ui/heritage-card";
import { OrnamentalHeading } from "@/components/ui/ornamental-heading";
import { Button } from "@/components/ui/button";

import { Crown, Star, Wine, Utensils } from "lucide-react";

export default function StyleGuidePage() {
    const colors = [
        { name: "Marwar Maroon", var: "--rajasthani-maroon", class: "bg-[hsl(var(--rajasthani-maroon))]" },
        { name: "Jaipur Pink", var: "--rajasthani-pink", class: "bg-[hsl(var(--rajasthani-pink))]" },
        { name: "Jodhpur Blue", var: "--rajasthani-blue", class: "bg-[hsl(var(--rajasthani-blue))]" },
        { name: "Thar Gold", var: "--rajasthani-gold", class: "bg-[hsl(var(--rajasthani-gold))]" },
        { name: "Aravalli Emerald", var: "--rajasthani-emerald", class: "bg-[hsl(var(--rajasthani-emerald))]" },
        { name: "Sandstone Cream", var: "--rajasthani-cream", class: "bg-[hsl(var(--rajasthani-cream))]" },
    ];

    return (
        <div className="min-h-screen bg-[hsl(var(--rajasthani-cream))] p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <OrnamentalHeading align="center" variant="royal" icon={Crown}>
                        Royal Heritage Design System
                    </OrnamentalHeading>
                    <p className="text-[#6B7280] italic">A visual guide to the Rajasthani UI elements</p>
                </div>

                {/* Colors Section */}
                <section>
                    <OrnamentalHeading variant="gold-gradient">Color Palette</OrnamentalHeading>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {colors.map((color) => (
                            <div key={color.name} className="space-y-2 text-center">
                                <div className={`h-24 w-full rounded-xl shadow-lg ${color.class} border-2 border-white/50`} />
                                <p className="font-bold text-[#111827]">{color.name}</p>
                                <code className="text-xs bg-white/50 px-2 py-1 rounded block">{color.var}</code>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Frosted Glass */}
                <section>
                    <OrnamentalHeading variant="gold-gradient">Frosted Glass</OrnamentalHeading>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="premium-card">
                            <h3 className="font-bold text-lg mb-2 text-[#111827]">Light Frosted</h3>
                            <p className="text-[#111827]">8px blur, 85% opacity. Use for subtle panels.</p>
                        </div>
                        <div className="premium-card">
                            <h3 className="font-bold text-lg mb-2 text-[#111827]">Medium Frosted</h3>
                            <p className="text-[#111827]">10px blur, 88% opacity. Default for cards.</p>
                        </div>
                        <div className="premium-card">
                            <h3 className="font-bold text-lg mb-2 text-[#111827]">Heavy Frosted</h3>
                            <p className="text-[#111827]">12px blur, 90% opacity. Use for modals.</p>
                        </div>
                    </div>
                </section>

                {/* Typography & Headings */}
                <section>
                    <OrnamentalHeading variant="gold-gradient">Typography & Headings</OrnamentalHeading>
                    <div className="space-y-6 p-6 bg-white/50 rounded-xl border border-[hsl(var(--rajasthani-gold))/30">
                        <OrnamentalHeading variant="default">Default Heading (Serif)</OrnamentalHeading>
                        <OrnamentalHeading variant="gold-gradient">Gold Gradient Heading</OrnamentalHeading>
                        <OrnamentalHeading variant="royal" icon={Star}>Royal Heading with Icon</OrnamentalHeading>
                    </div>
                </section>

                {/* Cards Section */}
                <section>
                    <OrnamentalHeading variant="gold-gradient">Heritage Cards</OrnamentalHeading>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <HeritageCard variant="default">
                            <h3 className="font-bold text-lg mb-2">Default Heritage Card</h3>
                            <p className="text-[#6B7280]">Standard card with subtle gradients and shadow.</p>
                        </HeritageCard>

                        <HeritageCard variant="jharokha">
                            <h3 className="font-bold text-lg mb-2 text-[hsl(var(--rajasthani-maroon))]">Jharokha Card</h3>
                            <p className="text-[#6B7280]">Features a double border inspired by Rajasthani architecture.</p>
                        </HeritageCard>

                        <HeritageCard variant="glass" className="text-white bg-[#111827]/50">
                            <h3 className="font-bold text-lg mb-2">Glass Card</h3>
                            <p className="text-white/80">Transparency for overlaying on complex backgrounds.</p>
                        </HeritageCard>
                    </div>
                </section>

                {/* Patterns Section */}
                <section>
                    <OrnamentalHeading variant="gold-gradient">Patterns</OrnamentalHeading>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <HeritageCard pattern="jaipuri" className="h-48 flex items-center justify-center">
                            <span className="bg-white/80 px-4 py-2 rounded-lg font-bold">Jaipuri Block Print</span>
                        </HeritageCard>
                        <div className="relative h-48 bg-[hsl(var(--rajasthani-maroon))] rounded-xl overflow-hidden flex items-center justify-center">
                            <div className="pattern-mandala absolute inset-0 opacity-20" />
                            <span className="relative z-10 bg-white/90 px-4 py-2 rounded-lg font-bold">Mandala Overlay</span>
                        </div>
                    </div>
                </section>

                {/* Buttons (using standard Button but styled) */}
                <section>
                    <OrnamentalHeading variant="gold-gradient">Interactive Elements</OrnamentalHeading>
                    <div className="flex flex-wrap gap-4 p-6 bg-white/50 rounded-xl border border-[hsl(var(--rajasthani-gold))/30">
                        <Button className="bg-[hsl(var(--rajasthani-maroon))] hover:bg-[hsl(var(--rajasthani-maroon))/90">
                            Primary Action
                        </Button>
                        <Button variant="outline" className="border-[hsl(var(--rajasthani-gold))] text-[hsl(var(--rajasthani-maroon))] hover:bg-[hsl(var(--rajasthani-gold))/10">
                            Secondary Action
                        </Button>
                        <Button className="bg-[hsl(var(--rajasthani-gold))] text-[#111827] hover:bg-[hsl(var(--rajasthani-gold))/80">
                            Gold Action
                        </Button>
                    </div>
                </section>

                {/* SVG Icons Section */}
                <section>
                    <OrnamentalHeading variant="gold-gradient">Custom Rajasthani Icons (Generated)</OrnamentalHeading>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 bg-white/50 rounded-xl border border-[hsl(var(--rajasthani-gold))/30">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 text-[hsl(var(--rajasthani-maroon))]">
                                <img src="/assets/icons/camel.svg" alt="Camel" className="w-full h-full" />
                            </div>
                            <span className="text-sm font-medium">Camel</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 text-[hsl(var(--rajasthani-maroon))]">
                                <img src="/assets/icons/turban.svg" alt="Turban" className="w-full h-full" />
                            </div>
                            <span className="text-sm font-medium">Turban</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 text-[hsl(var(--rajasthani-maroon))]">
                                <img src="/assets/icons/jharokha.svg" alt="Jharokha" className="w-full h-full" />
                            </div>
                            <span className="text-sm font-medium">Jharokha</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 text-[hsl(var(--rajasthani-maroon))]">
                                <img src="/assets/icons/mandala.svg" alt="Mandala" className="w-full h-full" />
                            </div>
                            <span className="text-sm font-medium">Mandala</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 text-[hsl(var(--rajasthani-maroon))]">
                                <img src="/assets/icons/paisley.svg" alt="Paisley" className="w-full h-full" />
                            </div>
                            <span className="text-sm font-medium">Paisley</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

