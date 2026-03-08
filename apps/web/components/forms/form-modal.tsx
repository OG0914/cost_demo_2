'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ==================== 类型定义 ====================

export interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onSubmit?: () => void | Promise<void>
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  loading?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  footer?: React.ReactNode
  hideFooter?: boolean
}

// ==================== 组件 ====================

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitText = '保存',
  cancelText = '取消',
  loading = false,
  disabled = false,
  size = 'md',
  className,
  footer,
  hideFooter = false,
}: FormModalProps) {
  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">{children}</div>

        {!hideFooter && (
          <DialogFooter>
            {footer || (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={disabled || loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitText}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ==================== 便捷导出：确认弹窗 ====================

export interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void | Promise<void>
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: 'default' | 'destructive'
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  loading = false,
  variant = 'default',
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
