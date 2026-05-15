import React from "react";
import { cn } from "@/lib/utils";

/**
 * @deprecated Use premium-card classes directly
 */
interface HeritageCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "jharokha" | "glass";
    pattern?: "none" | "jaipuri" | "mandala";
}

export function HeritageCard({
    className,
    variant = "default",
    pattern, // Patterns are ignored in Liquid Glass
    children,
    ...props
}: HeritageCardProps) {
    return (
        <div
            className={cn("premium-card", className)}
            {...props}
        >
            {children}
        </div>
    );
}

