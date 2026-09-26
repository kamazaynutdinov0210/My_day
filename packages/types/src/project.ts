import type { EntityId, IsoDateTime, Timestamped } from "./common.js";
import type { ProjectMemberRole, ProjectStatus, TaskPriority } from "./enums.js";

export interface Project extends Timestamped {
  id: EntityId;
  ownerId: EntityId;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: TaskPriority;
  deadline: IsoDateTime | null;
  tagIds: EntityId[];
  /**
   * Always computed server-side from the project's real Task rows
   * (completed / total). Never stored, never hardcoded (§11, §37).
   */
  progressPercent: number;
}

export interface ProjectMember {
  id: EntityId;
  projectId: EntityId;
  userId: EntityId;
  role: ProjectMemberRole;
  joinedAt: IsoDateTime;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: TaskPriority;
  deadline?: IsoDateTime;
  tagIds?: EntityId[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: TaskPriority;
  deadline?: IsoDateTime | null;
  tagIds?: EntityId[];
}

export interface ProjectFilterParams {
  status?: ProjectStatus[];
  priority?: TaskPriority[];
  search?: string;
}
