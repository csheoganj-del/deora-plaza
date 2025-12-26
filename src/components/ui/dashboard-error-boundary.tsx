"use client";

import { Component, ReactNode, useState, useEffect } from "react";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { AlertTriangle, RefreshCw, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Consolidated Dashboard Error Boundary
 * Handles all dashboard errors with graceful fallback UI
 */
export class DashboardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard Error:", error, errorInfo);
    this.setState({ errorInfo: errorInfo.componentStack || null });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <DashboardErrorFallback 
          error={this.state.error} 
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback UI Component
 */
function DashboardErrorFallback({ 
  error, 
  onRetry 
}: { 
  error: Error | null; 
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Something went wrong
          </h1>
          
          <p className="text-white/70 text-center mb-6">
            The dashboard encountered an error. This might be a temporary issue.
          </p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={onRetry}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/login'}
              variant="ghost"
              className="w-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Fallback for Dashboard
 */
export function DashboardLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/20 border-t-white/80 animate-spin" />
        <p className="text-white/70">Loading dashboard...</p>
      </div>
    </div>
  );
}

/**
 * Authentication Required Fallback
 */
export function AuthRequiredFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 border border-amber-500/30">
            <LogIn className="w-8 h-8 text-amber-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Authentication Required
          </h1>
          
          <p className="text-white/70 mb-6">
            Please log in to access the DEORA Plaza dashboard.
          </p>
          
          <Button 
            onClick={() => window.location.href = '/login'}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Session Status Display (for debugging)
 */
export function SessionStatusCard() {
  const { data: session, status } = useSupabaseSession();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-white/80 border border-white/10">
      <div className="font-semibold mb-1">Session Debug</div>
      <div>Status: <span className={status === 'authenticated' ? 'text-green-400' : 'text-amber-400'}>{status}</span></div>
      {session?.user && (
        <>
          <div>Role: {session.user.role}</div>
          <div>Unit: {session.user.businessUnit}</div>
        </>
      )}
    </div>
  );
}


/**
 * Debug Info Panel (development only)
 * Shows session and system information for debugging
 */
export function DashboardDebugPanel() {
  const { data: session, status } = useSupabaseSession();
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setDebugInfo({
        status,
        user: session?.user ? {
          email: session.user.email,
          role: session.user.role,
          businessUnit: session.user.businessUnit,
        } : null,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
      });
    }
  }, [session, status]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 bg-black/80 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-black/90 transition-colors"
        title="Toggle Debug Panel"
      >
        🐛
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg text-xs max-w-sm border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Debug Info</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
          <pre className="whitespace-pre-wrap overflow-auto max-h-60 text-white/80">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}
