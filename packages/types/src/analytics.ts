import type { EntityId, IsoDateTime } from "./common.js";
import type { AnalyticsPeriod } from "./enums.js";

export interface AnalyticsSnapshot {
  id: EntityId;
  userId: EntityId;
  period: AnalyticsPeriod;
  periodStart: IsoDateTime;
  periodEnd: IsoDateTime;
  tasksCompleted: number;
  tasksOverdue: number;
  completionRate: number;
  scheduledMinutes: number;
  actualMinutes: number;
  meetingMinutes: number;
  focusMinutes: number;
  computedAt: IsoDateTime;
}

export type AnalyticsRangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface AnalyticsQueryParams {
  preset?: AnalyticsRangePreset;
  /** Required when preset === "custom". */
  from?: IsoDateTime;
  to?: IsoDateTime;
}

export interface AnalyticsOverview {
  range: { from: IsoDateTime; to: IsoDateTime };
  tasksCompleted: number;
  tasksOverdue: number;
  completionRate: number;
  scheduledMinutes: number;
  actualMinutes: number;
  meetingMinutes: number;
  focusMinutes: number;
  projectProgress: Array<{ projectId: EntityId; name: string; progressPercent: number }>;
  trend: Array<{ date: string; completedTasks: number; focusMinutes: number }>;
}
