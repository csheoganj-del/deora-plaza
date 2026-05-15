"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Instagram } from "lucide-react";

// Cinematic Typewriter Subtitle Component
const TypewriterSubtitle = ({ phrases }: { phrases: string[] }) => {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const typingSpeed = isDeleting ? 40 : 80;
    const currentPhrase = phrases[phraseIndex];

    if (!isDeleting && text === currentPhrase) {
      setTimeout(() => setIsDeleting(true), 2500); // Pause at end of phrase
      return;
    }

    if (isDeleting && text === "") {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
      return;
    }

    const timer = setTimeout(() => {
      setText((prev) =>
        isDeleting
          ? prev.substring(0, prev.length - 1)
          : currentPhrase.substring(0, prev.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, phraseIndex, phrases]);

  return (
    <p className="cinematic-subtitle">
      {text}
      <span className="typewriter-cursor">|</span>
    </p>
  );
};

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const subtitlePhrases = [
    "Crafted for Modern Dining",
    "Smart Restaurant Management",
    "Where Flavor Meets Experience",
    "Elegant Dining. Smart Management."
  ];

  useEffect(() => {
    // Small delay to ensure smooth entry animations
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSystemEntry = async () => {
    setIsLoading(true);
    // Smooth cinematic transition out
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push("/login");
  };

  return (
    <main className="cinematic-viewport">
      {/* CINEMATIC BACKGROUND */}
      <div className="cinematic-bg"></div>
      
      {/* DARK OVERLAY */}
      <div className="cinematic-overlay"></div>

      {/* FLOATING PARTICLES */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`particle particle-${i}`}></div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className={`cinematic-content ${isMounted ? "visible" : ""}`}>
        {/* LOGO AREA WITH STEAM EFFECT */}
        <div className="logo-container">
          <div className="steam-effect steam-1"></div>
          <div className="steam-effect steam-2"></div>
          
          <h1 className="cinematic-title">BLOOM CAFÉ</h1>
        </div>

        {/* TYPEWRITER SUBTITLE */}
        <TypewriterSubtitle phrases={subtitlePhrases} />

        {/* GLOWING ACTION BUTTON */}
        <div className={`cta-wrapper ${isLoading ? "loading" : ""}`}>
          <button
            onClick={handleSystemEntry}
            disabled={isLoading}
            className="cinematic-btn"
          >
            {isLoading ? "Connecting..." : "Enter System"}
          </button>
        </div>
      </div>

      {/* FLOATING INSTAGRAM LINK */}
      <div className={`cinematic-insta-float ${isMounted ? 'visible' : ''}`}>
        <a 
          href="https://www.instagram.com/pixncraftstudio/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="insta-link"
        >
          <Instagram size={20} className="insta-icon" />
          <span>pixncraftstudio</span>
        </a>
      </div>
    </main>
  );
}