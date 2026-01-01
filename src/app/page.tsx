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
              pauseDuration={14000}
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

      </div>
    </div>
  );
}