'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ModelDictionaryCardProps {
  title: string
  description: string
  items: string[]
  placeholder?: string
  onChange: (items: string[]) => void
}

export function ModelDictionaryCard({
  title,
  description,
  items,
  placeholder = '输入新项',
  onChange,
}: ModelDictionaryCardProps) {
  const [newItem, setNewItem] = useState('')

  const handleAdd = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    if (items.includes(trimmed)) {
      // 重复项不添加
      setNewItem('')
      return
    }
    onChange([...items, trimmed])
    setNewItem('')
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label>新增项</Label>
            <Input
              placeholder={placeholder}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button onClick={handleAdd} disabled={!newItem.trim()}>
            <Plus className="mr-2 size-4" />
            添加
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无配置，请添加</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="text-sm">{item}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
