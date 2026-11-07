import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BriefingService {
  constructor(private readonly prisma: PrismaService) {}

  private dayBounds(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(start.getTime() + 86_400_000);
    return { start, end };
  }

  async generate(userId: string, useAI = false) {
    const now = new Date();
    const { start, end } = this.dayBounds(now);
    const yesterdayStart = new Date(start.getTime() - 86_400_000);

    const [meetingsCount, activeTasks, overdueTasks, yesterdayCompleted, timeEntries] = await Promise.all([
      this.prisma.calendarEvent.count({ where: { userId, startAt: { gte: start, lt: end } } }),
      this.prisma.task.count({ where: { userId, status: { in: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING'] } } }),
      this.prisma.task.count({ where: { userId, status: { not: 'COMPLETED' }, dueDate: { lt: now } } }),
      this.prisma.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: yesterdayStart, lt: start } } }),
      this.prisma.timeEntry.findMany({ where: { userId, startedAt: { gte: yesterdayStart, lt: start } } }),
    ]);

    const yesterdayFocusMinutes = timeEntries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);

    const stats = {
      meetingsCount,
      activeTasks,
      overdueTasks,
      importantDeadlines: overdueTasks,
      yesterdayCompletedTasks: yesterdayCompleted,
      yesterdayFocusMinutes,
    };

    const summary = `Good morning! You have ${activeTasks} active tasks, ${overdueTasks} overdue, and ${meetingsCount} meetings today. Yesterday you completed ${yesterdayCompleted} tasks and focused for ${yesterdayFocusMinutes} minutes.`;

    const generatedBy = useAI ? 'ai' : 'template';

    const record = await this.prisma.dailyBriefing.upsert({
      where: { userId_date: { userId, date: start } },
      create: { userId, date: start, summary, stats, generatedBy },
      update: { summary, stats, generatedBy },
    });

    return {
      id: record.id,
      userId: record.userId,
      date: record.date.toISOString().slice(0, 10),
      summary: record.summary,
      stats: record.stats,
      generatedBy: record.generatedBy,
      createdAt: record.createdAt.toISOString(),
    };
  }

  async today(userId: string) {
    const now = new Date();
    const { start } = this.dayBounds(now);
    const existing = await this.prisma.dailyBriefing.findUnique({
      where: { userId_date: { userId, date: start } },
    });
    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        date: existing.date.toISOString().slice(0, 10),
        summary: existing.summary,
        stats: existing.stats,
        generatedBy: existing.generatedBy,
        createdAt: existing.createdAt.toISOString(),
      };
    }
    return this.generate(userId, false);
  }
}