import type { EntityId, IsoDateTime } from "./common.js";
import type { ReminderChannel } from "./enums.js";

/**
 * Payload shapes for BullMQ jobs / domain events described in
 * docs/EVENTS.md. Queue names are defined there; payload types live here
 * so producers (apps/api) and consumers (workers/*) share one contract.
 */

export interface ReminderDueJobPayload {
  reminderId: EntityId;
  userId: EntityId;
  channel: ReminderChannel;
  title: string;
  remindAt: IsoDateTime;
}

export interface NotificationDispatchJobPayload {
  notificationId: EntityId;
  userId: EntityId;
}

export interface RecurringTaskGenerateJobPayload {
  taskId: EntityId;
  userId: EntityId;
}

export interface RecurringEventGenerateJobPayload {
  eventId: EntityId;
  userId: EntityId;
}

export interface MorningBriefingJobPayload {
  userId: EntityId;
  /** ISO "YYYY-MM-DD" in the user's timezone. */
  date: string;
}

export interface IntegrationSyncJobPayload {
  integrationAccountId: EntityId;
  userId: EntityId;
  sinceIso?: IsoDateTime;
}

export interface WebhookProcessJobPayload {
  provider: string;
  externalEventId: string;
  receivedAt: IsoDateTime;
  raw: Record<string, unknown>;
}

export interface AnalyticsAggregateJobPayload {
  userId: EntityId;
  period: "DAY" | "WEEK" | "MONTH";
  periodStart: IsoDateTime;
}

export interface AIBackgroundJobPayload {
  userId: EntityId;
  kind: "daily_briefing_ai" | "note_summarize" | "productivity_analysis";
  entityId?: EntityId;
}
