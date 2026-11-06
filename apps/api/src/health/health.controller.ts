import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    let db: 'ok' | 'error' = 'error';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'ok';
    } catch {
      db = 'error';
    }

    const redis: 'ok' | 'error' = process.env.REDIS_URL ? 'ok' : 'error';
    const status = db === 'ok' && redis === 'ok' ? 'ok' : 'error';

    return { success: true, data: { status, db, redis } };
  }
}