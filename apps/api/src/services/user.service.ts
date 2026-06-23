import bcrypt from 'bcryptjs'
import type { Prisma, Role, UserStatus } from '@cost/database'
import { BaseService } from './base.service.js'
import { userRepository, type PaginationParams, type PaginatedResult } from '../repositories/user.repository.js'
import { createError } from '../plugins/error-handler.js'
import type { User } from '@cost/database'

export interface CreateUserInput {
  username: string
  password: string
  name: string
  email: string
  role: Role
  status?: UserStatus
}

export interface UpdateUserInput {
  name?: string
  email?: string
  role?: Role
  status?: UserStatus
  password?: string
}

const USER_SELECT_FIELDS = {
  id: true,
  username: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

type UserResult = Pick<User, keyof typeof USER_SELECT_FIELDS>

export class UserService extends BaseService {
  async getList(params: PaginationParams): Promise<PaginatedResult<UserResult>> {
    return userRepository.findMany(params)
  }

  async getById(id: string): Promise<UserResult | null> {
    return userRepository.findById(id)
  }

  async create(input: CreateUserInput): Promise<UserResult> {
    const hashedPassword = await bcrypt.hash(input.password, 10)

    const createData: Prisma.UserCreateInput = {
      username: input.username,
      password: hashedPassword,
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status || 'active',
    }

    return userRepository.create(createData)
  }

  async update(id: string, input: UpdateUserInput): Promise<UserResult> {
    const updateData: Prisma.UserUpdateInput = {
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status,
    }

    if (input.password) {
      updateData.password = await bcrypt.hash(input.password, 10)
    }

    return userRepository.update(id, updateData)
  }

  async delete(id: string): Promise<void> {
    // 检查用户是否有关联业务数据
    const counts = await Promise.all([
      this.prisma.quotation.count({ where: { createdBy: id } }),
      this.prisma.quotation.count({ where: { reviewedBy: id } }),
      this.prisma.customer.count({ where: { createdBy: id } }),
      this.prisma.customer.count({ where: { updatedBy: id } }),
      this.prisma.standardCost.count({ where: { setBy: id } }),
      this.prisma.notification.count({ where: { processedBy: id } }),
    ])

    const totalCount = counts.reduce((sum, count) => sum + count, 0)

    if (totalCount > 0) {
      const [
        createdQuotations,
        reviewedQuotations,
        createdCustomers,
        updatedCustomers,
        setStandardCosts,
        processedNotifications,
      ] = await Promise.all([
        counts[0] > 0 ? this.prisma.quotation.findFirst({ where: { createdBy: id }, select: { quotationNo: true } }) : null,
        counts[1] > 0 ? this.prisma.quotation.findFirst({ where: { reviewedBy: id }, select: { quotationNo: true } }) : null,
        counts[2] > 0 ? this.prisma.customer.findFirst({ where: { createdBy: id }, select: { name: true } }) : null,
        counts[3] > 0 ? this.prisma.customer.findFirst({ where: { updatedBy: id }, select: { name: true } }) : null,
        counts[4] > 0 ? this.prisma.standardCost.findFirst({ where: { setBy: id }, select: { id: true } }) : null,
        counts[5] > 0 ? this.prisma.notification.findFirst({ where: { processedBy: id }, select: { id: true } }) : null,
      ])

      const associations = [
        { type: '报价单', identifier: createdQuotations?.quotationNo },
        { type: '审核的报价单', identifier: reviewedQuotations?.quotationNo },
        { type: '客户', identifier: createdCustomers?.name },
        { type: '更新的客户', identifier: updatedCustomers?.name },
        { type: '标准成本', identifier: setStandardCosts?.id },
        { type: '通知', identifier: processedNotifications?.id },
      ].filter((item) => item.identifier)

      const first = associations[0]
      const message = totalCount > 1
        ? `无法删除：该用户已关联业务数据（${first.type} ${first.identifier} 等 ${totalCount} 条），请先处理相关数据`
        : `无法删除：该用户已关联业务数据（${first.type} ${first.identifier}），请先处理相关数据`

      throw createError.conflict(message)
    }

    await userRepository.delete(id)
  }
}

export const userService = new UserService()
