'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ==================== 类型定义 ====================

export interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  onBack?: () => void
  actions?: React.ReactNode
  className?: string
}

export interface PageHeaderActionProps {
  children: React.ReactNode
  className?: string
}

export interface CreateButtonProps {
  onClick?: () => void
  href?: string
  children?: React.ReactNode
  className?: string
}

// ==================== 组件 ====================

export function PageHeader({
  title,
  description,
  backHref,
  onBack,
  actions,
  className,
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div className={cn('mb-6 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {(backHref || onBack) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

// ==================== 便捷导出：页面操作区 ====================

export function PageHeaderActions({
  children,
  className,
}: PageHeaderActionProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>{children}</div>
  )
}

// ==================== 便捷导出：新建按钮 ====================

export function CreateButton({
  onClick,
  href,
  children = '新建',
  className,
}: CreateButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      onClick?.()
    }
  }

  return (
    <Button onClick={handleClick} className={className}>
      <Plus className="mr-2 h-4 w-4" />
      {children}
    </Button>
  )
}

// ==================== 便捷导出：面包屑 ====================

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const router = useRouter()

  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-muted-foreground">/</span>}
          {item.href ? (
            <button
              onClick={() => router.push(item.href!)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span
              className={
                index === items.length - 1
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
