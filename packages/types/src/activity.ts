import type { EntityId, IsoDateTime } from "./common.js";
import type { ActivityAction, EntityType } from "./enums.js";

export interface ActivityLogEntry {
  id: EntityId;
  userId: EntityId;
  action: ActivityAction;
  entityType: EntityType;
  entityId: EntityId;
  metadata: Record<string, unknown> | null;
  createdAt: IsoDateTime;
}

export interface ActivityLogFilterParams {
  entityType?: EntityType;
  entityId?: EntityId;
  action?: ActivityAction[];
  from?: IsoDateTime;
  to?: IsoDateTime;
}
