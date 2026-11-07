import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function snapshot() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86_400_000);

  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    const [completed, overdue, total] = await Promise.all([
      prisma.task.count({ where: { userId: user.id, status: 'COMPLETED', completedAt: { gte: start, lt: end } } }),
      prisma.task.count({ where: { userId: user.id, status: { not: 'COMPLETED' }, dueDate: { lt: now } } }),
      prisma.task.count({ where: { userId: user.id } }),
    ]);
    const completionRate = total > 0 ? completed / total : 0;

    await prisma.analyticsSnapshot.upsert({
      where: { userId_period_periodStart: { userId: user.id, period: 'DAY', periodStart: start } },
      create: {
        userId: user.id,
        period: 'DAY',
        periodStart: start,
        periodEnd: end,
        tasksCompleted: completed,
        tasksOverdue: overdue,
        completionRate,
        scheduledMinutes: 0,
        actualMinutes: 0,
        meetingMinutes: 0,
        focusMinutes: 0,
      },
      update: {
        tasksCompleted: completed,
        tasksOverdue: overdue,
        completionRate,
      },
    });
  }
  console.log(`[analytics-worker] Snapshotted ${users.length} users`);
}

async function main() {
  console.log('[analytics-worker] Starting');
  await snapshot();
  setInterval(() => { void snapshot(); }, POLL_INTERVAL_MS);
}

void main();
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });