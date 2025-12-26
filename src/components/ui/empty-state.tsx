import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 md:p-12 text-center",
      className
    )}>
      {Icon && (
        <div className="mb-4 rounded-full bg-[#F1F5F9] dark:bg-[#111827] p-6">
          <Icon className="h-12 w-12 text-[#9CA3AF] dark:text-[#9CA3AF]" />
        </div>
      )}
      <h3 className="text-lg md:text-xl font-semibold text-[#111827] dark:text-[#F1F5F9] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm md:text-base text-[#9CA3AF] dark:text-[#9CA3AF] max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-[#F59E0B]/100 hover:bg-[#F59E0B] text-white"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

