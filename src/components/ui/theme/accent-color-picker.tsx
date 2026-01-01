"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { dynamicAccentSystem, ACCENT_PRESETS, AccentColor } from "@/lib/dynamic-accent-system";
import { Palette, Clock, TrendingUp, Calendar } from "lucide-react";

/**
 * Accent Color Picker Component
 * Allows users to change the dynamic accent color system
 */
export function AccentColorPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAccent, setCurrentAccent] = useState<AccentColor>(
    dynamicAccentSystem.getCurrentAccent()
  );

  useEffect(() => {
    const unsubscribe = dynamicAccentSystem.subscribe(setCurrentAccent);
    return unsubscribe;
  }, []);

  const colorGroups = {
    brand: ['primary', 'secondary', 'gold'],
    time: ['morning', 'day', 'evening', 'night'],
    business: ['success', 'warning', 'danger', 'neutral'],
    seasonal: ['spring', 'summer', 'autumn', 'winter']
  };

  const handleColorSelect = (colorKey: keyof typeof ACCENT_PRESETS) => {
    dynamicAccentSystem.setAccent(colorKey);
    setIsOpen(false);
  };

  const handleAutoMode = (mode: 'time' | 'business' | 'seasonal') => {
    switch (mode) {
      case 'time':
        dynamicAccentSystem.setTimeBasedAccent();
        break;
      case 'business':
        // Example business metrics - in real app, get from props/context
        dynamicAccentSystem.setBusinessAccent(100000, 90000);
        break;
      case 'seasonal':
        dynamicAccentSystem.setSeasonalAccent();
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        className="accent-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: `rgb(${currentAccent.rgb})`,
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          boxShadow: `0 4px 12px rgba(${currentAccent.rgb}, 0.3)`
        }}
      >
        <Palette className="h-4 w-4" />
        {currentAccent.name}
      </motion.button>

      {isOpen && (
        <motion.div
          className="accent-picker-panel"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            padding: '16px',
            minWidth: '280px',
            zIndex: 1000
          }}
        >
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#1a1a1a'
          }}>
            Choose Accent Color
          </h3>

          {/* Auto Modes */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ 
              fontSize: '12px', 
              fontWeight: '500', 
              color: '#6b7280',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Auto Modes
            </h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <motion.button
                onClick={() => handleAutoMode('time')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(106, 124, 255, 0.1)',
                  color: 'rgb(106, 124, 255)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Clock className="h-3 w-3" />
                Time
              </motion.button>
              <motion.button
                onClick={() => handleAutoMode('business')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: 'rgb(34, 197, 94)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <TrendingUp className="h-3 w-3" />
                Business
              </motion.button>
              <motion.button
                onClick={() => handleAutoMode('seasonal')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(249, 115, 22, 0.1)',
                  color: 'rgb(249, 115, 22)',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Calendar className="h-3 w-3" />
                Season
              </motion.button>
            </div>
          </div>

          {/* Color Groups */}
          {Object.entries(colorGroups).map(([groupName, colors]) => (
            <div key={groupName} style={{ marginBottom: '12px' }}>
              <h4 style={{ 
                fontSize: '12px', 
                fontWeight: '500', 
                color: '#6b7280',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {groupName}
              </h4>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {colors.map(colorKey => {
                  const color = ACCENT_PRESETS[colorKey as keyof typeof ACCENT_PRESETS];
                  const isActive = currentAccent.rgb === color.rgb;
                  
                  return (
                    <motion.button
                      key={colorKey}
                      onClick={() => handleColorSelect(colorKey as keyof typeof ACCENT_PRESETS)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: isActive ? '2px solid #1a1a1a' : '1px solid rgba(255, 255, 255, 0.3)',
                        background: `rgb(${color.rgb})`,
                        cursor: 'pointer',
                        boxShadow: `0 2px 8px rgba(${color.rgb}, 0.3)`
                      }}
                      title={color.name}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}