"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Settings, Palette } from "lucide-react";
import { initializeSmartContrast, autoDetectContrastLevel, type ContrastLevel } from "@/lib/smart-contrast-system";

/**
 * Enhanced Readability Toggle Component
 * Provides multiple contrast levels and smart auto-detection
 */
export function ReadabilityToggle() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [contrastLevel, setContrastLevel] = useState<ContrastLevel>('high');
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if smart contrast is already active
    const hasSmartContrast = document.body.classList.contains('smart-contrast-active');
    setIsHighContrast(hasSmartContrast);
    
    // Get saved contrast level
    const savedLevel = localStorage.getItem('deora-contrast-level') as ContrastLevel;
    if (savedLevel) {
      setContrastLevel(savedLevel);
    } else {
      // Auto-detect optimal level
      const autoLevel = autoDetectContrastLevel();
      setContrastLevel(autoLevel);
    }
  }, []);

  const toggleReadability = () => {
    if (!isClient) return;

    const newState = !isHighContrast;
    setIsHighContrast(newState);

    if (newState) {
      // Enable high contrast mode with current level
      initializeSmartContrast(contrastLevel);
      localStorage.setItem('deora-high-contrast', 'true');
      localStorage.setItem('deora-contrast-level', contrastLevel);
      console.log(`✅ Enabled ${contrastLevel} contrast mode for better readability`);
    } else {
      // Disable high contrast mode
      document.body.classList.remove('smart-contrast-active', 'smart-contrast-low', 'smart-contrast-medium', 'smart-contrast-high', 'smart-contrast-maximum');
      localStorage.setItem('deora-high-contrast', 'false');
      console.log('✅ Disabled high contrast mode');
    }
  };

  const changeContrastLevel = (level: ContrastLevel) => {
    setContrastLevel(level);
    localStorage.setItem('deora-contrast-level', level);
    
    if (isHighContrast) {
      // Apply new contrast level immediately
      initializeSmartContrast(level);
      console.log(`✅ Changed to ${level} contrast level`);
    }
    
    setShowLevelSelector(false);
  };

  // Load saved preference on mount
  useEffect(() => {
    if (isClient) {
      const saved = localStorage.getItem('deora-high-contrast');
      if (saved === 'true') {
        setIsHighContrast(true);
        initializeSmartContrast(contrastLevel);
      }
    }
  }, [isClient, contrastLevel]);

  if (!isClient) return null;

  const contrastLevels: { level: ContrastLevel; label: string; description: string }[] = [
    { level: 'low', label: 'Low', description: 'Subtle enhancement' },
    { level: 'medium', label: 'Medium', description: 'Balanced readability' },
    { level: 'high', label: 'High', description: 'Business standard' },
    { level: 'maximum', label: 'Maximum', description: 'Ultimate clarity' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
      {/* Level Selector */}
      <AnimatePresence>
        {showLevelSelector && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-lg p-3 min-w-[200px]"
          >
            <div className="text-xs font-medium text-gray-600 mb-2 px-2">Contrast Level</div>
            <div className="space-y-1">
              {contrastLevels.map(({ level, label, description }) => (
                <button
                  key={level}
                  onClick={() => changeContrastLevel(level)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    contrastLevel === level
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-xs opacity-75">{description}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Buttons */}
      <div className="flex gap-2">
        {/* Settings Button */}
        <motion.button
          onClick={() => setShowLevelSelector(!showLevelSelector)}
          className={`
            flex items-center justify-center w-12 h-12 rounded-xl font-medium text-sm
            backdrop-blur-xl border shadow-lg transition-all duration-300
            ${isHighContrast 
              ? 'bg-white/95 text-gray-600 border-gray-200 hover:bg-white' 
              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }
          `}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="Contrast Settings"
        >
          <Settings className="w-5 h-5" />
        </motion.button>

        {/* Main Readability Toggle */}
        <motion.button
          onClick={toggleReadability}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
            backdrop-blur-xl border shadow-lg transition-all duration-300 min-w-[140px]
            ${isHighContrast 
              ? 'bg-white/95 text-gray-800 border-gray-200 hover:bg-white' 
              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }
          `}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title={isHighContrast ? "Disable High Contrast" : "Enable High Contrast"}
        >
          {isHighContrast ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>High Contrast</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>Readability</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Current Level Indicator */}
      {isHighContrast && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center px-2 py-1 rounded-lg bg-black/20 text-white/80 backdrop-blur-sm"
        >
          {contrastLevel.charAt(0).toUpperCase() + contrastLevel.slice(1)} Level
        </motion.div>
      )}
    </div>
  );
}