import { Logo3D } from '@/components/ui/Logo3D'

interface LoadingLogoProps {
    message?: string
    variant?: 'fullscreen' | 'inline' | 'compact'
}

export function LoadingLogo({ message = "Loading...", variant = 'fullscreen' }: LoadingLogoProps) {
    if (variant === 'inline') {
        return (
            <div className="inline-flex items-center gap-2">
                <Logo3D size="sm" animated={true} className="w-8 h-8 text-xs" />
                {message && <span className="text-sm font-medium text-[var(--text-secondary)] animate-pulse">{message}</span>}
            </div>
        )
    }

    if (variant === 'compact') {
        return (
            <div className="flex flex-col items-center justify-center gap-4 w-full p-6 glass-card frosted-glass-medium rounded-2xl">
                <div className="relative">
                    <Logo3D size="md" animated={true} />
                </div>

                {message && (
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider animate-pulse">
                        {message}
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center gap-12 min-h-[400px] w-full">
            <div className="relative">
                {/* Background Glow */}
                <div className="absolute inset-0 rounded-full bg-[#6D5DFB]/20 blur-3xl animate-pulse scale-150"></div>

                {/* 3D Logo */}
                <Logo3D size="xl" animated={true} />
            </div>

            <div className="text-center space-y-3 relative z-10">
                <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                    Deora Plaza
                </h3>
                {message && (
                    <div className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[var(--text-secondary)] px-6 py-2 rounded-full glass-card frosted-glass-light">
                        <div className="h-2 w-2 rounded-full bg-[#6D5DFB] animate-pulse"></div>
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}

