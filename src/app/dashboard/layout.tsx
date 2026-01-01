"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import HybridHeader from "@/components/layout/HybridHeader"
import HybridSidebar from "@/components/layout/HybridSidebar"
import DynamicBreadcrumb from "@/components/navigation/DynamicBreadcrumb"
import { Button } from "@/components/ui/hybrid/button"
import { Toaster } from "@/components/ui/toaster"
import { EnhancedErrorBoundary } from "@/components/ui/enhanced-error-boundary"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { SkipToMain } from "@/components/ui/accessibility"
import { useServerAuth } from "@/hooks/useServerAuth"
import { LocationPermissionDialog } from "@/components/location/LocationPermissionDialog"
import { RealtimeSyncProvider } from "@/components/providers/RealtimeSyncProvider"
import { PerformanceProvider } from "@/components/providers/PerformanceProvider"


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session, status } = useServerAuth()
    const router = useRouter()
    const [showLocationDialog, setShowLocationDialog] = useState(false)
    const [manualLat, setManualLat] = useState("")
    const [manualLng, setManualLng] = useState("")

    // Clean up any loading states when dashboard loads
    useEffect(() => {
        document.body.classList.remove("route-loading");
        // Apply hybrid design system class to body
        document.body.classList.add("hybrid-dashboard");
    }, []);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            window.location.href = "/login";
        }
    }, [status])

    // Check if location is required for this user role
    const isLocationRequired = () => {
        if (!session?.user?.role) return false;
        const locationRequiredRoles = ['waiter', 'kitchen', 'bartender', 'reception', 'hotel_reception'];
        return locationRequiredRoles.includes(session.user.role);
    };

    useEffect(() => {
        // FIXED: Don't show location dialog for admin roles - they don't need location tracking
        const userRole = session?.user?.role;
        const adminRoles = ['super_admin', 'owner', 'manager', 'admin'];
        
        if (adminRoles.includes(userRole)) {
            // Skip location tracking for admin users
            return;
        }

        // Re-enable location tracking with proper client-side implementation
        const trackLocationInBackground = async () => {
            if (!session?.user?.id) return;

            try {
                // Import location service (client-side safe)
                const { locationService } = await import("@/lib/location/service");

                // Check if user has granted permissions
                const permissions = await locationService.checkLocationPermissions(session.user.id);

                if (!permissions.consentGiven && isLocationRequired()) {
                    // Show permission dialog for roles that require location
                    setShowLocationDialog(true);
                    return;
                }

                if (permissions.canTrack) {
                    // Track location in background without blocking UI
                    const location = await locationService.getCurrentLocation({
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 300000, // 5 minutes
                        fallbackToIP: true,
                        required: false
                    });

                    if (location) {
                        await locationService.saveUserLocation(session.user.id, location, {
                            source: 'dashboard_background',
                            userAgent: navigator.userAgent
                        });
                        console.log('✅ Location tracked successfully');
                    }
                }
            } catch (error) {
                console.warn('Background location tracking failed:', error);
                // Don't block the UI for location errors
            }
        };

        trackLocationInBackground();
    }, [session?.user?.id]);

    const handleLocationPermissionsUpdated = () => {
        setShowLocationDialog(false);
        // Optionally refresh location tracking
    };

    const handleManualVerify = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);

        if (!isNaN(lat) && !isNaN(lng)) {
            // Basic range check
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                // Save manual coordinates and close dialog
                if (typeof window !== 'undefined') {
                    localStorage.setItem("cached_location", JSON.stringify({
                        lat,
                        lng,
                        timestamp: Date.now(),
                        method: "manual"
                    }));
                }
                setShowLocationDialog(false);
            } else {
                alert("Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.");
            }
        } else {
            alert("Please enter valid numeric coordinates.");
        }
    }

    // Redirect to login immediately if not authenticated (no loading screen)
    if (status === "unauthenticated") {
        if (typeof window !== 'undefined') {
            window.location.href = "/login";
        }
        return null;
    }

    // Show minimal loading only for the initial render
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[var(--bg-secondary)] ga-flex ga-items-center justify-center">
                <div className="ga-flex ga-items-center ga-gap-3">
                    <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="ga-text-body text-[var(--text-secondary)]">Loading dashboard...</span>
                </div>
            </div>
        )
    }

    // Don't render dashboard if not authenticated - redirect to login
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-[var(--bg-secondary)] ga-flex ga-items-center justify-center">
                <div className="ga-card max-w-md w-full mx-4">
                    <div className="ga-card-content text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-error-light)] ga-flex ga-items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="ga-text-h2 text-[var(--color-error)] mb-2">Authentication Required</h2>
                        <p className="ga-text-body-secondary mb-6">
                            Please sign in to access the dashboard
                        </p>
                        
                        <div className="ga-flex ga-flex-col ga-gap-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full"
                            >
                                Retry
                            </Button>
                            <a
                                href="/login"
                                className="ga-text-body text-[var(--color-primary)] hover:underline text-center"
                            >
                                Back to Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <PerformanceProvider enableOptimizations={true} enableMonitoring={true}>
            <RealtimeSyncProvider enableNotifications={true} enablePerformanceMonitoring={true}>
                <div className="min-h-screen bg-[var(--bg-secondary)] ga-flex">
                    {/* ACCESSIBILITY: Skip to main content link */}
                    <SkipToMain />

                    <EnhancedErrorBoundary fallback={({ error, retry }) => (
                        <div className="ga-p-4 text-[var(--color-error)] bg-[var(--color-error-light)] border border-[var(--color-error)] rounded-lg ga-m-4">
                            <p className="ga-text-body font-medium">Sidebar error: {error?.message}</p>
                            <Button 
                                onClick={retry} 
                                variant="secondary"
                                size="sm"
                                className="mt-2"
                            >
                                Retry
                            </Button>
                        </div>
                    )}>
                        <HybridSidebar />
                    </EnhancedErrorBoundary>

                    <div className="flex-1 ga-flex ga-flex-col min-w-0">
                        <EnhancedErrorBoundary fallback={({ error, retry }) => (
                            <div className="ga-p-4 text-[var(--color-error)] bg-[var(--color-error-light)] border border-[var(--color-error)] rounded-lg ga-m-4">
                                <p className="ga-text-body font-medium">Header error: {error?.message}</p>
                                <Button 
                                    onClick={retry} 
                                    variant="secondary"
                                    size="sm"
                                    className="mt-2"
                                >
                                    Retry
                                </Button>
                            </div>
                        )}>
                            <HybridHeader />
                        </EnhancedErrorBoundary>

                        <main
                            id="main-content"
                            className="flex-1 bg-[var(--bg-secondary)] overflow-auto"
                            role="main"
                            aria-label="Dashboard main content"
                        >
                            <EnhancedErrorBoundary fallback={({ error, retry }) => (
                                <div className="ga-p-6">
                                    <div className="ga-card">
                                        <div className="ga-card-content">
                                            <p className="ga-text-body font-medium text-[var(--color-error)] mb-2">
                                                Dashboard content error: {error?.message}
                                            </p>
                                            <Button 
                                                onClick={retry}
                                            >
                                                Retry
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}>
                                {/* NAVIGATION: Add breadcrumb navigation for better UX */}
                                <div className="bg-[var(--bg-primary)] border-b border-[var(--border-primary)] ga-px-6 ga-py-3">
                                    <DynamicBreadcrumb />
                                </div>
                                {children}
                            </EnhancedErrorBoundary>
                        </main>
                    </div>

                    <Toaster />
                    <ProgressIndicator value={0} />

                    {/* Location Permission Dialog - Only for non-admin roles */}
                    {session?.user?.id && !['super_admin', 'owner', 'manager', 'admin'].includes(session.user.role) && (
                        <LocationPermissionDialog
                            isOpen={showLocationDialog}
                            onClose={() => setShowLocationDialog(false)}
                            userId={session.user.id}
                            onPermissionsUpdated={handleLocationPermissionsUpdated}
                        />
                    )}

                    {/* Manual Location Entry Dialog - Hybrid Design Style */}
                    {showLocationDialog && !['super_admin', 'owner', 'manager', 'admin'].includes(session?.user?.role || '') && (
                        <div className="fixed inset-0 bg-black/50 ga-flex ga-items-center justify-center z-50">
                            <div className="ga-card max-w-md w-full mx-4">
                                <div className="ga-card-header">
                                    <h3 className="ga-card-title">Manual Location Entry</h3>
                                    <p className="ga-card-description">
                                        If automatic location detection fails, you can enter coordinates manually.
                                    </p>
                                </div>
                                
                                <div className="ga-card-content">
                                    <Button
                                        onClick={() => window.open("https://www.google.com/search?q=my+location+coordinates", "_blank")}
                                        variant="secondary"
                                        className="w-full mb-4"
                                    >
                                        Find Coordinates on Google ↗
                                    </Button>

                                    <div className="ga-grid ga-grid-2 ga-gap-3 mb-4">
                                        <input
                                            type="number"
                                            placeholder="Latitude"
                                            value={manualLat}
                                            onChange={(e) => setManualLat(e.target.value)}
                                            className="ga-input"
                                            step="any"
                                            aria-label="Latitude coordinate"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Longitude"
                                            value={manualLng}
                                            onChange={(e) => setManualLng(e.target.value)}
                                            className="ga-input"
                                            step="any"
                                            aria-label="Longitude coordinate"
                                        />
                                    </div>
                                </div>

                                <div className="ga-card-footer">
                                    <Button
                                        onClick={() => setShowLocationDialog(false)}
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        Skip
                                    </Button>
                                    <Button
                                        onClick={handleManualVerify}
                                        className="flex-1"
                                    >
                                        Verify Location
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </RealtimeSyncProvider>
        </PerformanceProvider>
    )
}

