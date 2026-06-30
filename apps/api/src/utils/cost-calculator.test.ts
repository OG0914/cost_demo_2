import { describe, it, expect } from 'vitest'
import {
  getBoxVolumeCuft,
  getConfigBoxVolume,
  getLclTierRate,
  calculateShippingCost,
} from './cost-calculator.js'

describe('cost-calculator helpers', () => {
  describe('getBoxVolumeCuft', () => {
    it('should return boxVolume when available', () => {
      expect(getBoxVolumeCuft({ material: { price: 0 }, quantity: 1, boxVolume: 0.5 })).toBe(0.5)
    })

    it('should calculate from inches dimensions', () => {
      // 12in * 12in * 12in = 1728 cuin = 1 cuft
      expect(getBoxVolumeCuft({ material: { price: 0 }, quantity: 1, boxLength: 12, boxWidth: 12, boxHeight: 12 })).toBeCloseTo(1)
    })

    it('should return 0 when no volume or dimensions', () => {
      expect(getBoxVolumeCuft({ material: { price: 0 }, quantity: 1 })).toBe(0)
    })
  })

  describe('getConfigBoxVolume', () => {
    it('should return first material with volume', () => {
      const materials = [
        { material: { price: 0 }, quantity: 1 },
        { material: { price: 0 }, quantity: 1, boxVolume: 0.5 },
      ]
      expect(getConfigBoxVolume(materials)).toBe(0.5)
    })

    it('should fallback to dimensions', () => {
      const materials = [
        { material: { price: 0 }, quantity: 1, boxLength: 12, boxWidth: 12, boxHeight: 12 },
      ]
      expect(getConfigBoxVolume(materials)).toBeCloseTo(1)
    })
  })

  describe('getLclTierRate', () => {
    it('should return matching tier', () => {
      const config = { lclTier1: 80, lclTier2: 140, lclTierDefault: 200 }
      expect(getLclTierRate(config, 1)).toBe(80)
      expect(getLclTierRate(config, 2)).toBe(140)
    })

    it('should return default for missing tier', () => {
      const config = { lclTier1: 80, lclTierDefault: 200 }
      expect(getLclTierRate(config, 99)).toBe(200)
    })
  })

  describe('calculateShippingCost', () => {
    const config = {
      fcl20Volume: 950,
      fcl40Volume: 1950,
      fcl20Rate: 3500,
      fcl40Rate: 5800,
      lclHandlingFee: 500,
      lclDocumentFee: 500,
      lclUnitFee: 170,
      lclTier1: 80,
      lclTier2: 140,
      lclTier3: 200,
      lclTierDefault: 260,
    }

    it('should return 0 when perCarton is 0', () => {
      expect(calculateShippingCost('lcl', 1000, 0, 1, config)).toBe(0)
    })

    it('should return 0 for FCL without boxVolume', () => {
      expect(calculateShippingCost('fcl20', 1000, 100, 0, config)).toBe(0)
    })

    it('should calculate FCL20 per-piece shipping cost', () => {
      // perCarton=100, boxVolume=1, quantity=1000
      // cartonCount=10, maxCartons=950, maxPcs=95000, rate=3500
      // shippingCost = 3500 / 95000 * 1000 ≈ 36.84
      const cost = calculateShippingCost('fcl20', 1000, 100, 1, config)
      expect(cost).toBeCloseTo(3500 / 950 * 10, 2)
    })

    it('should calculate LCL with tier rate and fixed fees', () => {
      // perCarton=100, boxVolume=1.766 cuft (so totalCBM ≈ 1.01 → billedCbm=2)
      // quantity=1000 → cartonCount=10 → totalCuft=17.66 → totalCbm=0.5 → billedCbm=1
      // Actually let's use simpler: perCarton=100, boxVolume=3.532, quantity=1000
      // cartonCount=10, totalCuft=35.32, totalCbm=1.0, billedCbm=1
      // cost = 80 + 500 + 170*1 + 500 = 1250
      const cost = calculateShippingCost('lcl', 1000, 100, 3.532, config)
      expect(cost).toBe(80 + 500 + 170 + 500)
    })

    it('should round CBM up for LCL tier', () => {
      // perCarton=100, boxVolume=3.71, quantity=1000
      // cartonCount=10, totalCuft=37.1, totalCbm=1.05, billedCbm=2
      // cost = 140 + 500 + 340 + 500 = 1480
      const cost = calculateShippingCost('lcl', 1000, 100, 3.71, config)
      expect(cost).toBe(140 + 500 + 340 + 500)
    })
  })
})
