import type { EntityId, Timestamped } from "./common.js";
import type { NoteType } from "./enums.js";

export interface Note extends Timestamped {
  id: EntityId;
  userId: EntityId;
  title: string;
  content: string;
  type: NoteType;
  projectId: EntityId | null;
  taskId: EntityId | null;
  eventId: EntityId | null;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  type?: NoteType;
  projectId?: EntityId;
  taskId?: EntityId;
  eventId?: EntityId;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  type?: NoteType;
  projectId?: EntityId | null;
  taskId?: EntityId | null;
  eventId?: EntityId | null;
}

export interface NoteFilterParams {
  type?: NoteType[];
  projectId?: EntityId;
  taskId?: EntityId;
  eventId?: EntityId;
  search?: string;
}
