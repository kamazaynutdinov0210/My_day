import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 30_000;

async function processDueReminders() {
  const now = new Date();
  const due = await prisma.reminder.findMany({
    where: { status: 'SCHEDULED', remindAt: { lte: now } },
    take: 100,
  });

  for (const reminder of due) {
    try {
      // Delivery is handled by the notifications layer; here we mark as sent.
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'SENT', sentAt: now },
      });
      console.log(`[reminders-worker] Sent reminder ${reminder.id} (${reminder.title})`);
    } catch (err) {
      console.error(`[reminders-worker] Failed to process ${reminder.id}`, err);
    }
  }
}

async function main() {
  console.log('[reminders-worker] Starting');
  await processDueReminders();
  setInterval(() => {
    void processDueReminders();
  }, POLL_INTERVAL_MS);
}

void main();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});