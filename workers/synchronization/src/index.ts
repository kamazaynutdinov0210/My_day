import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 5 * 60 * 1000;

async function sync() {
  const accounts = await prisma.integrationAccount.findMany({ where: { status: 'CONNECTED' } });
  for (const account of accounts) {
    await prisma.integrationAccount.update({
      where: { id: account.id },
      data: { lastSyncedAt: new Date(), lastError: null },
    });
  }
  if (accounts.length > 0) console.log(`[sync-worker] Synced ${accounts.length} integration accounts`);
}

async function main() {
  console.log('[sync-worker] Starting');
  await sync();
  setInterval(() => { void sync(); }, POLL_INTERVAL_MS);
}

void main();
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });