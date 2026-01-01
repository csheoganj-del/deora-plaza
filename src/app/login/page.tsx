"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginWithCustomUser } from "@/actions/custom-auth";
import SparkTextReveal from "@/components/ui/SparkTextReveal";

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
        const redirectPath = getRedirectPath(result.user.role, result.user.businessUnit || "");
        router.push(redirectPath);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: `
        radial-gradient(circle at center, rgba(255, 255, 255, 0.06) 0%, rgba(0, 0, 0, 0.9) 60%),
        linear-gradient(180deg, #121212 0%, #1A1A1A 100%)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    }}>

      {/* MAIN CONTENT */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        maxWidth: '480px',
        width: '100%',
        padding: '40px 32px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 900ms cubic-bezier(0.22, 1, 0.36, 1)'
      }}>

        {/* BRAND HEADER - Match Entry Screen */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          marginBottom: '8px'
        }}>
          <div style={{
            fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.14em',
            color: '#F5F5F7',
            fontSize: 'clamp(28px, 6vw, 40px)',
            lineHeight: 1.1,
            margin: 0,
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 18px rgba(242, 185, 75, 0.12)',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px 0' /* Add breathing room for glow */
          }}>
            <SparkTextReveal
              text="DEORA PLAZA"
              sparkSpeed={130}
              pauseDuration={16000}
              autoStart={isVisible}
            />
          </div>
          <div style={{
            fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            letterSpacing: '0.08em',
            color: '#F5F5F7', /* Higher contrast */
            margin: 0
          }}>
            Staff Access
          </div>
        </div>

        {/* FLOATING GLASS PANEL */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: 'clamp(32px, 6vw, 40px)',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.55)',
          transform: 'translateZ(0)'
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
                  height: '56px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '0 20px',
                  fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  color: '#F5F5F7',
                  letterSpacing: '0.01em',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 0 rgba(255, 255, 255, 0.05)',
                  transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.borderColor = '#F2B94B';
                  e.target.style.boxShadow = '0 0 0 2px rgba(242, 185, 75, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 0 rgba(255, 255, 255, 0.05)';
                  e.target.style.transform = 'translateY(0)';
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
                    height: '56px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '16px',
                    padding: '0 52px 0 20px',
                    fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    color: '#F5F5F7',
                    letterSpacing: '0.01em',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 0 rgba(255, 255, 255, 0.05)',
                    transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.borderColor = '#F2B94B';
                    e.target.style.boxShadow = '0 0 0 2px rgba(242, 185, 75, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 0 rgba(255, 255, 255, 0.05)';
                    e.target.style.transform = 'translateY(0)';
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
              style={{
                width: '100%',
                height: '54px',
                borderRadius: '27px',
                border: 'none',
                background: 'linear-gradient(180deg, #F2B94B 0%, #D9A441 100%)',
                color: '#121212',
                fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                letterSpacing: '0.01em',
                boxShadow: '0 14px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                cursor: 'pointer',
                transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                transform: 'translateZ(0)',
                opacity: (loading || !formData.username || !formData.password) ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading && formData.username && formData.password) {
                  e.currentTarget.style.transform = 'scale(1.02) translateZ(0)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.55), 0 0 25px rgba(242, 185, 75, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
                  e.currentTarget.style.background = 'linear-gradient(180deg, #F4BC52 0%, #DBA748 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && formData.username && formData.password) {
                  e.currentTarget.style.transform = 'translateZ(0)';
                  e.currentTarget.style.boxShadow = '0 14px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.background = 'linear-gradient(180deg, #F2B94B 0%, #D9A441 100%)';
                }
              }}
              onMouseDown={(e) => {
                if (!loading && formData.username && formData.password) {
                  e.currentTarget.style.transform = 'scale(0.98) translateZ(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseUp={(e) => {
                if (!loading && formData.username && formData.password) {
                  e.currentTarget.style.transform = 'scale(1.02) translateZ(0)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.55), 0 0 25px rgba(242, 185, 75, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
                }
              }}
            >
              {loading ? 'Connecting...' : 'Enter System'}
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
        <div style={{
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{
            fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
            fontWeight: 300,
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.02em',
            margin: 0
          }}>
            © 2025 DEORA Plaza • Secure Staff Access Portal
          </p>
        </div>

      </div>

      {/* Add keyframes for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}