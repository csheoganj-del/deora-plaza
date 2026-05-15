"use client";

import { useEffect, useRef, useState } from "react";

interface SparkTextRevealProps {
  text: string;
  className?: string;
  sparkSpeed?: number; // milliseconds between letters
  pauseDuration?: number; // milliseconds before repeat
  autoStart?: boolean;
}

export default function SparkTextReveal({
  text,
  className = "",
  sparkSpeed = 130,
  pauseDuration = 14000,
  autoStart = true
}: SparkTextRevealProps) {
  const brandRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Split text into individual letters, preserving spaces
  const letters = text.split('').map((char, index) => ({
    char: char === ' ' ? '\u00A0' : char, // Use non-breaking space
    index
  }));

  const startSpark = () => {
    if (!brandRef.current || !sparkRef.current) return;
    
    setIsAnimating(true);
    let index = 0;
    
    // Reset all letters
    const letterElements = brandRef.current.querySelectorAll('.letter');
    letterElements.forEach(letter => {
      (letter as HTMLElement).style.opacity = '0';
      (letter as HTMLElement).style.textShadow = 'none';
    });

    // Show spark
    sparkRef.current.style.opacity = '1';

    intervalRef.current = setInterval(() => {
      if (index >= letterElements.length) {
        // Animation complete
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (sparkRef.current) sparkRef.current.style.opacity = '0';
        setIsAnimating(false);
        
        // Schedule next animation
        timeoutRef.current = setTimeout(() => {
          startSpark();
        }, pauseDuration);
        return;
      }

      const letter = letterElements[index] as HTMLElement;
      const letterRect = letter.getBoundingClientRect();
      const parentRect = brandRef.current!.getBoundingClientRect();

      // Position spark at current letter
      if (sparkRef.current) {
        sparkRef.current.style.left = 
          (letterRect.left - parentRect.left + letterRect.width / 2) + 'px';
      }

      // Reveal letter with glow
      letter.style.opacity = '1';
      letter.style.textShadow = '0 0 18px rgba(242,185,75,0.25)';

      index++;
    }, sparkSpeed);
  };

  useEffect(() => {
    if (autoStart) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startSpark();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      ref={brandRef}
      className={`relative inline-flex gap-1 ${className}`}
      style={{
        fontSize: 'clamp(32px, 8vw, 64px)',
        letterSpacing: '0.14em',
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
        fontWeight: 600
      }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className="letter"
          style={{
            opacity: 0,
            color: '#F5F5F7',
            transition: 'opacity 0.4s ease, text-shadow 0.4s ease',
            display: 'inline-block'
          }}
        >
          {letter.char}
        </span>
      ))}
      
      {/* Golden Spark */}
      <div
        ref={sparkRef}
        className="spark"
        style={{
          position: 'absolute',
          top: '50%',
          left: '0',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: `radial-gradient(circle,
            #FFE9A6,
            #F2B94B 60%,
            transparent 70%)`,
          boxShadow: '0 0 16px rgba(242,185,75,0.9)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          zIndex: 10
        }}
      />
    </div>
  );
}