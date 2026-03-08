// 数据格式化工具函数

// ==================== 货币格式化 ====================

export interface FormatCurrencyOptions {
  currency?: 'CNY' | 'USD'
  decimals?: number
  showSymbol?: boolean
}

export function formatCurrency(
  value: number,
  options: FormatCurrencyOptions = {}
): string {
  const { currency = 'CNY', decimals = 2, showSymbol = true } = options

  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  const formatted = formatter.format(value)

  if (!showSymbol) {
    return formatted.replace(/[^\d.,]/g, '')
  }

  return formatted
}

export function formatCNY(value: number, decimals = 2): string {
  return formatCurrency(value, { currency: 'CNY', decimals })
}

export function formatUSD(value: number, decimals = 2): string {
  return formatCurrency(value, { currency: 'USD', decimals })
}

// ==================== 数字格式化 ====================

export interface FormatNumberOptions {
  decimals?: number
  thousandsSeparator?: boolean
  suffix?: string
}

export function formatNumber(
  value: number,
  options: FormatNumberOptions = {}
): string {
  const { decimals = 0, thousandsSeparator = true, suffix = '' } = options

  const formatter = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: thousandsSeparator,
  })

  return formatter.format(value) + suffix
}

export function formatPercent(value: number, decimals = 2): string {
  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return formatter.format(value / 100)
}

export function formatQuantity(value: number): string {
  return formatNumber(value, { thousandsSeparator: true })
}

// ==================== 日期格式化 ====================

export type DateFormat = 'date' | 'datetime' | 'time' | 'short'

const dateFormatMap: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  date: { year: 'numeric', month: '2-digit', day: '2-digit' },
  datetime: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  },
  time: { hour: '2-digit', minute: '2-digit' },
  short: { month: 'short', day: 'numeric' },
}

export function formatDate(
  date: Date | string | number,
  format: DateFormat = 'date'
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('zh-CN', dateFormatMap[format]).format(d)
}

export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, 'datetime')
}

export function formatRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 30) {
    return `${diffDays}天前`
  } else {
    return formatDate(date)
  }
}

// ==================== 文本格式化 ====================

export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + suffix
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// ==================== 业务专用格式化 ====================

export function formatQuotationNo(no: string): string {
  return no.toUpperCase()
}

export function formatMaterialNo(no: string): string {
  return no.toUpperCase()
}

export function formatCustomerCode(code: string): string {
  return code.toUpperCase()
}

export function formatUnitPrice(price: number, currency: 'CNY' | 'USD' = 'CNY'): string {
  return formatCurrency(price, { currency, decimals: 4, showSymbol: false })
}

export function formatCostBreakdown(costs: {
  materialCost: number
  packagingCost: number
  processCost: number
  shippingCost: number
  adminFee: number
  vat: number
  totalCost: number
}): Record<keyof typeof costs, string> {
  return {
    materialCost: formatCNY(costs.materialCost),
    packagingCost: formatCNY(costs.packagingCost),
    processCost: formatCNY(costs.processCost),
    shippingCost: formatCNY(costs.shippingCost),
    adminFee: formatCNY(costs.adminFee),
    vat: formatCNY(costs.vat),
    totalCost: formatCNY(costs.totalCost),
  }
}
