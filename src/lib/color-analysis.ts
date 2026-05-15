// Apple iOS-style color analysis for smart glassmorphism adaptation
export interface ColorAnalysis {
  dominantColor: string
  averageColor: string
  brightness: number
  contrast: number
  isLight: boolean
  glassColor: string
  textColor: string
  accentColor: string
  borderColor: string
  shadowColor: string
  blurIntensity: number
  saturation: number
  // Enhanced readability properties
  textShadow: string
  cardBackdrop: string
  strongGlass: string
  textBackground: string
}

export function analyzeImageColors(imageElement: HTMLImageElement): Promise<ColorAnalysis> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // Set canvas size to image size (scaled down for performance)
    const maxSize = 200
    const scale = Math.min(maxSize / imageElement.width, maxSize / imageElement.height)
    canvas.width = imageElement.width * scale
    canvas.height = imageElement.height * scale
    
    // Draw image to canvas
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height)
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Analyze colors
    let totalR = 0, totalG = 0, totalB = 0
    let totalBrightness = 0
    const colorCounts: { [key: string]: number } = {}
    const sampleStep = 4 // Sample every 4th pixel for performance
    
    for (let i = 0; i < data.length; i += sampleStep * 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      totalR += r
      totalG += g
      totalB += b
      
      // Calculate brightness
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
      totalBrightness += brightness
      
      // Count dominant colors (simplified)
      const colorKey = `${Math.floor(r/32)*32},${Math.floor(g/32)*32},${Math.floor(b/32)*32}`
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1
    }
    
    const pixelCount = data.length / (sampleStep * 4)
    
    // Calculate average color
    const avgR = Math.round(totalR / pixelCount)
    const avgG = Math.round(totalG / pixelCount)
    const avgB = Math.round(totalB / pixelCount)
    const averageColor = `rgb(${avgR}, ${avgG}, ${avgB})`
    
    // Calculate average brightness
    const avgBrightness = totalBrightness / pixelCount
    const isLight = avgBrightness > 128
    
    // Find dominant color
    let dominantColorKey = Object.keys(colorCounts).reduce((a, b) => 
      colorCounts[a] > colorCounts[b] ? a : b
    )
    const dominantColor = `rgb(${dominantColorKey})`
    
    // Calculate contrast ratio
    const contrast = isLight ? (255 - avgBrightness) / 255 : avgBrightness / 255
    
    // Apple iOS-style adaptive colors with enhanced readability
    const baseOpacity = isLight ? 0.25 : 0.15
    const glassOpacity = baseOpacity + (contrast * 0.15)
    
    // Enhanced frosted glass effect
    const glassColor = isLight 
      ? `rgba(255, 255, 255, ${Math.min(glassOpacity, 0.4)})`
      : `rgba(255, 255, 255, ${Math.min(glassOpacity * 0.8, 0.25)})`
    
    // Strong glass for better readability
    const strongGlass = isLight
      ? `rgba(255, 255, 255, ${Math.min(glassOpacity + 0.2, 0.6)})`
      : `rgba(0, 0, 0, ${Math.min(0.4, 0.3 + contrast * 0.2)})`
    
    // High contrast text with fallback
    const textColor = isLight 
      ? `rgba(0, 0, 0, ${Math.max(0.9, 0.7 + contrast * 0.3)})`
      : `rgba(255, 255, 255, ${Math.max(0.95, 0.85 + contrast * 0.15)})`
    
    // Text shadow for readability
    const textShadow = isLight
      ? `0 1px 3px rgba(255, 255, 255, 0.8), 0 0 10px rgba(255, 255, 255, 0.4)`
      : `0 1px 3px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.6)`
    
    // Semi-transparent background for text areas
    const textBackground = isLight
      ? `rgba(255, 255, 255, 0.7)`
      : `rgba(0, 0, 0, 0.6)`
    
    // Card backdrop with stronger blur
    const cardBackdrop = isLight
      ? `rgba(255, 255, 255, ${Math.min(0.5, glassOpacity + 0.15)})`
      : `rgba(255, 255, 255, ${Math.min(0.3, glassOpacity + 0.1)})`
    
    // Create accent color from dominant color with proper saturation
    const accentColor = enhanceColor(avgR, avgG, avgB, isLight)
    
    const borderColor = isLight
      ? `rgba(255, 255, 255, ${0.2 + contrast * 0.1})`
      : `rgba(255, 255, 255, ${0.1 + contrast * 0.1})`
    
    const shadowColor = isLight
      ? `rgba(0, 0, 0, ${0.1 + contrast * 0.05})`
      : `rgba(0, 0, 0, ${0.2 + contrast * 0.1})`
    
    // Adaptive blur and saturation for frosted effect
    const blurIntensity = isLight ? 25 + (contrast * 15) : 30 + (contrast * 20)
    const saturation = isLight ? 140 + (contrast * 30) : 160 + (contrast * 40)
    
    resolve({
      dominantColor,
      averageColor,
      brightness: avgBrightness,
      contrast,
      isLight,
      glassColor,
      textColor,
      accentColor,
      borderColor,
      shadowColor,
      blurIntensity,
      saturation,
      // Enhanced readability properties
      textShadow,
      cardBackdrop,
      strongGlass,
      textBackground
    })
  })
}

function enhanceColor(r: number, g: number, b: number, isLight: boolean): string {
  // Convert to HSL for better color manipulation
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const diff = max - min
  
  let h = 0
  if (diff !== 0) {
    if (max === r / 255) h = ((g - b) / 255 / diff) % 6
    else if (max === g / 255) h = (b - r) / 255 / diff + 2
    else h = (r - g) / 255 / diff + 4
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360
  
  const l = (max + min) / 2
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1))
  
  // Enhance saturation and adjust lightness for better accent color
  const enhancedS = Math.min(s * 1.3, 0.8)
  const enhancedL = isLight ? Math.max(l * 0.7, 0.4) : Math.min(l * 1.3, 0.7)
  
  return `hsl(${h}, ${enhancedS * 100}%, ${enhancedL * 100}%)`
}

export function createImageBackground(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}