import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchQuery(userId: string, q: string) {
    const term = q.trim();
    if (!term) {
      return { tasks: [], projects: [], events: [], notes: [], messages: [], emails: [] };
    }

    const [tasks, projects, events, notes, messages, emails] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
          AND: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.calendarEvent.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { location: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { startAt: 'desc' },
      }),
      this.prisma.note.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { content: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.message.findMany({
        where: {
          userId,
          body: { contains: term, mode: 'insensitive' },
        },
        take: 20,
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.emailMessage.findMany({
        where: {
          userId,
          OR: [
            { subject: { contains: term, mode: 'insensitive' } },
            { bodyPreview: { contains: term, mode: 'insensitive' } },
            { from: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { receivedAt: 'desc' },
      }),
    ]);

    return { tasks, projects, events, notes, messages, emails };
  }
}