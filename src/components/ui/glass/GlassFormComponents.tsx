"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export interface GlassInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
    ({ className, icon, ...props }, ref) => {
        return (
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors group-focus-within:text-white/80 pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    className={cn(
                        "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm transition-all duration-200",
                        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                        "placeholder:text-white/30",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:bg-white/10 focus-visible:border-white/20",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "hover:bg-white/8 hover:border-white/15",
                        "[color-scheme:dark]",
                        "[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[1] [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
                        icon && "pl-10",
                        className
                    )}
                    ref={ref}
                    onClick={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target && 'showPicker' in target && ['date', 'datetime-local', 'time', 'month', 'week'].includes(target.type)) {
                            try {
                                target.showPicker();
                            } catch (error) {
                                // Ignore potential errors
                            }
                        }
                        props.onClick?.(e);
                    }}
                    {...props}
                />
                {/* Glow effect on focus */}
                <div className="absolute inset-0 -z-10 rounded-xl bg-white/5 opacity-0 blur-lg transition-opacity duration-500 group-focus-within:opacity-100" />
            </div>
        );
    }
);
GlassInput.displayName = "GlassInput";

export interface GlassSelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {
    icon?: React.ReactNode;
}

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
    ({ className, children, icon, ...props }, ref) => {
        return (
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors group-focus-within:text-white/80">
                        {icon}
                    </div>
                )}
                <select
                    className={cn(
                        "flex h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:bg-white/10 focus-visible:border-white/20",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "hover:bg-white/8 hover:border-white/15",
                        "[&>option]:bg-[#1a1a1a] [&>option]:text-white [&>option]:py-2",
                        icon && "pl-10",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {children}
                </select>
                {/* Custom Chevron */}
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        );
    }
);
GlassSelect.displayName = "GlassSelect";

export const GlassLabel = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            "text-sm font-medium leading-none text-white/70 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block",
            className
        )}
        {...props}
    />
));
GlassLabel.displayName = "GlassLabel";

export interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "glass";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, variant = "glass", size = "md", isLoading, icon, children, ...props }, ref) => {

        // Size variants
        const sizeStyles = {
            sm: "h-9 px-3 text-xs",
            md: "h-11 px-5 text-sm",
            lg: "h-14 px-8 text-base",
            icon: "h-11 w-11"
        };

        // Variant styles
        const variantStyles = {
            glass: "bg-white/10 border border-white/10 text-white hover:bg-white/15 hover:border-white/20 active:bg-white/20",
            primary: "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white font-semibold border-none hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98]",
            secondary: "bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 hover:text-white active:bg-white/15",
            ghost: "bg-transparent border-transparent text-white/70 hover:bg-white/5 hover:text-white active:bg-white/10",
            danger: "bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20 hover:text-red-100 hover:border-red-500/30"
        };

        return (
            <motion.button
                className={cn(
                    "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    sizeStyles[size],
                    variantStyles[variant],
                    className
                )}
                ref={ref}
                whileTap={{ scale: 0.96 }}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {icon && <span className="mr-2 flex items-center">{icon}</span>}
                {children}
            </motion.button>
        );
    }
);
GlassButton.displayName = "GlassButton";

export interface GlassTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <div className="relative group">
                <textarea
                    className={cn(
                        "flex min-h-[80px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm transition-all duration-200",
                        "placeholder:text-white/30",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:bg-white/10 focus-visible:border-white/20",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "hover:bg-white/8 hover:border-white/15",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {/* Glow effect on focus */}
                <div className="absolute inset-0 -z-10 rounded-xl bg-white/5 opacity-0 blur-lg transition-opacity duration-500 group-focus-within:opacity-100" />
            </div>
        );
    }
);
GlassTextarea.displayName = "GlassTextarea";
