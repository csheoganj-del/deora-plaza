"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ArrowUp } from "lucide-react";
import { loginWithCustomUser } from "@/actions/custom-auth";
// BackgroundCustomizer temporarily disabled due to performance issues
// import { BackgroundCustomizer } from "@/components/ui/background-customizer";

// Simple iOS Clock Component (no external dependencies)
function SimpleClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="text-center mb-12">
      <div className="text-8xl md:text-9xl font-thin text-white mb-4 drop-shadow-2xl">
        {formatTime(time)}
      </div>
      <div className="text-xl md:text-2xl font-medium text-white/80 drop-shadow-lg">
        {formatDate(time)}
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
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 text-center shadow-2xl">
          <Loader2 className="w-8 h-8 text-white mx-auto animate-spin mb-4" />
          <p className="text-white">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.2),transparent_50%)]" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {!showLoginForm ? (
          // Lock Screen
          <div className="text-center w-full max-w-md">
            {/* iOS Clock */}
            <SimpleClock />

            {/* DEORA Plaza Branding */}
            <div className="mb-16">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
                DEORA Plaza
              </h1>
              <p className="text-white/70 text-sm font-medium tracking-wide">
                Hospitality Management System
              </p>
            </div>

            {/* iOS Unlock Interface */}
            <div className="backdrop-blur-xl bg-white/8 border border-white/15 rounded-3xl p-8 mx-auto max-w-sm shadow-2xl">
              <div className="text-center">
                <ArrowUp className="w-6 h-6 text-white/80 mx-auto mb-3 animate-bounce" />
                <p className="text-white/80 text-sm font-medium mb-6">
                  Swipe up to unlock
                </p>
                
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-medium transition-all duration-300 backdrop-blur-sm hover:scale-105"
                >
                  Access System
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Login Form
          <div className="w-full max-w-md">
            <div className="backdrop-blur-xl bg-white/8 border border-white/15 rounded-3xl p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
                  DEORA Plaza
                </h1>
                <p className="text-white/70 text-sm">Restaurant Management System</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/90 font-medium text-sm">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="h-12 bg-white/8 border-white/20 text-white placeholder-white/40 rounded-xl backdrop-blur-sm focus:bg-white/12 focus:border-white/30 transition-all duration-300"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 font-medium text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-12 bg-white/8 border-white/20 text-white placeholder-white/40 rounded-xl backdrop-blur-sm focus:bg-white/12 focus:border-white/30 transition-all duration-300 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-400/30 text-red-200 p-4 rounded-xl text-sm text-center backdrop-blur-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !formData.username || !formData.password}
                  className="w-full h-12 relative overflow-hidden rounded-xl font-medium transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10 transition-all duration-300" />
                  <div className="absolute inset-0 border border-white/20 rounded-xl" />
                  
                  <div className="relative z-10 flex items-center justify-center text-white">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </div>
                </button>
              </form>

              {/* Back to Lock Screen */}
              <button
                onClick={() => setShowLoginForm(false)}
                className="w-full mt-6 py-2 text-white/60 hover:text-white/90 text-sm transition-colors duration-200"
              >
                ← Back to lock screen
              </button>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white/50 text-xs text-center">
                  &copy; {new Date().getFullYear()} DEORA Plaza. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Background Customizer - temporarily disabled */}
      {/* <BackgroundCustomizer /> */}
    </div>
  );
}