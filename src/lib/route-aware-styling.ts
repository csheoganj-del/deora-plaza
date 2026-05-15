/**
 * Route-aware styling utilities
 * Determines when to apply specific styling based on current route
 */

/**
 * Check if current route should use solid dashboard styling
 */
export function shouldUseSolidDashboard(): boolean {
  if (typeof window === 'undefined') return false;
  
  const pathname = window.location.pathname;
  
  // Dashboard routes that should use solid styling
  const dashboardRoutes = [
    '/dashboard',
    '/admin',
    '/manager',
    '/analytics',
    '/reports'
  ];
  
  return dashboardRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if current route is a customer-facing page
 */
export function isCustomerFacingRoute(): boolean {
  if (typeof window === 'undefined') return false;
  
  const pathname = window.location.pathname;
  
  const customerRoutes = [
    '/customer',
    '/qr-order',
    '/menu',
    '/booking'
  ];
  
  return customerRoutes.some(route => pathname.startsWith(route));
}

/**
 * Get appropriate styling mode based on current route
 */
export function getRouteStylingMode(): 'dashboard' | 'customer' | 'auth' {
  if (typeof window === 'undefined') return 'dashboard';
  
  const pathname = window.location.pathname;
  
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return 'auth';
  }
  
  if (isCustomerFacingRoute()) {
    return 'customer';
  }
  
  return 'dashboard';
}