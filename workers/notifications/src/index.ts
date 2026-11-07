import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 60_000;

async function cleanupExpired() {
  const now = new Date();
  const result = await prisma.notification.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  if (result.count > 0) console.log(`[notifications-worker] Removed ${result.count} expired notifications`);
}

async function main() {
  console.log('[notifications-worker] Starting');
  await cleanupExpired();
  setInterval(() => { void cleanupExpired(); }, POLL_INTERVAL_MS);
}

void main();
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });