"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ArrowUp } from "lucide-react";
import { loginWithCustomUser } from "@/actions/custom-auth";
import { SimpleBackgroundCustomizer } from "@/components/ui/simple-background-customizer";
import { AppleMiniLoader } from "@/components/ui/apple-loader";

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
              fontSize: '120px', /* Apple-level larger size */
              fontWeight: '800', /* Bolder like iOS */
              letterSpacing: '-0.03em', /* Tighter Apple spacing */
              fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
              position: 'relative',
              zIndex: 2
            }}
          >
            --:--
          </div>
        </div>
        <div style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)' }}>
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
          padding: '32px 48px'
        }}
      >
        <div 
          className="apple-time-glow liquid-glass-text"
          style={{
            fontSize: '120px', /* Apple-level larger size */
            fontWeight: '800', /* Bolder like iOS */
            letterSpacing: '-0.03em', /* Tighter Apple spacing */
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

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Initialize premium background
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.background = 'radial-gradient(ellipse at center, #2E2A5E 0%, #1A1033 50%, #0F1C3F 100%)';
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, []);

  const getRedirectPath = (role: string, businessUnit: string): string => {
    if (role === "super_admin" || role === "owner") return "/dashboard";
    if (role === "manager") return "/dashboard";
    if (role === "cafe_manager") return "/dashboard/tables";
    if (role === "bar_manager") return "/dashboard/bar/tables";
    if (role === "hotel_manager") return "/dashboard/hotel";
    if (role === "garden_manager") return "/dashboard/garden";
    if (role === "waiter") return businessUnit === "bar" ? "/dashboard/bar/tables" : "/dashboard/tables";
    if (role === "kitchen") return "/dashboard/kitchen";
    if (role === "bartender") return "/dashboard/bar/tables";
    if (role === "reception" || role === "hotel_reception") return "/dashboard/hotel";
    return "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginWithCustomUser(formData.username, formData.password);

      if (!result.success) {
        setError(result.error || "Invalid username or password");
        setLoading(false);
        return;
      }

      if (result.user) {
        // Add Apple-style loading transition
        document.body.classList.add("route-loading");
        
        const redirectPath = getRedirectPath(result.user.role, result.user.businessUnit || "");
        // Add a small delay to ensure token is properly set and smooth transition
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 500);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{ 
        background: 'radial-gradient(ellipse at center, #2E2A5E 0%, #1A1033 50%, #0F1C3F 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Apple Mini Loader for Login Process */}
      <AppleMiniLoader isVisible={loading} />
      
      {/* Cinematic Background Effects */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
          filter: 'blur(1px)'
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {!showLoginForm ? (
          // Premium Lock Screen
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
                  onClick={() => setShowLoginForm(true)}
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
              </div>
            </div>
          </div>
        ) : (
          // Apple-Level Login Form
          <div className="w-full max-w-md">
            <div className="login-card">
              {/* Header */}
              <div className="text-center login-section" style={{ position: 'relative', zIndex: 2 }}>
                <h1 className="login-brand" style={{ fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif' }}>
                  DEORA Plaza
                </h1>
                <div className="login-divider"></div>
                <p className="login-subtitle">
                  Restaurant Management System
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 2 }}>
                {/* Username Field */}
                <div className="login-input-group">
                  <label htmlFor="username" className="login-label">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="login-input"
                  />
                </div>

                {/* Password Field */}
                <div className="login-input-group">
                  <label htmlFor="password" className="login-label">
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'block' }}>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="login-input"
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        transition: 'color 0.25s cubic-bezier(.22,1,.36,1)',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = 'rgba(255, 255, 255, 1)';
                        e.target.style.filter = 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4))';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                        e.target.style.filter = 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))';
                      }}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="login-error">
                    <p>{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !formData.username || !formData.password}
                  className="w-full login-btn disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ border: 'none', color: '#ffffff', fontSize: '16px' }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              {/* Back to Lock Screen */}
              <button
                onClick={() => setShowLoginForm(false)}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.25s cubic-bezier(.22,1,.36,1)',
                  textDecoration: 'none',
                  marginTop: '16px',
                  display: 'block',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                  e.target.style.color = 'rgba(255, 255, 255, 0.95)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.color = 'rgba(255, 255, 255, 0.85)';
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'translateY(0px) scale(0.98)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                }}
              >
                ← Back to lock screen
              </button>
            </div>
          </div>
        )}
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