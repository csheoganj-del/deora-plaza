import React from 'react';

interface GlassMorphismCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const GlassMorphismCard = React.forwardRef<HTMLDivElement, GlassMorphismCardProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={`drop-shadow ${className}`}
        style={{ fontFamily: 'Rajdhani, sans-serif' }}
        {...props}
      >
        <div className="glass"></div>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

GlassMorphismCard.displayName = "GlassMorphismCard";

export { GlassMorphismCard };

