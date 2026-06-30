import { PrismaClient, Role, UserStatus, RegulationStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 标准包装类型常量（seed 不依赖构建后的 shared-types，直接内联）
const STANDARD_BOX = 'standard_box'
const NO_BOX = 'no_box'
const BLISTER_DIRECT = 'blister_direct'
const BLISTER_BAG = 'blister_bag'

function isThreeLayerType(type: string): boolean {
  return type === STANDARD_BOX || type === BLISTER_BAG
}

function calculatePerBox(type: string, layer1: number, layer2: number): number | null {
  return isThreeLayerType(type) ? layer1 * layer2 : null
}

function calculatePerCarton(layer1: number, layer2: number, layer3?: number | null): number {
  return layer1 * layer2 * (layer3 ?? 1)
}

// 用户 ID
const USER_ADMIN_ID = 'b045a025-da3e-4391-9f78-eb517d1ade27'
const USER_PURCHASER_ID = '9292aebd-eeb4-48ec-9e7f-0996da24b91e'
const USER_REVIEWER_ID = '1670ff03-7162-4342-8b59-99b9ebe88ec6'

// 法规 ID
const REGULATION_GB_ID = '262b6185-adb3-47d4-bdac-ec4e49e447c8'
const REGULATION_EN_ID = 'dbe18eb2-e9c6-482d-a8e4-7f95db02fa91'
const REGULATION_NIOSH_ID = '5d2def71-8c49-4fc3-b795-5082ee044de8'
const REGULATION_AS_NZS_ID = '2dc9d8b4-b82a-41f3-8a93-c525f186c5ca'

// 客户 ID
const CUSTOMER_3M_ID = 'ec628927-2d46-49e7-8230-46a7e4e8bc40'
const CUSTOMER_HONEYWELL_ID = '6e115991-e63f-454d-b78b-39e13b15423a'
const CUSTOMER_HONEYWELL_SAFETY_ID = '57cb6530-75aa-43a5-aae9-f62fc5a5d665'
const CUSTOMER_MSA_ID = 'a3f8c5e4-8e1e-4894-a97f-fd5874f15af0'
const CUSTOMER_DRAEGER_ID = '3bb92456-6ed0-4385-a798-5e9aa3af5c00'

// 原材料 ID
const MATERIAL_SILICONE_ID = 'b2089198-d75b-4fec-a39a-8d40a89371c0'
const MATERIAL_VALVE_ID = '8f934d2f-cd14-4a44-bd46-86b66bd69296'
const MATERIAL_HEADBAND_ID = '0d7c1b6c-a4da-4f3e-ae60-e1309e742c2d'
const MATERIAL_FILTER_COTTON_ID = 'a5e46950-ccab-4cb9-8afa-493f1b2619d8'
const MATERIAL_NOSE_CLIP_ID = '3355cf2a-528b-4b19-916a-17d85a1218c7'
const MATERIAL_EAR_LOOP_ID = 'cdbd94b9-9d42-44a2-8520-15c793b948f0'
const MATERIAL_FILTER_CARTRIDGE_ID = '9e2136f5-e970-4306-847c-0d30da079a93'
const MATERIAL_GASKET_ID = 'd8b3d87f-bcd1-47a4-83a3-b9789b2db479'

// 型号 ID
const MODEL_D700_ID = '4b57514b-8c43-4a86-b052-817cac1fcbb3'
const MODEL_D800_ID = '696478db-374c-4098-9b6e-d8587e1cfebc'
const MODEL_P100_ID = '99e66eeb-5568-45ac-b439-769408b47591'
const MODEL_P200_ID = 'a6ac18e4-32a6-49db-8f64-5adb773c6254'
const MODEL_N95_ID = 'c49d46a4-61a9-4ce0-81ae-af48cc85f6b2'
const MODEL_D900_ID = '10201459-3013-41f0-8b8b-7911de289668'

// BOM ID
const BOM_1_ID = '700f85a7-0954-4084-bec3-3f25719413b2'
const BOM_2_ID = '94fb7494-ae3f-4bb2-a2d1-e8d7421b60e6'
const BOM_3_ID = 'aeec2dbd-37da-47bc-b3a8-744deefe0878'
const BOM_4_ID = 'de9f51e0-ff98-4c63-a849-46cefdbd4a0b'
const BOM_5_ID = '8777338d-3d67-43d5-8528-a88e137a0b27'
const BOM_6_ID = '449c50cd-9f44-43c3-9caf-3f1f4fcbce62'
const BOM_7_ID = 'ca53c977-eca9-4e19-ae7d-c1437d9d93a5'
const BOM_8_ID = 'd50eeb8a-8a65-45d2-81a7-5047e9256926'
const BOM_9_ID = '680c534c-5f5c-4611-b1b7-03b48784e5fc'
const BOM_10_ID = '41964d0e-97f4-4a29-b3b4-b358d1f492c5'

// 包装配置 ID
const PACKAGING_STANDARD_SINGLE_ID = '75620ceb-b431-4146-a776-e6fbc4f132de'
const PACKAGING_BULK_50_ID = '666f7e10-29a7-41ac-9977-50173c8dde35'
const PACKAGING_D800_STANDARD_ID = '36c0aa1c-ee97-40e8-b6b4-618a4b6302f8'
const PACKAGING_P100_50_ID = 'f50c3324-7d7d-412b-879c-884a90f288fe'
const PACKAGING_N95_20_ID = '990df18e-711a-48ab-8a68-925b4906de40'

// 工序配置 ID
const PROCESS_ASSEMBLE_1_ID = 'b61985ce-b4f6-4886-a6db-059b06b8b421'
const PROCESS_INSPECT_1_ID = '1cabd727-fac7-4b96-aeaa-6abd20fea6cd'
const PROCESS_PACKAGE_1_ID = 'c2174a03-ff2e-43a7-babd-7cb4443f2f6a'
const PROCESS_ASSEMBLE_2_ID = 'ddb76e74-8cd1-4a9d-adf1-4609a5ccecab'
const PROCESS_BULK_PACKAGE_ID = '6d4a4360-6cae-4614-bbde-a66ebff34808'
const PROCESS_CUT_ID = 'a3fa0a6d-d82b-4514-a53f-8c18a4fd781a'
const PROCESS_WELD_ID = 'b61fefb0-17fc-42fd-ae24-512df64c57e3'
const PROCESS_PACKAGE_2_ID = '0257b074-a32a-44f3-979a-7b19a5882014'

// 包材配置 ID
const PACKAGING_MATERIAL_PE_BAG_ID = '705541fd-22d0-4efe-90df-fc499aad5916'
const PACKAGING_MATERIAL_MANUAL_ID = '87c2d01b-5917-4bef-becc-819c735131e1'
const PACKAGING_MATERIAL_SMALL_BOX_ID = 'f4873c7d-8d12-4634-abbe-fcefe1132fa7'
const PACKAGING_MATERIAL_OUTER_BOX_1_ID = '831ad988-e42d-4663-ba0c-64974f85931e'
const PACKAGING_MATERIAL_INNER_BAG_ID = '3beb8906-e514-4b44-a0db-d87a996fd20c'
const PACKAGING_MATERIAL_OUTER_BOX_2_ID = 'cec9cf3d-4c7e-4e78-818d-952b4bf347d0'
const PACKAGING_MATERIAL_INNER_BOX_ID = '97c2b9e1-c61f-4417-8500-dea08001605c'
const PACKAGING_MATERIAL_OUTER_BOX_3_ID = 'dfbee6e0-596a-4104-83cb-e8f40097040e'

async function main() {
  console.log('开始种子数据...')

  // 清理现有数据
  await prisma.notification.deleteMany()
  await prisma.standardCost.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.processConfig.deleteMany()
  await prisma.packagingMaterial.deleteMany()
  await prisma.packagingConfig.deleteMany()
  await prisma.bomMaterial.deleteMany()
  await prisma.material.deleteMany()
  await prisma.model.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.regulation.deleteMany()
  await prisma.systemConfig.deleteMany()
  await prisma.user.deleteMany()

  console.log('已清理现有数据')

  // 创建用户
  const adminPassword = await bcrypt.hash('admin123', 10)
  const purchaserPassword = await bcrypt.hash('purchaser123', 10)
  const reviewerPassword = await bcrypt.hash('reviewer123', 10)

  const admin = await prisma.user.create({
    data: {
      id: USER_ADMIN_ID,
      username: 'admin',
      password: adminPassword,
      name: '张明',
      email: 'admin@company.com',
      role: Role.admin,
      status: UserStatus.active,
      createdAt: new Date('2024-01-01'),
    },
  })

  const purchaser = await prisma.user.create({
    data: {
      id: USER_PURCHASER_ID,
      username: 'purchaser',
      password: purchaserPassword,
      name: '李采购',
      email: 'purchaser@company.com',
      role: Role.purchaser,
      status: UserStatus.active,
      createdAt: new Date('2024-01-01'),
    },
  })

  const reviewer = await prisma.user.create({
    data: {
      id: USER_REVIEWER_ID,
      username: 'reviewer',
      password: reviewerPassword,
      name: '王审核',
      email: 'reviewer@company.com',
      role: Role.reviewer,
      status: UserStatus.active,
      createdAt: new Date('2024-01-01'),
    },
  })

  console.log('已创建用户:', { admin: admin.name, purchaser: purchaser.name, reviewer: reviewer.name })

  // 创建法规
  const regulations = await prisma.regulation.createMany({
    data: [
      { id: REGULATION_GB_ID, code: 'GB', name: 'GB', description: '中国国家标准', status: RegulationStatus.active },
      { id: REGULATION_EN_ID, code: 'EN', name: 'EN', description: '欧洲标准', status: RegulationStatus.active },
      { id: REGULATION_NIOSH_ID, code: 'NIOSH', name: 'NIOSH', description: '美国NIOSH标准', status: RegulationStatus.active },
      { id: REGULATION_AS_NZS_ID, code: 'AS/NZS', name: 'AS/NZS', description: '澳洲/新西兰标准', status: RegulationStatus.active },
    ],
  })

  console.log('已创建法规:', regulations.count)

  // 创建客户
  const customers = await prisma.customer.createMany({
    data: [
      { id: CUSTOMER_3M_ID, code: 'VC001', name: '3M中国', region: '华东', note: '重点客户', createdBy: USER_ADMIN_ID, updatedBy: USER_ADMIN_ID },
      { id: CUSTOMER_HONEYWELL_ID, code: 'VC002', name: 'Honeywell', region: '华北', note: '外资企业', createdBy: USER_ADMIN_ID, updatedBy: USER_ADMIN_ID },
      { id: CUSTOMER_HONEYWELL_SAFETY_ID, code: 'VC003', name: '霍尼韦尔安全', region: '华南', createdBy: USER_ADMIN_ID, updatedBy: USER_ADMIN_ID },
      { id: CUSTOMER_MSA_ID, code: 'VC004', name: 'MSA安全', region: '西南', createdBy: USER_ADMIN_ID, updatedBy: USER_ADMIN_ID },
      { id: CUSTOMER_DRAEGER_ID, code: 'VC005', name: '德尔格安全', region: '华中', createdBy: USER_ADMIN_ID, updatedBy: USER_ADMIN_ID },
    ],
  })

  console.log('已创建客户:', customers.count)

  // 创建原材料
  const materials = await prisma.material.createMany({
    data: [
      { id: MATERIAL_SILICONE_ID, materialNo: 'M001', name: '硅胶面罩主体', unit: '个', price: 12.5, currency: 'CNY', manufacturer: '国产A厂', category: '半面罩类' },
      { id: MATERIAL_VALVE_ID, materialNo: 'M002', name: '呼吸阀', unit: '个', price: 3.2, currency: 'CNY', manufacturer: '国产B厂', category: '半面罩类' },
      { id: MATERIAL_HEADBAND_ID, materialNo: 'M003', name: '头带组件', unit: '套', price: 4.8, currency: 'CNY', manufacturer: '进口C厂', category: '半面罩类' },
      { id: MATERIAL_FILTER_COTTON_ID, materialNo: 'M004', name: '滤棉', unit: 'KG', price: 85, currency: 'CNY', manufacturer: '国产D厂', category: '口罩类' },
      { id: MATERIAL_NOSE_CLIP_ID, materialNo: 'M005', name: '鼻夹', unit: '码', price: 0.15, currency: 'CNY', manufacturer: '国产E厂', category: '口罩类' },
      { id: MATERIAL_EAR_LOOP_ID, materialNo: 'M006', name: '耳带', unit: '码', price: 0.08, currency: 'CNY', manufacturer: '国产F厂', category: '口罩类' },
      { id: MATERIAL_FILTER_CARTRIDGE_ID, materialNo: 'M007', name: '滤盒', unit: '个', price: 8.5, currency: 'CNY', manufacturer: '进口G厂', category: '半面罩类' },
      { id: MATERIAL_GASKET_ID, materialNo: 'M008', name: '密封垫', unit: '个', price: 1.2, currency: 'CNY', manufacturer: '国产H厂', category: '半面罩类' },
    ],
  })

  console.log('已创建原材料:', materials.count)

  // 创建型号
  const models = await prisma.model.createMany({
    data: [
      { id: MODEL_D700_ID, name: 'D-700', regulationId: REGULATION_GB_ID, category: '半面罩', series: 'D系列', imageUrl: '/models/d700.png' },
      { id: MODEL_D800_ID, name: 'D-800', regulationId: REGULATION_GB_ID, category: '半面罩', series: 'D系列', imageUrl: '/models/d800.png' },
      { id: MODEL_P100_ID, name: 'P-100', regulationId: REGULATION_EN_ID, category: '口罩', series: 'P系列', imageUrl: '/models/p100.png' },
      { id: MODEL_P200_ID, name: 'P-200', regulationId: REGULATION_EN_ID, category: '口罩', series: 'P系列', imageUrl: '/models/p200.png' },
      { id: MODEL_N95_ID, name: 'N-95', regulationId: REGULATION_NIOSH_ID, category: '口罩', series: 'N系列', imageUrl: '/models/n95.png' },
      { id: MODEL_D900_ID, name: 'D-900', regulationId: REGULATION_GB_ID, category: '半面罩', series: 'D系列', imageUrl: '/models/d900.png' },
    ],
  })

  console.log('已创建型号:', models.count)

  // 创建BOM
  const boms = await prisma.bomMaterial.createMany({
    data: [
      { id: BOM_1_ID, modelId: MODEL_D700_ID, materialId: MATERIAL_SILICONE_ID, quantity: 1, sortOrder: 1 },
      { id: BOM_2_ID, modelId: MODEL_D700_ID, materialId: MATERIAL_VALVE_ID, quantity: 1, sortOrder: 2 },
      { id: BOM_3_ID, modelId: MODEL_D700_ID, materialId: MATERIAL_HEADBAND_ID, quantity: 1, sortOrder: 3 },
      { id: BOM_4_ID, modelId: MODEL_D700_ID, materialId: MATERIAL_FILTER_CARTRIDGE_ID, quantity: 2, sortOrder: 4 },
      { id: BOM_5_ID, modelId: MODEL_D800_ID, materialId: MATERIAL_SILICONE_ID, quantity: 1, sortOrder: 1 },
      { id: BOM_6_ID, modelId: MODEL_D800_ID, materialId: MATERIAL_VALVE_ID, quantity: 2, sortOrder: 2 },
      { id: BOM_7_ID, modelId: MODEL_D800_ID, materialId: MATERIAL_HEADBAND_ID, quantity: 1, sortOrder: 3 },
      { id: BOM_8_ID, modelId: MODEL_P100_ID, materialId: MATERIAL_FILTER_COTTON_ID, quantity: 0.05, sortOrder: 1 },
      { id: BOM_9_ID, modelId: MODEL_P100_ID, materialId: MATERIAL_NOSE_CLIP_ID, quantity: 0.1, sortOrder: 2 },
      { id: BOM_10_ID, modelId: MODEL_P100_ID, materialId: MATERIAL_EAR_LOOP_ID, quantity: 0.2, sortOrder: 3 },
    ],
  })

  console.log('已创建BOM:', boms.count)

  // 创建包装配置
  const packagingConfigs = await prisma.packagingConfig.createMany({
    data: [
      {
        id: PACKAGING_STANDARD_SINGLE_ID,
        modelId: MODEL_D700_ID,
        name: 'D-700 标准彩盒',
        packagingType: STANDARD_BOX,
        layer1: 1,
        layer2: 50,
        layer3: 4,
        perBox: calculatePerBox(STANDARD_BOX, 1, 50),
        perCarton: calculatePerCarton(1, 50, 4),
      },
      {
        id: PACKAGING_BULK_50_ID,
        modelId: MODEL_D700_ID,
        name: 'D-700 无彩盒散装',
        packagingType: NO_BOX,
        layer1: 1,
        layer2: 500,
        perBox: calculatePerBox(NO_BOX, 1, 500),
        perCarton: calculatePerCarton(1, 500),
      },
      {
        id: PACKAGING_D800_STANDARD_ID,
        modelId: MODEL_D800_ID,
        name: 'D-800 标准彩盒',
        packagingType: STANDARD_BOX,
        layer1: 1,
        layer2: 40,
        layer3: 4,
        perBox: calculatePerBox(STANDARD_BOX, 1, 40),
        perCarton: calculatePerCarton(1, 40, 4),
      },
      {
        id: PACKAGING_P100_50_ID,
        modelId: MODEL_P100_ID,
        name: 'P-100 泡壳袋装',
        packagingType: BLISTER_BAG,
        layer1: 5,
        layer2: 2,
        layer3: 50,
        perBox: calculatePerBox(BLISTER_BAG, 5, 2),
        perCarton: calculatePerCarton(5, 2, 50),
      },
      {
        id: PACKAGING_N95_20_ID,
        modelId: MODEL_N95_ID,
        name: 'N-95 泡壳直装',
        packagingType: BLISTER_DIRECT,
        layer1: 1,
        layer2: 400,
        perBox: calculatePerBox(BLISTER_DIRECT, 1, 400),
        perCarton: calculatePerCarton(1, 400),
      },
    ],
  })

  console.log('已创建包装配置:', packagingConfigs.count)

  // 创建工序配置
  const processConfigs = await prisma.processConfig.createMany({
    data: [
      { id: PROCESS_ASSEMBLE_1_ID, packagingConfigId: PACKAGING_STANDARD_SINGLE_ID, name: '组装', price: 0.5, unit: 'piece', sortOrder: 1 },
      { id: PROCESS_INSPECT_1_ID, packagingConfigId: PACKAGING_STANDARD_SINGLE_ID, name: '检验', price: 0.2, unit: 'piece', sortOrder: 2 },
      { id: PROCESS_PACKAGE_1_ID, packagingConfigId: PACKAGING_STANDARD_SINGLE_ID, name: '包装', price: 0.3, unit: 'piece', sortOrder: 3 },
      { id: PROCESS_ASSEMBLE_2_ID, packagingConfigId: PACKAGING_BULK_50_ID, name: '组装', price: 0.45, unit: 'piece', sortOrder: 1 },
      { id: PROCESS_BULK_PACKAGE_ID, packagingConfigId: PACKAGING_BULK_50_ID, name: '散装打包', price: 0.15, unit: 'piece', sortOrder: 2 },
      { id: PROCESS_CUT_ID, packagingConfigId: PACKAGING_P100_50_ID, name: '裁切', price: 2.4, unit: 'dozen', sortOrder: 1 },
      { id: PROCESS_WELD_ID, packagingConfigId: PACKAGING_P100_50_ID, name: '焊接', price: 3.6, unit: 'dozen', sortOrder: 2 },
      { id: PROCESS_PACKAGE_2_ID, packagingConfigId: PACKAGING_P100_50_ID, name: '包装', price: 1.2, unit: 'dozen', sortOrder: 3 },
    ],
  })

  console.log('已创建工序配置:', processConfigs.count)

  // 创建包材配置（按 Task 3 schema，materialId 必填）
  const packagingMaterials = await prisma.packagingMaterial.createMany({
    data: [
      {
        id: PACKAGING_MATERIAL_PE_BAG_ID,
        packagingConfigId: PACKAGING_STANDARD_SINGLE_ID,
        materialId: MATERIAL_VALVE_ID,
        quantity: 1,
        boxVolume: 0.25,
      },
      {
        id: PACKAGING_MATERIAL_MANUAL_ID,
        packagingConfigId: PACKAGING_STANDARD_SINGLE_ID,
        materialId: MATERIAL_HEADBAND_ID,
        quantity: 1,
        boxVolume: 0.15,
      },
      {
        id: PACKAGING_MATERIAL_SMALL_BOX_ID,
        packagingConfigId: PACKAGING_STANDARD_SINGLE_ID,
        materialId: MATERIAL_GASKET_ID,
        quantity: 2,
        boxVolume: 0.35,
      },
      {
        id: PACKAGING_MATERIAL_OUTER_BOX_1_ID,
        packagingConfigId: PACKAGING_BULK_50_ID,
        materialId: MATERIAL_FILTER_CARTRIDGE_ID,
        quantity: 2,
        boxVolume: 0.5,
      },
      {
        id: PACKAGING_MATERIAL_INNER_BAG_ID,
        packagingConfigId: PACKAGING_P100_50_ID,
        materialId: MATERIAL_FILTER_COTTON_ID,
        quantity: 0.05,
        boxVolume: 0.08,
      },
      {
        id: PACKAGING_MATERIAL_OUTER_BOX_2_ID,
        packagingConfigId: PACKAGING_P100_50_ID,
        materialId: MATERIAL_NOSE_CLIP_ID,
        quantity: 0.1,
        boxVolume: 0.12,
      },
      {
        id: PACKAGING_MATERIAL_INNER_BOX_ID,
        packagingConfigId: PACKAGING_N95_20_ID,
        materialId: MATERIAL_EAR_LOOP_ID,
        quantity: 0.2,
        boxVolume: 0.1,
      },
      {
        id: PACKAGING_MATERIAL_OUTER_BOX_3_ID,
        packagingConfigId: PACKAGING_N95_20_ID,
        materialId: MATERIAL_FILTER_COTTON_ID,
        quantity: 0.05,
        boxVolume: 0.18,
      },
    ],
  })

  console.log('已创建包材配置:', packagingMaterials.count)

  // 创建系统配置
  await prisma.systemConfig.createMany({
    data: [
      { key: 'adminFeeRate', value: 0.1 },
      { key: 'vatRate', value: 0.13 },
      { key: 'exchangeRate', value: 7.2 },
      // FCL 柜型运费（USD/柜）
      { key: 'fcl20Rate', value: 3500 },
      { key: 'fcl40Rate', value: 5800 },
      // FCL 柜型容积（cuft）
      { key: 'fcl20Volume', value: 950 },
      { key: 'fcl40Volume', value: 1950 },
      // LCL 固定费用（CNY）
      { key: 'lclHandlingFee', value: 500 },
      { key: 'lclDocumentFee', value: 500 },
      { key: 'lclUnitFee', value: 170 },
      // LCL CBM 档位基础运费（USD/CBM），Lucas 可在 system 页调整
      { key: 'lclTier1', value: 80 },
      { key: 'lclTier2', value: 140 },
      { key: 'lclTier3', value: 200 },
      { key: 'lclTier4', value: 260 },
      { key: 'lclTier5', value: 320 },
      { key: 'lclTier6', value: 380 },
      { key: 'lclTier7', value: 440 },
      { key: 'lclTier8', value: 500 },
      { key: 'lclTier9', value: 560 },
      { key: 'lclTier10', value: 620 },
      // 超出 10 CBM 的默认费率
      { key: 'lclTierDefault', value: 680 },
    ],
  })

  console.log('已创建系统配置')

  console.log('种子数据完成!')
  console.log('默认用户:')
  console.log('  admin / admin123')
  console.log('  purchaser / purchaser123')
  console.log('  reviewer / reviewer123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
