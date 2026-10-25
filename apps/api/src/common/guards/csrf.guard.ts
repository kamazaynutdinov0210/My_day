import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!this.unsafeMethods.has(request.method)) return true;

    const sessionToken = request.cookies?.my_day_session;
    const csrfToken = request.headers['x-csrf-token'];
    if (!sessionToken || typeof csrfToken !== 'string') {
      throw new ForbiddenException('CSRF token required');
    }
    if (!(await this.authService.validateCsrf(sessionToken, csrfToken))) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    return true;
  }
}
