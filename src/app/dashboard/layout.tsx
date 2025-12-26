"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { useSupabaseSession } from "@/hooks/useSupabaseSession"
import { LocationPermissionDialog } from "@/components/location/LocationPermissionDialog"
import { SessionDebug } from "@/components/debug/SessionDebug"


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session, status } = useSupabaseSession()
    const router = useRouter()
    const [showLocationDialog, setShowLocationDialog] = useState(false)
    const [manualLat, setManualLat] = useState("")
    const [manualLng, setManualLng] = useState("")

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            // Force a hard navigation to clear any stale state and ensure reliable redirect
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

    // Show loading state while checking authentication
    if (status === "loading") {
        return (
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
                <p className="text-[#6B7280] mb-4">Loading dashboard...</p>
                <a href="/login" className="text-xs text-blue-500 hover:underline">
                    Taking too long? Click here
                </a>
            </div>
            </div >
        )

        )
    }

    // Don't render dashboard if not authenticated - redirect to login
    if (status === "unauthenticated") {
        return (
            <div className="flex h-screen bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] items-center justify-center">
                <div className="text-center">
                    <p className="text-[#6B7280] mb-4">Redirecting to login...</p>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
                    <a href="/login" className="text-xs text-blue-500 hover:underline">
                        Click here if not redirected
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen">
            <ErrorBoundary fallback={() => (
                <div className="p-4 text-red-400">Sidebar error occurred</div>
            )}>
                <Sidebar />
            </ErrorBoundary>

            <div className="flex-1 flex flex-col overflow-hidden">
                <ErrorBoundary fallback={() => (
                    <div className="p-4 text-red-400">Header error occurred</div>
                )}>
                    <Header />
                </ErrorBoundary>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth dashboard-main-content">
                    <ErrorBoundary fallback={() => <div className="p-4 text-red-400">Dashboard content error occurred</div>}>
                        {children}
                    </ErrorBoundary>
                </main>
            </div>

            <Toaster />
            <ProgressIndicator value={0} />
            {process.env.NODE_ENV === 'development' && <SessionDebug />}

            {/* Location Permission Dialog */}
            {session?.user?.id && (
                <LocationPermissionDialog
                    isOpen={showLocationDialog}
                    onClose={() => setShowLocationDialog(false)}
                    userId={session.user.id}
                    onPermissionsUpdated={handleLocationPermissionsUpdated}
                />
            )}

            {/* Fallback Manual Location Entry (for emergency cases) */}
            {showLocationDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-card p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Manual Location Entry</h3>
                        <p className="text-sm text-white/70 mb-4">
                            If automatic location detection fails, you can enter coordinates manually.
                        </p>

                        <Button
                            variant="outline"
                            onClick={() => window.open("https://www.google.com/search?q=my+location+coordinates", "_blank")}
                            className="glass-button w-full mb-4"
                        >
                            Find Coordinates on Google ↗
                        </Button>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <input
                                type="number"
                                placeholder="Latitude"
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value)}
                                className="glass-input px-3 py-2"
                                step="any"
                            />
                            <input
                                type="number"
                                placeholder="Longitude"
                                value={manualLng}
                                onChange={(e) => setManualLng(e.target.value)}
                                className="glass-input px-3 py-2"
                                step="any"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowLocationDialog(false)}
                                className="glass-button flex-1"
                            >
                                Skip
                            </Button>
                            <Button
                                onClick={handleManualVerify}
                                className="glass-button-primary flex-1"
                            >
                                Verify Location
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

