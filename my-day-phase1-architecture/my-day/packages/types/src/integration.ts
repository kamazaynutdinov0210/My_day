import type { EntityId, IsoDateTime } from "./common.js";
import type { IntegrationProviderType, IntegrationStatus } from "./enums.js";

export interface IntegrationCatalogEntry {
  id: EntityId;
  provider: IntegrationProviderType;
  displayName: string;
  enabled: boolean;
}

/** Per-user connection record. Token fields are never exposed over the API. */
export interface IntegrationAccount {
  id: EntityId;
  userId: EntityId;
  provider: IntegrationProviderType;
  status: IntegrationStatus;
  externalAccountId: string | null;
  scope: string | null;
  expiresAt: IsoDateTime | null;
  lastSyncedAt: IsoDateTime | null;
  lastError: string | null;
}

/**
 * Backend-only runtime contract (apps/api/src/modules/integrations).
 * Not an HTTP payload — imported by NestJS provider adapters so every
 * provider implements the same shape. Dashboard/business logic must depend
 * only on this interface, never on a provider SDK directly (§25).
 */
export interface IntegrationProvider {
  readonly provider: IntegrationProviderType;
  connect(userId: EntityId, authCode: string): Promise<void>;
  disconnect(userId: EntityId): Promise<void>;
  getStatus(userId: EntityId): Promise<IntegrationAccount>;
}

/** Extended by calendar-capable providers (Google, Microsoft). */
export interface CalendarSyncProvider extends IntegrationProvider {
  syncEvents(userId: EntityId, sinceIso: IsoDateTime): Promise<number>;
}

/** Extended by messaging-capable providers (Telegram, Slack, Discord). */
export interface MessagingProvider extends IntegrationProvider {
  sendMessage(userId: EntityId, text: string): Promise<void>;
}

export interface ConnectIntegrationInput {
  authCode: string;
  redirectUri: string;
}
