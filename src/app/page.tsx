"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SparkTextReveal from "@/components/ui/SparkTextReveal";

// DEORA Plaza - Dark Luxury Entry Screen with Spark Text Reveal
export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  // Trigger entrance animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSystemEntry = async () => {
    setIsLoading(true);
    // Smooth luxury transition
    await new Promise(resolve => setTimeout(resolve, 600));
    router.push('/login');
  };

  return (
    <div className="deora-luxury-viewport">
      {/* DARK LUXURY BACKGROUND */}
      <div className="deora-luxury-background"></div>

      {/* MAIN CONTENT */}
      <div className="deora-luxury-content">

        {/* BRAND NAME - Main Focus with Spark Animation */}
        <div className={`deora-brand-container ${isVisible ? 'visible' : ''}`}>
          <div className="deora-brand-name">
            <SparkTextReveal
              text="DEORA PLAZA"
              sparkSpeed={130}
              pauseDuration={5000}
              autoStart={isVisible}
            />
          </div>
          <p className="deora-brand-subtitle">
            Hospitality Management System
          </p>
        </div>

        {/* CALL-TO-ACTION BUTTON */}
        <div className={`deora-cta-container ${isVisible ? 'visible' : ''}`}>
          <button
            onClick={handleSystemEntry}
            disabled={isLoading}
            className="deora-luxury-button"
          >
            {isLoading ? 'Connecting...' : 'Enter System'}
          </button>
        </div>

        {/* INSTAGRAM LINK - Animated */}
        <div className={`deora-instagram-container ${isVisible ? 'visible' : ''}`}>
          <a
            href="https://instagram.com/pixncraftstudio"
            target="_blank"
            rel="noopener noreferrer"
            className="deora-instagram-link"
          >
            <svg className="instagram-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="url(#instagram-gradient)" />
              <defs>
                <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F2B94B" />
                  <stop offset="50%" stopColor="#F2B94B" />
                  <stop offset="100%" stopColor="#D9A441" />
                </linearGradient>
              </defs>
            </svg>
            <span>Created by @pixncraftstudio</span>
          </a>
        </div>

      </div>
    </div>
  );
}