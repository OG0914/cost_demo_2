import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/providers/query-provider'
import { ErrorBoundary } from '@/components/error-boundary'

export const metadata: Metadata = {
  title: '成本分析管理系统',
  description: '����ҵ�ɱ������뱨�۹���ƽ̨',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster />
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
