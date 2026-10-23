import type { EntityId, IsoDateTime, Timestamped } from "./common.js";
import type {
  EventCategory,
  EventStatus,
  RecurrenceFrequency,
  TaskPriority,
} from "./enums.js";

export interface CalendarEvent extends Timestamped {
  id: EntityId;
  userId: EntityId;
  title: string;
  description: string | null;
  startAt: IsoDateTime;
  endAt: IsoDateTime;
  timezone: string;
  location: string | null;
  category: EventCategory;
  priority: TaskPriority;
  status: EventStatus;
  recurrenceFreq: RecurrenceFrequency;
  recurrenceRule: string | null;
  projectId: EntityId | null;
}

export type CalendarView = "day" | "week" | "month" | "agenda" | "timeline";

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  startAt: IsoDateTime;
  endAt: IsoDateTime;
  timezone?: string;
  location?: string;
  category?: EventCategory;
  priority?: TaskPriority;
  status?: EventStatus;
  recurrenceFreq?: RecurrenceFrequency;
  recurrenceRule?: string;
  projectId?: EntityId;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string | null;
  startAt?: IsoDateTime;
  endAt?: IsoDateTime;
  timezone?: string;
  location?: string | null;
  category?: EventCategory;
  priority?: TaskPriority;
  status?: EventStatus;
  recurrenceFreq?: RecurrenceFrequency;
  recurrenceRule?: string | null;
  projectId?: EntityId | null;
}

export interface CalendarEventFilterParams {
  from: IsoDateTime;
  to: IsoDateTime;
  projectId?: EntityId;
  category?: EventCategory[];
}
