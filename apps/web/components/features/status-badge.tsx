'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { QuotationStatus } from '@/lib/types'

// ==================== 类型定义 ====================

export type StatusVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'

export interface StatusConfig {
  label: string
  variant: StatusVariant
}

export interface StatusBadgeProps {
  status: string
  config?: Record<string, StatusConfig>
  className?: string
}

// ==================== 预设配置 ====================

// 报价单状态配置
export const quotationStatusConfig: Record<QuotationStatus, StatusConfig> = {
  draft: { label: '草稿', variant: 'secondary' },
  submitted: { label: '待审核', variant: 'warning' },
  approved: { label: '已批准', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'destructive' },
}

// 通用启用/禁用状态配置
export const activeStatusConfig: Record<string, StatusConfig> = {
  active: { label: '启用', variant: 'success' },
  inactive: { label: '禁用', variant: 'destructive' },
  enabled: { label: '启用', variant: 'success' },
  disabled: { label: '禁用', variant: 'destructive' },
}

// 审核状态配置
export const reviewStatusConfig: Record<string, StatusConfig> = {
  pending: { label: '待审核', variant: 'warning' },
  approved: { label: '已通过', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'destructive' },
  processing: { label: '处理中', variant: 'info' },
}

// 通知状态配置
export const notificationStatusConfig: Record<string, StatusConfig> = {
  pending: { label: '待处理', variant: 'warning' },
  processed: { label: '已处理', variant: 'success' },
  archived: { label: '已归档', variant: 'secondary' },
}

// 销售类型配置
export const saleTypeConfig: Record<string, StatusConfig> = {
  domestic: { label: '内销', variant: 'default' },
  export: { label: '外销', variant: 'info' },
}

// ==================== 组件 ====================

const variantClasses: Record<StatusVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  success:
    'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100',
  warning:
    'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100',
  destructive:
    'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100',
  info: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100',
}

export function StatusBadge({
  status,
  config = {},
  className,
}: StatusBadgeProps) {
  const statusConfig = config[status]

  if (!statusConfig) {
    return <Badge className={className}>{status}</Badge>
  }

  return (
    <Badge
      className={cn(
        variantClasses[statusConfig.variant],
        'font-medium',
        className
      )}
    >
      {statusConfig.label}
    </Badge>
  )
}

// ==================== 便捷导出：报价单状态标签 ====================

export interface QuotationStatusBadgeProps {
  status: QuotationStatus
  className?: string
}

export function QuotationStatusBadge({
  status,
  className,
}: QuotationStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      config={quotationStatusConfig}
      className={className}
    />
  )
}

// ==================== 便捷导出：启用状态标签 ====================

export interface ActiveStatusBadgeProps {
  status: 'active' | 'inactive' | 'enabled' | 'disabled' | string
  className?: string
}

export function ActiveStatusBadge({
  status,
  className,
}: ActiveStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      config={activeStatusConfig}
      className={className}
    />
  )
}

// ==================== 便捷导出：审核状态标签 ====================

export interface ReviewStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'processing' | string
  className?: string
}

export function ReviewStatusBadge({
  status,
  className,
}: ReviewStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      config={reviewStatusConfig}
      className={className}
    />
  )
}

// ==================== 便捷导出：销售类型标签 ====================

export interface SaleTypeBadgeProps {
  type: 'domestic' | 'export' | string
  className?: string
}

export function SaleTypeBadge({ type, className }: SaleTypeBadgeProps) {
  return (
    <StatusBadge status={type} config={saleTypeConfig} className={className} />
  )
}
