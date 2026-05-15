"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning' | 'info'
  loading?: boolean
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: 'text-blue-500',
    confirmVariant: 'default' as const
  },
  destructive: {
    icon: XCircle,
    iconColor: 'text-red-500',
    confirmVariant: 'destructive' as const
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    confirmVariant: 'default' as const
  },
  info: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    confirmVariant: 'default' as const
  }
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false
}: ConfirmationDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 bg-gray-100 ${config.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useConfirmationDialog() {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    variant?: 'default' | 'destructive' | 'warning' | 'info'
    confirmText?: string
    cancelText?: string
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  })

  const showConfirmation = React.useCallback((options: {
    title: string
    description: string
    onConfirm: () => void
    variant?: 'default' | 'destructive' | 'warning' | 'info'
    confirmText?: string
    cancelText?: string
  }) => {
    setDialog({
      isOpen: true,
      ...options
    })
  }, [])

  const hideConfirmation = React.useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  const ConfirmationDialogComponent = React.useCallback(() => (
    <ConfirmationDialog
      isOpen={dialog.isOpen}
      onClose={hideConfirmation}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      description={dialog.description}
      variant={dialog.variant}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
    />
  ), [dialog, hideConfirmation])

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent
  }
}