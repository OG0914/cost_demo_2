import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'

// Mock user service
vi.mock('../services/user.service.js', () => ({
  userService: {
    getList: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock http-response utils
vi.mock('../utils/http-response.js', () => ({
  sendSuccess: vi.fn((reply, data, meta) => {
    const response: { success: boolean; data: unknown; meta?: unknown } = { success: true, data }
    if (meta) response.meta = meta
    return reply.send(response)
  }),
  sendError: vi.fn((reply, status, code, message) => {
    return reply.code(status).send({ success: false, error: { code, message } })
  }),
  sendNotFound: vi.fn((reply, resource) => {
    return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: `${resource}不存在` } })
  }),
}))

// Mock schemas
vi.mock('../lib/schemas.js', () => ({
  createUserSchema: {
    safeParse: vi.fn((data) => ({
      success: data.username?.length >= 3 && data.password?.length >= 6,
      data: data,
    })),
  },
  updateUserSchema: {
    safeParse: vi.fn((data) => ({
      success: true,
      data: data,
    })),
  },
  formatZodError: vi.fn((error) => 'Validation error'),
}))

// Import controller after mocks
import { UserController } from './user.controller.js'
import { userService } from '../services/user.service.js'

describe('UserController', () => {
  let controller: UserController
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(() => {
    controller = new UserController()
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return user list with pagination', async () => {
      const mockUsers = {
        data: [{ id: '1', username: 'test', name: 'Test User', email: 'test@example.com', role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() }],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }
      vi.mocked(userService.getList).mockResolvedValue(mockUsers)
      mockRequest = { query: { page: '1', pageSize: '20' } }

      await controller.getList(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(userService.getList).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUsers.data,
        meta: mockUsers.meta,
      }))
    })

    it('should use default pagination when not provided', async () => {
      vi.mocked(userService.getList).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })
      mockRequest = { query: {} }

      await controller.getList(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(userService.getList).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
    })
  })

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', username: 'test', name: 'Test User', email: 'test@example.com', role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() }
      vi.mocked(userService.getById).mockResolvedValue(mockUser)
      mockRequest = { params: { id: '1' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(userService.getById).toHaveBeenCalledWith('1')
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUser,
      }))
    })

    it('should return 404 when user not found', async () => {
      vi.mocked(userService.getById).mockResolvedValue(null)
      mockRequest = { params: { id: '999' } }

      await controller.getById(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
        }),
      }))
    })
  })

  describe('create', () => {
    it('should create user with valid data', async () => {
      const input = {
        username: 'newuser',
        password: 'password123',
        name: 'New User',
        email: 'new@example.com',
        role: 'user',
      }
      const mockUser = { id: '1', username: 'newuser', name: 'New User', email: 'new@example.com', role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() }
      vi.mocked(userService.create).mockResolvedValue(mockUser)
      mockRequest = { body: input }

      await controller.create(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(userService.create).toHaveBeenCalled()
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUser,
      }))
    })

    it('should return 400 for invalid data', async () => {
      mockRequest = { body: { username: 'ab', password: '123', name: '', email: 'invalid', role: 'invalid' } }

      await controller.create(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      }))
    })
  })

  describe('update', () => {
    it('should update user with valid data', async () => {
      const input = { name: 'Updated Name', email: 'updated@example.com' }
      const mockUser = { id: '1', username: 'test', name: 'Updated Name', email: 'updated@example.com', role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date() }
      vi.mocked(userService.update).mockResolvedValue(mockUser)
      mockRequest = { params: { id: '1' }, body: input }

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(userService.update).toHaveBeenCalledWith('1', input)
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUser,
      }))
    })

    it('should return 400 for invalid data', async () => {
      const { updateUserSchema } = await import('../lib/schemas.js')
      vi.mocked(updateUserSchema.safeParse).mockReturnValue({
        success: false,
        error: { issues: [{ message: 'Invalid email' }] },
      } as never)

      mockRequest = { params: { id: '1' }, body: { email: 'invalid-email' } }

      await controller.update(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      }))
    })
  })

  describe('delete', () => {
    it('should delete user by id', async () => {
      vi.mocked(userService.delete).mockResolvedValue(undefined)
      mockRequest = { params: { id: '1' } }

      await controller.delete(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(userService.delete).toHaveBeenCalledWith('1')
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { message: '用户已删除' },
      }))
    })
  })
})
