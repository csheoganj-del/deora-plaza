"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SimplifiedGlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  enableHover?: boolean;
  variant?: 'default' | 'stats' | 'action' | 'insight';
}

export function SimplifiedGlassCard({
  children,
  className,
  delay = 0,
  enableHover = true,
  variant = 'default'
}: SimplifiedGlassCardProps) {
  const variants = {
    default: "simplified-card",
    stats: "simplified-stats-card",
    action: "simplified-action-card",
    insight: "simplified-insight-card"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={cn(
        variants[variant],
        enableHover && "hover:transform hover:scale-[1.02] hover:-translate-y-1",
        className
      )}
    >
      {children}
    </motion.div>
  );
}