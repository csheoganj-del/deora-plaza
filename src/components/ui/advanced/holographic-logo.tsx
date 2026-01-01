"use client";

import React, { useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';

interface HolographicLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  interactive?: boolean;
  className?: string;
}

export function HolographicLogo({
  size = 'md',
  animated = true,
  interactive = true,
  className = ''
}: HolographicLogoProps) {
  const logoRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl'
  };

  useEffect(() => {
    if (animated) {
      controls.start({
        rotateY: [0, 360],
        transition: {
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }
      });
    }
  }, [animated, controls]);

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!interactive || !logoRef.current) return;

    const rect = logoRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={logoRef}
      className={`relative ${sizeClasses[size]} ${className}`}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={controls}
    >
      {/* Holographic Base */}
      <motion.div
        className="absolute inset-0 rounded-xl adaptive-logo"
        style={{
          backgroundImage: 'linear-gradient(45deg, var(--adaptive-logo-color, #6366f1), var(--adaptive-text-accent, #8b5cf6), #06b6d4, #10b981)',
          backgroundSize: '400% 400%',
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Glass Overlay */}
      <motion.div
        className="absolute inset-0 rounded-xl glass-morphism-heavy"
        style={{
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
        }}
      />

      {/* Logo Text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center font-bold adaptive-text-primary"
        style={{
          textShadow: '0 0 20px var(--adaptive-text-primary, rgba(255, 255, 255, 0.5))',
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
        }}
      >
        DEORA
      </motion.div>

      {/* Particle Effects */}
      <div className="absolute inset-0 particle-system rounded-xl" />

      {/* Ambient Glow */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          boxShadow: '0 0 40px var(--adaptive-logo-color, rgba(99, 102, 241, 0.4))',
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
        }}
        animate={{
          boxShadow: [
            '0 0 40px var(--adaptive-logo-color, rgba(99, 102, 241, 0.4))',
            '0 0 60px var(--adaptive-text-accent, rgba(139, 92, 246, 0.6))',
            '0 0 40px var(--adaptive-logo-color, rgba(99, 102, 241, 0.4))',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}

export function HolographicWordmark({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`flex items-center space-x-3 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <HolographicLogo size="lg" />
      <motion.div
        className="flex flex-col"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <span className="text-2xl font-bold adaptive-gradient-text">
          DEORA Plaza
        </span>
        <span className="text-sm adaptive-text-secondary font-medium">
          Hospitality Excellence
        </span>
      </motion.div>
    </motion.div>
  );
}