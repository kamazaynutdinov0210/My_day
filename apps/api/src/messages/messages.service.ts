import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MessageFilterParams } from '@my-day/types';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, filter: MessageFilterParams = {}, page = 1, pageSize = 20) {
    const where: Record<string, unknown> = { userId };
    if (filter.source?.length) where.source = { in: filter.source };
    if (filter.read !== undefined) where.read = filter.read;

    const [total, items] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { items, page, pageSize, total };
  }

  async markRead(userId: string, id: string) {
    const existing = await this.prisma.message.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Message not found');
    return this.prisma.message.update({ where: { id }, data: { read: true } });
  }
}