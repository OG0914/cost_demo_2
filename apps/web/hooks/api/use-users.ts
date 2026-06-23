'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/lib/api'
import { toast } from 'sonner'
import type { CreateUserRequest, UpdateUserRequest, User } from '@cost/shared-types'

export function useUsers() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userApi.getList()
      return response.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => userApi.create(data),
    onSuccess: () => {
      toast.success('用户已添加')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '添加失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userApi.update(id, data),
    onSuccess: () => {
      toast.success('用户已更新')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => userApi.delete(id),
    onSuccess: (_, variables) => {
      toast.success(`用户 "${variables.name}" 已删除`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || '删除失败')
    },
  })

  return {
    users: data,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
