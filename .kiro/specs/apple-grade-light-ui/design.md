# Design Document

## Overview

The Apple-grade light UI system transforms DEORA Plaza into a premium hospitality interface that combines the warmth of natural daylight with the sophistication of Apple's design language. The system creates a cohesive visual experience that feels like a luxury hotel lobby while maintaining enterprise functionality for restaurant management operations.

## Architecture

### Component Hierarchy

```
Global Background System
├── Typography System
├── Glass Card Components
│   ├── Login Cards
│   ├── Dashboard Cards
│   └── Modal Components
├── Interactive Elements
│   ├── Primary Buttons
│   ├── Secondary Buttons
│   └── Form Controls
├── Animation System
│   ├── Page Transitions
│   ├── Micro-interactions
│   └── Loading States
└── Responsive Adaptations
    ├── Mobile Optimizations
    ├── Tablet Layouts
    └── Desktop Enhancements
```

### CSS Architecture

The system uses a layered approach with CSS custom properties for consistency:

```css
/* Global Design Tokens */
:root {
  /* Background System */
  --bg-primary: radial-gradient(1200px 600px at 50% -200px, rgba(255, 215, 170, 0.35), transparent 60%), 
                linear-gradient(180deg, #f6f4f1 0%, #ede9e2 45%, #e6e1d8 100%);
  
  /* Typography */
  --font-primary: "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif;
  --text-primary: #2f2b26;
  --text-secondary: #6a655f;
  --text-muted: #9a948c;
  
  /* Glass Effects */
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(0, 0, 0, 0.06);
  --glass-shadow: 0 30px 60px rgba(0, 0, 0, 0.08);
  --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  
  /* Interactive Elements */
  --button-primary-bg: linear-gradient(180deg, #e6bb82 0%, #c99657 100%);
  --button-primary-text: #2b1d0e;
  --button-primary-shadow: 0 8px 20px rgba(201, 150, 87, 0.35);
  
  /* Animation */
  --ease-apple: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 0.2s;
  --duration-normal: 0.4s;
}
```

## Components and Interfaces

### Global Background Component

**Purpose**: Provides the foundational warm daylight background across all pages.

**Implementation**:
```typescript
interface BackgroundSystemProps {
  variant?: 'default' | 'login' | 'dashboard';
  intensity?: 'subtle' | 'normal' | 'enhanced';
}

const BackgroundSystem: React.FC<BackgroundSystemProps> = ({
  variant = 'default',
  intensity = 'normal'
}) => {
  // Background rendering logic
};
```

**CSS Classes**:
- `.apple-background-system` - Base background application
- `.apple-background-login` - Login-specific enhancements
- `.apple-background-dashboard` - Dashboard optimizations

### Glass Card Component

**Purpose**: Creates frosted glass containers for content with proper depth and lighting.

**Implementation**:
```typescript
interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  blur?: number;
  opacity?: number;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  blur = 16,
  opacity = 0.65,
  className
}) => {
  // Glass effect implementation
};
```

**Visual Properties**:
- Backdrop blur: 16px (configurable)
- Background: rgba(255,255,255,0.65)
- Border radius: 24px for cards, 14px for buttons
- Shadow system: Multiple layers for realistic depth

### Typography System

**Purpose**: Implements Apple's font hierarchy with warm, hospitality-appropriate colors.

**Font Stack**: SF Pro Display → SF Pro Text → System fonts
**Weight Mapping**:
- Headlines: 600 (Semibold)
- Subheadings: 500 (Medium)  
- Body text: 400 (Regular)

**Color Hierarchy**:
- Primary text: #2f2b26 (warm charcoal)
- Secondary text: #6a655f (soft gray)
- Muted text: #9a948c (light gray)
- Accent text: Metallic gradient for app titles

### Interactive Elements

**Primary Button Design**:
```css
.apple-button-primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-radius: 14px;
  font-weight: 600;
  box-shadow: var(--button-primary-shadow), var(--glass-highlight);
  transition: all var(--duration-fast) var(--ease-apple);
}

.apple-button-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(201, 150, 87, 0.4);
}

.apple-button-primary:active {
  transform: scale(0.98);
}
```

**Form Controls**:
- Input fields with glass backgrounds
- Focus states with warm amber accents
- Validation states using hospitality-appropriate colors

## Data Models

### Theme Configuration

```typescript
interface AppleLightTheme {
  id: string;
  name: string;
  background: {
    primary: string;
    intensity: 'subtle' | 'normal' | 'enhanced';
    warmth: number; // 0-100
  };
  typography: {
    fontFamily: string;
    weights: Record<string, number>;
    colors: {
      primary: string;
      secondary: string;
      muted: string;
      accent: string;
    };
  };
  glass: {
    blur: number;
    opacity: number;
    borderOpacity: number;
    shadowIntensity: number;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: string;
  };
}
```

