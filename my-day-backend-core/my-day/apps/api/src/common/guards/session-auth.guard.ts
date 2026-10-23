import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../auth/auth.service';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionToken = request.cookies?.my_day_session;
    if (!sessionToken) throw new UnauthorizedException('Authentication required');

    const user = await this.authService.validateSession(sessionToken);
    if (!user) throw new UnauthorizedException('Invalid or expired session');

    request.user = user;
    return true;
  }
}
