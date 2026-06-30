'use client'

import { useState, useMemo } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, Upload, Download, Package, Settings } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
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
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { SearchableSelect } from '@/components/searchable-select'
import { toast } from 'sonner'
import { usePackagingConfigs, usePackagingMaterials } from '@/hooks/api'
import {
  PACKAGING_TYPES,
  PACKAGING_TYPE_META,
  formatPackagingDescription,
  isThreeLayerType,
} from '@/lib/constants'

interface PackagingMaterial {
  id: string
  materialId: string
  material: {
    id: string
    materialNo: string
    name: string
    unit: string
    price: number
  }
  quantity: number
  boxLength?: number
  boxWidth?: number
  boxHeight?: number
  boxVolume?: number
}

interface PackagingConfig {
  id: string
  modelId: string
  name: string
  packagingType: string
  perBox?: number | null
  perCarton: number
  layer1: number
  layer2: number
  layer3?: number | null
}

export default function PackagingPage() {
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PackagingMaterial | null>(null)
  const [formData, setFormData] = useState({
    materialId: '',
    quantity: '',
    boxVolume: '',
  })

  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [configDeleteDialogOpen, setConfigDeleteDialogOpen] = useState(false)
  const [deletingConfig, setDeletingConfig] = useState<PackagingConfig | null>(null)
  const [editingConfig, setEditingConfig] = useState<PackagingConfig | null>(null)
  const [configFormData, setConfigFormData] = useState({
    name: '',
    packagingType: '',
    layer1: '',
    layer2: '',
    layer3: '',
  })

  const { packagingConfigs, models, isLoading: isLoadingConfigs, create: createConfig, update: updateConfig, delete: deleteConfig } = usePackagingConfigs(selectedModelId)

  // 根据型号筛选包装配置
  const modelPackagingConfigs = useMemo(() => {
    if (!selectedModelId) return packagingConfigs
    return packagingConfigs.filter((p: { modelId?: string }) => p.modelId === selectedModelId)
  }, [packagingConfigs, selectedModelId])

  const currentPackagingId = selectedPackagingId && modelPackagingConfigs.some((p: { id: string }) => p.id === selectedPackagingId)
    ? selectedPackagingId
    : modelPackagingConfigs[0]?.id || ''

  const selectedPackaging = modelPackagingConfigs.find((p: { id: string }) => p.id === currentPackagingId) as PackagingConfig | undefined

  const { packagingMaterials, materials, isLoading: isLoadingMaterials, create, update, delete: deleteMaterial } = usePackagingMaterials(currentPackagingId)

  const isLoading = isLoadingConfigs || isLoadingMaterials

  const totalPackagingCost = (packagingMaterials as PackagingMaterial[]).reduce(
    (sum: number, item: PackagingMaterial) => sum + item.material.price * item.quantity,
    0
  )

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ materialId: '', quantity: '', boxVolume: '' })
    setDialogOpen(true)
  }

  const handleEdit = (item: PackagingMaterial) => {
    setEditingItem(item)
    setFormData({
      materialId: item.materialId,
      quantity: item.quantity.toString(),
      boxVolume: item.boxVolume?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.materialId || !formData.quantity) {
      toast.error('请选择原料并填写用量')
      return
    }

    const data = {
      materialId: formData.materialId,
      quantity: parseFloat(formData.quantity),
      boxVolume: formData.boxVolume ? parseFloat(formData.boxVolume) : undefined,
    }

    if (editingItem) {
      update({ materialId: editingItem.id, data })
    } else {
      create(data)
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (editingItem) {
      deleteMaterial(editingItem.id)
    }
    setDeleteDialogOpen(false)
    setEditingItem(null)
  }

  const handleAddConfig = () => {
    setEditingConfig(null)
    setConfigFormData({ name: '', packagingType: '', layer1: '', layer2: '', layer3: '' })
    setConfigDialogOpen(true)
  }

  const handleEditConfig = (config: PackagingConfig) => {
    setEditingConfig(config)
    setConfigFormData({
      name: config.name,
      packagingType: config.packagingType,
      layer1: config.layer1.toString(),
      layer2: config.layer2.toString(),
      layer3: config.layer3?.toString() || '',
    })
    setConfigDialogOpen(true)
  }

  const handleDeleteConfigClick = (config: PackagingConfig) => {
    setDeletingConfig(config)
    setConfigDeleteDialogOpen(true)
  }

  const handleDeleteConfig = () => {
    if (deletingConfig) {
      deleteConfig(deletingConfig.id)
      if (selectedPackagingId === deletingConfig.id) {
        setSelectedPackagingId('')
      }
    }
    setConfigDeleteDialogOpen(false)
    setDeletingConfig(null)
  }

  const configPreview = useMemo(() => {
    const type = configFormData.packagingType
    const layer1 = parseInt(configFormData.layer1, 10)
    const layer2 = parseInt(configFormData.layer2, 10)
    const layer3 = configFormData.layer3 ? parseInt(configFormData.layer3, 10) : undefined
    if (!type || Number.isNaN(layer1) || Number.isNaN(layer2)) return ''
    return formatPackagingDescription(type, layer1, layer2, layer3)
  }, [configFormData])

  const handleSaveConfig = () => {
    if (!configFormData.packagingType || !configFormData.layer1 || !configFormData.layer2) {
      toast.error('请选择包装类型并填写层级数量')
      return
    }

    const threeLayer = isThreeLayerType(configFormData.packagingType)
    if (threeLayer && !configFormData.layer3) {
      toast.error('该包装类型需要填写第三层数量')
      return
    }

    const layer1 = parseInt(configFormData.layer1, 10)
    const layer2 = parseInt(configFormData.layer2, 10)
    const layer3 = threeLayer ? parseInt(configFormData.layer3, 10) : null
    const modelName = models.find((m: { id: string }) => m.id === selectedModelId)?.name || '未命名型号'
    const typeLabel = PACKAGING_TYPE_META[configFormData.packagingType as keyof typeof PACKAGING_TYPE_META]?.label ?? configFormData.packagingType
    const layerText = threeLayer ? `${layer1}x${layer2}x${layer3}` : `${layer1}x${layer2}`
    const name = `${modelName} ${typeLabel} (${layerText})`

    const data = {
      name,
      packagingType: configFormData.packagingType,
      layer1,
      layer2,
      layer3,
    }

    if (editingConfig) {
      updateConfig({ id: editingConfig.id, data })
    } else {
      if (!selectedModelId) {
        toast.error('请先选择型号')
        return
      }
      createConfig({ modelId: selectedModelId, ...data })
    }
    setConfigDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">包材管理</h1>
          <p className="text-sm text-muted-foreground">
            管理包装材料配置和定价
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info('请选择Excel文件导入')}>
            <Upload className="mr-2 size-4" />
            导入
          </Button>
          <Button variant="outline" onClick={() => toast.success('导出成功')}>
            <Download className="mr-2 size-4" />
            导出
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* 型号和包装选择 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>选择配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>型号</Label>
              <SearchableSelect
                options={models.map((m: { id: string; name: string }) => ({ value: m.id, label: m.name }))}
                value={selectedModelId}
                onChange={(value) => {
                  setSelectedModelId(value)
                  setSelectedPackagingId('')
                }}
                placeholder="选择型号"
                searchPlaceholder="搜索型号..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>包装配置</Label>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleAddConfig} disabled={!selectedModelId}>
                  <Plus className="mr-1 size-3" />
                  新增
                </Button>
              </div>
              <div className="space-y-2">
                {modelPackagingConfigs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">该型号暂无包装配置</p>
                ) : (
                  modelPackagingConfigs.map((config: PackagingConfig) => {
                    const materialCount = (packagingMaterials as PackagingMaterial[]).length
                    const meta = PACKAGING_TYPE_META[config.packagingType as keyof typeof PACKAGING_TYPE_META]
                    const description = formatPackagingDescription(config.packagingType, config.layer1, config.layer2, config.layer3)
                    return (
                      <div
                        key={config.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedPackagingId(config.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedPackagingId(config.id)
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 cursor-pointer ${
                          currentPackagingId === config.id ? 'border-foreground bg-muted/50' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{config.name}</p>
                          <p className="text-xs text-muted-foreground">{meta?.label ?? config.packagingType}</p>
                          <p className="text-xs text-muted-foreground truncate">{description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{materialCount}种包材</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditConfig(config)
                            }}
                          >
                            <Settings className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 shrink-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteConfigClick(config)
                            }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 包材配置 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedModelId ? models.find((m: { id: string }) => m.id === selectedModelId)?.name : '选择型号'} - {selectedPackaging?.name || '未选择'}
                </CardTitle>
                <CardDescription>
                  共 {(packagingMaterials as PackagingMaterial[]).length} 种包材，单件包材成本 ¥{totalPackagingCost.toFixed(2)}
                </CardDescription>
              </div>
              <Button onClick={handleAdd} disabled={!currentPackagingId}>
                <Plus className="mr-2 size-4" />
                添加包材
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>原料料号</TableHead>
                    <TableHead>原料名称</TableHead>
                    <TableHead className="text-right">用量</TableHead>
                    <TableHead className="text-right">单价</TableHead>
                    <TableHead className="text-right">小计</TableHead>
                    <TableHead>单位</TableHead>
                    <TableHead>外箱材积</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(packagingMaterials as PackagingMaterial[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        {currentPackagingId ? '暂无包材配置，点击"添加包材"开始配置' : '请先选择包装配置'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (packagingMaterials as PackagingMaterial[]).map((item: PackagingMaterial) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.material.materialNo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="size-4 text-muted-foreground" />
                            {item.material.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">¥{item.material.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          ¥{(item.material.price * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>{item.material.unit}</TableCell>
                        <TableCell>
                          {item.boxVolume ? (
                            <Badge variant="outline">{item.boxVolume.toFixed(3)} cuft</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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

            {(packagingMaterials as PackagingMaterial[]).length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="rounded-lg bg-muted p-3 text-right">
                  <p className="text-sm text-muted-foreground">单件包材总成本</p>
                  <p className="text-xl font-bold">¥{totalPackagingCost.toFixed(2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 新增/编辑包材弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑包材' : '添加包材'}</DialogTitle>
            <DialogDescription>
              {selectedModelId ? models.find((m: { id: string }) => m.id === selectedModelId)?.name : '选择型号'} - {selectedPackaging?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>原料</Label>
              <SearchableSelect
                options={materials.map((m: { id: string; materialNo: string; name: string; price: number; unit: string }) => ({ value: m.id, label: `${m.materialNo} - ${m.name}` }))}
                value={formData.materialId}
                onChange={(value) => setFormData((prev) => ({ ...prev, materialId: value }))}
                placeholder="选择原料"
                searchPlaceholder="搜索原料..."
              />
              {formData.materialId && (
                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    已选：{materials.find((m: { id: string }) => m.id === formData.materialId)?.materialNo} - {materials.find((m: { id: string }) => m.id === formData.materialId)?.name}
                  </span>
                  <span className="font-medium">
                    ¥{materials.find((m: { id: string }) => m.id === formData.materialId)?.price.toFixed(2)} / {materials.find((m: { id: string }) => m.id === formData.materialId)?.unit}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>用量</Label>
              <Input
                type="number"
                placeholder="请输入用量"
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>外箱材积（CUFT，用于运费计算）</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="请输入外箱材积（CUFT）"
                value={formData.boxVolume}
                onChange={(e) => setFormData((prev) => ({ ...prev, boxVolume: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.materialId || !formData.quantity}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增/编辑包装配置弹窗 */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfig ? '编辑包装配置' : '新增包装配置'}</DialogTitle>
            <DialogDescription>
              {selectedModelId ? models.find((m: { id: string }) => m.id === selectedModelId)?.name : '选择型号'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>包装方式</Label>
              <SearchableSelect
                options={PACKAGING_TYPES.map((type) => ({ value: type, label: PACKAGING_TYPE_META[type].label }))}
                value={configFormData.packagingType}
                onChange={(value) => setConfigFormData((prev) => ({ ...prev, packagingType: value, layer3: '' }))}
                placeholder="选择包装方式"
                searchPlaceholder="搜索包装方式..."
              />
            </div>
            {configFormData.packagingType && (
              <div className="space-y-2">
                <Label>层级数量</Label>
                <div className="grid gap-2" style={{ gridTemplateColumns: isThreeLayerType(configFormData.packagingType) ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)' }}>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{PACKAGING_TYPE_META[configFormData.packagingType as keyof typeof PACKAGING_TYPE_META]?.layerUnits[0]}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={configFormData.layer1}
                      onChange={(e) => setConfigFormData((prev) => ({ ...prev, layer1: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{PACKAGING_TYPE_META[configFormData.packagingType as keyof typeof PACKAGING_TYPE_META]?.layerUnits[1]}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={configFormData.layer2}
                      onChange={(e) => setConfigFormData((prev) => ({ ...prev, layer2: e.target.value }))}
                    />
                  </div>
                  {isThreeLayerType(configFormData.packagingType) && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{PACKAGING_TYPE_META[configFormData.packagingType as keyof typeof PACKAGING_TYPE_META]?.layerUnits[2]}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={configFormData.layer3}
                        onChange={(e) => setConfigFormData((prev) => ({ ...prev, layer3: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {configPreview && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">预览</p>
                <p className="text-sm font-medium">{configPreview}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveConfig} disabled={!configFormData.packagingType || !configFormData.layer1 || !configFormData.layer2}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        description={`确定要删除包材 "${editingItem?.material.name}" 吗？此操作不可撤销。`}
        onConfirm={handleDelete}
      />

      <ConfirmDeleteDialog
        open={configDeleteDialogOpen}
        onOpenChange={setConfigDeleteDialogOpen}
        description={`确定要删除包装配置 "${deletingConfig?.name}" 吗？关联的包材和工序也会被一并删除，此操作不可撤销。`}
        onConfirm={handleDeleteConfig}
      />
    </div>
  )
}
