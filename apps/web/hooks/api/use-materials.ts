'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { materialApi } from '@/lib/api'
import { toast } from 'sonner'
import type { CreateMaterialRequest, UpdateMaterialRequest } from '@cost/shared-types'

export function useMaterials() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const response = await materialApi.getList()
      return response.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialRequest) => materialApi.create(data),
    onSuccess: () => {
      toast.success('原料已添加')
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '添加失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaterialRequest }) =>
      materialApi.update(id, data),
    onSuccess: () => {
      toast.success('原料已更新')
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => materialApi.delete(id),
    onSuccess: (_, variables) => {
      toast.success(`原料 "${variables.name}" 已删除`)
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })

  return {
    materials: data,
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
