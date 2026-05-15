"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SimplifiedGlassCard } from "@/components/ui/simplified-glass-card";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  delay?: number;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function QuickActionCard({
  title,
  description,
  icon,
  href,
  onClick,
  delay = 0,
  className,
  variant = 'secondary'
}: QuickActionCardProps) {
  const CardContent = () => (
    <SimplifiedGlassCard 
      variant="action" 
      delay={delay}
      className={cn("p-6 h-full", className)}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="simplified-icon-container">
            {icon}
          </div>
          <ArrowUpRight className="h-4 w-4 text-neutral-text group-hover:text-primary-action group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-high-contrast mb-2">
            {title}
          </h3>
          <p className="text-sm text-neutral-text">
            {description}
          </p>
        </div>
      </div>
    </SimplifiedGlassCard>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        <CardContent />
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="group block w-full text-left">
      <CardContent />
    </button>
  );
}