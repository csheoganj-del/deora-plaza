"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import HybridHeader from "@/components/layout/HybridHeader"
import HybridSidebar from "@/components/layout/HybridSidebar"
import DynamicBreadcrumb from "@/components/navigation/DynamicBreadcrumb"
import { Toaster } from "@/components/ui/toaster"
import { EnhancedErrorBoundary } from "@/components/ui/enhanced-error-boundary"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { SkipToMain } from "@/components/ui/accessibility"
import { useServerAuth } from "@/hooks/useServerAuth"
import { LocationPermissionDialog } from "@/components/location/LocationPermissionDialog"
import { RealtimeSyncProvider } from "@/components/providers/RealtimeSyncProvider"
import { PerformanceProvider } from "@/components/providers/PerformanceProvider"

export default function HybridDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session, status } = useServerAuth()
    const router = useRouter()
    const [showLocationDialog, setShowLocationDialog] = useState(false)

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
        // Skip location tracking for admin users
        const userRole = session?.user?.role;
        const adminRoles = ['super_admin', 'owner', 'manager', 'admin'];
        
        if (adminRoles.includes(userRole)) {
            return;
        }

        // Location tracking implementation (same as before)
        const trackLocationInBackground = async () => {
            if (!session?.user?.id) return;

            try {
                const { locationService } = await import("@/lib/location/service");
                const permissions = await locationService.checkLocationPermissions(session.user.id);

                if (!permissions.consentGiven && isLocationRequired()) {
                    setShowLocationDialog(true);
                    return;
                }

                if (permissions.canTrack) {
                    const location = await locationService.getCurrentLocation({
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 300000,
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
            }
        };

        trackLocationInBackground();
    }, [session?.user?.id]);

    const handleLocationPermissionsUpdated = () => {
        setShowLocationDialog(false);
    };

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

    // Don't render dashboard if not authenticated
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
                            <button
                                onClick={() => window.location.reload()}
                                className="ga-button ga-button-primary w-full"
                            >
                                Retry
                            </button>
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
                            <button 
                                onClick={retry} 
                                className="ga-button ga-button-secondary ga-button-sm mt-2"
                            >
                                Retry
                            </button>
                        </div>
                    )}>
                        <HybridSidebar />
                    </EnhancedErrorBoundary>

                    <div className="flex-1 ga-flex ga-flex-col min-w-0">
                        <EnhancedErrorBoundary fallback={({ error, retry }) => (
                            <div className="ga-p-4 text-[var(--color-error)] bg-[var(--color-error-light)] border border-[var(--color-error)] rounded-lg ga-m-4">
                                <p className="ga-text-body font-medium">Header error: {error?.message}</p>
                                <button 
                                    onClick={retry} 
                                    className="ga-button ga-button-secondary ga-button-sm mt-2"
                                >
                                    Retry
                                </button>
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
                                            <button 
                                                onClick={retry} 
                                                className="ga-button ga-button-primary"
                                            >
                                                Retry
                                            </button>
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
                </div>
            </RealtimeSyncProvider>
        </PerformanceProvider>
    )
}