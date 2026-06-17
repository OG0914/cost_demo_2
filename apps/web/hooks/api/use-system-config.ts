'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { systemConfigApi } from '@/lib/api'
import type { SystemConfig } from '@cost/shared-types'

export function useSystemConfigs() {
  return useQuery<SystemConfig[]>({
    queryKey: ['system-configs'],
    queryFn: async () => {
      const response = await systemConfigApi.getList()
      return response.data?.data ?? []
    },
  })
}

export function useSystemConfig(key: string) {
  return useQuery<SystemConfig | null>({
    queryKey: ['system-configs', key],
    queryFn: async () => {
      const response = await systemConfigApi.getByKey(key)
      return response.data?.data ?? null
    },
    enabled: !!key,
  })
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient()

  return useMutation<SystemConfig | undefined, Error, { key: string; value: Record<string, unknown> }>({
    mutationFn: async ({ key, value }) => {
      const response = await systemConfigApi.update(key, value)
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system-configs'] })
      queryClient.invalidateQueries({ queryKey: ['system-configs', variables.key] })
    },
  })
}
