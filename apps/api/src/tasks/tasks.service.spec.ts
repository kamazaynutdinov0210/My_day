import { describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  it('sets completedAt when a task transitions to COMPLETED', async () => {
    const current = {
      id: 'task-1', userId: 'user-1', status: 'TODO', completedAt: null,
    };
    const prisma = {
      task: {
        findFirst: vi.fn().mockResolvedValue(current),
        update: vi.fn().mockResolvedValue({ ...current, status: 'COMPLETED', completedAt: new Date() }),
      },
      project: { findFirst: vi.fn() },
    };
    const activity = { create: vi.fn().mockResolvedValue(undefined) };
    const service = new TasksService(prisma as never, activity as never);

    await service.update('user-1', 'task-1', { status: 'COMPLETED' });
    expect(prisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'task-1' },
      data: expect.objectContaining({ status: 'COMPLETED', completedAt: expect.any(Date) }),
    }));
    expect(activity.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'TASK_COMPLETED' }));
  });

  it('clears completedAt when a completed task is reopened', async () => {
    const completedAt = new Date('2026-10-20T10:00:00Z');
    const current = { id: 'task-1', userId: 'user-1', status: 'COMPLETED', completedAt };
    const prisma = {
      task: {
        findFirst: vi.fn().mockResolvedValue(current),
        update: vi.fn().mockResolvedValue({ ...current, status: 'TODO', completedAt: null }),
      },
      project: { findFirst: vi.fn() },
    };
    const activity = { create: vi.fn().mockResolvedValue(undefined) };
    const service = new TasksService(prisma as never, activity as never);

    await service.update('user-1', 'task-1', { status: 'TODO' });
    expect(prisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'TODO', completedAt: null }),
    }));
    expect(activity.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'TASK_UPDATED' }));
  });

  it('keeps the original completedAt when an already completed task is edited', async () => {
    const completedAt = new Date('2026-10-20T10:00:00Z');
    const current = { id: 'task-1', userId: 'user-1', status: 'COMPLETED', completedAt };
    const prisma = {
      task: {
        findFirst: vi.fn().mockResolvedValue(current),
        update: vi.fn().mockResolvedValue(current),
      },
      project: { findFirst: vi.fn() },
    };
    const service = new TasksService(prisma as never, { create: vi.fn() } as never);

    await service.update('user-1', 'task-1', { title: 'Renamed' });
    expect(prisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ completedAt }),
    }));
  });

  it('rejects self-parenting', async () => {
    const prisma = {
      task: { findFirst: vi.fn().mockResolvedValue({ id: 'task-1', userId: 'user-1', status: 'TODO', completedAt: null }) },
      project: { findFirst: vi.fn() },
    };
    const service = new TasksService(prisma as never, { create: vi.fn() } as never);
    await expect(service.update('user-1', 'task-1', { parentTaskId: 'task-1' })).rejects.toThrow('Task cannot be its own parent');
  });
});

describe('TasksService list filters (dashboard queries)', () => {
  const service = new TasksService({} as never, {} as never);

  it('scopes to the user and applies no extra filters by default', () => {
    expect(service.buildWhere('u1', {})).toEqual({ userId: 'u1' });
  });

  it('builds the overdue query: open statuses and dueDate strictly before the cut-off', () => {
    const where = service.buildWhere('u1', {
      status: ['TODO', 'IN_PROGRESS', 'WAITING'],
      dueBefore: '2026-10-26T00:00:00.000Z',
    });
    expect(where).toEqual({
      userId: 'u1',
      status: { in: ['TODO', 'IN_PROGRESS', 'WAITING'] },
      dueDate: { lt: new Date('2026-10-26T00:00:00.000Z') },
    });
  });

  it('combines a due window, priority, project and text search', () => {
    const where = service.buildWhere('u1', {
      priority: ['HIGH'],
      projectId: 'cproject000000000000000001',
      dueAfter: '2026-10-01T00:00:00.000Z',
      dueBefore: '2026-11-01T00:00:00.000Z',
      search: 'report',
    });
    expect(where.priority).toEqual({ in: ['HIGH'] });
    expect(where.projectId).toBe('cproject000000000000000001');
    expect(where.dueDate).toEqual({ lt: new Date('2026-11-01T00:00:00.000Z'), gt: new Date('2026-10-01T00:00:00.000Z') });
    expect(where.OR).toHaveLength(2);
  });
});
