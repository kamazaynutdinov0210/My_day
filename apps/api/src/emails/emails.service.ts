import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { EmailFilterParams } from '@my-day/types';

@Injectable()
export class EmailsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, filter: EmailFilterParams = {}, page = 1, pageSize = 20) {
    const where: Record<string, unknown> = { userId };
    if (filter.folder) where.folder = filter.folder;
    if (filter.read !== undefined) where.read = filter.read;

    const [total, items] = await Promise.all([
      this.prisma.emailMessage.count({ where }),
      this.prisma.emailMessage.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { items, page, pageSize, total };
  }

  async markRead(userId: string, id: string) {
    const existing = await this.prisma.emailMessage.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Email not found');
    return this.prisma.emailMessage.update({ where: { id }, data: { read: true } });
  }
}