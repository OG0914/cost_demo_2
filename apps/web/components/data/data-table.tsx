'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

// ==================== 类型定义 ====================

export interface Column<T> {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (row: T, index: number) => React.ReactNode
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  pagination?: PaginationConfig
  sortable?: boolean
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  emptyText?: string
  className?: string
  rowClassName?: (row: T) => string
  onRowClick?: (row: T) => void
}

// ==================== 组件 ====================

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  pagination,
  sortable = false,
  onSort,
  emptyText = '暂无数据',
  className,
  rowClassName,
  onRowClick,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const handleSort = (key: string) => {
    if (!sortable) return

    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
    onSort?.(key, direction)
  }

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null

    if (sortConfig?.key !== column.key) {
      return <ChevronsUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
    }

    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    )
  }

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer select-none',
                    'whitespace-nowrap'
                  )}
                  onClick={() => handleSort(column.key)}
                >
                  <div
                    className={cn(
                      'flex items-center',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}
                  >
                    {column.title}
                    {getSortIcon(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  加载中...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={keyExtractor(row)}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(row)
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${keyExtractor(row)}-${column.key}`}
                      className={cn(
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.render
                        ? column.render(row, index)
                        : (row as Record<string, unknown>)[column.key] as React.ReactNode}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {pagination && totalPages > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {pagination.total} 条记录，第 {pagination.page} / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
