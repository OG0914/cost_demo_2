'use client'

import { useState, useMemo, useCallback } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '请选择...',
  searchPlaceholder = '搜索...',
  emptyText = '未找到匹配项',
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  )

  const selectedLabel = selectedOption?.label || placeholder

  const handleSelect = useCallback(
    (commandValue: string) => {
      const option = options.find((o) => o.value === commandValue)
      if (option) {
        onChange(option.value)
      }
      setOpen(false)
    },
    [options, onChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
          filter={(commandValue, search) => {
            if (!search) return 1
            const option = options.find((o) => o.value === commandValue)
            if (!option) return 0
            const normalizedLabel = option.label.toLowerCase()
            const normalizedSearch = search.toLowerCase().trim()
            return normalizedLabel.includes(normalizedSearch) ? 1 : 0
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
