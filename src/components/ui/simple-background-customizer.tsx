"use client";

import { useState, useEffect } from "react";
import { Palette } from "lucide-react";

const SIMPLE_BACKGROUNDS = [
  {
    id: 'default',
    name: 'Default',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    textColor: '#1f2937'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff'
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    textColor: '#ffffff'
  }
];

export function SimpleBackgroundCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const applyBackground = (bg: typeof SIMPLE_BACKGROUNDS[0]) => {
    if (typeof document === 'undefined') return;
    
    document.body.style.background = bg.gradient;
    document.body.style.backgroundAttachment = 'fixed';
    
    // Apply text colors
    document.documentElement.style.setProperty('--adaptive-text-primary', bg.textColor);
    document.documentElement.style.setProperty('--adaptive-text-secondary', 
      bg.textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)'
    );
    
    setIsOpen(false);
  };

  if (!isClient) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[99999] p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105"
        style={{ pointerEvents: 'auto' }}
      >
        <Palette className="w-6 h-6 text-white" />
      </button>

      {/* Simple Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Choose Background</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {SIMPLE_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => applyBackground(bg)}
                  className="aspect-video rounded-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
                  style={{ background: bg.gradient }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-medium" style={{ color: bg.textColor }}>
                      {bg.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full py-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}