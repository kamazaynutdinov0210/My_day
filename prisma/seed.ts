/**
 * prisma/seed.ts
 *
 * LOCAL DEVELOPMENT SEED ONLY.
 *
 * This script is explicitly separated from production data (§37 "No fake data").
 * It must never run against a production DATABASE_URL. It exists only so
 * Backend/Frontend AI have deterministic local data to build against.
 *
 * Ownership: Architect AI creates this stub; Backend AI extends it once
 * Prisma Client models are consumed by apps/api services.
 *
 * Run with: pnpm db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run prisma/seed.ts with NODE_ENV=production. " +
        "Seed data must never be written to a production database."
    );
  }

  const integrationCatalog = [
    { provider: "GOOGLE", displayName: "Google Calendar & Gmail" },
    { provider: "MICROSOFT", displayName: "Microsoft Outlook" },
    { provider: "TELEGRAM", displayName: "Telegram" },
    { provider: "SLACK", displayName: "Slack" },
    { provider: "DISCORD", displayName: "Discord" },
    { provider: "GITHUB", displayName: "GitHub" },
    { provider: "NOTION", displayName: "Notion" },
    { provider: "GOOGLE_DRIVE", displayName: "Google Drive" },
    { provider: "AI_OPENAI", displayName: "OpenAI" },
    { provider: "AI_ANTHROPIC", displayName: "Anthropic" },
    { provider: "AI_GOOGLE", displayName: "Google AI" },
    { provider: "AI_OPENAI_COMPATIBLE", displayName: "OpenAI-compatible" },
    { provider: "AI_LOCAL", displayName: "Local model" },
  ] as const;

  for (const entry of integrationCatalog) {
    await prisma.integration.upsert({
      where: { provider: entry.provider },
      update: { displayName: entry.displayName },
      create: { provider: entry.provider, displayName: entry.displayName },
    });
  }

  // NOTE: no fake User/Task/Project/AnalyticsSnapshot rows are created here.
  // Per-user demo data (if desired) must be added explicitly by Backend AI
  // as an opt-in seed flag, never as default seed behavior, to avoid the
  // "fake analytics" / "hardcoded counters" trap described in §37.
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
