import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, status?: string[], taskId?: string, eventId?: string, page = 1, pageSize = 20) {
    const where: Record<string, unknown> = { userId };
    if (status?.length) where.status = { in: status };
    if (taskId) where.taskId = taskId;
    if (eventId) where.eventId = eventId;

    const [total, items] = await Promise.all([
      this.prisma.reminder.count({ where }),
      this.prisma.reminder.findMany({
        where,
        orderBy: { remindAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { items, page, pageSize, total };
  }

  async create(userId: string, dto: { title: string; remindAt: string; channel?: string; taskId?: string; eventId?: string }) {
    return this.prisma.reminder.create({
      data: {
        userId,
        title: dto.title.trim(),
        remindAt: new Date(dto.remindAt),
        channel: (dto.channel as never) ?? 'BROWSER',
        taskId: dto.taskId || null,
        eventId: dto.eventId || null,
      },
    });
  }

  async update(userId: string, id: string, dto: { title?: string; remindAt?: string; channel?: string; status?: string }) {
    const existing = await this.prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Reminder not found');

    return this.prisma.reminder.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.remindAt !== undefined ? { remindAt: new Date(dto.remindAt) } : {}),
        ...(dto.channel !== undefined ? { channel: dto.channel as never } : {}),
        ...(dto.status !== undefined ? { status: dto.status as never } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Reminder not found');
    await this.prisma.reminder.delete({ where: { id } });
    return null;
  }
}