"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link" // Ensure Link is imported if needed, or remove if unused in layout
import GlassHeader from "@/components/layout/GlassHeader"
import GlassSidebar from "@/components/layout/GlassSidebar"
// Removed DynamicBreadcrumb as it's not in the new design spec for now, or can be added back if needed.
import { Button } from "@/components/ui/hybrid/button"
import { Toaster } from "@/components/ui/toaster"
import { EnhancedErrorBoundary } from "@/components/ui/enhanced-error-boundary"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { SkipToMain } from "@/components/ui/accessibility"
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


    // Redirect handled in useEffect to avoid hydration mismatches and reload loops
    if (status === "unauthenticated") {
        // We still return null or a loader here to prevent flashing content
        // continuously rendering this while waiting for useEffect to redirect is fine
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
        <ToastProvider>
            <NotificationSystemInitializer />
            {/* Global Ambient Background Mesh - Simplified for performance */}
            <div className="fixed inset-0 z-0 bg-[#0f0f13]">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-purple-900/5 blur-[40px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-900/5 blur-[40px]" />
            </div>

            <div className="relative z-10 min-h-screen flex text-white overflow-hidden font-sans antialiased">
                <GlassSidebar />

                <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                    <GlassHeader />

                    <main
                        id="main-content"
                        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 pt-2 pb-24"
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

