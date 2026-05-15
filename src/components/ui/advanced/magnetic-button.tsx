"use client";

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAudioNotifications } from '@/lib/audio/notification-system';

interface MagneticButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'holographic' | 'liquid';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  magnetic?: boolean;
  soundEffect?: boolean;
  glowColor?: string;
  children: React.ReactNode;
}

export function MagneticButton({
  variant = 'primary',
  size = 'md',
  magnetic = true,
  soundEffect = true,
  glowColor,
  className,
  children,
  onClick,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { playNotification } = useAudioNotifications();
  
  // Mouse tracking for magnetic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { stiffness: 300, damping: 30 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  
  // Transform values for magnetic attraction
  const magneticX = useTransform(x, [-100, 100], [-8, 8]);
  const magneticY = useTransform(y, [-100, 100], [-8, 8]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-8 py-4 text-lg h-14'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#EDEBFF]0 to-[#C084FC] text-white shadow-lg shadow-indigo-500/25',
    secondary: 'glass-morphism text-[#111827] dark:text-white border border-white/20',
    ghost: 'hover:glass-morphism-light text-[#111827] dark:text-[#9CA3AF]',
    holographic: 'holographic-gradient text-white border border-white/30',
    liquid: 'glass-morphism-heavy liquid-morph text-[#111827] dark:text-white'
  };

  const getGlowColor = () => {
    if (glowColor) return glowColor;
    
    switch (variant) {
      case 'primary': return 'rgba(99, 102, 241, 0.4)';
      case 'holographic': return 'rgba(139, 92, 246, 0.4)';
      case 'liquid': return 'rgba(6, 182, 212, 0.4)';
      default: return 'rgba(99, 102, 241, 0.2)';
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!magnetic || !buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(event.clientX - centerX, 2) + Math.pow(event.clientY - centerY, 2)
    );
    
    // Magnetic attraction within 100px radius
    if (distance < 100) {
      mouseX.set((event.clientX - centerX) * 0.3);
      mouseY.set((event.clientY - centerY) * 0.3);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (soundEffect) {
      playNotification({
        type: 'info',
        title: 'Button Hover',
        priority: 'low'
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (soundEffect) {
      playNotification({
        type: 'success',
        title: 'Button Click',
        priority: 'medium'
      });
    }
    
    // Ripple effect
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const ripple = document.createElement('div');
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;
      
      buttonRef.current?.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
    
    onClick?.(event);
  };

  return (
    <>
      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
      
      <motion.button
        ref={buttonRef}
        className={cn(
          'relative overflow-hidden rounded-xl font-medium transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-[#EDEBFF]0 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'spring-smooth interactive-element',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        style={{
          x: magnetic ? magneticX : 0,
          y: magnetic ? magneticY : 0,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        whileHover={{
          scale: 1.05,
          boxShadow: `0 10px 30px ${getGlowColor()}`,
        }}
        whileTap={{
          scale: 0.95,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
        {...props}
      >
        {/* Background Glow */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`,
            opacity: 0,
          }}
          animate={{
            opacity: isHovered ? 0.3 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Holographic Shine */}
        {variant === 'holographic' && (
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.8) 50%, transparent 70%)',
            }}
            animate={{
              x: isHovered ? ['-100%', '100%'] : '-100%',
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        
        {/* Particle Effect on Hover */}
        {isHovered && variant === 'primary' && (
          <div className="absolute inset-0 particle-system opacity-20" />
        )}
      </motion.button>
    </>
  );
}

export function ButtonGroup({ 
  children, 
  className,
  orientation = 'horizontal' 
}: { 
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <div
      className={cn(
        'flex gap-2',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
    >
      {children}
    </div>
  );
}