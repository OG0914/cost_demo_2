'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, Send, FileBarChart, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuotation } from '@/hooks/api'
import type { QuotationStatus } from '@/lib/types'

const statusConfig: Record<QuotationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  submitted: { label: '待审核', variant: 'default' },
  approved: { label: '已通过', variant: 'outline' },
  rejected: { label: '已退回', variant: 'destructive' },
}

const saleTypeLabels = {
  domestic: '内销',
  export: '外销',
}

const shippingTypeLabels = {
  fcl20: '整柜20尺',
  fcl40: '整柜40尺',
  lcl: '拼箱',
}

export default function CostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { quotation: q, isLoading } = useQuotation(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!q) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">报价单不存在</p>
          <Button asChild className="mt-4">
            <Link href="/cost/records">返回列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  const canEdit = q.status === 'draft' || q.status === 'rejected'
  const canSubmit = q.status === 'draft' || q.status === 'rejected'

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cost/records">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{q.quotationNo}</h1>
              <Badge variant={statusConfig[q.status].variant}>
                {statusConfig[q.status].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              创建于 {q.createdAt} · 更新于 {q.updatedAt}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/cost/${q.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                编辑
              </Link>
            </Button>
          )}
          {canSubmit && (
            <Button>
              <Send className="mr-2 size-4" />
              提交审核
            </Button>
          )}
        </div>
      </div>

      {/* 审核信息 */}
      {q.reviewedAt && (
        <Card className={q.status === 'approved' ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
          <CardContent className="flex items-start gap-3 py-4">
            {q.status === 'approved' ? (
              <CheckCircle2 className="size-5 text-green-600" />
            ) : (
              <XCircle className="size-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                {q.status === 'approved' ? '审核通过' : '审核退回'}
              </p>
              <p className="text-sm text-muted-foreground">
                {q.reviewedAt} · {q.reviewNote}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧信息 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 基础信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基础信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">客户</p>
                  <p className="font-medium">{q.customer?.name}</p>
                  <p className="text-xs text-muted-foreground">{q.customer?.code} · {q.customer?.region}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">法规/型号</p>
                  <p className="font-medium">{q.regulation?.name} / {q.model?.name}</p>
                  <p className="text-xs text-muted-foreground">{q.model?.series} · {q.model?.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">包装配置</p>
                  <p className="font-medium">{q.packagingConfig?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">销售类型</p>
                  <p className="font-medium">{saleTypeLabels[q.saleType]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">运输方式</p>
                  <p className="font-medium">{shippingTypeLabels[q.shippingType]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">数量</p>
                  <p className="font-medium">{q.quantity.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOM和包材工序简化展示 */}
          <Card>
            <CardHeader>
              <CardTitle>成本明细</CardTitle>
              <CardDescription>各成本项明细</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">成本项目</th>
                      <th className="px-3 py-2 text-right font-medium">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-2 text-muted-foreground">原料成本</td>
                      <td className="px-3 py-2 text-right">¥{q.costs?.materialCost?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-2 text-muted-foreground">包材成本</td>
                      <td className="px-3 py-2 text-right">¥{q.costs?.packagingCost?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-2 text-muted-foreground">工序成本</td>
                      <td className="px-3 py-2 text-right">¥{q.costs?.processCost?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-2 text-muted-foreground">运费</td>
                      <td className="px-3 py-2 text-right">¥{q.costs?.shippingCost?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-2 text-muted-foreground">管销费用</td>
                      <td className="px-3 py-2 text-right">¥{q.costs?.adminFee?.toLocaleString()}</td>
                    </tr>
                    {q.saleType === 'domestic' && (
                      <tr className="border-b">
                        <td className="px-3 py-2 text-muted-foreground">增值税</td>
                        <td className="px-3 py-2 text-right">¥{q.costs?.vat?.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="font-medium">
                      <td className="px-3 py-2">总成本</td>
                      <td className="px-3 py-2 text-right">¥{q.costs?.totalCost?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧费用汇总 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="size-5" />
                费用汇总
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">原料成本</span>
                  <span>¥{q.costs?.materialCost?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">包材成本</span>
                  <span>¥{q.costs?.packagingCost?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">工序成本</span>
                  <span>¥{q.costs?.processCost?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">运费</span>
                  <span>¥{q.costs?.shippingCost?.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">管销费用</span>
                  <span>¥{q.costs?.adminFee?.toLocaleString()}</span>
                </div>
                {q.saleType === 'domestic' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">增值税</span>
                    <span>¥{q.costs?.vat?.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="font-medium">总成本</span>
                <span className="text-xl font-bold">¥{q.costs?.totalCost?.toLocaleString()}</span>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">单件成本</span>
                  <span className="font-medium">¥{q.costs?.totalCost ? (q.costs.totalCost / q.quantity).toFixed(2) : '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
