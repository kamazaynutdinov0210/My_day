import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

const CODES: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};

export function buildErrorBody(status: number, payload: unknown) {
  const obj = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
  const rawMessage = typeof payload === 'string' ? payload : obj.message;
  const message = Array.isArray(rawMessage)
    ? rawMessage.join(', ')
    : typeof rawMessage === 'string'
      ? rawMessage
      : status >= 500
        ? 'Internal server error'
        : 'Request failed';
  const code = typeof obj.code === 'string' ? obj.code : (CODES[status] ?? 'INTERNAL_ERROR');
  const details = Array.isArray(obj.details) ? obj.details : undefined;

  return { success: false as const, error: { code, message, ...(details ? { details } : {}) } };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (!isHttp) this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));

    response.status(status).json(buildErrorBody(status, isHttp ? exception.getResponse() : undefined));
  }
}