### Component State Management

```typescript
interface UIState {
  theme: AppleLightTheme;
  animations: {
    enabled: boolean;
    reducedMotion: boolean;
  };
  performance: {
    gpuAcceleration: boolean;
    backdropBlurSupported: boolean;
  };
  responsive: {
    breakpoint: 'mobile' | 'tablet' | 'desktop';
    orientation: 'portrait' | 'landscape';
  };
}
```

## Animation System

### Page Transitions

**Entry Animation**:
```css
@keyframes apple-page-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Loading States**:
- Button text transitions to "Checking..."
- Thin-stroke spinner with warm colors
- Background remains active during loading
- No blocking overlays

### Micro-interactions

**Button Feedback**:
1. Hover: Subtle lift (translateY(-1px))
2. Active: Scale down (scale(0.98))
3. Loading: Text change + spinner

**Card Interactions**:
1. Hover: Slight shadow increase
2. Focus: Warm amber outline
3. Selection: Gentle scale animation

## Error Handling

### Fallback Strategies

**Backdrop Blur Unsupported**:
```css
@supports not (backdrop-filter: blur(16px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}
```

**Reduced Motion Preference**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Performance Degradation**:
- Automatic fallback to simpler effects on low-end devices
- GPU acceleration detection and optimization
- Memory usage monitoring for complex backgrounds

## Testing Strategy

### Visual Regression Testing
- Screenshot comparison across different devices
- Color contrast validation (WCAG AA compliance)
- Animation smoothness verification
- Glass effect rendering consistency

### Performance Testing
- Frame rate monitoring during animations
- Memory usage tracking with complex backgrounds
- Load time measurement for initial render
- Battery usage impact on mobile devices

### Accessibility Testing
- Screen reader compatibility with glass effects
- Keyboard navigation with visual feedback
- High contrast mode compatibility
- Color blindness simulation testing

### Cross-browser Testing
- Safari (iOS/macOS) - Primary target
- Chrome/Edge - Chromium compatibility
- Firefox - Gecko engine support
- Mobile browsers - Touch interaction testing

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Background System Consistency
*For any* page or component in the system, the background should use the warm daylight gradient system and avoid pure white backgrounds
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Typography System Compliance
*For any* text element, it should use the SF Pro font family with appropriate weights (400, 500, 600) and warm charcoal colors instead of pure black
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: Glass Card Visual Properties
*For any* glass card component, it should have backdrop blur (16px), semi-transparent white background (rgba(255,255,255,0.65)), subtle borders, soft shadows, and inset highlights
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 4: Primary Button Styling
*For any* primary button, it should have warm amber gradient background, dark brown text, and warm amber shadows
**Validates: Requirements 4.1, 4.2, 4.5**

### Property 5: Interactive Button Animations
*For any* button interaction (hover, click), the system should apply the correct transform animations (translateY(-1px) for hover, scale(0.98) for click) with immediate visual feedback
**Validates: Requirements 4.3, 4.4, 5.4**

### Property 6: Animation System Standards
*For any* animation or transition, it should use cubic-bezier(0.22, 1, 0.36, 1) easing and have duration ≤ 0.4 seconds
**Validates: Requirements 5.2, 5.3**

### Property 7: Page Load Animation Behavior
*For any* page load, cards should fade in with upward motion (6px) using the standard animation system
**Validates: Requirements 5.1**

### Property 8: Loading State Management
*For any* loading state, buttons should show "Checking..." text, display thin-stroke spinners, avoid blocking overlays, and keep background animations active
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 9: Color Palette Compliance
*For any* color used in the system, it should avoid pure black (#000000) and pure white (#ffffff), use warm neutrals for text, muted colors for secondary information, and maintain 4.5:1 contrast ratio minimum
**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

### Property 10: Responsive Design Preservation
*For any* screen size or orientation, the system should maintain glass effects, scale typography appropriately, preserve minimum touch targets (44px), and ensure backdrop blur compatibility
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 11: Performance Optimization Features
*For any* device or browser, the system should optimize for GPU acceleration, lazy load non-critical effects, and provide fallbacks for unsupported features like backdrop blur
**Validates: Requirements 9.3, 9.4, 9.5**

### Property 12: System Integration Compatibility
*For any* existing functionality (dashboard, authentication, forms, notifications, responsive layouts), it should continue to work correctly with the new Apple-grade UI system applied
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**