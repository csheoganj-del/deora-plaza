"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: "increase" | "decrease"
    period: string
  }
  icon: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger"
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-green-200 bg-[#DCFCE7]/50 dark:border-green-800 dark:bg-green-950/50",
    warning: "border-[#F59E0B]/20/20 bg-[#F59E0B]/10 dark:border-[#F59E0B]/20/20 dark:bg-[#F59E0B]/10",
    danger: "border-red-200 bg-[#FEE2E2]/50 dark:border-red-800 dark:bg-red-950/50",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "glass-card p-6 space-y-4 hover:shadow-lg transition-all duration-200",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-primary/10">
          {icon}
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            change.type === "increase" ? "text-[#22C55E] dark:text-green-400" : "text-[#EF4444] dark:text-red-400"
          )}>
            {change.type === "increase" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(change.value)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        {change && (
          <p className="text-xs text-muted-foreground">
            vs {change.period}
          </p>
        )}
      </div>
    </motion.div>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  variant?: "default" | "primary" | "success" | "warning"
}

export function QuickAction({
  title,
  description,
  icon,
  onClick,
  variant = "default"
}: QuickActionProps) {
  const variantStyles = {
    default: "hover:bg-muted/50",
    primary: "hover:bg-primary/10 border-primary/20",
    success: "hover:bg-[#DCFCE7] border-green-200 dark:hover:bg-green-950 dark:border-green-800",
    warning: "hover:bg-[#F59E0B]/10 border-[#F59E0B]/20/20 dark:hover:bg-[#F59E0B]/10 dark:border-[#F59E0B]/20/20",
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "glass-card p-4 text-left w-full transition-all duration-200 border-0",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          {icon}
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.button>
  )
}

interface AlertItemProps {
  title: string
  description: string
  type: "info" | "warning" | "error" | "success"
  timestamp: string
  onDismiss?: () => void
}

export function AlertItem({
  title,
  description,
  type,
  timestamp,
  onDismiss
}: AlertItemProps) {
  const typeConfig = {
    info: { icon: Clock, color: "text-[#6D5DFB] dark:text-blue-400" },
    warning: { icon: AlertTriangle, color: "text-[#F59E0B] dark:text-[#F59E0B]400" },
    error: { icon: AlertTriangle, color: "text-[#EF4444] dark:text-red-400" },
    success: { icon: CheckCircle, color: "text-[#22C55E] dark:text-green-400" },
  }

  const { icon: Icon, color } = typeConfig[type]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="glass-card p-4 border-l-4 border-l-current"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", color)} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
          <p className="text-xs text-muted-foreground mt-2">{timestamp}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// Dashboard layout components
export function DashboardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {children}
    </div>
  )
}

export function DashboardSection({ 
  title, 
  description, 
  children, 
  className,
  action
}: { 
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// Pre-built dashboard widgets
export function RevenueMetrics({ data }: { data: any }) {
  return (
    <DashboardGrid>
      <MetricCard
        title="Today's Revenue"
        value={`₹${data.today?.toLocaleString() || 0}`}
        change={{ value: 12.5, type: "increase", period: "yesterday" }}
        icon={<DollarSign className="h-5 w-5 text-primary" />}
        variant="success"
      />
      <MetricCard
        title="Total Orders"
        value={data.orders || 0}
        change={{ value: 8.2, type: "increase", period: "yesterday" }}
        icon={<ShoppingCart className="h-5 w-5 text-primary" />}
      />
      <MetricCard
        title="Active Customers"
        value={data.customers || 0}
        change={{ value: 3.1, type: "decrease", period: "last week" }}
        icon={<Users className="h-5 w-5 text-primary" />}
      />
      <MetricCard
        title="Low Stock Items"
        value={data.lowStock || 0}
        icon={<Package className="h-5 w-5 text-primary" />}
        variant={data.lowStock > 5 ? "warning" : "default"}
      />
    </DashboardGrid>
  )
}

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <QuickAction
        title="New Order"
        description="Create a new order for walk-in customers"
        icon={<ShoppingCart className="h-5 w-5 text-primary" />}
        onClick={() => {}}
        variant="primary"
      />
      <QuickAction
        title="Generate Report"
        description="Create daily sales and inventory reports"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        onClick={() => {}}
      />
      <QuickAction
        title="Manage Inventory"
        description="Update stock levels and manage suppliers"
        icon={<Package className="h-5 w-5 text-primary" />}
        onClick={() => {}}
      />
    </div>
  )
}

