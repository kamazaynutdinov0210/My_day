import { describe, expect, it, vi } from 'vitest';
import { CryptoHistoryService } from './crypto-history.service';

describe('CryptoHistoryService', () => {
  it('sanitizes metadata to prevent secrets from being stored', async () => {
    const prisma = {
      encryptionHistory: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'hist-1', ...data })),
      },
    };
    const service = new CryptoHistoryService(prisma as never);

    await service.create('user-1', {
      operationType: 'ENCRYPT',
      algorithm: 'AES-256-GCM',
      category: 'SYMMETRIC',
      metadata: {
        durationMs: 1.5,
        inputLength: 100,
        key: 'secret-key-1234567890',
        password: 'my-plaintext-password',
        plaintext: 'do-not-save-me',
      },
    });

    expect(prisma.encryptionHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        algorithm: 'AES-256-GCM',
        metadata: {
          durationMs: 1.5,
          inputLength: 100,
        },
      }),
    });
  });

  it('enforces user isolation when fetching history records', async () => {
    const prisma = {
      encryptionHistory: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new CryptoHistoryService(prisma as never);

    await expect(service.get('user-1', 'other-user-record')).rejects.toThrow(
      'Encryption history record not found',
    );
    expect(prisma.encryptionHistory.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-user-record', userId: 'user-1' },
    });
  });

  it('lists history with pagination and filters', async () => {
    const fakeRecords = [
      { id: 'h1', userId: 'user-1', algorithm: 'AES-256-GCM', operationType: 'ENCRYPT' },
    ];
    const prisma = {
      encryptionHistory: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue(fakeRecords),
      },
    };
    const service = new CryptoHistoryService(prisma as never);

    const result = await service.list('user-1', {
      page: 1,
      pageSize: 20,
      algorithm: 'AES-256-GCM',
    });

    expect(result.data).toEqual(fakeRecords);
    expect(result.meta.pagination.totalItems).toBe(1);
    expect(result.meta.pagination.totalPages).toBe(1);
  });
});

