import React from "react";
import { cn } from "@/lib/utils";

interface OrnamentalHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    variant?: "default" | "gold-gradient" | "royal";
    align?: "left" | "center" | "right";
    icon?: React.ElementType;
}

export function OrnamentalHeading({
    className,
    variant = "default",
    align = "left",
    icon: Icon,
    children,
    ...props
}: OrnamentalHeadingProps) {
    return (
        <div className={cn("mb-6", className)}>
            <div className={cn(
                "flex items-center gap-3",
                align === "center" && "justify-center",
                align === "right" && "justify-end"
            )}>
                {Icon && <Icon className="h-6 w-6 text-[hsl(var(--rajasthani-gold))]" />}
                <h2
                    className={cn(
                        "font-serif font-bold tracking-tight",
                        variant === "default" && "text-[#111827] text-2xl",
                        variant === "gold-gradient" && "text-gradient-gold text-3xl uppercase tracking-widest",
                        variant === "royal" && "text-[hsl(var(--rajasthani-maroon))] text-4xl border-b-2 border-[hsl(var(--rajasthani-gold))/30 pb-2"
                    )}
                    {...props}
                >
                    {children}
                </h2>
                {Icon && align === "center" && <Icon className="h-6 w-6 text-[hsl(var(--rajasthani-gold))] transform scale-x-[-1]" />}
            </div>
            {variant === "gold-gradient" && (
                <div className="h-1 w-24 mx-auto mt-2 bg-gradient-to-r from-transparent via-[hsl(var(--rajasthani-gold))] to-transparent" />
            )}
        </div>
    );
}

