'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bomApi, modelApi, materialApi } from '@/lib/api'
import { toast } from 'sonner'
import type { CreateBomMaterialRequest, UpdateBomMaterialRequest } from '@cost/shared-types'

export function useBom(modelId: string) {
  const queryClient = useQueryClient()

  const { data: bomData, isLoading: isLoadingBom, error: bomError } = useQuery({
    queryKey: ['bom', modelId],
    queryFn: async () => {
      const response = await bomApi.getByModel(modelId)
      return response.data
    },
    enabled: !!modelId,
  })

  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const response = await materialApi.getList()
      return response.data
    },
  })

  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await modelApi.getList()
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: bomApi.create,
    onSuccess: () => {
      toast.success('原料已添加到BOM')
      queryClient.invalidateQueries({ queryKey: ['bom', modelId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '添加失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBomMaterialRequest }) =>
      bomApi.update(id, data),
    onSuccess: () => {
      toast.success('BOM已更新')
      queryClient.invalidateQueries({ queryKey: ['bom', modelId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: bomApi.delete,
    onSuccess: () => {
      toast.success('原料已从BOM移除')
      queryClient.invalidateQueries({ queryKey: ['bom', modelId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })

  // 将BOM数据与物料数据关联
  const bomWithMaterials = (bomData ?? []).map((item: unknown) => {
    const material = (materialsData ?? []).find(
      (m: unknown) => (m as { id: string }).id === (item as { materialId: string }).materialId
    )
    return { ...(item as object), material }
  })

  return {
    bom: bomWithMaterials,
    materials: materialsData ?? [],
    models: modelsData ?? [],
    isLoading: isLoadingBom || isLoadingMaterials || isLoadingModels,
    error: bomError,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
