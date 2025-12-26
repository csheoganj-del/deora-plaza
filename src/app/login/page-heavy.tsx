"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Sparkles, ArrowUp, X } from "lucide-react";
import { loginWithCustomUser } from "@/actions/custom-auth";
import { BackgroundCustomizer } from "@/components/ui/background-customizer";
import { forceApplyAdaptiveColors } from "@/lib/force-adaptive-colors";

export default function LoginPage() {
  const router = useRouter();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
    
    // Force apply adaptive colors immediately
    forceApplyAdaptiveColors();
  }, []);

  // Update clock every second (only on client)
  useEffect(() => {
    if (!isClient) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isClient]);

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
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="liquid-glass-effect backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-12 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <Loader2 className="w-16 h-16 adaptive-text-primary mx-auto" />
          </motion.div>
          <motion.div
            className="adaptive-text-primary font-medium text-lg ios-text-depth"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Verifying credentials...
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      
      {/* Ambient Background Effects - NO BLUR */}
      <div className="absolute inset-0 particle-system opacity-10" />
      
      {/* Subtle Luxury Gradient Orbs - NO BLUR */}
      <motion.div 
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#6D5DFB]/15 to-[#C084FC]/10 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="w-full h-full flex items-center justify-center p-4 relative z-10">
        
        <AnimatePresence mode="wait">
          {!showLoginForm ? (
            <motion.div
              key="lock-screen"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl flex flex-col items-center justify-center text-center"
            >
              {/* Live Clock Display with Premium Depth Effects */}
              <motion.div 
                className="mb-16"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                {/* Time with premium depth and gradient effects - NO BLUR */}
                <motion.div 
                  key={isClient ? formatTime(currentTime) : 'loading'}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative mb-6"
                >
                  {/* Time Shadow/Depth Layer - NO BLUR */}
                  <div className="absolute inset-0 transform translate-x-2 translate-y-2">
                    <div className="text-8xl md:text-9xl font-thin opacity-20 adaptive-text-primary">
                      {isClient ? formatTime(currentTime) : '--:--'}
                    </div>
                  </div>
                  
                  {/* Main Time with Gradient and Glow */}
                  <div className="relative text-8xl md:text-9xl font-thin ios-text-depth adaptive-text-primary">
                    {isClient ? formatTime(currentTime) : '--:--'}
                  </div>

                  {/* Glass Reflection Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-3xl pointer-events-none" />
                </motion.div>
                
                {/* Date with premium depth and gradient effects - NO BLUR */}
                <motion.div 
                  key={isClient ? formatDate(currentTime) : 'loading-date'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  {/* Date Shadow/Depth Layer - NO BLUR */}
                  <div className="absolute inset-0 transform translate-x-1 translate-y-1">
                    <div className="text-xl md:text-2xl font-medium opacity-30 adaptive-text-secondary">
                      {isClient ? formatDate(currentTime) : 'Loading...'}
                    </div>
                  </div>
                  
                  {/* Main Date with Gradient and Glow */}
                  <div className="relative text-xl md:text-2xl font-medium ios-text-depth adaptive-text-secondary">
                    {isClient ? formatDate(currentTime) : 'Loading...'}
                  </div>
                </motion.div>

                {/* Ambient Glow Effect for Clock */}
                <motion.div
                  className="absolute inset-0 -z-10"
                  animate={{
                    boxShadow: [
                      '0 0 60px rgba(255, 255, 255, 0.1)',
                      '0 0 80px rgba(255, 255, 255, 0.15)',
                      '0 0 60px rgba(255, 255, 255, 0.1)',
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>

              {/* Logo Section with Enhanced Depth - NO BLUR */}
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <motion.div
                  className="relative mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  {/* DEORA Plaza Shadow/Depth Layer - NO BLUR */}
                  <div className="absolute inset-0 transform translate-x-1.5 translate-y-1.5">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight opacity-25 adaptive-text-primary">
                      DEORA Plaza
                    </h1>
                  </div>
                  
                  {/* Main DEORA Plaza with Premium Gradient */}
                  <h1 className="relative text-2xl md:text-3xl font-bold tracking-tight ios-text-depth adaptive-gradient-text">
                    DEORA Plaza
                  </h1>

                  {/* Glass Reflection Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent rounded-2xl pointer-events-none" />
                </motion.div>
                
                <motion.div
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  {/* Subtitle Shadow/Depth Layer - NO BLUR */}
                  <div className="absolute inset-0 transform translate-x-0.5 translate-y-0.5">
                    <p className="text-base font-medium opacity-20 adaptive-text-secondary">
                      Hospitality Management System
                    </p>
                  </div>
                  
                  {/* Main Subtitle with Gradient */}
                  <p className="relative text-base font-medium ios-text-depth adaptive-text-secondary">
                    Hospitality Management System
                  </p>
                </motion.div>
              </motion.div>

              {/* Enhanced Unlock Interface */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="adaptive-card liquid-glass-effect backdrop-blur-xl border rounded-3xl p-8 max-w-sm mx-auto">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-4"
                  >
                    <ArrowUp className="w-8 h-8 adaptive-text-primary mx-auto" />
                  </motion.div>
                  <p className="adaptive-text-secondary text-lg font-medium mb-6">
                    Swipe up to unlock
                  </p>
                  <motion.button
                    onClick={() => setShowLoginForm(true)}
                    className="adaptive-button liquid-glass-effect px-8 py-3 rounded-2xl font-semibold text-lg w-full shadow-lg"
                    whileHover={{ 
                      scale: 1.02, 
                      y: -2,
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Access System
                    </span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.p 
                className="text-sm adaptive-text-secondary mt-12 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                style={{ opacity: 0.6 }}
              >
                &copy; {new Date().getFullYear()} DEORA Plaza. All rights reserved.
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md"
            >
              <div className="adaptive-card liquid-glass-effect backdrop-blur-2xl border rounded-3xl p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold adaptive-text-primary ios-text-depth">
                    Sign In
                  </h2>
                  <motion.button
                    onClick={() => setShowLoginForm(false)}
                    className="adaptive-text-secondary hover:adaptive-text-primary p-2 rounded-lg hover:bg-white/10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="adaptive-text-primary font-semibold text-sm">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="adaptive-input liquid-glass-effect h-12 text-base"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="adaptive-text-primary font-semibold text-sm">
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
                        className="adaptive-input liquid-glass-effect h-12 pr-12 text-base"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 adaptive-text-secondary hover:adaptive-text-primary p-2 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </motion.button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="liquid-glass-effect p-4 border-red-400/30 text-sm text-red-300 rounded-xl font-semibold text-center"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading || !formData.username || !formData.password}
                    className="adaptive-button liquid-glass-effect w-full h-12 font-bold text-lg rounded-xl flex items-center justify-center gap-3"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="h-5 w-5" />
                    Unlock
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Customizer - Single instance */}
      <BackgroundCustomizer />
    </div>
  );
}