import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateHistoryDto } from './dto/create-history.dto';
import type { ListHistoryQuery } from './dto/list-history.query';
import { paginated } from '../common/api-response';

@Injectable()
export class CryptoHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListHistoryQuery) {
    const where: Prisma.EncryptionHistoryWhereInput = {
      userId,
    };

    if (query.operationType) where.operationType = query.operationType;
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.algorithm) where.algorithm = { equals: query.algorithm, mode: 'insensitive' };

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { algorithm: { contains: term, mode: 'insensitive' } },
        { dataType: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.encryptionHistory.count({ where }),
      this.prisma.encryptionHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return paginated(items, query.page, query.pageSize, totalItems);
  }

  async get(userId: string, id: string) {
    const record = await this.prisma.encryptionHistory.findFirst({
      where: { id, userId },
    });
    if (!record) {
      throw new NotFoundException('Encryption history record not found');
    }
    return record;
  }

  async create(userId: string, dto: CreateHistoryDto) {
    // Sanitize metadata to guarantee no sensitive keys or plaintext are ever persisted
    const safeMetadata = dto.metadata ? this.sanitizeMetadata(dto.metadata) : undefined;

    return this.prisma.encryptionHistory.create({
      data: {
        userId,
        operationType: dto.operationType,
        algorithm: dto.algorithm,
        category: dto.category,
        dataType: dto.dataType || 'TEXT',
        status: dto.status || 'SUCCESS',
        metadata: safeMetadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const record = await this.prisma.encryptionHistory.findFirst({ where: { id, userId } });
    if (!record) {
      throw new NotFoundException('Encryption history record not found');
    }
    await this.prisma.encryptionHistory.delete({ where: { id } });
    return null;
  }

  async clear(userId: string) {
    const result = await this.prisma.encryptionHistory.deleteMany({
      where: { userId },
    });
    return { count: result.count };
  }

  private sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const forbidden = ['key', 'secret', 'password', 'plaintext', 'privatekey', 'private_key', 'token'];

    for (const [key, value] of Object.entries(meta)) {
      const lower = key.toLowerCase();
      if (!forbidden.some((f) => lower.includes(f))) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
