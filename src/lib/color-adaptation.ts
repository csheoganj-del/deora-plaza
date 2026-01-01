"use client";

export interface AdaptiveColors {
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  logoColor: string;
  cardBackground: string;
  cardBorder: string;
  buttonBackground: string;
  buttonText: string;
  inputBackground: string;
  inputBorder: string;
  shadowColor: string;
}

export interface BackgroundAnalysis {
  dominantColor: string;
  brightness: number;
  saturation: number;
  hue: number;
  isLight: boolean;
  isDark: boolean;
  isWarm: boolean;
  isCool: boolean;
}

/**
 * Extract dominant colors from an image URL
 */
export async function extractDominantColors(imageUrl: string): Promise<{
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      // Server-side fallback
      resolve({
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#a855f7',
        text: '#f8f8f8',
        textSecondary: 'rgba(255, 255, 255, 0.8)'
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Create canvas to analyze image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Resize image for faster processing
        const maxSize = 100;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Analyze colors
        const colorCounts: { [key: string]: number } = {};
        let totalBrightness = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue; // Skip transparent pixels

          // Calculate brightness
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          totalBrightness += brightness;
          pixelCount++;

          // Group similar colors
          const colorKey = `${Math.floor(r / 32) * 32},${Math.floor(g / 32) * 32},${Math.floor(b / 32) * 32}`;
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        }

        // Find dominant colors
        const sortedColors = Object.entries(colorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        const avgBrightness = totalBrightness / pixelCount;
        const isDark = avgBrightness < 128;

        // Generate color palette
        const dominantColor = sortedColors[0] ? sortedColors[0][0] : '102,102,255';
        const [r, g, b] = dominantColor.split(',').map(Number);

        const primary = `rgb(${r}, ${g}, ${b})`;
        const secondary = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
        const accent = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
        
        // Text colors based on background brightness
        const text = isDark ? '#f8f8f8' : '#1a1a1a';
        const textSecondary = isDark ? 'rgba(248, 248, 248, 0.8)' : 'rgba(26, 26, 26, 0.8)';

        resolve({
          primary,
          secondary,
          accent,
          text,
          textSecondary
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}
export function generateAdaptiveColors(backgroundId: string, customImage?: string): AdaptiveColors | Promise<AdaptiveColors> {
  // Predefined color schemes for each background
  const colorSchemes: Record<string, AdaptiveColors> = {
    default: {
      textPrimary: '#f8f8f8',
      textSecondary: 'rgba(248, 248, 248, 0.8)',
      textAccent: '#a855f7',
      logoColor: '#6366f1',
      cardBackground: 'rgba(248, 248, 248, 0.12)',
      cardBorder: 'rgba(248, 248, 248, 0.2)',
      buttonBackground: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      buttonText: '#f8f8f8',
      inputBackground: 'rgba(248, 248, 248, 0.08)',
      inputBorder: 'rgba(248, 248, 248, 0.2)',
      shadowColor: 'rgba(26, 26, 26, 0.3)'
    },
    ocean: {
      textPrimary: '#f8f8f8',
      textSecondary: 'rgba(248, 248, 248, 0.85)',
      textAccent: '#06b6d4',
      logoColor: '#0ea5e9',
      cardBackground: 'rgba(248, 248, 248, 0.15)',
      cardBorder: 'rgba(6, 182, 212, 0.3)',
      buttonBackground: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      buttonText: '#f8f8f8',
      inputBackground: 'rgba(248, 248, 248, 0.1)',
      inputBorder: 'rgba(6, 182, 212, 0.4)',
      shadowColor: 'rgba(6, 182, 212, 0.2)'
    },
    sunset: {
      textPrimary: '#1f2937',
      textSecondary: 'rgba(31, 41, 55, 0.8)',
      textAccent: '#ec4899',
      logoColor: '#f97316',
      cardBackground: 'rgba(255, 255, 255, 0.25)',
      cardBorder: 'rgba(236, 72, 153, 0.3)',
      buttonBackground: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
      buttonText: '#f8f8f8',
      inputBackground: 'rgba(255, 255, 255, 0.2)',
      inputBorder: 'rgba(236, 72, 153, 0.4)',
      shadowColor: 'rgba(236, 72, 153, 0.2)'
    },
    forest: {
      textPrimary: '#f8f8f8',
      textSecondary: 'rgba(248, 248, 248, 0.85)',
      textAccent: '#10b981',
      logoColor: '#059669',
      cardBackground: 'rgba(248, 248, 248, 0.15)',
      cardBorder: 'rgba(16, 185, 129, 0.3)',
      buttonBackground: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      buttonText: '#f8f8f8',
      inputBackground: 'rgba(248, 248, 248, 0.1)',
      inputBorder: 'rgba(16, 185, 129, 0.4)',
      shadowColor: 'rgba(16, 185, 129, 0.2)'
    },
    aurora: {
      textPrimary: '#f8f8f8',
      textSecondary: 'rgba(248, 248, 248, 0.85)',
      textAccent: '#a855f7',
      logoColor: '#8b5cf6',
      cardBackground: 'rgba(248, 248, 248, 0.15)',
      cardBorder: 'rgba(168, 85, 247, 0.3)',
      buttonBackground: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
      buttonText: '#f8f8f8',
      inputBackground: 'rgba(248, 248, 248, 0.1)',
      inputBorder: 'rgba(168, 85, 247, 0.4)',
      shadowColor: 'rgba(168, 85, 247, 0.2)'
    },
    midnight: {
      textPrimary: '#f8f8f8',
      textSecondary: 'rgba(248, 248, 248, 0.8)',
      textAccent: '#3b82f6',
      logoColor: '#2563eb',
      cardBackground: 'rgba(248, 248, 248, 0.1)',
      cardBorder: 'rgba(59, 130, 246, 0.3)',
      buttonBackground: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      buttonText: '#f8f8f8',
      inputBackground: 'rgba(248, 248, 248, 0.08)',
      inputBorder: 'rgba(59, 130, 246, 0.4)',
      shadowColor: 'rgba(59, 130, 246, 0.2)'
    },
    cherry: {
      textPrimary: '#1f2937',
      textSecondary: 'rgba(31, 41, 55, 0.8)',
      textAccent: '#ec4899',
      logoColor: '#be185d',
      cardBackground: 'rgba(248, 248, 248, 0.3)',
      cardBorder: 'rgba(236, 72, 153, 0.3)',
      buttonBackground: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
      buttonText: '#f8f8f8',
      inputBackground: 'rgba(248, 248, 248, 0.25)',
      inputBorder: 'rgba(236, 72, 153, 0.4)',
      shadowColor: 'rgba(236, 72, 153, 0.15)'
    }
  };

  // For custom images, analyze and generate adaptive colors
  if (backgroundId === 'custom' && customImage) {
    return analyzeCustomImageColors(customImage);
  }

  return colorSchemes[backgroundId] || colorSchemes.default;
}

/**
 * Analyze custom image and generate adaptive colors
 */
async function analyzeCustomImageColors(imageUrl: string): Promise<AdaptiveColors> {
  return new Promise((resolve) => {
    // Try advanced analysis first
    tryAdvancedAnalysis(imageUrl)
      .then(resolve)
      .catch(() => {
        // Fallback to basic analysis
        console.warn('Advanced analysis failed, using basic color detection');
        tryBasicAnalysis(imageUrl)
          .then(resolve)
          .catch(() => {
            // Final fallback
            console.warn('All analysis methods failed, using default colors');
            resolve(getDefaultCustomColors());
          });
      });
  });
}

/**
 * Try advanced canvas-based analysis
 */
function tryAdvancedAnalysis(imageUrl: string): Promise<AdaptiveColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Analysis timeout'));
    }, 3000); // 3 second timeout
    
    // Only set crossOrigin for external URLs, not for blob URLs
    if (!imageUrl.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set canvas size (smaller for performance)
        canvas.width = 100;
        canvas.height = 100;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, 100, 100);
        
        // Get image data - wrap in try-catch for CORS issues
        let imageData;
        try {
          imageData = ctx.getImageData(0, 0, 100, 100);
        } catch (securityError) {
          reject(securityError);
          return;
        }
        
        const data = imageData.data;
        
        // Analyze colors
        const analysis = analyzeImageData(data);
        
        // Generate adaptive colors based on analysis
        const adaptiveColors = generateColorsFromAnalysis(analysis);
        resolve(adaptiveColors);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Image load failed'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Try basic analysis without canvas (for CORS-restricted images)
 */
function tryBasicAnalysis(imageUrl: string): Promise<AdaptiveColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    const timeout = setTimeout(() => {
      reject(new Error('Basic analysis timeout'));
    }, 2000);
    
    img.onload = () => {
      clearTimeout(timeout);
      
      // Basic heuristics based on image properties
      const isLikelyLight = img.naturalWidth > 0 && img.naturalHeight > 0;
      
      // Generate colors based on basic assumptions
      if (isLikelyLight) {
        // Assume it's a typical photo - use balanced colors
        resolve({
          textPrimary: '#f8f8f8',
          textSecondary: 'rgba(248, 248, 248, 0.85)',
          textAccent: '#8b5cf6',
          logoColor: '#a855f7',
          cardBackground: 'rgba(26, 26, 26, 0.35)',
          cardBorder: 'rgba(248, 248, 248, 0.2)',
          buttonBackground: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(168, 85, 247, 0.9) 100%)',
          buttonText: '#f8f8f8',
          inputBackground: 'rgba(26, 26, 26, 0.25)',
          inputBorder: 'rgba(248, 248, 248, 0.3)',
          shadowColor: 'rgba(26, 26, 26, 0.4)'
        });
      } else {
        reject(new Error('Basic analysis failed'));
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Basic analysis image load failed'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Analyze image data to extract color information
 */
function analyzeImageData(data: Uint8ClampedArray): BackgroundAnalysis {
  let totalR = 0, totalG = 0, totalB = 0;
  let pixelCount = 0;
  let lightPixels = 0;
  let darkPixels = 0;
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    totalR += r;
    totalG += g;
    totalB += b;
    pixelCount++;
    
    // Calculate brightness
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    if (brightness > 128) {
      lightPixels++;
    } else {
      darkPixels++;
    }
  }
  
  // Calculate average color
  const avgR = Math.round(totalR / pixelCount);
  const avgG = Math.round(totalG / pixelCount);
  const avgB = Math.round(totalB / pixelCount);
  
  // Calculate overall brightness
  const brightness = (avgR * 0.299 + avgG * 0.587 + avgB * 0.114) / 255;
  
  // Calculate saturation
  const max = Math.max(avgR, avgG, avgB) / 255;
  const min = Math.min(avgR, avgG, avgB) / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  
  // Calculate hue
  const hue = calculateHue(avgR, avgG, avgB);
  
  // Determine if image is predominantly light or dark
  const isLight = lightPixels > darkPixels;
  const isDark = !isLight;
  
  // Determine color temperature
  const isWarm = avgR > avgB;
  const isCool = !isWarm;
  
  return {
    dominantColor: `rgb(${avgR}, ${avgG}, ${avgB})`,
    brightness,
    saturation,
    hue,
    isLight,
    isDark,
    isWarm,
    isCool
  };
}

/**
 * Calculate hue from RGB values
 */
function calculateHue(r: number, g: number, b: number): number {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  if (diff === 0) return 0;
  
  let hue = 0;
  if (max === r) {
    hue = ((g - b) / diff) % 6;
  } else if (max === g) {
    hue = (b - r) / diff + 2;
  } else {
    hue = (r - g) / diff + 4;
  }
  
  return Math.round(hue * 60);
}

/**
 * Generate adaptive colors based on image analysis
 */
function generateColorsFromAnalysis(analysis: BackgroundAnalysis): AdaptiveColors {
  const { brightness, saturation, hue, isLight, isDark, isWarm, isCool } = analysis;
  
  // Base colors based on image characteristics
  let textPrimary: string;
  let textSecondary: string;
  let cardBackground: string;
  let cardBorder: string;
  let inputBackground: string;
  let inputBorder: string;
  let shadowColor: string;
  
  if (isLight) {
    // Light background - use dark text
    textPrimary = brightness > 0.8 ? '#111827' : '#1f2937';
    textSecondary = brightness > 0.8 ? 'rgba(17, 24, 39, 0.8)' : 'rgba(31, 41, 55, 0.8)';
    cardBackground = 'rgba(255, 255, 255, 0.25)';
    cardBorder = 'rgba(0, 0, 0, 0.15)';
    inputBackground = 'rgba(255, 255, 255, 0.2)';
    inputBorder = 'rgba(0, 0, 0, 0.2)';
    shadowColor = 'rgba(0, 0, 0, 0.15)';
  } else {
    // Dark background - use light text
    textPrimary = brightness < 0.2 ? '#f8f8f8' : '#f9fafb';
    textSecondary = brightness < 0.2 ? 'rgba(248, 248, 248, 0.85)' : 'rgba(249, 250, 251, 0.8)';
    cardBackground = 'rgba(26, 26, 26, 0.4)';
    cardBorder = 'rgba(248, 248, 248, 0.2)';
    inputBackground = 'rgba(26, 26, 26, 0.3)';
    inputBorder = 'rgba(248, 248, 248, 0.3)';
    shadowColor = 'rgba(26, 26, 26, 0.5)';
  }
  
  // Generate accent and logo colors based on hue and saturation
  let textAccent: string;
  let logoColor: string;
  let buttonBackground: string;
  
  if (saturation > 0.3) {
    // Colorful image - use complementary colors
    const complementaryHue = (hue + 180) % 360;
    
    if (isWarm) {
      textAccent = `hsl(${complementaryHue}, 70%, 60%)`;
      logoColor = `hsl(${complementaryHue}, 80%, 55%)`;
    } else {
      textAccent = `hsl(${complementaryHue}, 65%, 65%)`;
      logoColor = `hsl(${complementaryHue}, 75%, 60%)`;
    }
    
    buttonBackground = `linear-gradient(135deg, hsl(${complementaryHue}, 75%, 55%) 0%, hsl(${complementaryHue}, 70%, 60%) 100%)`;
  } else {
    // Low saturation image - use neutral accent colors
    if (isLight) {
      textAccent = '#6366f1';
      logoColor = '#4f46e5';
      buttonBackground = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
    } else {
      textAccent = '#8b5cf6';
      logoColor = '#a855f7';
      buttonBackground = 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)';
    }
  }
  
  return {
    textPrimary,
    textSecondary,
    textAccent,
    logoColor,
    cardBackground,
    cardBorder,
    buttonBackground,
    buttonText: isLight ? '#f8f8f8' : '#f8f8f8',
    inputBackground,
    inputBorder,
    shadowColor
  };
}

/**
 * Get default colors for custom images when analysis fails
 */
function getDefaultCustomColors(): AdaptiveColors {
  return {
    textPrimary: '#f8f8f8',
    textSecondary: 'rgba(248, 248, 248, 0.85)',
    textAccent: '#6366f1',
    logoColor: '#8b5cf6',
    cardBackground: 'rgba(26, 26, 26, 0.4)',
    cardBorder: 'rgba(248, 248, 248, 0.2)',
    buttonBackground: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.9) 100%)',
    buttonText: '#f8f8f8',
    inputBackground: 'rgba(26, 26, 26, 0.3)',
    inputBorder: 'rgba(248, 248, 248, 0.3)',
    shadowColor: 'rgba(26, 26, 26, 0.5)'
  };
}

