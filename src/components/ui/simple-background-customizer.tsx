"use client";

import { useState, useEffect, useRef } from "react";
import { Palette, RotateCcw, Sparkles, Sun, Moon, Sunset, Cloud, Upload, X } from "lucide-react";

interface BackgroundPreset {
  name: string;
  icon: React.ReactNode;
  gradient: string;
  textColor: string;
  glassColor: string;
}

interface CustomBackground {
  name: string;
  url: string;
  dataUrl?: string; // Add base64 data URL for persistence
  textColor: string;
  glassColor: string;
  timestamp: number; // Add timestamp for sorting
}

const backgroundPresets: BackgroundPreset[] = [
  // --- Nature & Scenery ---
  {
    name: "Stellar Void",
    icon: <Sparkles className="w-4 h-4" />,
    gradient: "radial-gradient(1px 1px at 10% 10%, rgba(255, 255, 255, 0.9) 0%, transparent 100%), radial-gradient(1px 1px at 20% 40%, rgba(255, 255, 255, 0.7) 0%, transparent 100%), radial-gradient(2px 2px at 50% 50%, rgba(255, 255, 255, 0.6) 0%, transparent 100%), radial-gradient(circle at top right, rgba(50, 40, 100, 0.5), transparent 40%), linear-gradient(to bottom, #020111 0%, #191621 100%)",
    textColor: "rgba(220, 230, 255, 0.95)",
    glassColor: "rgba(20, 30, 60, 0.4)"
  },
  {
    name: "Golden Sands",
    icon: <Sun className="w-4 h-4" />,
    gradient: "linear-gradient(to bottom, #D4AF37 0%, #C5a028 30%, #a88015 60%, #8a6008 100%)",
    textColor: "rgba(60, 30, 0, 0.95)",
    glassColor: "rgba(212, 175, 55, 0.2)"
  },
  {
    name: "Nordic Mountain",
    icon: <Cloud className="w-4 h-4" />,
    gradient: "linear-gradient(to bottom, #E0EAFC 0%, #CFDEF3 40%, #8E9EAB 100%)",
    textColor: "rgba(40, 50, 60, 0.9)",
    glassColor: "rgba(255, 255, 255, 0.3)"
  },
  {
    name: "Deep Jungle",
    icon: <Sun className="w-4 h-4" />,
    gradient: "radial-gradient(circle at 20% 20%, rgba(255, 255, 200, 0.2), transparent 30%), linear-gradient(to bottom, #134E5E 0%, #71B280 100%)",
    textColor: "rgba(230, 255, 240, 0.95)",
    glassColor: "rgba(19, 78, 94, 0.25)"
  },
  {
    name: "Sakura Breeze",
    icon: <Cloud className="w-4 h-4" />,
    gradient: "radial-gradient(circle at top left, rgba(255, 255, 255, 0.8), transparent 40%), linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)",
    textColor: "rgba(100, 20, 80, 0.9)",
    glassColor: "rgba(255, 255, 255, 0.25)"
  },

  // --- High-End Abstract ---
  {
    name: "Neon Tokyo",
    icon: <Sparkles className="w-4 h-4" />,
    gradient: "linear-gradient(to bottom, #2b32b2 0%, #1488cc 100%)",
    textColor: "rgba(200, 240, 255, 0.95)",
    glassColor: "rgba(43, 50, 178, 0.2)"
  },
  {
    name: "Midnight Jazz",
    icon: <Moon className="w-4 h-4" />,
    gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    textColor: "rgba(255, 230, 200, 0.95)",
    glassColor: "rgba(48, 43, 99, 0.3)"
  },
  {
    name: "Obsidian Flow",
    icon: <Moon className="w-4 h-4" />,
    gradient: "linear-gradient(45deg, #1a1a1a 0%, #222222 50%, #1a1a1a 100%)",
    textColor: "rgba(255, 255, 255, 0.9)",
    glassColor: "rgba(50, 50, 50, 0.3)"
  },
  {
    name: "Ethereal Horizon",
    icon: <Cloud className="w-4 h-4" />,
    gradient: "linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)",
    textColor: "rgba(70, 20, 70, 0.9)",
    glassColor: "rgba(255, 255, 255, 0.25)"
  },
  {
    name: "Electric Dreams",
    icon: <Sparkles className="w-4 h-4" />,
    gradient: "conic-gradient(from 0deg at 50% 50%, #1a1a1a 0%, #2c3e50 25%, #4ca1af 50%, #2c3e50 75%, #1a1a1a 100%)",
    textColor: "rgba(200, 255, 255, 0.95)",
    glassColor: "rgba(76, 161, 175, 0.15)"
  },

  // --- Classics ---
  {
    name: "Deep Ocean",
    icon: <Cloud className="w-4 h-4" />,
    gradient: "radial-gradient(ellipse at center, #2E2A5E 0%, #1A1033 50%, #0F1C3F 100%)",
    textColor: "rgba(255, 255, 255, 0.95)",
    glassColor: "rgba(255, 255, 255, 0.1)"
  },
  {
    name: "Sunset Glow",
    icon: <Sunset className="w-4 h-4" />,
    gradient: "radial-gradient(ellipse at center, #FF6B35 0%, #F7931E 30%, #8B4513 70%, #2F1B14 100%)",
    textColor: "rgba(255, 255, 255, 0.95)",
    glassColor: "rgba(255, 255, 255, 0.15)"
  },
  {
    name: "Aurora Night",
    icon: <Moon className="w-4 h-4" />,
    gradient: "radial-gradient(ellipse at center, #4C1D95 0%, #1E1B4B 40%, #0F172A 80%, #1a1a1a 100%)",
    textColor: "rgba(255, 255, 255, 0.95)",
    glassColor: "rgba(255, 255, 255, 0.12)"
  }
];

