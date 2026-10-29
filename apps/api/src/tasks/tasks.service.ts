import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DEFAULT_PAGE_SIZE } from '../common/api-response';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { ListTasksQuery } from './dto/list-tasks.query';
import type { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService, private readonly activity: ActivityService) {}

  async list(userId: string, query: Partial<ListTasksQuery> = {}) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const where = this.buildWhere(userId, query);
    const skip = (page - 1) * pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({ where, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }], skip, take: pageSize }),
      this.prisma.task.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  /** Marks a task completed (POST /tasks/:id/complete). Reuses update() so completedAt and the activity log stay consistent. */
  complete(userId: string, id: string) {
    return this.update(userId, id, { status: 'COMPLETED' });
  }

  buildWhere(userId: string, q: Partial<ListTasksQuery>): Prisma.TaskWhereInput {
    const due = {
      ...(q.dueBefore ? { lt: new Date(q.dueBefore) } : {}),
      ...(q.dueAfter ? { gt: new Date(q.dueAfter) } : {}),
    };
    return {
      userId,
      ...(q.status?.length ? { status: { in: q.status } } : {}),
      ...(q.priority?.length ? { priority: { in: q.priority } } : {}),
      ...(q.projectId ? { projectId: q.projectId } : {}),
      ...(q.parentTaskId ? { parentTaskId: q.parentTaskId } : {}),
      ...(q.tagIds?.length ? { tags: { some: { tagId: { in: q.tagIds } } } } : {}),
      // A comparison on dueDate never matches tasks without a due date, so they are never "overdue".
      ...(Object.keys(due).length ? { dueDate: due } : {}),
      ...(q.search
        ? {
            OR: [
              { title: { contains: q.search, mode: 'insensitive' as const } },
              { description: { contains: q.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }

  async get(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    if (dto.parentTaskId) {
      await this.assertOwnedTask(userId, dto.parentTaskId);
    }
    if (dto.projectId) {
      await this.assertProjectMembership(userId, dto.projectId);
    }

    const task = await this.prisma.task.create({
      data: {
        userId,
        title: dto.title.trim(),
        description: dto.description,
        status: dto.status ?? 'TODO',
        priority: dto.priority ?? 'MEDIUM',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        estimatedDuration: dto.estimatedDuration,
        projectId: dto.projectId,
        parentTaskId: dto.parentTaskId,
        recurrenceFreq: dto.recurrenceFreq,
        recurrenceRule: dto.recurrenceRule,
      },
    });

    await this.activity.create({ userId, action: 'TASK_CREATED', entityType: 'TASK', entityId: task.id });
    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const current = await this.get(userId, id);
    if (dto.parentTaskId) {
      if (dto.parentTaskId === id) throw new BadRequestException('Task cannot be its own parent');
      await this.assertOwnedTask(userId, dto.parentTaskId);
    }
    if (dto.projectId) await this.assertProjectMembership(userId, dto.projectId);

    const status = dto.status ?? current.status;
    const completedAt =
      dto.completedAt !== undefined
        ? (dto.completedAt ? new Date(dto.completedAt) : null)
        : status === 'COMPLETED'
          ? (current.status !== 'COMPLETED' ? new Date() : current.completedAt)
          : null; // not completed (including reopened), so there is no completion time

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate ? new Date(dto.startDate) : null } : {}),
        ...(dto.estimatedDuration !== undefined ? { estimatedDuration: dto.estimatedDuration } : {}),
        ...(dto.actualDuration !== undefined ? { actualDuration: dto.actualDuration } : {}),
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
        ...(dto.parentTaskId !== undefined ? { parentTaskId: dto.parentTaskId } : {}),
        ...(dto.recurrenceFreq !== undefined ? { recurrenceFreq: dto.recurrenceFreq } : {}),
        ...(dto.recurrenceRule !== undefined ? { recurrenceRule: dto.recurrenceRule } : {}),
        completedAt,
      },
    });

    await this.activity.create({
      userId,
      action: task.status === 'COMPLETED' && current.status !== 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: task.id,
    });
    return task;
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.task.delete({ where: { id } });
    await this.activity.create({ userId, action: 'TASK_DELETED', entityType: 'TASK', entityId: id });
    return { deleted: true };
  }

  private async assertOwnedTask(userId: string, taskId: string) {
    const exists = await this.prisma.task.findFirst({ where: { id: taskId, userId }, select: { id: true } });
    if (!exists) throw new BadRequestException('Parent task not found');
  }

  private async assertProjectMembership(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, members: { some: { userId } } },
      select: { id: true },
    });
    if (!project) throw new BadRequestException('Project not found or access denied');
  }
}
