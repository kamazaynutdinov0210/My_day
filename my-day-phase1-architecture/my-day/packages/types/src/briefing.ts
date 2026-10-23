import type { EntityId, IsoDateTime } from "./common.js";
import type { TimeEntrySource } from "./enums.js";

export interface DailyBriefingStats {
  meetingsCount: number;
  activeTasks: number;
  overdueTasks: number;
  importantDeadlines: number;
  yesterdayCompletedTasks: number;
  yesterdayFocusMinutes: number;
}

export interface DailyBriefing {
  id: EntityId;
  userId: EntityId;
  /** Calendar date (user's timezone), truncated to day, ISO "YYYY-MM-DD". */
  date: string;
  summary: string;
  stats: DailyBriefingStats;
  generatedBy: "template" | "ai";
  createdAt: IsoDateTime;
}

export interface TimeEntry {
  id: EntityId;
  userId: EntityId;
  taskId: EntityId | null;
  startedAt: IsoDateTime;
  endedAt: IsoDateTime | null;
  durationMinutes: number | null;
  source: TimeEntrySource;
  note: string | null;
}

export interface CreateTimeEntryInput {
  taskId?: EntityId;
  startedAt: IsoDateTime;
  endedAt?: IsoDateTime;
  source?: TimeEntrySource;
  note?: string;
}
