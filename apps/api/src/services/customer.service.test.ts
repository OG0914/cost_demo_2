import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomerService } from './customer.service.js'
import { customerRepository } from '../repositories/customer.repository.js'

vi.mock('../repositories/customer.repository.js', () => ({
  customerRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('CustomerService', () => {
  let service: CustomerService

  beforeEach(() => {
    service = new CustomerService()
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return paginated customer list', async () => {
      const mockResult = {
        data: [{ id: '1', code: 'C001', name: 'Test Customer', region: 'CN', createdAt: new Date(), updatedAt: new Date(), createdBy: 'user1', updatedBy: 'user1' }],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }
      vi.mocked(customerRepository.findMany).mockResolvedValue(mockResult)

      const result = await service.getList({ search: '' }, { page: 1, pageSize: 20 })

      expect(customerRepository.findMany).toHaveBeenCalledWith({ search: '' }, { page: 1, pageSize: 20 })
      expect(result).toEqual(mockResult)
    })

    it('should pass search filter to repository', async () => {
      vi.mocked(customerRepository.findMany).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })

      await service.getList({ search: 'test' }, { page: 1, pageSize: 20 })

      expect(customerRepository.findMany).toHaveBeenCalledWith({ search: 'test' }, { page: 1, pageSize: 20 })
    })
  })

  describe('getById', () => {
    it('should return customer by id', async () => {
      const mockCustomer = { id: '1', code: 'C001', name: 'Test Customer', region: 'CN', createdAt: new Date(), updatedAt: new Date(), createdBy: 'user1', updatedBy: 'user1' }
      vi.mocked(customerRepository.findById).mockResolvedValue(mockCustomer)

      const result = await service.getById('1')

      expect(customerRepository.findById).toHaveBeenCalledWith('1')
      expect(result).toEqual(mockCustomer)
    })

    it('should return null when customer not found', async () => {
      vi.mocked(customerRepository.findById).mockResolvedValue(null)

      const result = await service.getById('999')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create customer with user relations', async () => {
      const input = {
        code: 'C002',
        name: 'New Customer',
        region: 'US',
        note: 'Test note',
        createdBy: 'user1',
      }
      const mockCustomer = { id: '2', ...input, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'user1' }
      vi.mocked(customerRepository.create).mockResolvedValue(mockCustomer)

      const result = await service.create(input)

      expect(customerRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        code: 'C002',
        name: 'New Customer',
        region: 'US',
        note: 'Test note',
        createdByUser: { connect: { id: 'user1' } },
        updatedByUser: { connect: { id: 'user1' } },
      }))
      expect(result).toEqual(mockCustomer)
    })

    it('should create customer without optional note', async () => {
      const input = {
        code: 'C003',
        name: 'Another Customer',
        region: 'EU',
        createdBy: 'user2',
      }
      vi.mocked(customerRepository.create).mockResolvedValue({} as never)

      await service.create(input)

      expect(customerRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        code: 'C003',
        name: 'Another Customer',
        region: 'EU',
      }))
    })
  })

  describe('update', () => {
    it('should update customer with user relation', async () => {
      const input = {
        name: 'Updated Name',
        region: 'JP',
        updatedBy: 'user1',
      }
      const mockCustomer = { id: '1', code: 'C001', name: 'Updated Name', region: 'JP', createdAt: new Date(), updatedAt: new Date(), createdBy: 'user1', updatedBy: 'user1' }
      vi.mocked(customerRepository.update).mockResolvedValue(mockCustomer)

      const result = await service.update('1', input)

      expect(customerRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        name: 'Updated Name',
        region: 'JP',
        updatedByUser: { connect: { id: 'user1' } },
      }))
      expect(result).toEqual(mockCustomer)
    })

    it('should update customer code when provided', async () => {
      const input = {
        code: 'C999',
        updatedBy: 'user1',
      }
      vi.mocked(customerRepository.update).mockResolvedValue({} as never)

      await service.update('1', input)

      expect(customerRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        code: 'C999',
      }))
    })
  })

  describe('delete', () => {
    it('should delete customer by id', async () => {
      vi.mocked(customerRepository.delete).mockResolvedValue(undefined)

      await service.delete('1')

      expect(customerRepository.delete).toHaveBeenCalledWith('1')
    })
  })
})
