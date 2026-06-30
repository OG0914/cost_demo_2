// 标准包装类型常量
export const STANDARD_BOX = 'standard_box' as const
export const NO_BOX = 'no_box' as const
export const BLISTER_DIRECT = 'blister_direct' as const
export const BLISTER_BAG = 'blister_bag' as const

export type PackagingType =
  | typeof STANDARD_BOX
  | typeof NO_BOX
  | typeof BLISTER_DIRECT
  | typeof BLISTER_BAG

export const PACKAGING_TYPES: PackagingType[] = [
  STANDARD_BOX,
  NO_BOX,
  BLISTER_DIRECT,
  BLISTER_BAG,
]

// 包装类型元数据：中文名、层级单位、是否为三层包装
export interface PackagingTypeMeta {
  key: PackagingType
  label: string
  layerUnits: [string, string] | [string, string, string]
  isThreeLayer: boolean
}

export const PACKAGING_TYPE_META: Record<PackagingType, PackagingTypeMeta> = {
  [STANDARD_BOX]: {
    key: STANDARD_BOX,
    label: '标准彩盒',
    layerUnits: ['片/袋', '袋/盒', '盒/箱'],
    isThreeLayer: true,
  },
  [NO_BOX]: {
    key: NO_BOX,
    label: '无彩盒',
    layerUnits: ['片/袋', '袋/箱'],
    isThreeLayer: false,
  },
  [BLISTER_DIRECT]: {
    key: BLISTER_DIRECT,
    label: '泡壳直装',
    layerUnits: ['片/泡壳', '泡壳/箱'],
    isThreeLayer: false,
  },
  [BLISTER_BAG]: {
    key: BLISTER_BAG,
    label: '泡壳袋装',
    layerUnits: ['片/袋', '袋/泡壳', '泡壳/箱'],
    isThreeLayer: true,
  },
}

export function getPackagingTypeLabel(type: string): string {
  return PACKAGING_TYPE_META[type as PackagingType]?.label ?? type
}

export function isThreeLayerType(type: string): boolean {
  return PACKAGING_TYPE_META[type as PackagingType]?.isThreeLayer ?? false
}

// 根据类型和层级计算每盒数量（两层类型返回 null）
export function calculatePerBox(type: string, layer1: number, layer2: number): number | null {
  if (!isThreeLayerType(type)) return null
  return layer1 * layer2
}

// 根据层级计算每箱数量
export function calculatePerCarton(
  layer1: number,
  layer2: number,
  layer3?: number | null
): number {
  return layer1 * layer2 * (layer3 ?? 1)
}

// 生成包装方式描述，例如 "10片/袋, 10袋/盒, 50盒/箱"
export function formatPackagingDescription(
  type: string,
  layer1: number,
  layer2: number,
  layer3?: number | null
): string {
  const meta = PACKAGING_TYPE_META[type as PackagingType]
  if (!meta) return ''

  const layers = [layer1, layer2, ...(layer3 !== undefined && layer3 !== null ? [layer3] : [])]
  return meta.layerUnits
    .map((unit, index) => `${layers[index]}${unit}`)
    .join(', ')
}
