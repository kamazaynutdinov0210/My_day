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

  it('rejects self-parenting', async () => {
    const prisma = {
      task: { findFirst: vi.fn().mockResolvedValue({ id: 'task-1', userId: 'user-1', status: 'TODO', completedAt: null }) },
      project: { findFirst: vi.fn() },
    };
    const service = new TasksService(prisma as never, { create: vi.fn() } as never);
    await expect(service.update('user-1', 'task-1', { parentTaskId: 'task-1' })).rejects.toThrow('Task cannot be its own parent');
  });
});
