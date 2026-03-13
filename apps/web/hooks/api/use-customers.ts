'use client'

import { useQuery } from '@tanstack/react-query'
import { customerApi } from '@/lib/api'

export function useCustomers() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await customerApi.getList()
      return response.data?.data ?? []
    },
  })

  return {
    customers: data,
    isLoading,
    error,
  }
}
