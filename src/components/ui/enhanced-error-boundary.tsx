"use client"

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/base/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/base/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface EnhancedErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

class EnhancedErrorBoundary extends React.Component<
  EnhancedErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to external service
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          showDetails={this.props.showDetails}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error
  errorInfo?: React.ErrorInfo
  resetError: () => void
  showDetails?: boolean
}

function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  showDetails = false,
}: DefaultErrorFallbackProps) {
  const [showFullError, setShowFullError] = React.useState(false)

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleReportError = () => {
    // In a real app, this would send error details to your error reporting service
    const errorDetails = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    console.log('Error report:', errorDetails)
    
    // You could integrate with services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { extra: errorDetails })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl apple-glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-red-100 w-fit">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="apple-text-heading text-xl">
            Something went wrong
          </CardTitle>
          <CardDescription className="apple-text-body">
            We're sorry, but something unexpected happened. Our team has been notified.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800 mb-1">Error Message:</p>
              <p className="text-sm text-red-700 font-mono">{error.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetError}
              variant="default"
              className="flex-1"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
            
            <Button
              onClick={handleReload}
              variant="secondary"
              className="flex-1"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reload Page
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="secondary"
              className="flex-1"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Go Home
            </Button>
          </div>

          {/* Technical Details Toggle */}
          {(showDetails || process.env.NODE_ENV === 'development') && (
            <div className="space-y-3">
              <Button
                onClick={() => setShowFullError(!showFullError)}
                variant="ghost"
                size="sm"
                leftIcon={<Bug className="w-4 h-4" />}
              >
                {showFullError ? 'Hide' : 'Show'} Technical Details
              </Button>

              {showFullError && (
                <div className="space-y-3">
                  {/* Error Stack */}
                  {error?.stack && (
                    <div className="p-4 rounded-lg bg-gray-50 border">
                      <p className="text-sm font-medium text-gray-800 mb-2">Stack Trace:</p>
                      <pre className="text-xs text-gray-600 overflow-auto max-h-40 font-mono">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {/* Component Stack */}
                  {errorInfo?.componentStack && (
                    <div className="p-4 rounded-lg bg-gray-50 border">
                      <p className="text-sm font-medium text-gray-800 mb-2">Component Stack:</p>
                      <pre className="text-xs text-gray-600 overflow-auto max-h-40 font-mono">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  {/* Report Error Button */}
                  <Button
                    onClick={handleReportError}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Report This Error
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="text-center text-sm text-gray-600">
            <p>
              If this problem persists, please contact support with the error details above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<EnhancedErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export { EnhancedErrorBoundary }
export default EnhancedErrorBoundary