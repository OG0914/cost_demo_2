import { prisma } from '@cost/database'

export interface CostCalculationInput {
  modelId: string
  packagingConfigId: string
  saleType: 'domestic' | 'export'
  shippingType: 'fcl20' | 'fcl40' | 'lcl'
  quantity: number
}

export interface CostCalculationResult {
  materialCost: number
  packagingCost: number
  processCost: number
  shippingCost: number
  adminFee: number
  vat: number
  totalCost: number
  unitCost: number
}

interface SystemConfigMap {
  fcl20Rate?: number
  fcl40Rate?: number
  fcl20Volume?: number
  fcl40Volume?: number
  lclHandlingFee?: number
  lclDocumentFee?: number
  lclUnitFee?: number
  lclTier1?: number
  lclTier2?: number
  lclTier3?: number
  lclTier4?: number
  lclTier5?: number
  lclTier6?: number
  lclTier7?: number
  lclTier8?: number
  lclTier9?: number
  lclTier10?: number
  lclTierDefault?: number
  adminFeeRate?: number
  vatRate?: number
}

async function getSystemConfig(): Promise<SystemConfigMap> {
  const config = await prisma.systemConfig.findMany()
  return Object.fromEntries(
    config.map((c: { key: string; value: unknown }) => [c.key, Number(c.value)])
  )
}

async function calculateMaterialCost(modelId: string, quantity: number): Promise<number> {
  const bomMaterials = await prisma.bomMaterial.findMany({
    where: { modelId },
    include: { material: true },
  })

  return bomMaterials.reduce((sum, bom) => {
    return sum + Number(bom.material.price) * Number(bom.quantity) * quantity
  }, 0)
}

async function getPackagingConfig(packagingConfigId: string) {
  return prisma.packagingConfig.findUnique({
    where: { id: packagingConfigId },
    include: {
      processConfigs: true,
      packagingMaterials: {
        include: { material: true },
      },
    },
  })
}

interface PackagingMaterialItem {
  material: { price: number | string | { toNumber(): number } }
  quantity: number | string | { toNumber(): number }
  boxVolume?: number | string | { toNumber(): number } | null
  boxLength?: number | string | { toNumber(): number } | null
  boxWidth?: number | string | { toNumber(): number } | null
  boxHeight?: number | string | { toNumber(): number } | null
}

function calculatePackagingCost(
  packagingMaterials: PackagingMaterialItem[],
  quantity: number
): number {
  return packagingMaterials.reduce(
    (sum, pm) => sum + Number(pm.material.price) * Number(pm.quantity) * quantity,
    0
  )
}

export function getBoxVolumeCuft(material: PackagingMaterialItem): number {
  if (material.boxVolume) return Number(material.boxVolume)
  if (material.boxLength && material.boxWidth && material.boxHeight) {
    // 假设输入尺寸为英寸，cuft = 长×宽×高 ÷ 1728
    return (Number(material.boxLength) * Number(material.boxWidth) * Number(material.boxHeight)) / 1728
  }
  return 0
}

export function getConfigBoxVolume(packagingMaterials: PackagingMaterialItem[]): number {
  // 取第一个有 boxVolume 或尺寸的包材作为外箱材积
  for (const material of packagingMaterials) {
    const volume = getBoxVolumeCuft(material)
    if (volume > 0) return volume
  }
  return 0
}

interface ProcessConfigItem {
  unit: string
  price: number | string | { toNumber(): number }
}

function calculateProcessCost(
  processConfigs: ProcessConfigItem[],
  quantity: number
): number {
  return processConfigs.reduce((sum, pc) => {
    const unitMultiplier = pc.unit === 'dozen' ? quantity / 12 : quantity
    return sum + Number(pc.price) * unitMultiplier
  }, 0)
}

export function getLclTierRate(config: SystemConfigMap, billedCbm: number): number {
  const tierKey = `lclTier${billedCbm}` as keyof SystemConfigMap
  return (config[tierKey] as number | undefined) ?? (config.lclTierDefault ?? 0)
}

export function calculateShippingCost(
  shippingType: 'fcl20' | 'fcl40' | 'lcl',
  quantity: number,
  perCarton: number,
  boxVolumeCuft: number,
  config: SystemConfigMap
): number {
  if (perCarton <= 0) return 0

  const cartonCount = Math.ceil(quantity / perCarton)

  switch (shippingType) {
    case 'fcl20':
    case 'fcl40': {
      if (boxVolumeCuft <= 0) return 0
      const volumeKey = shippingType === 'fcl20' ? 'fcl20Volume' : 'fcl40Volume'
      const rateKey = shippingType === 'fcl20' ? 'fcl20Rate' : 'fcl40Rate'
      const volume = config[volumeKey] ?? (shippingType === 'fcl20' ? 950 : 1950)
      const rate = config[rateKey] ?? (shippingType === 'fcl20' ? 3500 : 5800)
      const maxCartons = volume / boxVolumeCuft
      const maxPcs = maxCartons * perCarton
      if (maxPcs <= 0) return 0
      return (rate / maxPcs) * quantity
    }
    case 'lcl': {
      if (boxVolumeCuft <= 0) return 0
      const totalCuft = cartonCount * boxVolumeCuft
      const totalCbm = totalCuft / 35.32
      const billedCbm = Math.ceil(totalCbm)
      const tierBaseRate = getLclTierRate(config, billedCbm)
      const handlingFee = config.lclHandlingFee ?? 500
      const documentFee = config.lclDocumentFee ?? 500
      const lclFee = (config.lclUnitFee ?? 170) * billedCbm
      return tierBaseRate + handlingFee + documentFee + lclFee
    }
    default:
      return 0
  }
}

function calculateAdminFee(
  materialCost: number,
  packagingCost: number,
  processCost: number,
  adminFeeRate: number
): number {
  return (materialCost + packagingCost + processCost) * adminFeeRate
}

function calculateVat(
  materialCost: number,
  packagingCost: number,
  processCost: number,
  adminFee: number,
  vatRate: number,
  saleType: 'domestic' | 'export'
): number {
  if (saleType !== 'domestic') return 0
  return (materialCost + packagingCost + processCost + adminFee) * vatRate
}

export async function calculateCosts(input: CostCalculationInput): Promise<CostCalculationResult> {
  const { modelId, packagingConfigId, saleType, shippingType, quantity } = input

  const [config, materialCost, packagingConfig] = await Promise.all([
    getSystemConfig(),
    calculateMaterialCost(modelId, quantity),
    getPackagingConfig(packagingConfigId),
  ])

  if (!packagingConfig) {
    throw new Error('包装配置不存在')
  }

  const packagingCost = calculatePackagingCost(packagingConfig.packagingMaterials, quantity)
  const processCost = calculateProcessCost(packagingConfig.processConfigs, quantity)
  const boxVolumeCuft = getConfigBoxVolume(packagingConfig.packagingMaterials)

  const shippingCost = calculateShippingCost(shippingType, quantity, packagingConfig.perCarton, boxVolumeCuft, config)

  const adminFeeRate = config.adminFeeRate ?? 0.1
  const adminFee = calculateAdminFee(materialCost, packagingCost, processCost, adminFeeRate)

  const vatRate = config.vatRate ?? 0.13
  const vat = calculateVat(materialCost, packagingCost, processCost, adminFee, vatRate, saleType)

  const totalCost = materialCost + packagingCost + processCost + shippingCost + adminFee + vat

  return {
    materialCost,
    packagingCost,
    processCost,
    shippingCost,
    adminFee,
    vat,
    totalCost,
    unitCost: totalCost / quantity,
  }
}
