import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FrostedCard - Card component with frosted glass effect
 * This is an enhanced version of the standard Card with frosted glass styling
 */

function FrostedCard({
    className,
    intensity = 'medium',
    showTexture = true,
    ...props
}: React.ComponentProps<"div"> & {
    intensity?: 'light' | 'medium' | 'heavy';
    showTexture?: boolean;
}) {
    const intensityClasses = {
        light: 'frosted-glass-light',
        medium: 'frosted-glass-medium',
        heavy: 'frosted-glass-heavy',
    };

    return (
        <div
            data-slot="frosted-card"
            className={cn(
                "group flex flex-col gap-6 rounded-xl py-6 transition-all duration-300",
                intensityClasses[intensity],
                showTexture && 'frosted-texture',
                "hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)]",
                className,
            )}
            {...props}
        />
    );
}

function FrostedCardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="frosted-card-header"
            className={cn(
                "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
                className,
            )}
            {...props}
        />
    );
}

function FrostedCardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="frosted-card-title"
            className={cn("leading-none font-semibold", className)}
            {...props}
        />
    );
}

function FrostedCardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="frosted-card-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

function FrostedCardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="frosted-card-content"
            className={cn("px-6", className)}
            {...props}
        />
    );
}

function FrostedCardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="frosted-card-footer"
            className={cn(
                "flex items-center justify-between gap-2 px-6 pt-3",
                className,
            )}
            {...props}
        />
    );
}

export {
    FrostedCard,
    FrostedCardHeader,
    FrostedCardTitle,
    FrostedCardDescription,
    FrostedCardContent,
    FrostedCardFooter,
};