export function SimpleBackgroundCustomizer() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoCycle, setAutoCycle] = useState(false);

  // Load saved preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem('deora-current-background');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.type === 'preset' && parsed.preset) {
          // Find the preset index
          const index = backgroundPresets.findIndex(p => p.name === parsed.preset.name);
          if (index !== -1) {
            applyBackground(backgroundPresets[index], index);
          }
        }
      } else {
        // Default to first preset
        applyBackground(backgroundPresets[0], 0);
      }
    } catch (error) {
      console.error('Error loading background preferences:', error);
      applyBackground(backgroundPresets[0], 0);
    }
  }, []);

  // Apply preset background
  const applyBackground = (preset: BackgroundPreset, index: number) => {
    if (typeof document === 'undefined') return;

    setIsAnimating(true);
    setCurrentPreset(index);

    // Remove image background class if present
    document.body.classList.remove('has-image-background');

    // Apply to body
    document.body.style.background = preset.gradient;
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';

    // Update CSS custom properties
    const borderColor = `color-mix(in srgb, ${preset.textColor} 20%, transparent)`;
    const secondaryColor = `color-mix(in srgb, ${preset.textColor} 70%, transparent)`;
    const tertiaryColor = `color-mix(in srgb, ${preset.textColor} 45%, transparent)`;

    const root = document.documentElement;
    root.style.setProperty('--adaptive-text-color', preset.textColor);
    root.style.setProperty('--adaptive-text-primary', preset.textColor);
    root.style.setProperty('--adaptive-text-secondary', secondaryColor);
    root.style.setProperty('--adaptive-text-tertiary', tertiaryColor);
    root.style.setProperty('--adaptive-glass-color', preset.glassColor);
    root.style.setProperty('--adaptive-glass-bg', preset.glassColor);
    root.style.setProperty('--adaptive-border-color', borderColor);
    root.style.setProperty('--adaptive-glass-border', borderColor);

    // Apply to background layer if it exists (from old custom uploads)
    const bgLayer = document.getElementById('deora-background-layer');
    if (bgLayer) {
      bgLayer.style.background = preset.gradient;
    }

    // Force update of adaptive elements
    const adaptiveElements = document.querySelectorAll('.text-adaptive-primary, .text-adaptive-secondary, .text-adaptive-tertiary, .glass-adaptive');
    adaptiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.classList.add('adaptive-update');
      setTimeout(() => {
        htmlElement.classList.remove('adaptive-update');
      }, 100);
    });

    // Save to localStorage
    try {
      localStorage.setItem('deora-current-background', JSON.stringify({
        background: preset.gradient,
        type: 'preset',
        preset: preset,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving preset background:', error);
    }

    setTimeout(() => setIsAnimating(false), 500);
  };

  // Reset to default
  const resetToDefault = () => {
    applyBackground(backgroundPresets[0], 0);
  };

  // Auto-cycle
  useEffect(() => {
    if (!autoCycle) return;

    const interval = setInterval(() => {
      const nextIndex = (currentPreset + 1) % backgroundPresets.length;
      applyBackground(backgroundPresets[nextIndex], nextIndex);
    }, 8000);

    return () => clearInterval(interval);
  }, [autoCycle, currentPreset]);

  return (
    <>
      <div
        className="fixed bottom-6 right-6 z-50"
        style={{
          opacity: isVisible ? 1 : 0.8,
          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:scale-110 transition-transform"
        >
          <Palette className="w-6 h-6" />
        </button>
      </div>

      {isVisible && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[70vh] overflow-y-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white/95">
              Background Studio
            </h3>
            <button
              onClick={resetToDefault}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
              title="Reset to Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Themes */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-white/90">
              Preset Themes
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {backgroundPresets.map((preset, index) => (
                <button
                  key={preset.name}
                  onClick={() => applyBackground(preset, index)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200
                    ${currentPreset === index
                      ? 'bg-blue-500/20 border-blue-400/50 border'
                      : 'bg-white/5 border-white/10 border hover:bg-white/10'}
                  `}
                >
                  <div className={`p-2 rounded-full ${currentPreset === index ? 'bg-blue-500/30 text-blue-200' : 'bg-white/10 text-white/70'}`}>
                    {preset.icon}
                  </div>
                  <span className="text-xs font-medium text-white/90">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-cycle Toggle */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">
              Auto-cycle themes
            </span>
            <button
              onClick={() => setAutoCycle(!autoCycle)}
              className={`
                w-11 h-6 rounded-full transition-colors relative
                ${autoCycle ? 'bg-green-500/80' : 'bg-white/20'}
              `}
            >
              <div
                className={`
                  w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm
                  ${autoCycle ? 'translate-x-6' : 'translate-x-0.5'}
                `}
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
}