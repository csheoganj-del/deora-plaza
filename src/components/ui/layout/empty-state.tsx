"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Package, 
  Users, 
  ShoppingCart, 
  FileText, 
  Calendar,
  Database,
  Plus,
  RefreshCw
} from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const iconMap = {
  search: Search,
  package: Package,
  users: Users,
  cart: ShoppingCart,
  file: FileText,
  calendar: Calendar,
  database: Database,
  plus: Plus,
  refresh: RefreshCw
}

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  const Icon = IconComponent || Database

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      
      <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
      
      {(action || secondaryAction) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Predefined empty states for common scenarios
export function NoDataEmptyState({ 
  onRefresh, 
  entityName = "items" 
}: { 
  onRefresh?: () => void
  entityName?: string 
}) {
  return (
    <EmptyState
      icon={Database}
      title={`No ${entityName} found`}
      description={`There are no ${entityName} to display at the moment.`}
      action={onRefresh ? {
        label: "Refresh",
        onClick: onRefresh,
        variant: "outline"
      } : undefined}
    />
  )
}

export function SearchEmptyState({ 
  searchTerm, 
  onClear 
}: { 
  searchTerm: string
  onClear: () => void 
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No results found for "${searchTerm}". Try adjusting your search terms.`}
      action={{
        label: "Clear search",
        onClick: onClear,
        variant: "outline"
      }}
    />
  )
}

export function CreateFirstEmptyState({ 
  entityName, 
  onCreate 
}: { 
  entityName: string
  onCreate: () => void 
}) {
  return (
    <EmptyState
      icon={Plus}
      title={`Create your first ${entityName}`}
      description={`Get started by creating your first ${entityName}.`}
      action={{
        label: `Create ${entityName}`,
        onClick: onCreate
      }}
    />
  )
}

export function ErrorEmptyState({ 
  onRetry 
}: { 
  onRetry: () => void 
}) {
  return (
    <EmptyState
      icon={RefreshCw}
      title="Something went wrong"
      description="We couldn't load the data. Please try again."
      action={{
        label: "Try again",
        onClick: onRetry,
        variant: "outline"
      }}
    />
  )
}