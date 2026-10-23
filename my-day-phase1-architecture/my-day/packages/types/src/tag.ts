import type { EntityId, IsoDateTime } from "./common.js";

export interface Tag {
  id: EntityId;
  userId: EntityId;
  name: string;
  color: string | null;
  createdAt: IsoDateTime;
}

export interface CreateTagInput {
  name: string;
  color?: string;
}
