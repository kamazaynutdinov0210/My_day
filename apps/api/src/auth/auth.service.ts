import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PUBLIC_USER_SELECT } from '../users/public-user';
import * as argon2 from 'argon2';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Response } from 'express';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { GoogleAuthDto } from './dto/google-auth.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';

const SESSION_COOKIE = 'my_day_session';
const CSRF_COOKIE = 'my_day_csrf';
const DEFAULT_SESSION_DAYS = 30;
const DEFAULT_TIMEZONE = 'Asia/Tashkent';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService, private readonly mailService?: MailService) {}
  async register(dto: RegisterDto, response: Response) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email is already registered');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        timezone: dto.timezone?.trim() || DEFAULT_TIMEZONE,
      },
      select: PUBLIC_USER_SELECT,
    });

    await this.issueSession(user.id, response);
    await this.requestEmailVerification(user.id, user.email);
    return { success: true, data: { user } };
  }

  async login(dto: LoginDto, response: Response) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.issueSession(user.id, response);
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return { success: true, data: { user: publicUser } };
  }

  async googleAuth(dto: GoogleAuthDto, response: Response) {
    let email = dto.email?.trim().toLowerCase();
    let name = dto.name?.trim();
    let googleSub = dto.credential || dto.code || randomBytes(16).toString('hex');
    let avatarUrl = dto.photoUrl;

    // Verify/decode Google ID Token (JWT) if credential is provided.
    if (dto.credential) {
      let verified = false;
      try {
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(dto.credential)}`);
        if (res.ok) {
          const payload = await res.json() as Record<string, unknown>;
          if (payload.email) email = String(payload.email).trim().toLowerCase();
          if (payload.name) name = String(payload.name).trim();
          if (payload.sub) googleSub = String(payload.sub);
          if (payload.picture) avatarUrl = String(payload.picture);
          verified = true;
        }
      } catch {
        verified = false;
      }

      if (!verified) {
        try {
          const parts = dto.credential.split('.');
          if (parts.length === 3) {
            const payloadJson = Buffer.from(parts[1]!, 'base64url').toString('utf8');
            const payload = JSON.parse(payloadJson);
            if (payload.email) email = String(payload.email).trim().toLowerCase();
            if (payload.name) name = String(payload.name).trim();
            if (payload.sub) googleSub = String(payload.sub);
            if (payload.picture) avatarUrl = String(payload.picture);
          }
        } catch (e) {
          this.logger.warn(`Failed to parse Google credential token: ${e instanceof Error ? e.message : e}`);
        }
      }
    }

    if (!email) {
      throw new BadRequestException('Google authentication failed: email is required');
    }

    // Check if OAuth account exists
    const oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'google',
          providerUserId: googleSub,
        },
      },
      include: { user: true },
    });

    let user = oauthAccount?.user;

    if (!user) {
      // Check if user with that email already exists
      const existingUser = await this.prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        user = existingUser;
        // Link OAuth account
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerUserId: googleSub,
            email,
          },
        });
      } else {
        // Create new user with unguessable random Argon2 hash (so standard password login requires password reset)
        const dummyPassword = randomBytes(32).toString('hex');
        const dummyHash = await argon2.hash(dummyPassword);

        user = await this.prisma.user.create({
          data: {
            email,
            passwordHash: dummyHash,
            name: name || email.split('@')[0] || 'Google User',
            avatarUrl: avatarUrl || null,
            timezone: DEFAULT_TIMEZONE,
            oauthAccounts: {
              create: {
                provider: 'google',
                providerUserId: googleSub,
                email,
              },
            },
          },
        });
      }
    }

    await this.issueSession(user.id, response);
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return { success: true, data: { user: publicUser } };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Prevent account enumeration by always returning the same response
    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
      await this.mailService?.sendPasswordReset(email, resetUrl);
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[PASSWORD RESET] Recovery email queued for ${email} (token not logged)`);
      }
    }

    return {
      success: true,
      message: 'If that email is registered in our system, a password reset link has been sent.',
    };
  }

  async verifyResetToken(token: string) {
    if (!token || typeof token !== 'string') {
      return { success: true, valid: false };
    }

    const tokenHash = this.hashToken(token.trim());
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { select: { email: true } } },
    });

    if (!record) {
      return { success: true, valid: false };
    }

    return {
      success: true,
      valid: true,
      email: record.user.email,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token.trim());
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new BadRequestException('Password reset token is invalid, expired, or already used');
    }

    const newPasswordHash = await argon2.hash(dto.password);

    // Atomic password update + token invalidate + session revocation
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      success: true,
      message: 'Your password has been successfully updated. Please log in with your new password.',
    };
  }

  async verifyEmail(token: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Verification token is required');
    }
    const tokenHash = this.hashToken(token.trim());
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) {
      throw new BadRequestException('Email verification token is invalid or expired');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return { success: true, message: 'Email verified successfully' };
  }

  async requestEmailVerification(userId: string, email: string) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${rawToken}`;
    await this.mailService?.sendEmailVerification(email, verifyUrl);
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[EMAIL VERIFICATION] Verification email queued for ${email} (token not logged)`);
    }
  }

  async resendEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.requestEmailVerification(user.id, user.email);
    return { success: true, message: 'Verification email sent' };
  }

  async logout(sessionToken: string | undefined, response: Response) {
    if (sessionToken) {
      await this.prisma.session.updateMany({
        where: { tokenHash: this.hashToken(sessionToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.clearCookies(response);
    return { success: true, data: null };
  }

  async getPublicUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async validateSession(sessionToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(sessionToken) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;

    return {
      id: session.user.id,
      email: session.user.email,
      timezone: session.user.timezone,
    };
  }

  async validateCsrf(sessionToken: string, csrfToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(sessionToken) },
      select: { expiresAt: true, revokedAt: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) return false;

    const expected = Buffer.from(this.csrfFor(sessionToken));
    const actual = Buffer.from(csrfToken);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private async issueSession(userId: string, response: Response) {
    const sessionToken = randomBytes(32).toString('base64url');
    const csrfToken = this.csrfFor(sessionToken);
    const expiresAt = new Date(Date.now() + DEFAULT_SESSION_DAYS * 86_400_000);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.hashToken(sessionToken),
        expiresAt,
      },
    });

    const secure = process.env.NODE_ENV === 'production';
    response.cookie(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      expires: expiresAt,
    });
    response.cookie(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure,
      sameSite: 'strict',
      path: '/',
      expires: expiresAt,
    });
  }

  private clearCookies(response: Response) {
    const secure = process.env.NODE_ENV === 'production';
    response.clearCookie(SESSION_COOKIE, { httpOnly: true, secure, sameSite: 'strict', path: '/' });
    response.clearCookie(CSRF_COOKIE, { httpOnly: false, secure, sameSite: 'strict', path: '/' });
  }

  // Stateless double-submit token: HMAC of the session token, keyed by CSRF_SECRET.
  private csrfFor(sessionToken: string) {
    const secret = process.env.CSRF_SECRET || 'dev-insecure-csrf-secret-change-in-production-min32';
    return createHmac('sha256', secret).update(sessionToken).digest('base64url');
  }

  private hashToken(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}

