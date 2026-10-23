import { describe, expect, it, vi } from 'vitest';
import { CalendarService } from './calendar.service';

describe('CalendarService', () => {
  it('rejects an event whose end is not after its start', async () => {
    const prisma = { calendarEvent: { create: vi.fn() } };
    const service = new CalendarService(prisma as never, { create: vi.fn() } as never);
    await expect(service.create('user-1', {
      title: 'Bad event',
      startAt: '2026-09-25T10:00:00.000Z',
      endAt: '2026-09-25T09:00:00.000Z',
      timezone: 'Asia/Tashkent',
    })).rejects.toThrow('endAt must be after startAt');
  });
});
