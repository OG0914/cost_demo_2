'use client'

import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/lib/api'

export function useUsers() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userApi.getList()
      return response.data ?? []
    },
  })

  return {
    users: data,
    isLoading,
    error,
  }
}
