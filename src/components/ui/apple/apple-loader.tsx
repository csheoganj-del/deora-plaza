"use client";

import { useEffect, useState } from "react";

interface AppleMiniLoaderProps {
  isVisible: boolean;
}

export function AppleMiniLoader({ isVisible }: AppleMiniLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      <div 
        className="glass-soft"
        style={{
          padding: '32px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        {/* Apple-style spinner */}
        <div 
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            borderTop: '3px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <p 
          className="liquid-glass-text"
          style={{ 
            fontSize: '14px', 
            fontWeight: '500',
            margin: 0
          }}
        >
          Signing in...
        </p>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}