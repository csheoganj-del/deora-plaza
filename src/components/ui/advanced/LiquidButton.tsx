import React from 'react';

/**
 * LiquidButton - Primary interactive element for the Liquid Glass Design System.
 * 
 * Specs:
 * - Hover: 0.96 scale
 * - Active: 0.92 scale + 10% opacity increase
 */

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'glass' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {

        const baseClasses = `
      inline-flex items-center justify-center
      rounded-[20px] font-medium transition-all duration-400
      ease-[cubic-bezier(0.34,1.56,0.64,1)]
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5DFB]
      disabled:pointer-events-none disabled:opacity-50
      will-change-transform
      active:opacity-90 active:scale-92
      hover:scale-96
    `;

        const variants = {
            primary: `bg-[#6D5DFB] text-white shadow-lg shadow-[#6D5DFB]/30 hover:shadow-[#6D5DFB]/20`,
            secondary: `bg-[#F1F5F9] text-[#111827] dark:bg-[#111827] dark:text-[#F1F5F9] hover:bg-[#E5E7EB]`,
            glass: `bg-white/40 backdrop-blur-md border border-white/40 text-[#111827] shadow-sm hover:bg-white/50`,
            ghost: `hover:bg-black/5 dark:hover:bg-white/5 text-[#111827] dark:text-[#9CA3AF]`,
        };

        const sizes = {
            sm: `h-8 px-3 text-xs`,
            md: `h-10 px-5 text-sm`,
            lg: `h-12 px-8 text-base`,
            icon: `h-10 w-10`,
        };

        return (
            <button
                ref={ref}
                className={`
          ${baseClasses}
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
                {...props}
            />
        );
    }
);

LiquidButton.displayName = "LiquidButton";

export { LiquidButton };

