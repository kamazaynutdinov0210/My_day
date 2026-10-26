import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import type { ListNotificationsQuery } from './dto/list-notifications.query';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService, private readonly activity: ActivityService) {}

  async list(userId: string, query: ListNotificationsQuery) {
    const where = {
      userId,
      ...(query.read !== undefined ? { read: query.read === 'true' } : {}),
      ...(query.type?.length ? { type: { in: query.type } } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: query.pageSize }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async unreadCount(userId: string) {
    return { count: await this.prisma.notification.count({ where: { userId, read: false } }) };
  }

  async markRead(userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { read: true, readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    return null;
  }
}
