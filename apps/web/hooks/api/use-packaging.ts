'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { packagingApi, modelApi } from '@/lib/api'
import { toast } from 'sonner'
import type {
  CreatePackagingConfigRequest,
  UpdatePackagingConfigRequest,
  CreateProcessConfigRequest,
  UpdateProcessConfigRequest,
  CreatePackagingMaterialRequest,
  UpdatePackagingMaterialRequest,
} from '@cost/shared-types'

// 包装配置 Hook
export function usePackagingConfigs(modelId?: string) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['packaging-configs', { modelId }],
    queryFn: async () => {
      if (!modelId) return []  // 未选型号返回空数组
      const response = await packagingApi.getList({ modelId })
      return response.data
    },
    enabled: !!modelId,  // 未选型号时不发起请求
  })

  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await modelApi.getList()
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: packagingApi.create,
    onSuccess: () => {
      toast.success('包装配置已创建')
      queryClient.invalidateQueries({ queryKey: ['packaging-configs'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '创建失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePackagingConfigRequest }) =>
      packagingApi.update(id, data),
    onSuccess: () => {
      toast.success('包装配置已更新')
      queryClient.invalidateQueries({ queryKey: ['packaging-configs'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: packagingApi.delete,
    onSuccess: () => {
      toast.success('包装配置已删除')
      queryClient.invalidateQueries({ queryKey: ['packaging-configs'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })

  return {
    packagingConfigs: data ?? [],
    models: modelsData ?? [],
    isLoading: isLoading || isLoadingModels,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// 工序配置 Hook
export function useProcessConfigs(packagingConfigId: string) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['process-configs', packagingConfigId],
    queryFn: async () => {
      const response = await packagingApi.getProcesses(packagingConfigId)
      return response.data
    },
    enabled: !!packagingConfigId,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateProcessConfigRequest) =>
      packagingApi.createProcess(packagingConfigId, data),
    onSuccess: () => {
      toast.success('工序已添加')
      queryClient.invalidateQueries({ queryKey: ['process-configs', packagingConfigId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '添加失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ processId, data }: { processId: string; data: UpdateProcessConfigRequest }) =>
      packagingApi.updateProcess(processId, data),
    onSuccess: () => {
      toast.success('工序已更新')
      queryClient.invalidateQueries({ queryKey: ['process-configs', packagingConfigId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: packagingApi.deleteProcess,
    onSuccess: () => {
      toast.success('工序已删除')
      queryClient.invalidateQueries({ queryKey: ['process-configs', packagingConfigId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })

  return {
    processConfigs: data ?? [],
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

// 包材配置 Hook
export function usePackagingMaterials(packagingConfigId: string) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['packaging-materials', packagingConfigId],
    queryFn: async () => {
      const response = await packagingApi.getMaterials(packagingConfigId)
      return response.data
    },
    enabled: !!packagingConfigId,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreatePackagingMaterialRequest) =>
      packagingApi.createMaterial(packagingConfigId, data),
    onSuccess: () => {
      toast.success('包材已添加')
      queryClient.invalidateQueries({ queryKey: ['packaging-materials', packagingConfigId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '添加失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ materialId, data }: { materialId: string; data: UpdatePackagingMaterialRequest }) =>
      packagingApi.updateMaterial(materialId, data),
    onSuccess: () => {
      toast.success('包材已更新')
      queryClient.invalidateQueries({ queryKey: ['packaging-materials', packagingConfigId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: packagingApi.deleteMaterial,
    onSuccess: () => {
      toast.success('包材已删除')
      queryClient.invalidateQueries({ queryKey: ['packaging-materials', packagingConfigId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })

  return {
    packagingMaterials: data ?? [],
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
