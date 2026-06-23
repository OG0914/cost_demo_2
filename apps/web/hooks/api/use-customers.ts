'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '@/lib/api'
import { toast } from 'sonner'
import type { CreateCustomerRequest, UpdateCustomerRequest } from '@cost/shared-types'

export function useCustomers() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await customerApi.getList()
      return response.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerApi.create(data),
    onSuccess: () => {
      toast.success('客户已添加')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '添加失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      customerApi.update(id, data),
    onSuccess: () => {
      toast.success('客户已更新')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => customerApi.delete(id),
    onSuccess: (_, variables) => {
      toast.success(`客户 "${variables.name}" 已删除`)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })

  return {
    customers: data,
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
