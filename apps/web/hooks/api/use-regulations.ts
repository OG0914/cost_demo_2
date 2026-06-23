'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { regulationApi } from '@/lib/api'
import { toast } from 'sonner'
import type { CreateRegulationRequest } from '@cost/shared-types'

export function useRegulations() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['regulations'],
    queryFn: async () => {
      const response = await regulationApi.getList()
      return response.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateRegulationRequest) => regulationApi.create(data),
    onSuccess: () => {
      toast.success('法规已添加')
      queryClient.invalidateQueries({ queryKey: ['regulations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '添加失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRegulationRequest }) =>
      regulationApi.update(id, data),
    onSuccess: () => {
      toast.success('法规已更新')
      queryClient.invalidateQueries({ queryKey: ['regulations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => regulationApi.delete(id),
    onSuccess: (_, variables) => {
      toast.success(`法规 "${variables.name}" 已删除`)
      queryClient.invalidateQueries({ queryKey: ['regulations'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })

  return {
    regulations: data,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
