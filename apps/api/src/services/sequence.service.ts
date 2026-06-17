import { prisma } from '@cost/database'

export class SequenceService {
  async nextNumber(prefix: string): Promise<number> {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.sequenceNumber.upsert({
        where: { prefix },
        update: { seq: { increment: 1 } },
        create: { prefix, seq: 1 },
      })
      return updated.seq
    })

    return result
  }
}

export const sequenceService = new SequenceService()
