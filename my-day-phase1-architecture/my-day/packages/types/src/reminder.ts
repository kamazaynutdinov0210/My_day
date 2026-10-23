import type { EntityId, IsoDateTime, Timestamped } from "./common.js";
import type {
  EntityType,
  NotificationPriority,
  NotificationType,
  ReminderChannel,
  ReminderStatus,
} from "./enums.js";

export interface Reminder extends Timestamped {
  id: EntityId;
  userId: EntityId;
  title: string;
  remindAt: IsoDateTime;
  channel: ReminderChannel;
  status: ReminderStatus;
  taskId: EntityId | null;
  eventId: EntityId | null;
  sentAt: IsoDateTime | null;
}

export interface CreateReminderInput {
  title: string;
  remindAt: IsoDateTime;
  channel?: ReminderChannel;
  taskId?: EntityId;
  eventId?: EntityId;
}

export interface UpdateReminderInput {
  title?: string;
  remindAt?: IsoDateTime;
  channel?: ReminderChannel;
  status?: ReminderStatus;
}

export interface Notification {
  id: EntityId;
  userId: EntityId;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  entityType: EntityType | null;
  entityId: EntityId | null;
  createdAt: IsoDateTime;
  expiresAt: IsoDateTime | null;
  readAt: IsoDateTime | null;
}

export interface NotificationFilterParams {
  read?: boolean;
  type?: NotificationType[];
}
