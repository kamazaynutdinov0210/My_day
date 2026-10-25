import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import type { CreateEventDto } from './dto/create-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService, private readonly activity: ActivityService) {}

  async list(userId: string, from?: string, to?: string) {
    const startAt = from ? new Date(from) : new Date(Date.now() - 7 * 86_400_000);
    const endAt = to ? new Date(to) : new Date(Date.now() + 30 * 86_400_000);
    const events = await this.prisma.calendarEvent.findMany({
      where: { userId, startAt: { lt: endAt }, endAt: { gt: startAt } },
      orderBy: { startAt: 'asc' },
    });
    return { items: events, from: startAt, to: endAt };
  }

  async get(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Calendar event not found');
    return event;
  }

  async create(userId: string, dto: CreateEventDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) throw new BadRequestException('endAt must be after startAt');

    const event = await this.prisma.calendarEvent.create({
      data: {
        userId,
        title: dto.title.trim(),
        description: dto.description,
        startAt,
        endAt,
        timezone: dto.timezone,
        location: dto.location,
        category: dto.category,
        priority: dto.priority,
        status: dto.status,
        recurrenceFreq: dto.recurrenceFreq,
        recurrenceRule: dto.recurrenceRule,
        projectId: dto.projectId,
      },
    });
    await this.activity.create({ userId, action: 'EVENT_CREATED', entityType: 'EVENT', entityId: event.id });
    return event;
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    const current = await this.get(userId, id);
    const startAt = dto.startAt !== undefined ? new Date(dto.startAt) : current.startAt;
    const endAt = dto.endAt !== undefined ? new Date(dto.endAt) : current.endAt;
    if (endAt <= startAt) throw new BadRequestException('endAt must be after startAt');

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.startAt !== undefined ? { startAt } : {}),
        ...(dto.endAt !== undefined ? { endAt } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.recurrenceFreq !== undefined ? { recurrenceFreq: dto.recurrenceFreq } : {}),
        ...(dto.recurrenceRule !== undefined ? { recurrenceRule: dto.recurrenceRule } : {}),
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
      },
    });
    await this.activity.create({
      userId,
      action: startAt.getTime() !== current.startAt.getTime() || endAt.getTime() !== current.endAt.getTime() ? 'EVENT_MOVED' : 'EVENT_UPDATED',
      entityType: 'EVENT',
      entityId: id,
    });
    return event;
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.calendarEvent.delete({ where: { id } });
    await this.activity.create({ userId, action: 'EVENT_DELETED', entityType: 'EVENT', entityId: id });
    return { deleted: true };
  }
}
