"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function BreadcrumbNav({ 
  items, 
  className,
  showHome = true 
}: BreadcrumbNavProps) {
  const allItems = showHome 
    ? [{ label: "Dashboard", href: "/dashboard" }, ...items]
    : items;

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      {showHome && (
        <>
          <Link 
            href="/dashboard"
            className="flex items-center text-neutral-text hover:text-high-contrast transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-neutral-text" />
        </>
      )}
      
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        
        return (
          <div key={index} className="flex items-center space-x-1">
            {item.href && !item.active ? (
              <Link
                href={item.href}
                className="text-neutral-text hover:text-high-contrast transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                "font-medium",
                item.active || isLast ? "text-high-contrast" : "text-neutral-text"
              )}>
                {item.label}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-neutral-text" />
            )}
          </div>
        );
      })}
    </nav>
  );
}