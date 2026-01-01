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
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackgroundPreferences } from "@/hooks/useBackgroundPreferences";
import { getPredefinedBackgrounds, getBackgroundPreferences, applyAdaptiveColors } from "@/lib/background-preferences";
import { shouldUseDynamicBackgrounds } from "@/lib/route-aware-styling";

export function BackgroundCustomizer() {
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

  // Handle client-side hydration first
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Force show on login page - simplified approach
  useEffect(() => {
    if (!isClient) return;
    
    const pathname = window.location.pathname;
    const isLogin = pathname === '/login' || pathname.startsWith('/login');
    
    console.log('🔍 Background Customizer Check:', {
      pathname,
      isLogin,
      isClient
    });
    
    setShouldShow(isLogin);
  }, [isClient]);

  // Listen for route changes - CLIENT SIDE ONLY
  useEffect(() => {
    if (!isClient) return;
    
    const handleRouteChange = () => {
      const isLoginRoute = window.location.pathname.startsWith('/login');
      console.log('🔄 Route changed:', {
        pathname: window.location.pathname,
        isLoginRoute
      });
      setShouldShow(isLoginRoute);
      
      // Close customizer if we navigate away from login
      if (!isLoginRoute && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [isClient, isOpen]);

  // Ensure button is always visible - moved before conditional return - CLIENT SIDE ONLY
  useEffect(() => {
    if (!isClient || !shouldShow) return;
    
    const timer = setTimeout(() => {
      const button = document.querySelector('[data-testid="bg-customizer-btn"]');
      if (button) {
        console.log('✅ Background customizer button found and visible');
      } else {
        console.warn('⚠️ Background customizer button not found in DOM');
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isClient, shouldShow]);

  // Move all callbacks before conditional return
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
      console.log('📤 Uploading custom image:', file.name);
      
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

        console.log('🎨 Setting custom background with color extraction...');
        await setBackground(customBackground);
        
        // Force immediate color application after a short delay for color extraction
        setTimeout(() => {
          const preferences = getBackgroundPreferences();
          if (preferences.current?.dominantColors) {
            applyAdaptiveColors(preferences.current.dominantColors);
            document.body.classList.add('adaptive-colors-active');
            console.log('✅ Custom image colors applied successfully');
          }
        }, 500); // Longer delay for color extraction
        
        setIsOpen(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  }, [setBackground, setIsOpen]);

  const handlePresetSelect = useCallback(async (preset: any) => {
    console.log('🎯 Selecting preset:', preset.name);
    await setBackground(preset);
    
    // Force immediate color application
    setTimeout(() => {
      const preferences = getBackgroundPreferences();
      if (preferences.current?.dominantColors) {
        applyAdaptiveColors(preferences.current.dominantColors);
        document.body.classList.add('adaptive-colors-active');
        console.log('✅ Preset colors applied immediately');
      }
    }, 100);
    
    setIsOpen(false);
  }, [setBackground, setIsOpen]);

  const handleFavoriteToggle = useCallback((background: any) => {
    if (isFavorite(background.id)) {
      removeFavorite(background.id);
    } else {
      addFavorite(background);
    }
  }, [isFavorite, removeFavorite, addFavorite]);
  console.log('🎯 Current background:', current);
  console.log('🔍 Should show customizer:', shouldShow);
  console.log('💻 Is client:', isClient);
  console.log('📍 Current pathname:', isClient ? window.location.pathname : 'SSR');

  // Don't render anything during SSR or before client hydration
  if (!isClient) {
    return null;
  }

  // Don't render if not on login route
  if (!shouldShow) {
    console.log('❌ Not rendering - not on login route');
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
      {/* Floating Customizer Button */}
      <motion.div
        className="fixed bottom-4 right-4 z-[99999]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ pointerEvents: 'auto' }}
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          data-testid="bg-customizer-btn"
          className="liquid-glass-effect backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-3 shadow-lg hover:bg-white/20 transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            zIndex: 99999,
            willChange: 'opacity, transform',
            pointerEvents: 'auto'
          }}
        >
          <Palette className="w-6 h-6 text-white" />
        </motion.button>
      </motion.div>

      {/* Customizer Modal */}
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-4xl max-h-[80vh] liquid-glass-effect backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold adaptive-text-primary ios-text-depth">
                    Background Customizer
                  </h2>
                  <p className="adaptive-text-secondary mt-1">
                    Personalize your workspace with beautiful backgrounds
                  </p>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 adaptive-text-secondary hover:adaptive-text-primary transition-colors"
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
                          ? 'adaptive-text-primary'
                          : 'adaptive-text-secondary hover:adaptive-text-primary'
                      }`}
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 0 }}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"
                          layoutId="activeTab"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Content */}
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
                        <p className="text-sm adaptive-text-primary font-medium mt-2 text-center">
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
                      <ImageIcon className="w-16 h-16 adaptive-text-secondary mx-auto mb-4" />
                      <h3 className="text-xl font-semibold adaptive-text-primary mb-2">
                        Upload Custom Background
                      </h3>
                      <p className="adaptive-text-secondary mb-4">
                        Choose an image from your device to use as background
                      </p>
                      <Button className="adaptive-button">
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
                    
                    <p className="text-xs adaptive-text-secondary mt-4">
                      Supported formats: JPG, PNG, WebP • Max size: 10MB
                    </p>
                  </div>
                )}

                {/* Favorites Tab */}
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
                            <p className="text-sm adaptive-text-primary font-medium mt-2 text-center">
                              {favorite.name}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="w-16 h-16 adaptive-text-secondary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold adaptive-text-primary mb-2">
                          No Favorites Yet
                        </h3>
                        <p className="adaptive-text-secondary">
                          Add backgrounds to favorites by clicking the heart icon
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Tab */}
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
                            <p className="text-sm adaptive-text-primary font-medium mt-2 text-center">
                              {recent.name}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="w-16 h-16 adaptive-text-secondary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold adaptive-text-primary mb-2">
                          No Recent Backgrounds
                        </h3>
                        <p className="adaptive-text-secondary">
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