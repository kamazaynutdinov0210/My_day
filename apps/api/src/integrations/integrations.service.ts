import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async catalog() {
    const rows = await this.prisma.integration.findMany({ orderBy: { displayName: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      displayName: r.displayName,
      enabled: r.enabled,
    }));
  }

  async accounts(userId: string) {
    const rows = await this.prisma.integrationAccount.findMany({
      where: { userId },
      include: { integration: true },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      provider: r.integration.provider,
      status: r.status,
      externalAccountId: r.externalAccountId,
      scope: r.scope,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      lastSyncedAt: r.lastSyncedAt?.toISOString() ?? null,
      lastError: r.lastError,
    }));
  }

  async connect(userId: string, provider: string, input: { authCode: string; redirectUri: string }) {
    const integration = await this.prisma.integration.findUnique({ where: { provider: provider as never } });
    if (!integration || !integration.enabled) throw new NotFoundException('Integration not found or disabled');

    const account = await this.prisma.integrationAccount.upsert({
      where: { userId_integrationId: { userId, integrationId: integration.id } },
      create: {
        userId,
        integrationId: integration.id,
        status: 'CONNECTED',
        externalAccountId: input.authCode || null,
        scope: null,
      },
      update: {
        status: 'CONNECTED',
        externalAccountId: input.authCode || null,
        lastError: null,
      },
    });

    return {
      id: account.id,
      userId: account.userId,
      provider: integration.provider,
      status: account.status,
      externalAccountId: account.externalAccountId,
      scope: account.scope,
      expiresAt: account.expiresAt?.toISOString() ?? null,
      lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
      lastError: account.lastError,
    };
  }

  async disconnect(userId: string, provider: string) {
    const integration = await this.prisma.integration.findUnique({ where: { provider: provider as never } });
    if (!integration) throw new NotFoundException('Integration not found');

    await this.prisma.integrationAccount.updateMany({
      where: { userId, integrationId: integration.id },
      data: { status: 'DISCONNECTED', accessTokenEnc: null, refreshTokenEnc: null },
    });
    return null;
  }
}