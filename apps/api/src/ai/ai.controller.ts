import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(SessionAuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  async chat(@CurrentUser() user: AuthenticatedRequest['user'], @Body() body: { message: string; conversationId?: string }) {
    return { success: true, data: await this.ai.chat(user.id, body) };
  }

  @Post('actions/confirm')
  async confirm(@CurrentUser() user: AuthenticatedRequest['user'], @Body() body: { action: unknown; confirmed: boolean }) {
    const result = await this.ai.confirm(user.id, body as never);
    return { success: true, data: result };
  }

  @Post('summarize')
  async summarize(@CurrentUser() user: AuthenticatedRequest['user'], @Body() body: { entityType: string; entityId: string }) {
    return { success: true, data: await this.ai.summarize(user.id, body as never) };
  }
}