import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  // Base card styles with Apple-grade design principles
  "group relative flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
  {
    variants: {
      variant: {
        // Default glass morphism card
        default: "bg-white/8 backdrop-blur-[12px] backdrop-saturate-[140%] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:bg-white/10 hover:backdrop-blur-[14px] hover:backdrop-saturate-[150%] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] hover:transform hover:-translate-y-[1px]",
        
        // Elevated glass card with more prominence
        elevated: "bg-white/12 backdrop-blur-[16px] backdrop-saturate-[160%] border border-white/15 shadow-[0_12px_48px_rgba(0,0,0,0.15)] hover:bg-white/15 hover:backdrop-blur-[20px] hover:backdrop-saturate-[170%] hover:shadow-[0_24px_72px_rgba(0,0,0,0.18)] hover:transform hover:-translate-y-[2px]",
        
        // Subtle glass card for secondary content
        subtle: "bg-white/4 backdrop-blur-[10px] backdrop-saturate-[120%] border border-white/6 shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:bg-white/6 hover:backdrop-blur-[12px] hover:backdrop-saturate-[130%] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:transform hover:-translate-y-[0.5px]",
        
        // Solid card for high contrast needs
        solid: "bg-white/95 border border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] hover:transform hover:-translate-y-[1px]",
        
        // Interactive card for clickable content
        interactive: "bg-white/8 backdrop-blur-[12px] backdrop-saturate-[140%] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:bg-white/12 hover:backdrop-blur-[14px] hover:backdrop-saturate-[150%] hover:shadow-[0_16px_56px_rgba(0,0,0,0.18)] hover:transform hover:-translate-y-[2px] cursor-pointer active:transform active:scale-[0.98]",
      },
      size: {
        sm: "p-4 gap-3 rounded-[16px]",
        default: "p-6 gap-4 rounded-[20px]",
        lg: "p-8 gap-6 rounded-[24px]",
      },
      animation: {
        none: "",
        breathe: "animate-[glass-breathe_6s_ease-in-out_infinite]",
        enter: "animate-[apple-card-fade-in_0.4s_cubic-bezier(0.22,1,0.36,1)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "breathe",
    },
  }
);

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {
  interactive?: boolean;
  loading?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, animation, interactive, loading, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card"
        className={cn(
          cardVariants({ 
            variant: interactive ? "interactive" : variant, 
            size, 
            animation: loading ? "none" : animation 
          }),
          // Loading state
          loading && "pointer-events-none opacity-75",
          className
        )}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
            <div className="w-6 h-6 border-2 border-transparent border-t-current rounded-full animate-spin opacity-60" />
          </div>
        )}
        
        {/* Glass highlight effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {props.children}
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-header"
        className={cn(
          "flex flex-col space-y-2 pb-4 border-b border-white/10 last:border-b-0 last:pb-0",
          className
        )}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-title"
        className={cn(
          "font-semibold leading-tight text-[var(--text-primary)] text-lg",
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-description"
        className={cn(
          "text-sm text-[var(--text-secondary)] leading-relaxed",
          className
        )}
        {...props}
      />
    );
  }
);

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-content"
        className={cn("flex-1", className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-footer"
        className={cn(
          "flex items-center justify-between pt-4 border-t border-white/10 first:border-t-0 first:pt-0",
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  type CardProps,
};

