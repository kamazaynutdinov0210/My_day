import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Response } from 'express';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const SESSION_COOKIE = 'my_day_session';
const CSRF_COOKIE = 'my_day_csrf';
const DEFAULT_SESSION_DAYS = 30;
const DEFAULT_TIMEZONE = 'Asia/Tashkent';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
      select: { id: true, email: true, name: true, timezone: true, createdAt: true, updatedAt: true },
    });

    await this.issueSession(user.id, response);
    return { success: true, data: user };
  }

  async login(dto: LoginDto, response: Response) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.issueSession(user.id, response);
    return {
      success: true,
      data: { id: user.id, email: user.email, name: user.name, timezone: user.timezone },
    };
  }

  async logout(sessionToken: string | undefined, response: Response) {
    if (sessionToken) {
      await this.prisma.session.deleteMany({ where: { tokenHash: this.hashToken(sessionToken) } });
    }
    this.clearCookies(response);
    return { success: true, data: { loggedOut: true } };
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
    const secret = process.env.CSRF_SECRET;
    if (!secret) throw new Error('CSRF_SECRET is not set');
    return createHmac('sha256', secret).update(sessionToken).digest('base64url');
  }

  private hashToken(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
