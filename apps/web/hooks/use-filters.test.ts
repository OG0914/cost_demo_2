import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useListFilters } from './forms/use-filters'

describe('useListFilters', () => {
  const mockItems = [
    { id: '1', name: 'Apple', category: 'fruit', status: 'active' },
    { id: '2', name: 'Banana', category: 'fruit', status: 'inactive' },
    { id: '3', name: 'Carrot', category: 'vegetable', status: 'active' },
    { id: '4', name: 'Date', category: 'fruit', status: 'active' },
  ]

  it('should return all items when no filters applied', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name']))

    expect(result.current.filteredItems).toEqual(mockItems)
    expect(result.current.searchTerm).toBe('')
  })

  it('should filter items by search term', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name']))

    act(() => {
      result.current.setSearchTerm('app')
    })

    expect(result.current.filteredItems).toHaveLength(1)
    expect(result.current.filteredItems[0].name).toBe('Apple')
  })

  it('should filter case-insensitively', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name']))

    act(() => {
      result.current.setSearchTerm('BANANA')
    })

    expect(result.current.filteredItems).toHaveLength(1)
    expect(result.current.filteredItems[0].name).toBe('Banana')
  })

  it('should search in multiple fields', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name', 'category']))

    act(() => {
      result.current.setSearchTerm('vegetable')
    })

    expect(result.current.filteredItems).toHaveLength(1)
    expect(result.current.filteredItems[0].name).toBe('Carrot')
  })

  it('should filter by category filter', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name']))

    act(() => {
      result.current.setFilter('category', 'fruit')
    })

    expect(result.current.filteredItems).toHaveLength(3)
    expect(result.current.filteredItems.every(item => item.category === 'fruit')).toBe(true)
  })

  it('should return all items when filter is set to "all"', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name']))

    act(() => {
      result.current.setFilter('category', 'all')
    })

    expect(result.current.filteredItems).toEqual(mockItems)
  })

  it('should combine search and filters', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name']))

    act(() => {
      result.current.setSearchTerm('a')
      result.current.setFilter('status', 'active')
    })

    expect(result.current.filteredItems).toHaveLength(3)
    expect(result.current.filteredItems.every(item => item.status === 'active')).toBe(true)
  })

  it('should handle empty items array', () => {
    const { result } = renderHook(() => useListFilters([], ['name']))

    expect(result.current.filteredItems).toEqual([])
  })

  it('should handle search with no matches', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name']))

    act(() => {
      result.current.setSearchTerm('xyz')
    })

    expect(result.current.filteredItems).toEqual([])
  })

  it('should update search term', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name']))

    act(() => {
      result.current.setSearchTerm('test')
    })

    expect(result.current.searchTerm).toBe('test')
  })

  it('should maintain multiple filters', () => {
    const { result } = renderHook(() => useListFilters(mockItems, ['name']))

    act(() => {
      result.current.setFilter('category', 'fruit')
      result.current.setFilter('status', 'active')
    })

    expect(result.current.filters).toEqual({
      category: 'fruit',
      status: 'active',
    })
  })
})
