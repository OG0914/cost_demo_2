'use client'

import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSystemConfigs, useUpdateSystemConfig } from '@/hooks/api'
import { ModelDictionaryCard } from './model-dictionary-card'

const DEFAULT_SERIES = ['D系列', 'P系列', 'N系列', 'X系列']
const DEFAULT_CATEGORIES = ['半面罩', '口罩', '全面罩', '配件']

function parseStringArray(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value as string[]
  }
  return fallback
}

export function ModelDictionaryConfig() {
  const { data: systemConfigs, isLoading } = useSystemConfigs()
  const updateConfig = useUpdateSystemConfig()

  const [series, setSeries] = useState(DEFAULT_SERIES)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

  useEffect(() => {
    if (!systemConfigs) return
    const seriesConfig = systemConfigs.find((c) => c.key === 'modelSeries')
    const categoriesConfig = systemConfigs.find((c) => c.key === 'modelCategories')
    setSeries(parseStringArray(seriesConfig?.value, DEFAULT_SERIES))
    setCategories(parseStringArray(categoriesConfig?.value, DEFAULT_CATEGORIES))
  }, [systemConfigs])

  const handleSave = async () => {
    try {
      await Promise.all([
        updateConfig.mutateAsync({ key: 'modelSeries', value: series }),
        updateConfig.mutateAsync({ key: 'modelCategories', value: categories }),
      ])
      toast.success('型号字典已保存')
    } catch (error) {
      toast.error((error as Error).message || '保存失败')
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-md bg-muted" />
        <div className="h-48 animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ModelDictionaryCard
          title="产品系列"
          description="维护型号管理中的系列选项"
          items={series}
          placeholder="如：D系列"
          onChange={setSeries}
        />
        <ModelDictionaryCard
          title="产品分类"
          description="维护型号管理中的分类选项"
          items={categories}
          placeholder="如：半面罩"
          onChange={setCategories}
        />
      </div>
      <Button onClick={handleSave} disabled={updateConfig.isPending}>
        <Save className="mr-2 size-4" />
        保存型号字典
      </Button>
    </div>
  )
}
