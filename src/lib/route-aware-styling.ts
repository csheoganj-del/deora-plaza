/**
 * Route-Aware Styling System
 * Applies different styling approaches based on current route
 */

export type RouteType = 'login' | 'dashboard' | 'other';

/**
 * Detect current route type
 */
export function detectRouteType(): RouteType {
  if (typeof window === 'undefined') return 'other';
  
  const pathname = window.location.pathname;
  
  if (pathname.startsWith('/login')) {
    return 'login';
  }
  
  if (pathname.startsWith('/dashboard')) {
    return 'dashboard';
  }
  
  return 'other';
}

/**
 * Apply route-specific styling
 */
export function applyRouteSpecificStyling(routeType: RouteType) {
  if (typeof document === 'undefined') return;
  
  const body = document.body;
  
  // Remove all route classes
  body.classList.remove('route-login', 'route-dashboard', 'route-other');
  
  // Add current route class
  body.classList.add(`route-${routeType}`);
  
  switch (routeType) {
    case 'login':
      applyLoginStyling();
      break;
    case 'dashboard':
      applyDashboardStyling();
      break;
    case 'other':
      applyDefaultStyling();
      break;
  }
  
  console.log(`🎨 Applied ${routeType} route styling`);
}

/**
 * Apply login-specific styling (dynamic backgrounds)
 */
function applyLoginStyling() {
  const root = document.documentElement;
  
  // Enable dynamic background system
  root.style.setProperty('--enable-dynamic-backgrounds', '1');
  root.style.setProperty('--enable-adaptive-colors', '1');
  
  // Login-specific glass effects
  root.style.setProperty('--login-glass-opacity', '0.1');
  root.style.setProperty('--login-glass-blur', '20px');
  root.style.setProperty('--login-glass-saturation', '180%');
  
  console.log('🌟 Login styling applied - dynamic backgrounds enabled');
}

/**
 * Apply dashboard-specific styling (solid frosted glass)
 */
function applyDashboardStyling() {
  const root = document.documentElement;
  
  // Disable dynamic backgrounds
  root.style.setProperty('--enable-dynamic-backgrounds', '0');
  root.style.setProperty('--enable-adaptive-colors', '0');
  
  // Premium liquid glass variables
  root.style.setProperty('--dashboard-glass-bg', 'rgba(255, 255, 255, 0.65)');
  root.style.setProperty('--dashboard-glass-border', 'rgba(255, 255, 255, 0.4)');
  root.style.setProperty('--dashboard-glass-blur', '18px');
  root.style.setProperty('--dashboard-glass-saturation', '140%');
  root.style.setProperty('--dashboard-glass-brightness', '108%');
  
  // Professional color scheme
  root.style.setProperty('--dashboard-text-primary', '#1a1a1a');
  root.style.setProperty('--dashboard-text-secondary', '#6b7280');
  root.style.setProperty('--dashboard-text-muted', '#9ca3af');
  
  // Force the premium background with enhanced gradients
  document.body.style.background = `
    radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.08), transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.06), transparent 40%),
    radial-gradient(circle at 40% 60%, rgba(6, 182, 212, 0.04), transparent 30%),
    linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)
  `;
  document.body.style.backgroundAttachment = 'fixed';
  
  console.log('🏢 Dashboard styling applied - premium liquid glass enabled');
  console.log('📊 Dashboard body classes:', document.body.className);
  console.log('🎨 Dashboard CSS variables set:', {
    '--dashboard-glass-bg': root.style.getPropertyValue('--dashboard-glass-bg'),
    '--dashboard-text-primary': root.style.getPropertyValue('--dashboard-text-primary')
  });
}

/**
 * Apply default styling for other routes
 */
function applyDefaultStyling() {
  const root = document.documentElement;
  
  // Default settings
  root.style.setProperty('--enable-dynamic-backgrounds', '0');
  root.style.setProperty('--enable-adaptive-colors', '0');
  
  console.log('🎯 Default styling applied');
}

/**
 * Initialize route-aware styling system
 */
export function initializeRouteAwareStyling() {
  if (typeof window === 'undefined') return;
  
  const currentRoute = detectRouteType();
  applyRouteSpecificStyling(currentRoute);
  
  // Listen for route changes
  const handleRouteChange = () => {
    const newRoute = detectRouteType();
    applyRouteSpecificStyling(newRoute);
  };
  
  // Listen for navigation events
  window.addEventListener('popstate', handleRouteChange);
  
  // Listen for Next.js route changes
  if (typeof window !== 'undefined' && 'navigation' in window) {
    // Modern navigation API
    window.addEventListener('navigate', handleRouteChange);
  }
  
  return currentRoute;
}

/**
 * Check if current route should use dynamic backgrounds
 */
export function shouldUseDynamicBackgrounds(): boolean {
  return detectRouteType() === 'login';
}

/**
 * Check if current route should use solid dashboard styling
 */
export function shouldUseSolidDashboard(): boolean {
  return detectRouteType() === 'dashboard';
}