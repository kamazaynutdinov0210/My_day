import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & { user: { id: string; email: string; timezone: string } };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => (ctx.switchToHttp().getRequest<AuthenticatedRequest>()).user,
);
