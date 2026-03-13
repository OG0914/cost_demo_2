'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/lib/api'
import { toast } from 'sonner'

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationApi.getList()
      return response.data
    },
  })

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount()
      return response.data
    },
  })

  const processMutation = useMutation({
    mutationFn: notificationApi.process,
    onSuccess: () => {
      toast.success('通知已处理')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '处理失败')
    },
  })

  return {
    notifications: data ?? [],
    unreadCount: unreadCountData?.count ?? 0,
    isLoading,
    error,
    process: processMutation.mutate,
    isProcessing: processMutation.isPending,
  }
}
