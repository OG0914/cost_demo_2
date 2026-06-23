'use client'

import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { toast } from 'sonner'
import { useRegulations } from '@/hooks/api/use-regulations'
import { Skeleton } from '@/components/ui/skeleton'
import type { Regulation } from '@cost/shared-types'

export default function RegulationsPage() {
  const { regulations, isLoading, create, update, delete: deleteRegulation, isCreating, isUpdating, isDeleting } = useRegulations()
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Regulation | null>(null)
  const [formData, setFormData] = useState({ code: '', name: '', description: '' })

  const filteredRegulations = (regulations ?? []).filter((r: Regulation) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ code: '', name: '', description: '' })
    setDialogOpen(true)
  }

  const handleEdit = (item: Regulation) => {
    setEditingItem(item)
    setFormData({ code: item.code, name: item.name, description: item.description || '' })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('请填写法规代码和名称')
      return
    }
    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      status: editingItem ? editingItem.status : 'active',
    }
    if (editingItem) {
      update({ id: editingItem.id, data: payload })
    } else {
      create(payload)
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (editingItem) {
      deleteRegulation({ id: editingItem.id, name: editingItem.name })
    }
    setDeleteDialogOpen(false)
  }

  const handleToggleStatus = (item: Regulation) => {
    toast.success(item.status === 'active' ? '法规已禁用' : '法规已启用')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">法规管理</h1>
          <p className="text-sm text-muted-foreground">
            管理产品适用的法规标准
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 size-4" />
          新增法规
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>法规列表</CardTitle>
          <CardDescription>共 {filteredRegulations.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索法规..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>法规名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegulations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegulations.map((item: Regulation) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.description}</TableCell>
                      <TableCell>
                        {item.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">启用</Badge>
                        ) : (
                          <Badge variant="secondary">禁用</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Pencil className="mr-2 size-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                              {item.status === 'active' ? (
                                <>
                                  <PowerOff className="mr-2 size-4" />
                                  禁用
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 size-4" />
                                  启用
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setEditingItem(item)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 size-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑法规' : '新增法规'}</DialogTitle>
            <DialogDescription>
              {editingItem ? '修改法规信息' : '添加新的法规标准'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>法规代码</Label>
              <Input
                placeholder="如：GB、EN、NIOSH"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>法规名称</Label>
              <Input
                placeholder="如：GB、EN、NIOSH"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                placeholder="法规标准的描述说明"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isCreating || isUpdating}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        description={`确定要删除法规 "${editingItem?.name}" 吗？此操作不可撤销。`}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  )
}
