'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { standardCostApi } from '@/lib/api'
import { toast } from 'sonner'
import type { StandardCost } from '@/lib/types'

interface StandardCostFilters {
  modelId?: string
  packagingConfigId?: string
  saleType?: string
  isCurrent?: boolean
}

export function useStandardCosts(filters: StandardCostFilters = {}) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['standard-costs', filters],
    queryFn: async () => {
      const response = await standardCostApi.getList(filters)
      return (response.data?.data ?? []) as StandardCost[]
    },
  })

  const createMutation = useMutation({
    mutationFn: standardCostApi.create,
    onSuccess: () => {
      toast.success('标准成本创建成功')
      queryClient.invalidateQueries({ queryKey: ['standard-costs'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败')
    },
  })

  const setCurrentMutation = useMutation({
    mutationFn: standardCostApi.setCurrent,
    onSuccess: () => {
      toast.success('已设为当前版本')
      queryClient.invalidateQueries({ queryKey: ['standard-costs'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '操作失败')
    },
  })

  return {
    standardCosts: data ?? [],
    isLoading,
    error,
    create: createMutation.mutate,
    setCurrent: setCurrentMutation.mutate,
    isCreating: createMutation.isPending,
    isSettingCurrent: setCurrentMutation.isPending,
  }
}

export function useStandardCost(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['standard-cost', id],
    queryFn: async () => {
      const response = await standardCostApi.getById(id)
      return response.data?.data as StandardCost
    },
    enabled: !!id,
  })

  return {
    standardCost: data,
    isLoading,
    error,
  }
}
