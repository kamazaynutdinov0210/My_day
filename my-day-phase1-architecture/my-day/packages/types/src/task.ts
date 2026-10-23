import type { EntityId, IsoDateTime, Timestamped } from "./common.js";
import type { RecurrenceFrequency, TaskPriority, TaskStatus } from "./enums.js";

export interface Task extends Timestamped {
  id: EntityId;
  userId: EntityId;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: IsoDateTime | null;
  startDate: IsoDateTime | null;
  estimatedDuration: number | null; // minutes
  actualDuration: number | null; // minutes
  projectId: EntityId | null;
  parentTaskId: EntityId | null;
  recurrenceFreq: RecurrenceFrequency;
  recurrenceRule: string | null;
  completedAt: IsoDateTime | null;
  tagIds: EntityId[];
}

export interface TaskComment extends Timestamped {
  id: EntityId;
  taskId: EntityId;
  userId: EntityId;
  body: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: IsoDateTime;
  startDate?: IsoDateTime;
  estimatedDuration?: number;
  projectId?: EntityId;
  parentTaskId?: EntityId;
  recurrenceFreq?: RecurrenceFrequency;
  recurrenceRule?: string;
  tagIds?: EntityId[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: IsoDateTime | null;
  startDate?: IsoDateTime | null;
  estimatedDuration?: number | null;
  actualDuration?: number | null;
  projectId?: EntityId | null;
  parentTaskId?: EntityId | null;
  recurrenceFreq?: RecurrenceFrequency;
  recurrenceRule?: string | null;
  tagIds?: EntityId[];
}

export interface TaskFilterParams {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  projectId?: EntityId;
  tagIds?: EntityId[];
  dueBefore?: IsoDateTime;
  dueAfter?: IsoDateTime;
  search?: string;
  parentTaskId?: EntityId | null;
}
