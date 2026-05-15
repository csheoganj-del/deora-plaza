"use client";

import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EtherealCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: 'glass' | 'holographic' | 'liquid' | 'ambient';
  intensity?: 'light' | 'medium' | 'heavy';
  interactive?: boolean;
  glowColor?: string;
  children: React.ReactNode;
}

export function EtherealCard({
  variant = 'glass',
  intensity = 'medium',
  interactive = true,
  glowColor = 'rgba(99, 102, 241, 0.4)',
  className,
  children,
  ...props
}: EtherealCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for 3D effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), {
    stiffness: 300,
    damping: 30
  });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), {
    stiffness: 300,
    damping: 30
  });
  
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!interactive || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const getVariantClasses = () => {
    const baseClasses = "relative overflow-hidden rounded-2xl";
    
    switch (variant) {
      case 'glass':
        return cn(baseClasses, {
          'glass-morphism-light': intensity === 'light',
          'glass-morphism': intensity === 'medium',
          'glass-morphism-heavy': intensity === 'heavy',
        });
      
      case 'holographic':
        return cn(baseClasses, "holographic-gradient border border-white/20");
      
      case 'liquid':
        return cn(baseClasses, "glass-morphism liquid-morph");
      
      case 'ambient':
        return cn(baseClasses, "glass-morphism ambient-glow");
      
      default:
        return cn(baseClasses, "glass-morphism");
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        getVariantClasses(),
        "floating-card interactive-element",
        interactive && "magnetic-hover",
        className
      )}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: interactive ? 1.02 : 1,
        boxShadow: `0 20px 40px ${glowColor}`,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      {...props}
    >
      {/* Particle System Overlay */}
      {variant === 'ambient' && (
        <div className="absolute inset-0 particle-system opacity-30" />
      )}
      
      {/* Holographic Shine Effect */}
      {variant === 'holographic' && (
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Interactive Glow */}
      {interactive && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor} 0%, transparent 50%)`,
            opacity: 0,
          }}
          whileHover={{ opacity: 0.3 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
}

export function EtherealGrid({ 
  children, 
  className,
  cols = 3,
  gap = 6 
}: { 
  children: React.ReactNode;
  className?: string;
  cols?: number;
  gap?: number;
}) {
  return (
    <motion.div
      className={cn(
        "grid gap-6",
        {
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': cols === 3,
          'grid-cols-1 md:grid-cols-2': cols === 2,
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4': cols === 4,
        },
        `gap-${gap}`,
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.6,
        staggerChildren: 0.1
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: index * 0.1,
            ease: "easeOut"
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}