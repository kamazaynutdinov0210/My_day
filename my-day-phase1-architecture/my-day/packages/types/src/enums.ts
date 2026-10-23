/**
 * Enum unions mirroring prisma/schema.prisma exactly.
 *
 * These are hand-kept in sync with the Prisma schema (Prisma's generated
 * client enums are the runtime source of truth in apps/api; this file is
 * what apps/web and other non-Prisma consumers import so they never need
 * a Prisma Client dependency). Any change here MUST be mirrored in
 * prisma/schema.prisma and vice versa — see docs/ARCHITECTURE.md.
 */

export const TASK_STATUS = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "WAITING",
  "COMPLETED",
  "CANCELLED",
] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

export const TASK_PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITY)[number];

export const PROJECT_STATUS = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const PROJECT_MEMBER_ROLE = ["OWNER", "EDITOR", "VIEWER"] as const;
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLE)[number];

export const EVENT_STATUS = ["CONFIRMED", "TENTATIVE", "CANCELLED"] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

export const EVENT_CATEGORY = [
  "MEETING",
  "PERSONAL",
  "FOCUS",
  "TRAVEL",
  "DEADLINE",
  "OTHER",
] as const;
export type EventCategory = (typeof EVENT_CATEGORY)[number];

export const RECURRENCE_FREQUENCY = [
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
  "CUSTOM",
] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCY)[number];

export const REMINDER_STATUS = [
  "SCHEDULED",
  "SENT",
  "DISMISSED",
  "FAILED",
  "CANCELLED",
] as const;
export type ReminderStatus = (typeof REMINDER_STATUS)[number];

export const REMINDER_CHANNEL = ["BROWSER", "EMAIL", "TELEGRAM"] as const;
export type ReminderChannel = (typeof REMINDER_CHANNEL)[number];

export const NOTIFICATION_TYPE = [
  "TASK",
  "PROJECT",
  "EVENT",
  "REMINDER",
  "MESSAGE",
  "INTEGRATION",
  "SYSTEM",
  "AI",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[number];

export const NOTIFICATION_PRIORITY = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITY)[number];

export const NOTE_TYPE = [
  "NOTE",
  "IDEA",
  "INSTRUCTION",
  "PLAN",
  "DECISION",
  "LINK",
] as const;
export type NoteType = (typeof NOTE_TYPE)[number];

export const INTEGRATION_PROVIDER_TYPE = [
  "GOOGLE",
  "MICROSOFT",
  "TELEGRAM",
  "SLACK",
  "DISCORD",
  "GITHUB",
  "NOTION",
  "GOOGLE_DRIVE",
  "AI_OPENAI",
  "AI_ANTHROPIC",
  "AI_GOOGLE",
  "AI_OPENAI_COMPATIBLE",
  "AI_LOCAL",
] as const;
export type IntegrationProviderType = (typeof INTEGRATION_PROVIDER_TYPE)[number];

export const INTEGRATION_STATUS = [
  "DISCONNECTED",
  "CONNECTING",
  "CONNECTED",
  "ERROR",
  "EXPIRED",
] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUS)[number];

export const MESSAGE_SOURCE = ["TELEGRAM", "SLACK", "DISCORD", "INTERNAL"] as const;
export type MessageSource = (typeof MESSAGE_SOURCE)[number];

export const EMAIL_FOLDER = ["INBOX", "SENT", "ARCHIVE", "TRASH"] as const;
export type EmailFolder = (typeof EMAIL_FOLDER)[number];

export const TIME_ENTRY_SOURCE = ["MANUAL", "TIMER", "CALENDAR_SYNC"] as const;
export type TimeEntrySource = (typeof TIME_ENTRY_SOURCE)[number];

export const ANALYTICS_PERIOD = ["DAY", "WEEK", "MONTH", "CUSTOM"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIOD)[number];

export const ACTIVITY_ACTION = [
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_COMPLETED",
  "TASK_DELETED",
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "PROJECT_COMPLETED",
  "PROJECT_DELETED",
  "EVENT_CREATED",
  "EVENT_UPDATED",
  "EVENT_MOVED",
  "EVENT_DELETED",
  "REMINDER_CREATED",
  "REMINDER_TRIGGERED",
  "REMINDER_CANCELLED",
  "NOTE_CREATED",
  "NOTE_UPDATED",
  "NOTE_DELETED",
  "INTEGRATION_CONNECTED",
  "INTEGRATION_DISCONNECTED",
  "AI_ACTION_EXECUTED",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTION)[number];

export const ENTITY_TYPE = [
  "TASK",
  "PROJECT",
  "EVENT",
  "NOTE",
  "REMINDER",
  "NOTIFICATION",
  "INTEGRATION",
  "MESSAGE",
  "EMAIL_MESSAGE",
] as const;
export type EntityType = (typeof ENTITY_TYPE)[number];
