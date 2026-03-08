import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserService } from './user.service.js'
import { userRepository } from '../repositories/user.repository.js'
import bcrypt from 'bcryptjs'

// Mock dependencies
vi.mock('../repositories/user.repository.js', () => ({
  userRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

describe('UserService', () => {
  let service: UserService

  beforeEach(() => {
    service = new UserService()
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return paginated user list', async () => {
      const mockResult = {
        data: [{ id: '1', username: 'test', name: 'Test User', email: 'test@example.com', role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() }],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }
      vi.mocked(userRepository.findMany).mockResolvedValue(mockResult)

      const result = await service.getList({ page: 1, pageSize: 20 })

      expect(userRepository.findMany).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
      expect(result).toEqual(mockResult)
    })
  })

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', username: 'test', name: 'Test User', email: 'test@example.com', role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() }
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

      const result = await service.getById('1')

      expect(userRepository.findById).toHaveBeenCalledWith('1')
      expect(result).toEqual(mockUser)
    })

    it('should return null when user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null)

      const result = await service.getById('999')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create user with hashed password', async () => {
      const input = {
        username: 'newuser',
        password: 'password123',
        name: 'New User',
        email: 'new@example.com',
        role: 'user' as const,
      }
      const hashedPassword = 'hashedpassword'
      const mockUser = { id: '1', username: 'newuser', name: 'New User', email: 'new@example.com', role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() }

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never)
      vi.mocked(userRepository.create).mockResolvedValue(mockUser)

      const result = await service.create(input)

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        username: 'newuser',
        password: hashedPassword,
        name: 'New User',
        email: 'new@example.com',
        role: 'user',
        status: 'active',
      }))
      expect(result).toEqual(mockUser)
    })

    it('should use provided status when given', async () => {
      const input = {
        username: 'newuser',
        password: 'password123',
        name: 'New User',
        email: 'new@example.com',
        role: 'user' as const,
        status: 'inactive' as const,
      }
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never)
      vi.mocked(userRepository.create).mockResolvedValue({} as never)

      await service.create(input)

      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        status: 'inactive',
      }))
    })
  })

  describe('update', () => {
    it('should update user with provided fields', async () => {
      const input = { name: 'Updated Name', email: 'updated@example.com' }
      const mockUser = { id: '1', username: 'test', name: 'Updated Name', email: 'updated@example.com', role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() }
      vi.mocked(userRepository.update).mockResolvedValue(mockUser)

      const result = await service.update('1', input)

      expect(userRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        name: 'Updated Name',
        email: 'updated@example.com',
      }))
      expect(result).toEqual(mockUser)
    })

    it('should update user role and status', async () => {
      const input = { role: 'admin' as const, status: 'inactive' as const }
      vi.mocked(userRepository.update).mockResolvedValue({} as never)

      await service.update('1', input)

      expect(userRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        role: 'admin',
        status: 'inactive',
      }))
    })
  })

  describe('delete', () => {
    it('should delete user by id', async () => {
      vi.mocked(userRepository.delete).mockResolvedValue(undefined)

      await service.delete('1')

      expect(userRepository.delete).toHaveBeenCalledWith('1')
    })
  })
})
