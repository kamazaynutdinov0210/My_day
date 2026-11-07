import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, taskId?: string, from?: string, to?: string, page = 1, pageSize = 20) {
    const where: Record<string, unknown> = { userId };
    if (taskId) where.taskId = taskId;
    if (from || to) {
      where.startedAt = {};
      if (from) (where.startedAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.startedAt as Record<string, unknown>).lte = new Date(to);
    }

    const [total, items] = await Promise.all([
      this.prisma.timeEntry.count({ where }),
      this.prisma.timeEntry.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { items, page, pageSize, total };
  }

  async create(userId: string, dto: {
    taskId?: string; startedAt: string; endedAt?: string; source?: string; note?: string;
  }) {
    const startedAt = new Date(dto.startedAt);
    const endedAt = dto.endedAt ? new Date(dto.endedAt) : null;
    const durationMinutes =
      endedAt && !Number.isNaN(startedAt.getTime()) && !Number.isNaN(endedAt.getTime())
        ? Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
        : null;

    return this.prisma.timeEntry.create({
      data: {
        userId,
        taskId: dto.taskId || null,
        startedAt,
        endedAt,
        durationMinutes,
        source: (dto.source as never) ?? 'MANUAL',
        note: dto.note?.trim() || null,
      },
    });
  }

  async stop(userId: string, id: string) {
    const entry = await this.prisma.timeEntry.findFirst({ where: { id, userId } });
    if (!entry) throw new NotFoundException('Time entry not found');
    if (entry.endedAt) return entry;
    const endedAt = new Date();
    const durationMinutes = Math.round((endedAt.getTime() - entry.startedAt.getTime()) / 60000);
    return this.prisma.timeEntry.update({
      where: { id },
      data: { endedAt, durationMinutes },
    });
  }
}