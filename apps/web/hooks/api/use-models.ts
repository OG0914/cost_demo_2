'use client'

import { useQuery } from '@tanstack/react-query'
import { modelApi } from '@/lib/api'

export function useModels() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await modelApi.getList()
      return response.data?.data ?? []
    },
  })

  return {
    models: data,
    isLoading,
    error,
  }
}
