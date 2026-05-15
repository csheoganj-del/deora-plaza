/**
 * 🎨 Dashboard Background Customizer
 * Background customizer specifically for dashboard pages
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, 
  Upload, 
  X, 
  Heart, 
  Star,
  Clock,
  Image as ImageIcon,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackgroundPreferences } from "@/hooks/useBackgroundPreferences";
import { getPredefinedBackgrounds } from "@/lib/background-preferences";

export function DashboardBackgroundCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'favorites' | 'recent'>('presets');
  const [shouldShow, setShouldShow] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    preferences, 
    setBackground, 
    addFavorite, 
    removeFavorite, 
    isFavorite,
    current 
  } = useBackgroundPreferences();

  const predefinedBackgrounds = getPredefinedBackgrounds();

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show on dashboard pages
  useEffect(() => {
    if (!isClient) return;
    
    const pathname = window.location.pathname;
    const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard');
    
    console.log('🔍 Dashboard Background Customizer Check:', {
      pathname,
      isDashboard,
      isClient
    });
    
    setShouldShow(isDashboard);
  }, [isClient]);

  // Listen for route changes
  useEffect(() => {
    if (!isClient) return;
    
    const handleRouteChange = () => {
      const isDashboardRoute = window.location.pathname.startsWith('/dashboard');
      console.log('🔄 Route changed:', {
        pathname: window.location.pathname,
        isDashboardRoute
      });
      setShouldShow(isDashboardRoute);
      
      // Close customizer if we navigate away from dashboard
      if (!isDashboardRoute && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [isClient, isOpen]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
        const customBackground = {
          id: `custom-${Date.now()}`,
          name: file.name.split('.')[0],
          type: 'image' as const,
          value: imageUrl
        };

        await setBackground(customBackground);
        setIsOpen(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  }, [setBackground, setIsOpen]);

  const handlePresetSelect = useCallback(async (preset: any) => {
    await setBackground(preset);
    setIsOpen(false);
  }, [setBackground, setIsOpen]);

  const handleFavoriteToggle = useCallback((background: any) => {
    if (isFavorite(background.id)) {
      removeFavorite(background.id);
    } else {
      addFavorite(background);
    }
  }, [isFavorite, removeFavorite, addFavorite]);

  // Don't render anything during SSR or before client hydration
  if (!isClient) {
    return null;
  }

  // Don't render if not on dashboard route
  if (!shouldShow) {
    return null;
  }

  const tabs = [
    { id: 'presets', label: 'Presets', icon: Palette },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock }
  ];

  return (
    <>
      {/* Floating Customizer Button - Dashboard Style */}
      <motion.div
        className="fixed bottom-6 right-6 z-[99999]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ pointerEvents: 'auto' }}
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          data-testid="dashboard-bg-customizer-btn"
          className="liquid-glass-effect backdrop-blur-xl bg-white/8 border border-white/15 rounded-2xl p-4 shadow-xl hover:bg-white/12 transition-all duration-300 group"
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            zIndex: 99999,
            willChange: 'opacity, transform',
            pointerEvents: 'auto'
          }}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-white text-sm font-medium hidden sm:block">Customize</span>
          </div>
        </motion.button>
      </motion.div>

      {/* Customizer Modal - Same as login but with dashboard styling */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-4xl max-h-[80vh] liquid-glass-effect backdrop-blur-2xl bg-white/8 border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold text-white ios-text-depth">
                    Dashboard Background
                  </h2>
                  <p className="text-white/80 mt-1">
                    Customize your dashboard workspace
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                        activeTab === tab.id
                          ? 'text-white'
                          : 'text-white/70 hover:text-white'
                      }`}
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 0 }}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"
                          layoutId="dashboardActiveTab"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Content - Same structure as login customizer */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {/* Presets Tab */}
                {activeTab === 'presets' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {predefinedBackgrounds.map((preset) => (
                      <motion.div
                        key={preset.id}
                        className="relative group cursor-pointer"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePresetSelect(preset)}
                      >
                        <div
                          className="aspect-video rounded-xl overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"
                          style={{
                            background: preset.value,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          {/* Current indicator */}
                          {current?.id === preset.id && (
                            <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg" />
                          )}
                          
                          {/* Favorite button */}
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavoriteToggle(preset);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Heart 
                              className={`w-4 h-4 ${
                                isFavorite(preset.id) 
                                  ? 'text-red-400 fill-red-400' 
                                  : 'text-white'
                              }`} 
                            />
                          </motion.button>
                        </div>
                        <p className="text-sm text-white font-medium mt-2 text-center">
                          {preset.name}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                  <div className="text-center">
                    <motion.div
                      className="border-2 border-dashed border-white/30 rounded-2xl p-12 hover:border-white/50 transition-colors cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-16 h-16 text-white/70 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Upload Custom Background
                      </h3>
                      <p className="text-white/80 mb-4">
                        Choose an image from your device to use as background
                      </p>
                      <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20">
                        <Upload className="w-4 h-4 mr-2" />
                        Select Image
                      </Button>
                    </motion.div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    <p className="text-xs text-white/60 mt-4">
                      Supported formats: JPG, PNG, WebP • Max size: 10MB
                    </p>
                  </div>
                )}

                {/* Favorites and Recent tabs - same structure as login */}
                {activeTab === 'favorites' && (
                  <div>
                    {preferences.favorites.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {preferences.favorites.map((favorite) => (
                          <motion.div
                            key={favorite.id}
                            className="relative group cursor-pointer"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePresetSelect(favorite)}
                          >
                            <div
                              className="aspect-video rounded-xl overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"
                              style={{
                                background: favorite.type === 'image' ? `url(${favorite.value})` : favorite.value,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              {current?.id === favorite.id && (
                                <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg" />
                              )}
                              
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFavorite(favorite.id);
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                              </motion.button>
                            </div>
                            <p className="text-sm text-white font-medium mt-2 text-center">
                              {favorite.name}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="w-16 h-16 text-white/50 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No Favorites Yet
                        </h3>
                        <p className="text-white/70">
                          Add backgrounds to favorites by clicking the heart icon
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'recent' && (
                  <div>
                    {preferences.recent.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {preferences.recent.map((recent) => (
                          <motion.div
                            key={recent.id}
                            className="relative group cursor-pointer"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePresetSelect(recent)}
                          >
                            <div
                              className="aspect-video rounded-xl overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"
                              style={{
                                background: recent.type === 'image' ? `url(${recent.value})` : recent.value,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              {current?.id === recent.id && (
                                <div className="absolute top-2 left-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg" />
                              )}
                              
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFavoriteToggle(recent);
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Heart 
                                  className={`w-4 h-4 ${
                                    isFavorite(recent.id) 
                                      ? 'text-red-400 fill-red-400' 
                                      : 'text-white'
                                  }`} 
                                />
                              </motion.button>
                            </div>
                            <p className="text-sm text-white font-medium mt-2 text-center">
                              {recent.name}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="w-16 h-16 text-white/50 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No Recent Backgrounds
                        </h3>
                        <p className="text-white/70">
                          Your recently used backgrounds will appear here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}