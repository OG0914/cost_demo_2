'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// 错误边界 Props
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  resetKeys?: Array<string | number>
}

// 错误边界 State
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// 错误上报数据
interface ErrorReportData {
  error: {
    name: string
    message: string
    stack?: string
  }
  errorInfo: {
    componentStack?: string
  }
  timestamp: string
  url: string
  userAgent: string
  userId?: string
}

/**
 * React 错误边界组件
 * 捕获子组件树中的 JavaScript 错误，记录错误并显示 fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // 调用自定义错误处理
    this.props.onError?.(error, errorInfo)

    // 上报错误
    this.reportError(error, errorInfo)

    // 控制台输出（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Component stack:', errorInfo.componentStack)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // 当 resetKeys 变化时自动重置错误状态
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )
      if (hasResetKeyChanged) {
        this.handleReset()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  /**
   * 上报错误到服务器
   */
  private reportError(error: Error, errorInfo: ErrorInfo) {
    const reportData: ErrorReportData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    }

    // 尝试从 localStorage 获取用户信息
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          reportData.userId = user.id
        }
      } catch {
        // 忽略解析错误
      }
    }

    // 发送到错误收集服务
    this.sendErrorReport(reportData)
  }

  /**
   * 发送错误报告
   */
  private async sendErrorReport(data: ErrorReportData) {
    try {
      // 优先使用 Beacon API（页面卸载时也能发送）
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        })
        const sent = navigator.sendBeacon('/api/v1/errors/client', blob)
        if (sent) return
      }

      // 降级使用 fetch
      await fetch('/api/v1/errors/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        // 保持页面活跃直到发送完成
        keepalive: true,
      })
    } catch {
      // 错误上报失败，存储到本地稍后重试
      this.storeErrorForRetry(data)
    }
  }

  /**
   * 存储错误以便稍后重试
   */
  private storeErrorForRetry(data: ErrorReportData) {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('pendingErrors')
      const pendingErrors: ErrorReportData[] = stored ? JSON.parse(stored) : []
      pendingErrors.push(data)
      // 最多保留 10 条
      if (pendingErrors.length > 10) {
        pendingErrors.shift()
      }
      localStorage.setItem('pendingErrors', JSON.stringify(pendingErrors))
    } catch {
      // 存储失败，静默处理
    }
  }

  /**
   * 重置错误状态
   */
  private handleReset = () => {
    this.props.onReset?.()
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  /**
   * 返回首页
   */
  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  /**
   * 刷新页面
   */
  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误 UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
          onReload={this.handleReload}
        />
      )
    }

    return this.props.children
  }
}

/**
 * 默认错误 Fallback UI
 */
interface DefaultErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
  onGoHome: () => void
  onReload: () => void
}

function DefaultErrorFallback({
  error,
  errorInfo,
  onReset,
  onGoHome,
  onReload,
}: DefaultErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            页面出现错误
          </CardTitle>
          <CardDescription className="mt-2">
            抱歉，应用程序遇到了意外错误。我们已经记录了这个问题。
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 错误摘要 */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {error?.name || 'Error'}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error?.message || 'Unknown error occurred'}
            </p>
          </div>

          {/* 开发环境显示详细信息 */}
          {isDev && (
            <div className="space-y-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <Bug className="w-4 h-4" />
                {showDetails ? '隐藏技术详情' : '显示技术详情'}
              </button>

              {showDetails && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-auto max-h-64">
                  <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {error?.stack}
                  </pre>
                  {errorInfo?.componentStack && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Component Stack:
                      </p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              onClick={onReset}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
            <Button
              onClick={onReload}
              variant="outline"
              className="flex-1"
            >
              刷新页面
            </Button>
            <Button
              onClick={onGoHome}
              variant="ghost"
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 局部错误边界 - 用于包裹特定组件
 */
interface SectionErrorBoundaryProps {
  children: ReactNode
  sectionName?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export function SectionErrorBoundary({
  children,
  sectionName = '此区域',
  onError,
}: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={onError}
      fallback={
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              {sectionName}加载失败
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              该部分内容加载时出错，请尝试刷新页面。
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * 异步错误边界 - 用于捕获异步操作中的错误
 */
interface AsyncErrorBoundaryProps {
  children: ReactNode
  error: Error | null
  onReset: () => void
}

export function AsyncErrorBoundary({
  children,
  error,
  onReset,
}: AsyncErrorBoundaryProps) {
  if (error) {
    return (
      <Card className="m-4 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-base text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            操作失败
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  return children
}

export default ErrorBoundary
