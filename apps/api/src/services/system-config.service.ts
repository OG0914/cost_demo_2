import { prisma } from '@cost/database'
import type { Prisma, SystemConfig } from '@cost/database'

export class SystemConfigService {
  async getList(): Promise<SystemConfig[]> {
    return prisma.systemConfig.findMany()
  }

  async getByKey(key: string): Promise<SystemConfig | null> {
    return prisma.systemConfig.findUnique({ where: { key } })
  }

  async update(key: string, value: Prisma.InputJsonValue): Promise<SystemConfig> {
    return prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }
}

export const systemConfigService = new SystemConfigService()
