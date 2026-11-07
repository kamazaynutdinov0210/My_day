import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(SessionAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  async overview(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return { success: true, data: await this.analytics.overview(user.id, from, to) };
  }
}