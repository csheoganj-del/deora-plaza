"use client";

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Palette, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  applyReadabilityMode, 
  toggleReadabilityMode, 
  getCurrentReadabilityMode,
  type ReadabilityMode 
} from '@/lib/enhanced-readability-system';
import { shouldUseSolidDashboard } from '@/lib/route-aware-styling';

export function EnhancedReadabilityToggle() {
  const [currentMode, setCurrentMode] = useState<ReadabilityMode>('beauty');
  const [isClient, setIsClient] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Only show on dashboard routes
    setShouldShow(shouldUseSolidDashboard());
    
    if (shouldUseSolidDashboard()) {
      const mode = getCurrentReadabilityMode();
      setCurrentMode(mode);
    }
  }, []);

  // Listen for route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const shouldShowNow = shouldUseSolidDashboard();
      setShouldShow(shouldShowNow);
      
      if (shouldShowNow) {
        const mode = getCurrentReadabilityMode();
        setCurrentMode(mode);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const handleQuickToggle = () => {
    const newMode = toggleReadabilityMode();
    setCurrentMode(newMode);
  };

  const handleModeSelect = (mode: ReadabilityMode) => {
    applyReadabilityMode(mode);
    setCurrentMode(mode);
    setShowModeSelector(false);
  };

  const modes: { mode: ReadabilityMode; label: string; icon: any; description: string }[] = [
    {
      mode: 'beauty',
      label: 'Beauty',
      icon: Palette,
      description: 'Elegant frosted glass with visual appeal'
    },
    {
      mode: 'balanced',
      label: 'Balanced',
      icon: Eye,
      description: 'Enhanced readability with style'
    },
    {
      mode: 'business',
      label: 'Business',
      icon: BookOpen,
      description: 'High contrast for data analysis'
    },
    {
      mode: 'maximum',
      label: 'Maximum',
      icon: EyeOff,
      description: 'Highest contrast for accessibility'
    }
  ];

  const currentModeData = modes.find(m => m.mode === currentMode) || modes[0];
  const CurrentIcon = currentModeData.icon;

  // Don't render if not client-side or not on dashboard route
  if (!isClient || !shouldShow) return null;

  return (
    <div className="fixed top-4 right-4 z-50 enhanced-readability-toggle">
      <div className="relative">
        {/* Quick Toggle Button */}
        <motion.button
          onClick={handleQuickToggle}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowModeSelector(!showModeSelector);
          }}
          className={cn(
            "glass-card p-3 rounded-xl shadow-lg transition-all duration-300",
            "hover:scale-105 active:scale-95",
            "border border-white/20 backdrop-filter backdrop-blur-lg",
            "bg-white/80"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={`Dashboard Readability: ${currentModeData.label} (Right-click for options)`}
        >
          <CurrentIcon 
            className="h-5 w-5 text-gray-700 transition-colors" 
          />
        </motion.button>

        {/* Mode Selector Dropdown */}
        <AnimatePresence>
          {showModeSelector && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-64 glass-card rounded-xl shadow-xl border border-white/20 backdrop-filter backdrop-blur-lg bg-white/90 overflow-hidden"
            >
              <div className="p-3 border-b border-white/20">
                <h3 className="font-semibold text-gray-800 text-sm">Dashboard Readability</h3>
                <p className="text-xs text-gray-600 mt-1">Optimize for your work environment</p>
              </div>
              
              <div className="p-2 space-y-1">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = currentMode === mode.mode;
                  
                  return (
                    <motion.button
                      key={mode.mode}
                      onClick={() => handleModeSelect(mode.mode)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all duration-200",
                        "hover:bg-white/50 active:scale-98",
                        isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium text-sm",
                              isActive ? 'text-blue-700' : 'text-gray-700'
                            )}>
                              {mode.label}
                            </span>
                            {isActive && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{mode.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              
              <div className="p-3 border-t border-white/20 bg-gray-50/50">
                <p className="text-xs text-gray-500">
                  💡 <strong>Dashboard Mode:</strong> Consistent iOS-style frosted glass for professional work
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Click outside to close */}
        {showModeSelector && (
          <div 
            className="fixed inset-0 z-[-1]" 
            onClick={() => setShowModeSelector(false)}
          />
        )}
      </div>
    </div>
  );
}