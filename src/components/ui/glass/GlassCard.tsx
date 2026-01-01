import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    variant?: 'base' | 'elevated' | 'flat' | 'frosted' | 'morph';
    interactive?: boolean;
    frostedIntensity?: 'light' | 'medium' | 'heavy';
    showTexture?: boolean;
    className?: string;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className = '', children, variant = 'base', interactive = false, frostedIntensity = 'medium', showTexture = true, ...props }, ref) => {

        // Handle morph variant separately
        if (variant === 'morph') {
            const interactionClass = interactive ? 'cursor-pointer' : '';
            
            return (
                <div
                    ref={ref}
                    className={`
                        drop-shadow
                        rounded-[20px]
                        ${interactionClass}
                        ${className}
                    `}
                    {...props}
                >
                    <div className="glass"></div>
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>
            );
        }

        // Handle frosted variant separately
        if (variant === 'frosted') {
            const frostedClasses = {
                light: 'frosted-glass-light',
                medium: 'frosted-glass-medium',
                heavy: 'frosted-glass-heavy',
            };

            const textureClass = showTexture ? 'frosted-texture' : '';
            const interactionClass = interactive ? 'frosted-interactive' : '';

            return (
                <div
                    ref={ref}
                    className={`
                        rounded-[20px]
                        ${frostedClasses[frostedIntensity]}
                        ${textureClass}
                        ${interactionClass}
                        ${className}
                    `}
                    {...props}
                >
                    {children}
                </div>
            );
        }

        // Base classes always applied (for non-frosted variants)
        const baseClasses = `
      relative overflow-hidden
      rounded-[20px] 
      border border-white/40 dark:border-white/10
      backdrop-blur-md backdrop-brightness-110
      transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]
      will-change-transform
    `;

        // Variant styles
        const variants = {
            base: `bg-white/65 dark:bg-black/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/25`,
            elevated: `bg-white/75 dark:bg-black/50 shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-white/25`,
            flat: `bg-white/30 dark:bg-black/20 shadow-none border-white/20`,
        };

        // Interaction styles
        const interactionClasses = interactive
            ? `cursor-pointer hover:scale-96 active:scale-92 active:opacity-90 hover:shadow-sm`
            : ``;

        return (
            <div
                ref={ref}
                className={`
          ${baseClasses}
          ${variants[variant as 'base' | 'elevated' | 'flat']}
          ${interactionClasses}
          ${className}
        `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };