import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { BriefingService } from './briefing.service';

@Controller('briefing')
@UseGuards(SessionAuthGuard)
export class BriefingController {
  constructor(private readonly briefing: BriefingService) {}

  @Get('today')
  async today(@CurrentUser() user: AuthenticatedRequest['user']) {
    return { success: true, data: await this.briefing.today(user.id) };
  }

  @Post('generate')
  async generate(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() body?: { useAI?: boolean },
  ) {
    return { success: true, data: await this.briefing.generate(user.id, body?.useAI ?? false) };
  }
}