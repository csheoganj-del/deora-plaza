"use client";

/**
 * 📖 Readability Enhancer
 * 
 * Provides instant readability improvements with toggle controls
 * Addresses text contrast, glass effect opacity, and accessibility
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Eye, 
  EyeOff, 
  Contrast, 
  Type, 
  Palette,
  Settings,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';

export type ReadabilityMode = 'beauty' | 'balanced' | 'business' | 'maximum';

interface ReadabilitySettings {
  mode: ReadabilityMode;
  textContrast: number;
  glassOpacity: number;
  removeAnimations: boolean;
  highContrast: boolean;
  largeText: boolean;
}

const DEFAULT_SETTINGS: ReadabilitySettings = {
  mode: 'balanced',
  textContrast: 1.2,
  glassOpacity: 0.3,
  removeAnimations: false,
  highContrast: false,
  largeText: false
};

const MODE_CONFIGS = {
  beauty: {
    name: 'Beauty Mode',
    description: 'Maximum visual appeal',
    textContrast: 1.0,
    glassOpacity: 0.1,
    icon: Palette,
    color: 'from-pink-500 to-purple-500'
  },
  balanced: {
    name: 'Balanced Mode',
    description: 'Good looks + readability',
    textContrast: 1.2,
    glassOpacity: 0.3,
    icon: Eye,
    color: 'from-blue-500 to-cyan-500'
  },
  business: {
    name: 'Business Mode',
    description: 'Professional readability',
    textContrast: 1.5,
    glassOpacity: 0.7,
    icon: Monitor,
    color: 'from-gray-500 to-slate-500'
  },
  maximum: {
    name: 'Maximum Readability',
    description: 'Accessibility focused',
    textContrast: 2.0,
    glassOpacity: 0.9,
    icon: Contrast,
    color: 'from-green-500 to-emerald-500'
  }
};

export function ReadabilityEnhancer() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ReadabilitySettings>(DEFAULT_SETTINGS);
  const [isApplying, setIsApplying] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('deora-readability-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.warn('Failed to load readability settings:', error);
      }
    }
  }, []);

  // Apply settings when they change
  useEffect(() => {
    const applySettings = async (newSettings: ReadabilitySettings) => {
      setIsApplying(true);
      
      try {
        // Apply CSS custom properties
        const root = document.documentElement;
        
        root.style.setProperty('--readability-text-contrast', newSettings.textContrast.toString());
        root.style.setProperty('--readability-glass-opacity', newSettings.glassOpacity.toString());
        root.style.setProperty('--readability-animations', newSettings.removeAnimations ? '0' : '1');
        
        // Apply mode-specific styles
        const modeConfig = MODE_CONFIGS[newSettings.mode];
        root.style.setProperty('--readability-mode-contrast', modeConfig.textContrast.toString());
        root.style.setProperty('--readability-mode-opacity', modeConfig.glassOpacity.toString());
        
        // Apply readability classes
        document.body.classList.remove('readability-beauty', 'readability-balanced', 'readability-business', 'readability-maximum');
        document.body.classList.add(`readability-${newSettings.mode}`);
        
        if (newSettings.highContrast) {
          document.body.classList.add('readability-high-contrast');
        } else {
          document.body.classList.remove('readability-high-contrast');
        }
        
        if (newSettings.largeText) {
          document.body.classList.add('readability-large-text');
        } else {
          document.body.classList.remove('readability-large-text');
        }
        
        if (newSettings.removeAnimations) {
          document.body.classList.add('readability-no-animations');
        } else {
          document.body.classList.remove('readability-no-animations');
        }
        
        // Apply dynamic styles
        applyDynamicStyles(newSettings);
        
      } catch (error) {
        console.error('Failed to apply readability settings:', error);
      } finally {
        setIsApplying(false);
      }
    };

    applySettings(settings);
    localStorage.setItem('deora-readability-settings', JSON.stringify(settings));
  }, [settings]);

  const applyReadabilitySettings = async (newSettings: ReadabilitySettings) => {
    setIsApplying(true);
    
    try {
      // Apply CSS custom properties
      const root = document.documentElement;
      
      root.style.setProperty('--readability-text-contrast', newSettings.textContrast.toString());
      root.style.setProperty('--readability-glass-opacity', newSettings.glassOpacity.toString());
      root.style.setProperty('--readability-animations', newSettings.removeAnimations ? '0' : '1');
      
      // Apply mode-specific styles
      const modeConfig = MODE_CONFIGS[newSettings.mode];
      root.style.setProperty('--readability-mode-contrast', modeConfig.textContrast.toString());
      root.style.setProperty('--readability-mode-opacity', modeConfig.glassOpacity.toString());
      
      // Apply readability classes
      document.body.classList.remove('readability-beauty', 'readability-balanced', 'readability-business', 'readability-maximum');
      document.body.classList.add(`readability-${newSettings.mode}`);
      
      if (newSettings.highContrast) {
        document.body.classList.add('readability-high-contrast');
      } else {
        document.body.classList.remove('readability-high-contrast');
      }
      
      if (newSettings.largeText) {
        document.body.classList.add('readability-large-text');
      } else {
        document.body.classList.remove('readability-large-text');
      }
      
      if (newSettings.removeAnimations) {
        document.body.classList.add('readability-no-animations');
      } else {
        document.body.classList.remove('readability-no-animations');
      }
      
      // Apply dynamic styles
      applyDynamicStyles(newSettings);
      
    } catch (error) {
      console.error('Failed to apply readability settings:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const applyDynamicStyles = (settings: ReadabilitySettings) => {
    const styleId = 'readability-dynamic-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    
    const contrastMultiplier = settings.textContrast;
    const glassOpacity = settings.glassOpacity;
    
    style.textContent = `
      /* Dynamic Readability Styles */
      
      /* Text Contrast Enhancement */
      .readability-${settings.mode} .adaptive-text-primary,
      .readability-${settings.mode} h1,
      .readability-${settings.mode} h2,
      .readability-${settings.mode} h3 {
        color: rgba(255, 255, 255, ${Math.min(0.95 * contrastMultiplier, 1)}) !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, ${0.3 * contrastMultiplier}) !important;
      }
      
      .readability-${settings.mode} .adaptive-text-secondary {
        color: rgba(255, 255, 255, ${Math.min(0.85 * contrastMultiplier, 1)}) !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, ${0.25 * contrastMultiplier}) !important;
      }
      
      /* Glass Effect Opacity */
      .readability-${settings.mode} [class*="glass"],
      .readability-${settings.mode} [class*="liquid"] {
        background: rgba(255, 255, 255, ${glassOpacity}) !important;
        backdrop-filter: blur(${Math.max(20 - (glassOpacity * 10), 8)}px) !important;
      }
      
      /* High Contrast Mode */
      .readability-high-contrast * {
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8) !important;
      }
      
      .readability-high-contrast [class*="glass"],
      .readability-high-contrast [class*="liquid"] {
        background: rgba(255, 255, 255, 0.95) !important;
        backdrop-filter: blur(4px) !important;
        border: 2px solid rgba(0, 0, 0, 0.2) !important;
      }
      
      /* Large Text Mode */
      .readability-large-text {
        font-size: 110% !important;
      }
      
      .readability-large-text h1 { font-size: 2.5rem !important; }
      .readability-large-text h2 { font-size: 2rem !important; }
      .readability-large-text h3 { font-size: 1.5rem !important; }
      .readability-large-text p, .readability-large-text span { font-size: 1.1rem !important; }
      
      /* No Animations Mode */
      .readability-no-animations *,
      .readability-no-animations *::before,
      .readability-no-animations *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        transform: none !important;
      }
      
      /* Business Mode Specific */
      .readability-business [class*="glass"],
      .readability-business [class*="liquid"] {
        background: rgba(255, 255, 255, 0.9) !important;
        backdrop-filter: blur(8px) !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Maximum Readability Mode */
      .readability-maximum {
        background: #f8f9fa !important;
      }
      
      .readability-maximum [class*="glass"],
      .readability-maximum [class*="liquid"] {
        background: rgba(255, 255, 255, 0.98) !important;
        backdrop-filter: none !important;
        border: 2px solid rgba(0, 0, 0, 0.15) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      }
      
      .readability-maximum .adaptive-text-primary {
        color: rgba(0, 0, 0, 0.95) !important;
        text-shadow: none !important;
      }
      
      .readability-maximum .adaptive-text-secondary {
        color: rgba(0, 0, 0, 0.75) !important;
        text-shadow: none !important;
      }
    `;
  };

  const handleModeChange = (mode: ReadabilityMode) => {
    const config = MODE_CONFIGS[mode];
    setSettings(prev => ({
      ...prev,
      mode,
      textContrast: config.textContrast,
      glassOpacity: config.glassOpacity
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg glass-effect-optimized"
        title="Readability Settings"
      >
        <Eye className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-xl glass-effect-optimized">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Readability
          </CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Reading Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MODE_CONFIGS).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = settings.mode === key;
              
              return (
                <Button
                  key={key}
                  onClick={() => handleModeChange(key as ReadabilityMode)}
                  variant={isActive ? "default" : "outline"}
                  className={`h-auto p-3 flex flex-col items-center gap-1 ${
                    isActive ? `bg-gradient-to-r ${config.color} text-white` : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{config.name.split(' ')[0]}</span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {MODE_CONFIGS[settings.mode].description}
          </p>
        </div>

        {/* Text Contrast */}
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Type className="h-4 w-4" />
            Text Contrast: {settings.textContrast.toFixed(1)}x
          </label>
          <Slider
            value={[settings.textContrast]}
            onValueChange={([value]) => setSettings(prev => ({ ...prev, textContrast: value }))}
            min={0.8}
            max={2.0}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Glass Opacity */}
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Background Opacity: {Math.round(settings.glassOpacity * 100)}%
          </label>
          <Slider
            value={[settings.glassOpacity]}
            onValueChange={([value]) => setSettings(prev => ({ ...prev, glassOpacity: value }))}
            min={0.1}
            max={1.0}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Accessibility Options */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Contrast className="h-4 w-4" />
              High Contrast
            </label>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, highContrast: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Type className="h-4 w-4" />
              Large Text
            </label>
            <Switch
              checked={settings.largeText}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, largeText: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Reduce Motion
            </label>
            <Switch
              checked={settings.removeAnimations}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, removeAnimations: checked }))}
            />
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant={isApplying ? "secondary" : "default"}>
            {isApplying ? "Applying..." : "Active"}
          </Badge>
          
          <Button
            onClick={resetToDefaults}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}