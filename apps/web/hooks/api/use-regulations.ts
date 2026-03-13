'use client'

import { useQuery } from '@tanstack/react-query'
import { regulationApi } from '@/lib/api'

export function useRegulations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['regulations'],
    queryFn: async () => {
      const response = await regulationApi.getList()
      return response.data?.data ?? []
    },
  })

  return {
    regulations: data,
    isLoading,
    error,
  }
}
