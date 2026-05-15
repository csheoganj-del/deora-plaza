"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PhysicsGlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  enableGravity?: boolean;
  enableFloat?: boolean;
}

/**
 * Physics-Based Glass Card with Framer Motion
 * Features: Spring physics, magnetic gravity, floating animation
 */
export function PhysicsGlassCard({ 
  children, 
  className = "", 
  delay = 0,
  enableGravity = true,
  enableFloat = false
}: PhysicsGlassCardProps) {
  
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 22,
    mass: 0.8
  };

  const floatAnimation = enableFloat ? {
    y: [0, -6, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay * 0.5
    }
  } : {};

  return (
    <motion.div
      className={`premium-card physics-card ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        ...floatAnimation
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: springConfig
      }}
      whileTap={{ 
        scale: 0.97,
        transition: { ...springConfig, duration: 0.1 }
      }}
      transition={{
        ...springConfig,
        delay: delay * 0.1
      }}
      style={{
        transformStyle: "preserve-3d"
      }}
      onMouseMove={enableGravity ? (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        
        // Subtle magnetic pull effect
        e.currentTarget.style.transform = `
          translate(${dx * 0.08}px, ${dy * 0.08}px)
          rotateX(${dy * -0.05}deg)
          rotateY(${dx * 0.05}deg)
          translateZ(8px)
        `;
      } : undefined}
      onMouseLeave={enableGravity ? (e) => {
        e.currentTarget.style.transform = "translate(0) rotateX(0) rotateY(0) translateZ(0)";
      } : undefined}
    >
      {children}
    </motion.div>
  );
}