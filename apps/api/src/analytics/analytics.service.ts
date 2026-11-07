import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string, from?: string, to?: string) {
    const now = new Date();
    const toDate = to ? new Date(to) : now;
    const fromDate = from ? new Date(from) : new Date(now.getTime() - 7 * 86_400_000);

    const [totalTasks, completedTasks, overdueTasks, projects] = await Promise.all([
      this.prisma.task.count({ where: { userId } }),
      this.prisma.task.count({
        where: { userId, status: 'COMPLETED', completedAt: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.task.count({
        where: { userId, status: { not: 'COMPLETED' }, dueDate: { lt: now } },
      }),
      this.prisma.project.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true, tasks: { select: { status: true } } },
      }),
    ]);

    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    const projectProgress = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === 'COMPLETED').length;
      return {
        projectId: p.id,
        name: p.name,
        progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });

    // Build a simple 7-day trend
    const trend: Array<{ date: string; completedTasks: number; focusMinutes: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86_400_000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);
      const count = await this.prisma.task.count({
        where: { userId, status: 'COMPLETED', completedAt: { gte: dayStart, lt: dayEnd } },
      });
      trend.push({ date: dayStart.toISOString().slice(0, 10), completedTasks: count, focusMinutes: 0 });
    }

    return {
      range: { from: fromDate.toISOString(), to: toDate.toISOString() },
      tasksCompleted: completedTasks,
      tasksOverdue: overdueTasks,
      completionRate,
      scheduledMinutes: 0,
      actualMinutes: 0,
      meetingMinutes: 0,
      focusMinutes: 0,
      projectProgress,
      trend,
    };
  }
}