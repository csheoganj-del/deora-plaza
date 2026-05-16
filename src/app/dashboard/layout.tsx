"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import GlassHeader from "@/components/layout/GlassHeader"
import GlassSidebar from "@/components/layout/GlassSidebar"
import { Button } from "@/components/ui/hybrid/button"
import { Toaster } from "@/components/ui/toaster"
import { EnhancedErrorBoundary } from "@/components/ui/enhanced-error-boundary"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { useServerAuth } from "@/hooks/useServerAuth"
import { ToastProvider } from "@/components/ui/feedback/notification-toast"
import { NotificationSystemInitializer } from "@/components/system/NotificationSystemInitializer"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session, status } = useServerAuth()
    const router = useRouter()

    // Clean up any loading states when dashboard loads
    useEffect(() => {
        document.body.classList.remove("route-loading");
        // Apply hybrid design system class to body
        document.body.classList.add("hybrid-dashboard");
    }, []);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login"); // Use router.push instead of window.location.href to avoid reload loops
        }
    }, [status, router])

    // Show nothing while loading - layout shell renders immediately, content loads independently
    // DO NOT block here - this causes full-screen spinner on EVERY tab switch

    return (
        <ToastProvider>
            <NotificationSystemInitializer />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0a0806]">
                {/* CINEMATIC BACKGROUND */}
                <div className="cinematic-bg transform-gpu"></div>
                
                {/* DARK OVERLAY */}
                <div className="cinematic-overlay transform-gpu" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', opacity: 0.85 }}></div>

                {/* FLOATING PARTICLES */}
                <div className="particles-container transform-gpu">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className={`particle particle-${i}`}></div>
                  ))}
                </div>
            </div>

            <div className="relative z-10 min-h-screen flex text-white overflow-hidden font-sans antialiased">
                <GlassSidebar />

                <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                    <GlassHeader />

                    <main
                        id="main-content"
                        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 md:p-6 pt-2 pb-24"
                        role="main"
                        aria-label="Dashboard main content"
                    >
                        <EnhancedErrorBoundary fallback={({ error, resetError }) => (
                            <div className="p-6">
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-md">
                                    <p className="font-medium text-red-400 mb-2">
                                        Dashboard content error: {error?.message}
                                    </p>
                                    <Button
                                        onClick={resetError}
                                        variant="destructive"
                                    >
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        )}>
                            {children}
                        </EnhancedErrorBoundary>
                    </main>
                </div>

                {/* Note: Standard Toaster is still here but ToastProvider handles our notification toasts */}
                <Toaster />
                <ProgressIndicator value={0} />

            </div>
        </ToastProvider>
    )
}

