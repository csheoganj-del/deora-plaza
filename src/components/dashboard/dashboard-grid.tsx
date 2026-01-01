"use client";

import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn("dashboard-grid space-y-8", className)}>
      {children}
    </div>
  );
}

interface DashboardSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({ title, children, className }: DashboardSectionProps) {
  return (
    <section className={cn("dashboard-section", className)}>
      {title && (
        <h2 className="text-lg font-semibold text-high-contrast mb-4">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function StatsSection({ children, className }: DashboardSectionProps) {
  return (
    <DashboardSection className={cn("stats-section", className)}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </DashboardSection>
  );
}

export function ActionsSection({ children, className }: DashboardSectionProps) {
  return (
    <DashboardSection title="Quick Actions" className={cn("actions-section", className)}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </DashboardSection>
  );
}

export function InsightsSection({ children, className }: DashboardSectionProps) {
  return (
    <DashboardSection title="Insights & Alerts" className={cn("insights-section", className)}>
      <div className="grid gap-4 md:grid-cols-2">
        {children}
      </div>
    </DashboardSection>
  );
}