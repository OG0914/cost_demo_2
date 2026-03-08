import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuotationService } from './quotation.service.js'
import { quotationRepository } from '../repositories/quotation.repository.js'

vi.mock('../repositories/quotation.repository.js', () => ({
  quotationRepository: {
    findMany: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    findByIdBasic: vi.fn(),
    findLastByYear: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateWithReviewer: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../utils/cost-calculator.js', () => ({
  calculateCosts: vi.fn(),
}))

describe('QuotationService', () => {
  let service: QuotationService

  beforeEach(() => {
    service = new QuotationService()
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return paginated quotations', async () => {
      const quotations = [{ id: '1', quotationNo: 'QT-2024-0001' }]
      vi.mocked(quotationRepository.findMany).mockResolvedValue(quotations as never)
      vi.mocked(quotationRepository.count).mockResolvedValue(1)

      const result = await service.getList({ page: 1, pageSize: 20 })

      expect(result.quotations).toEqual(quotations)
      expect(result.total).toBe(1)
      expect(result.totalPages).toBe(1)
    })

    it('should apply filters correctly', async () => {
      vi.mocked(quotationRepository.findMany).mockResolvedValue([])
      vi.mocked(quotationRepository.count).mockResolvedValue(0)

      await service.getList({
        page: 1,
        pageSize: 20,
        status: 'draft',
        customerId: 'cust1',
        modelId: 'model1',
      })

      expect(quotationRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
          customerId: 'cust1',
          modelId: 'model1',
        }),
        expect.anything()
      )
    })
  })

  describe('getById', () => {
    it('should return quotation by id', async () => {
      const quotation = { id: '1', quotationNo: 'QT-2024-0001' }
      vi.mocked(quotationRepository.findById).mockResolvedValue(quotation as never)

      const result = await service.getById('1')

      expect(result).toEqual(quotation)
    })
  })

  describe('generateQuotationNo', () => {
    it('should generate first quotation number for year', async () => {
      vi.mocked(quotationRepository.findLastByYear).mockResolvedValue(null)

      const result = await service.generateQuotationNo()

      const year = new Date().getFullYear()
      expect(result).toBe(`QT-${year}-0001`)
    })

    it('should increment sequence number', async () => {
      vi.mocked(quotationRepository.findLastByYear).mockResolvedValue({
        quotationNo: 'QT-2024-0005',
      } as never)

      const result = await service.generateQuotationNo()

      expect(result).toMatch(/QT-\d{4}-0006/)
    })
  })

  describe('create', () => {
    it('should create quotation with generated number', async () => {
      const input = {
        customerId: 'cust1',
        regulationId: 'reg1',
        modelId: 'model1',
        packagingConfigId: 'pack1',
        saleType: 'domestic',
        shippingType: 'land',
        quantity: 100,
        materialCost: 1000,
        packagingCost: 200,
        processCost: 300,
        shippingCost: 400,
        adminFee: 50,
        vat: 130,
        totalCost: 2080,
      }
      vi.mocked(quotationRepository.findLastByYear).mockResolvedValue(null)
      vi.mocked(quotationRepository.create).mockResolvedValue({ id: '1' } as never)

      await service.create('user1', input)

      expect(quotationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        quotationNo: expect.stringMatching(/QT-\d{4}-\d{4}/),
        status: 'draft',
        creator: { connect: { id: 'user1' } },
      }))
    })
  })

  describe('update', () => {
    it('should update draft quotation', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'draft' } as never)
      vi.mocked(quotationRepository.update).mockResolvedValue({ id: '1' } as never)

      await service.update('1', { quantity: 200 })

      expect(quotationRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        quantity: 200,
      }))
    })

    it('should throw NOT_FOUND when quotation does not exist', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue(null)

      await expect(service.update('999', {})).rejects.toThrow('NOT_FOUND')
    })

    it('should throw INVALID_STATUS when not draft', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'approved' } as never)

      await expect(service.update('1', {})).rejects.toThrow('INVALID_STATUS')
    })
  })

  describe('delete', () => {
    it('should delete non-approved quotation', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'draft' } as never)
      vi.mocked(quotationRepository.delete).mockResolvedValue(undefined)

      await service.delete('1')

      expect(quotationRepository.delete).toHaveBeenCalledWith('1')
    })

    it('should throw INVALID_STATUS when quotation is approved', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'approved' } as never)

      await expect(service.delete('1')).rejects.toThrow('INVALID_STATUS')
    })
  })

  describe('submit', () => {
    it('should submit draft quotation', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'draft' } as never)
      vi.mocked(quotationRepository.update).mockResolvedValue({ id: '1', status: 'submitted' } as never)

      const result = await service.submit('1')

      expect(quotationRepository.update).toHaveBeenCalledWith('1', { status: 'submitted' })
      expect(result.status).toBe('submitted')
    })

    it('should throw INVALID_STATUS when not draft', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'submitted' } as never)

      await expect(service.submit('1')).rejects.toThrow('INVALID_STATUS')
    })
  })

  describe('approve', () => {
    it('should approve submitted quotation', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'submitted' } as never)
      vi.mocked(quotationRepository.updateWithReviewer).mockResolvedValue({ id: '1', status: 'approved' } as never)

      const result = await service.approve('1', { userId: 'admin1', note: 'Approved' })

      expect(quotationRepository.updateWithReviewer).toHaveBeenCalledWith('1', expect.objectContaining({
        status: 'approved',
        reviewer: { connect: { id: 'admin1' } },
        reviewNote: 'Approved',
      }))
      expect(result.status).toBe('approved')
    })

    it('should throw INVALID_STATUS when not submitted', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'draft' } as never)

      await expect(service.approve('1', { userId: 'admin1' })).rejects.toThrow('INVALID_STATUS')
    })
  })

  describe('reject', () => {
    it('should reject submitted quotation', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'submitted' } as never)
      vi.mocked(quotationRepository.updateWithReviewer).mockResolvedValue({ id: '1', status: 'rejected' } as never)

      const result = await service.reject('1', { userId: 'admin1', note: 'Rejected' })

      expect(quotationRepository.updateWithReviewer).toHaveBeenCalledWith('1', expect.objectContaining({
        status: 'rejected',
        reviewNote: 'Rejected',
      }))
      expect(result.status).toBe('rejected')
    })

    it('should throw INVALID_STATUS when not submitted', async () => {
      vi.mocked(quotationRepository.findByIdBasic).mockResolvedValue({ id: '1', status: 'approved' } as never)

      await expect(service.reject('1', { userId: 'admin1' })).rejects.toThrow('INVALID_STATUS')
    })
  })

  describe('calculate', () => {
    it('should call cost calculator', async () => {
      const { calculateCosts } = await import('../utils/cost-calculator.js')
      const mockResult = { totalCost: 1000 }
      vi.mocked(calculateCosts).mockReturnValue(mockResult as never)

      const input = {
        modelId: 'model1',
        packagingConfigId: 'pack1',
        quantity: 100,
        saleType: 'domestic',
        shippingType: 'land',
      }

      const result = await service.calculate(input)

      expect(calculateCosts).toHaveBeenCalledWith(input)
      expect(result).toEqual(mockResult)
    })
  })
})