/**
 * Apply adaptive colors to the page
 */
export function applyAdaptiveColors(colors: AdaptiveColors) {
  const root = document.documentElement;
  
  // Set CSS custom properties for adaptive colors
  root.style.setProperty('--adaptive-text-primary', colors.textPrimary);
  root.style.setProperty('--adaptive-text-secondary', colors.textSecondary);
  root.style.setProperty('--adaptive-text-accent', colors.textAccent);
  root.style.setProperty('--adaptive-logo-color', colors.logoColor);
  root.style.setProperty('--adaptive-card-bg', colors.cardBackground);
  root.style.setProperty('--adaptive-card-border', colors.cardBorder);
  root.style.setProperty('--adaptive-button-bg', colors.buttonBackground);
  root.style.setProperty('--adaptive-button-text', colors.buttonText);
  root.style.setProperty('--adaptive-input-bg', colors.inputBackground);
  root.style.setProperty('--adaptive-input-border', colors.inputBorder);
  root.style.setProperty('--adaptive-shadow', colors.shadowColor);
}

/**
 * Get contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast calculation
  // In a full implementation, you'd use proper color space calculations
  return 4.5; // Placeholder
}

/**
 * Determine if a color is light or dark
 */
function isLightColor(color: string): boolean {
  // Simplified brightness calculation
  // In a full implementation, you'd convert to RGB and calculate luminance
  return color.includes('255') || color.includes('white');
}