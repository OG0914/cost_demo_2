'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { systemConfigApi } from '@/lib/api'
import type { SystemConfig } from '@cost/shared-types'

export function useSystemConfigs() {
  return useQuery<SystemConfig[]>({
    queryKey: ['system-configs'],
    queryFn: async () => {
      const response = await systemConfigApi.getList()
      return response.data ?? []
    },
  })
}

export function useSystemConfig(key: string) {
  return useQuery<SystemConfig | null>({
    queryKey: ['system-configs', key],
    queryFn: async () => {
      const response = await systemConfigApi.getByKey(key)
      return response.data ?? null
    },
    enabled: !!key,
  })
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient()

  return useMutation<SystemConfig | undefined, Error, { key: string; value: unknown }>({
    mutationFn: async ({ key, value }) => {
      const response = await systemConfigApi.update(key, value)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system-configs'] })
      queryClient.invalidateQueries({ queryKey: ['system-configs', variables.key] })
    },
  })
}
