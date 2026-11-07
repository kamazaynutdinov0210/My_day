import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { paginated, parsePaging } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(SessionAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query('source') source?: string | string[],
    @Query('read') read?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const paging = parsePaging(page, pageSize);
    const sources = Array.isArray(source) ? source : source ? [source] : undefined;
    const result = await this.messages.list(
      user.id,
      { source: sources as never, read: read === undefined ? undefined : read === 'true' },
      paging.page,
      paging.pageSize,
    );
    return paginated(result.items, result.page, result.pageSize, result.total);
  }

  @Post(':id/read')
  @UseGuards(CsrfGuard)
  async markRead(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    return { success: true, data: await this.messages.markRead(user.id, id) };
  }
}