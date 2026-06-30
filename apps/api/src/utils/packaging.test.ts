import { describe, it, expect } from 'vitest'
import {
  STANDARD_BOX,
  NO_BOX,
  BLISTER_DIRECT,
  BLISTER_BAG,
  calculatePerBox,
  calculatePerCarton,
  formatPackagingDescription,
  isThreeLayerType,
} from '@cost/shared-types'

describe('packaging calculations', () => {
  describe('isThreeLayerType', () => {
    it('should return true for standard_box and blister_bag', () => {
      expect(isThreeLayerType(STANDARD_BOX)).toBe(true)
      expect(isThreeLayerType(BLISTER_BAG)).toBe(true)
    })

    it('should return false for no_box and blister_direct', () => {
      expect(isThreeLayerType(NO_BOX)).toBe(false)
      expect(isThreeLayerType(BLISTER_DIRECT)).toBe(false)
    })
  })

  describe('calculatePerBox', () => {
    it('should calculate perBox for three-layer types', () => {
      expect(calculatePerBox(STANDARD_BOX, 10, 10)).toBe(100)
      expect(calculatePerBox(BLISTER_BAG, 5, 4)).toBe(20)
    })

    it('should return null for two-layer types', () => {
      expect(calculatePerBox(NO_BOX, 50, 100)).toBeNull()
      expect(calculatePerBox(BLISTER_DIRECT, 1, 200)).toBeNull()
    })
  })

  describe('calculatePerCarton', () => {
    it('should multiply all layers when layer3 provided', () => {
      expect(calculatePerCarton(10, 10, 20)).toBe(2000)
    })

    it('should ignore null/undefined layer3', () => {
      expect(calculatePerCarton(50, 100)).toBe(5000)
      expect(calculatePerCarton(50, 100, null)).toBe(5000)
    })
  })

  describe('formatPackagingDescription', () => {
    it('should format standard_box description', () => {
      expect(formatPackagingDescription(STANDARD_BOX, 10, 10, 20)).toBe('10片/袋, 10袋/盒, 20盒/箱')
    })

    it('should format no_box description', () => {
      expect(formatPackagingDescription(NO_BOX, 50, 100)).toBe('50片/袋, 100袋/箱')
    })

    it('should format blister_direct description', () => {
      expect(formatPackagingDescription(BLISTER_DIRECT, 1, 200)).toBe('1片/泡壳, 200泡壳/箱')
    })

    it('should format blister_bag description', () => {
      expect(formatPackagingDescription(BLISTER_BAG, 5, 4, 50)).toBe('5片/袋, 4袋/泡壳, 50泡壳/箱')
    })
  })
})
