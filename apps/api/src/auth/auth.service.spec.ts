import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('prevents account enumeration on forgot password request', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null), // Non-existent user
      },
      passwordResetToken: {
        create: vi.fn(),
      },
    };
    const service = new AuthService(prisma as never);

    const result = await service.forgotPassword({ email: 'nonexistent@example.com' });
    expect(result.success).toBe(true);
    expect(result.message).toContain('If that email is registered');
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('creates single-use hashed reset token for existing user', async () => {
    const user = { id: 'u-1', email: 'alice@example.com' };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(user),
      },
      passwordResetToken: {
        create: vi.fn().mockResolvedValue({ id: 'tok-1' }),
      },
    };
    const service = new AuthService(prisma as never);

    const result = await service.forgotPassword({ email: 'alice@example.com' });
    expect(result.success).toBe(true);
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u-1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
  });

  it('rejects password reset when token is expired or invalid', async () => {
    const prisma = {
      passwordResetToken: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new AuthService(prisma as never);

    await expect(
      service.resetPassword({ token: 'invalid-token-12345', password: 'NewSecurePassword123!' }),
    ).rejects.toThrow('Password reset token is invalid, expired, or already used');
  });

  it('resets password, marks token used, and invalidates all existing sessions', async () => {
    const tokenRecord = {
      id: 'tok-1',
      userId: 'u-1',
      tokenHash: 'somehash',
      expiresAt: new Date(Date.now() + 100000),
      usedAt: null,
    };
    const prisma = {
      passwordResetToken: {
        findFirst: vi.fn().mockResolvedValue(tokenRecord),
        update: vi.fn().mockResolvedValue({ ...tokenRecord, usedAt: new Date() }),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: 'u-1' }),
      },
      session: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
    };
    const service = new AuthService(prisma as never);

    const res = await service.resetPassword({
      token: 'valid-token',
      password: 'BrandNewPassword2026!',
    });

    expect(res.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-1' },
        data: expect.objectContaining({ passwordHash: expect.stringContaining('$argon2') }),
      }),
    );
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tok-1' },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      }),
    );
    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u-1', revokedAt: null },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('authenticates with Google OAuth, creating user and OAuth account if new', async () => {
    const prisma = {
      oAuthAccount: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'u-google',
          email: 'googleuser@gmail.com',
          name: 'Google User',
          passwordHash: 'dummy',
        }),
      },
      session: {
        create: vi.fn().mockResolvedValue({ id: 's-1' }),
      },
    };
    const service = new AuthService(prisma as never);
    const mockResponse = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    };

    const res = await service.googleAuth(
      {
        email: 'googleuser@gmail.com',
        name: 'Google User',
      },
      mockResponse as never,
    );

    expect(res.success).toBe(true);
    expect(res.data.user.email).toBe('googleuser@gmail.com');
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'my_day_session',
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
  });
});

