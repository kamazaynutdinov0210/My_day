import { describe, expect, it, vi } from 'vitest';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  it('calculates project progress from actual task counts', async () => {
    const prisma = {
      project: { findFirst: vi.fn() },
      task: {
        count: vi.fn()
          .mockResolvedValueOnce(8)
          .mockResolvedValueOnce(3),
      },
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    const service = new ProjectsService(prisma as never, { create: vi.fn() } as never);

    const withProgress = (service as unknown as {
      withProgress: (id: string, project: { id: string; name: string }) => Promise<{ progress: number; taskStats: unknown }>;
    }).withProgress.bind(service);
    const result = await withProgress('project-1', { id: 'project-1', name: 'Demo' });
    expect(result.progress).toBe(37.5);
    expect(result.taskStats).toEqual({ total: 8, completed: 3 });
  });
});
