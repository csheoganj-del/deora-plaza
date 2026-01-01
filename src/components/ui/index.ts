// DEORA Plaza - Apple-Grade UI Component Library
// Organized, production-ready components with consistent design patterns

// Base Components (shadcn/ui)
export * from './base'

// Direct exports for commonly used components
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './base/dialog'
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup } from './base/dropdown-menu'

// Glass Morphism Components
export * from './glass'

// Apple-Inspired Components
export * from './apple'

// Form Components
export * from './forms'

// Feedback Components
export * from './feedback'

// Layout Components
export * from './layout'

// Theme Components
export * from './theme'

// Accessibility Components
export * from './accessibility'

// Status Components
export * from './status'

// Error Handling Components
export * from './error'

// Advanced/Experimental Components
export * from './advanced'

// Component Categories for Easy Discovery
export const ComponentCategories = {
  base: 'Base shadcn/ui components for standard UI elements',
  glass: 'Glass morphism components with liquid glass effects',
  apple: 'Apple-inspired components following Human Interface Guidelines',
  forms: 'Form-related components for user input and validation',
  feedback: 'User feedback components like toasts, loading states, and skeletons',
  layout: 'Layout and navigation components',
  theme: 'Theme and customization components',
  accessibility: 'Accessibility enhancement components',
  status: 'Status indicators and real-time updates',
  error: 'Error handling and boundary components',
  advanced: 'Advanced and experimental components'
} as const

// Design System Utilities
export const DesignTokens = {
  spacing: {
    xs: 'var(--space-1)', // 4px
    sm: 'var(--space-2)', // 8px
    md: 'var(--space-4)', // 16px
    lg: 'var(--space-6)', // 24px
    xl: 'var(--space-8)', // 32px
  },
  borderRadius: {
    sm: 'var(--border-radius-sm)', // 8px
    md: 'var(--border-radius-md)', // 12px
    lg: 'var(--border-radius-lg)', // 16px
    xl: 'var(--border-radius-xl)', // 20px
    card: 'var(--border-radius-card)', // 24px
  },
  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    glass: 'var(--shadow-glass-md)',
  },
  colors: {
    primary: 'var(--warm-amber-500)',
    secondary: 'var(--warm-neutral-600)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
  }
} as const

// Animation Utilities
export const AnimationClasses = {
  // Entry animations
  pageEnter: 'apple-page-enter',
  cardEnter: 'apple-card-enter',
  slideUp: 'apple-slide-up',
  slideDown: 'apple-slide-down',
  slideLeft: 'apple-slide-left',
  slideRight: 'apple-slide-right',
  scaleIn: 'apple-scale-in',
  fadeIn: 'apple-fade-in',
  
  // Interactive animations
  interactive: 'apple-interactive',
  hoverLift: 'apple-hover-lift',
  hoverScale: 'apple-hover-scale',
  pressScale: 'apple-press-scale',
  
  // Loading animations
  spin: 'apple-spin',
  pulse: 'apple-pulse',
  bounce: 'apple-bounce',
  
  // Spring animations
  springIn: 'spring-in',
  springOut: 'spring-out',
} as const

// Glass Effect Utilities
export const GlassEffects = {
  card: 'apple-glass-card',
  cardElevated: 'apple-glass-card-elevated',
  cardSubtle: 'apple-glass-card-subtle',
  cardStrong: 'apple-glass-card-strong',
  panel: 'glass-panel',
  overlay: 'glass-overlay',
  modal: 'glass-modal',
} as const

// Typography Utilities
export const TypographyClasses = {
  display: 'apple-text-display',
  heading: 'apple-text-heading',
  subheading: 'apple-text-subheading',
  body: 'apple-text-body',
  bodyLarge: 'apple-text-body-large',
  caption: 'apple-text-caption',
  small: 'apple-text-small',
  appTitle: 'apple-app-title',
  gradient: 'apple-text-gradient',
} as const

// Component Usage Guidelines
export const UsageGuidelines = {
  base: 'Use for standard UI elements that need consistent styling and behavior',
  glass: 'Use for cards and panels that need depth and visual hierarchy',
  apple: 'Use for primary interactions and key user interface elements',
  forms: 'Use for all user input scenarios with proper validation',
  feedback: 'Use to provide clear user feedback and loading states',
  layout: 'Use for consistent navigation and content organization',
  theme: 'Use for customization and personalization features',
  accessibility: 'Use to enhance accessibility for all users',
  status: 'Use to communicate system state and real-time updates',
  error: 'Use for graceful error handling and recovery',
  advanced: 'Use sparingly for special effects and experimental features'
} as const