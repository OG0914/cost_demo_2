'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { modelApi } from '@/lib/api'
import { toast } from 'sonner'
import type { CreateModelRequest, UpdateModelRequest } from '@cost/shared-types'

export function useModels() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await modelApi.getList()
      return response.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateModelRequest) => modelApi.create(data),
    onSuccess: () => {
      toast.success('型号已添加')
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '添加失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateModelRequest }) =>
      modelApi.update(id, data),
    onSuccess: () => {
      toast.success('型号已更新')
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => modelApi.delete(id),
    onSuccess: (_, variables) => {
      toast.success(`型号 "${variables.name}" 已删除`)
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })

  return {
    models: data,
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
