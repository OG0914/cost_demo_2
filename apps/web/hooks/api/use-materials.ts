'use client'

import { useQuery } from '@tanstack/react-query'
import { materialApi } from '@/lib/api'

export function useMaterials() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const response = await materialApi.getList()
      return response.data?.data ?? []
    },
  })

  return {
    materials: data,
    isLoading,
    error,
  }
}
