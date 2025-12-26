'use client';

import React from 'react';
import { GlassMorphismCard } from './GlassMorphismCard';

export function GlassMorphismDemo() {
  return (
    <div className="min-h-screen bg-transparent p-8" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Glass Morphism Effect
          </h1>
          <p className="text-xl text-[#E5E7EB]">
            Premium glass effect with blur and shadow
          </p>
        </div>

        {/* Demo Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GlassMorphismCard className="h-96 rounded-3xl">
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Glass Card</h2>
              <p className="text-[#E5E7EB] mb-6">
                This is a demonstration of the new glass morphism effect with background blur and drop shadow.
              </p>
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm"></div>
                <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm"></div>
                <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm"></div>
              </div>
            </div>
          </GlassMorphismCard>

          <GlassMorphismCard className="h-96 rounded-3xl">
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Interactive Card</h2>
              <p className="text-[#E5E7EB] mb-6">
                This card showcases the glass effect with interactive elements.
              </p>
              <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold hover:bg-white/30 transition-all duration-300">
                Click Me
              </button>
            </div>
          </GlassMorphismCard>
        </div>

        {/* Showcase Different Sizes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Small', 'Medium', 'Large'].map((size, index) => (
            <GlassMorphismCard 
              key={size} 
              className={`rounded-2xl ${
                index === 0 ? 'h-48' : 
                index === 1 ? 'h-64' : 'h-80'
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-2xl font-bold text-white mb-2">{size} Card</h3>
                <p className="text-[#E5E7EB] text-center px-4">
                  Glass effect adapts to different sizes and content.
                </p>
              </div>
            </GlassMorphismCard>
          ))}
        </div>
      </div>
    </div>
  );
}

