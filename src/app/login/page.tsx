"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Instagram } from "lucide-react";
import { loginWithCustomUser } from "@/actions/custom-auth";


export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Trigger entrance animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getRedirectPath = (role: string, businessUnit: string): string => {
    if (role === "super_admin" || role === "owner") return "/dashboard";
    if (role === "manager") return "/dashboard";
    if (role === "cafe_manager") return "/dashboard/tables";
    if (role === "bar_manager") return "/dashboard/bar/tables";
    if (role === "hotel_manager") return "/dashboard/hotel";
    if (role === "garden_manager") return "/dashboard/garden";
    if (role === "waiter") return businessUnit === "bar" ? "/dashboard/bar/tables" : "/dashboard/tables";
    if (role === "kitchen") return "/dashboard/orders";
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

      if (result.success && result.user) {
        if (result.token) {
          // Manually set cookie on client side to ensure it's saved before navigation
          document.cookie = `bloom-auth-token=${result.token}; path=/; max-age=86400; SameSite=Lax`;
        }
        
        const redirectPath = getRedirectPath(result.user.role, result.user.businessUnit || "");
        
        // Force hard navigation to bypass any Next.js client-side router bugs
        window.location.href = redirectPath;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
    <main className="cinematic-viewport" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* CINEMATIC BACKGROUND */}
      <div className="cinematic-login-bg"></div>
      
      {/* DARK OVERLAY */}
      <div className="cinematic-overlay"></div>

      {/* FLOATING PARTICLES */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`particle particle-${i}`}></div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        maxWidth: '480px',
        width: '100%',
        padding: '24px'
      }}>

        {/* BRAND HEADER - Match Entry Screen */}
        <div className={isVisible ? 'animate-stagger-1' : ''} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '4px',
          marginBottom: '24px',
          opacity: 0 /* Initial state for animation */
        }}>
          <div className="logo-container" style={{ marginBottom: '8px' }}>
            <div className="steam-effect steam-1"></div>
            <div className="steam-effect steam-2"></div>
            <h1 className="cinematic-title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>BLOOM CAFÉ</h1>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <h2 style={{
              fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
              fontWeight: 500,
              fontSize: '20px',
              color: '#F5F5F7',
              letterSpacing: '0.02em',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>Welcome Back</h2>
            <p style={{
              fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", sans-serif',
              fontWeight: 400,
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.04em',
              margin: 0
            }}>Manage Your Café Seamlessly</p>
          </div>
        </div>

        {/* FLOATING GLASS PANEL */}
        <div className={isVisible ? 'animate-stagger-2' : ''} style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          background: 'rgba(10, 8, 6, 0.4)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(217, 164, 65, 0.15)',
          borderRadius: '24px',
          padding: 'clamp(24px, 5vw, 32px)',
          boxShadow: '0 40px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(217, 164, 65, 0.05)',
          transform: 'translateZ(0)',
          opacity: 0 /* Initial state for animation */
        }}>

          {/* Loading Overlay */}
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderTop: '2px solid #F2B94B',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(20px, 4vw, 24px)'
          }}>

            {/* Username Field */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <label htmlFor="username" style={{
                fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(14px, 3vw, 15px)',
                color: 'rgba(255, 255, 255, 0.8)',
                letterSpacing: '0.01em',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                textAlign: 'left'
              }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  height: '50px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '0 20px',
                  fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  color: '#F5F5F7',
                  letterSpacing: '0.01em',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                  transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                  e.target.style.borderColor = 'rgba(217, 164, 65, 0.6)';
                  e.target.style.boxShadow = '0 0 15px rgba(217, 164, 65, 0.2), inset 0 0 0 1px rgba(217, 164, 65, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.4)';
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <label htmlFor="password" style={{
                fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(14px, 3vw, 15px)',
                color: 'rgba(255, 255, 255, 0.8)',
                letterSpacing: '0.01em',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                textAlign: 'left'
              }}>
                Password
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '50px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '0 52px 0 20px',
                    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    color: '#F5F5F7',
                    letterSpacing: '0.01em',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                    transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                    e.target.style.borderColor = 'rgba(217, 164, 65, 0.6)';
                    e.target.style.boxShadow = '0 0 15px rgba(217, 164, 65, 0.2), inset 0 0 0 1px rgba(217, 164, 65, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.4)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '36px',
                    minHeight: '36px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: 'rgba(255, 59, 48, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 59, 48, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '8px',
                boxShadow: '0 8px 16px rgba(255, 59, 48, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}>
                <p style={{
                  fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(14px, 3vw, 15px)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: 0,
                  textAlign: 'center',
                  letterSpacing: '0.01em',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* BRAND GOLD CTA BUTTON */}
            <button
              type="submit"
              disabled={loading || !formData.username || !formData.password}
              className={`cinematic-login-btn ${(loading || !formData.username || !formData.password) ? 'disabled' : ''}`}
            >
              {loading ? 'CONNECTING...' : 'ACCESS SYSTEM'}
            </button>
          </form>

          {/* Back to Home Button */}
          <button
            onClick={() => router.push('/')}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#A1A1A6',
              fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: '15px',
              letterSpacing: '0.01em',
              cursor: 'pointer',
              padding: '12px 0',
              marginTop: '16px',
              transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
              textAlign: 'center',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#A1A1A6';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ← Back to Home
          </button>
        </div>

        {/* Footer */}
        <div className={isVisible ? 'animate-stagger-3' : ''} style={{
          marginTop: '24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          opacity: 0 /* Initial state for animation */
        }}>
          <p style={{
            fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.02em',
            margin: 0
          }}>
            © {new Date().getFullYear()} Bloom Cafe & Restaurant • Secure Staff Access Portal
          </p>
        </div>
      </div>

      {/* Instagram Link - Placed outside relative container so it uses viewport coordinates */}
      <div className={`cinematic-insta-float ${isVisible ? 'visible' : ''}`}>
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

    {/* Add keyframes for spinner animation and autofill styles */}
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes cinematicFadeUp {
        0% { opacity: 0; transform: translateY(30px); filter: blur(8px); }
        100% { opacity: 1; transform: translateY(0); filter: blur(0); }
      }
      
      .animate-stagger-1 { animation: cinematicFadeUp 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; animation-delay: 0.2s; }
      .animate-stagger-2 { animation: cinematicFadeUp 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; animation-delay: 0.5s; }
      .animate-stagger-3 { animation: cinematicFadeUp 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; animation-delay: 0.8s; }

      /* Fix Chrome Autofill turning inputs white */
      input:-webkit-autofill,
      input:-webkit-autofill:hover, 
      input:-webkit-autofill:focus, 
      input:-webkit-autofill:active{
          -webkit-box-shadow: 0 0 0 30px rgba(10, 8, 6, 0.8) inset !important;
          -webkit-text-fill-color: #F5F5F7 !important;
          transition: background-color 5000s ease-in-out 0s;
      }
    `}</style>
  </>
  );
}