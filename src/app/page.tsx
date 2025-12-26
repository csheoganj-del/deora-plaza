"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { SimpleBackgroundCustomizer } from "@/components/ui/simple-background-customizer";

// Premium Apple-Level iOS Clock Component
function PremiumClock() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="text-center mb-12">
        <div 
          className="inline-block glass-strong time-card-depth animate-float-in mb-6"
          style={{
            padding: '32px 48px',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div 
            className="apple-time-glow liquid-glass-text"
            style={{
              fontSize: '120px',
              fontWeight: '800',
              letterSpacing: '-0.03em',
              fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
              position: 'relative',
              zIndex: 2
            }}
          >
            --:--
          </div>
        </div>
        <div style={{ fontSize: '18px' }} className="liquid-glass-text-secondary">
          Loading...
        </div>
      </div>
    );
  }

  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="text-center mb-12">
      <div 
        className="inline-block glass-strong time-card-depth animate-float-in mb-6"
        style={{
          padding: '32px 48px',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div 
          className="apple-time-glow liquid-glass-text"
          style={{
            fontSize: '120px',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
            position: 'relative',
            zIndex: 2
          }}
        >
          {timeString}
        </div>
      </div>
      <div style={{ fontSize: '18px' }} className="liquid-glass-text-secondary">
        {dateString}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  // Initialize premium background and lock screen class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.background = 'radial-gradient(ellipse at center, #2E2A5E 0%, #1A1033 50%, #0F1C3F 100%)';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.classList.add('lock-screen');
      
      // Cleanup when component unmounts
      return () => {
        document.body.classList.remove('lock-screen');
      };
    }
  }, []);

  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{ 
        background: 'radial-gradient(ellipse at center, #2E2A5E 0%, #1A1033 50%, #0F1C3F 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Cinematic Background Effects */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
          filter: 'blur(1px)'
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Premium Lock Screen */}
        <div className="text-center w-full max-w-md">
          <PremiumClock />

          {/* DEORA Plaza Brand Section - Apple Level */}
          <div className="mb-16">
            <h1 
              className="text-2xl font-semibold mb-3 apple-brand-glow liquid-glass-text-blue"
              style={{
                fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
                fontWeight: '600'
              }}
            >
              DEORA Plaza
            </h1>
            
            {/* Premium Glass Divider */}
            <div 
              className="mx-auto mb-4"
              style={{
                width: '220px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                filter: 'blur(0.5px)',
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.2)'
              }}
            />
            
            <p 
              className="text-sm liquid-glass-text-secondary"
              style={{
                fontWeight: '400'
              }}
            >
              Hospitality Management System
            </p>
          </div>

          {/* Apple-Level Unlock Card */}
          <div className="mx-auto glass-soft unlock-card-depth animate-float-in" style={{ width: '320px', position: 'relative', zIndex: 10 }}>
            <div className="text-center" style={{ position: 'relative', zIndex: 2 }}>
              <ArrowUp 
                className="w-5 h-5 mx-auto mb-3 animate-pulse"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))'
                }}
              />
              <p 
                className="text-sm font-medium mb-6 liquid-glass-text"
                style={{ 
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                Swipe up to unlock
              </p>

              <button
                onClick={() => router.push('/login')}
                className="w-full apple-button animate-button-pulse font-semibold"
                style={{
                  height: '52px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none'
                }}
              >
                Access System
              </button>
              
              {/* Tailwind CSS Test Link */}
              <div className="mt-4 text-center">
                <a 
                  href="/tailwind-test" 
                  className="text-sm text-blue-300 hover:text-blue-100 transition-colors duration-300"
                  style={{ textDecoration: 'underline', textDecorationColor: 'rgba(147, 197, 253, 0.5)' }}
                >
                  Tailwind CSS Test Page
                </a>
                <div className="mt-2">
                  <a 
                    href="/tailwind-comprehensive-test" 
                    className="text-xs text-blue-300 hover:text-blue-100 transition-colors duration-300"
                    style={{ textDecoration: 'underline', textDecorationColor: 'rgba(147, 197, 253, 0.5)' }}
                  >
                    Comprehensive Tailwind Test
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium Footer */}
      <div 
        className="absolute bottom-6 left-0 right-0 text-center z-10"
        style={{
          color: 'rgba(255, 255, 255, 0.45)',
          fontSize: '12px'
        }}
      >
        © 2025 DEORA Plaza. All rights reserved.
      </div>
      
      {/* Simple Background Customizer */}
      <SimpleBackgroundCustomizer />
    </div>
  );
}