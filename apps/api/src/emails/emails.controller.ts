import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { paginated, parsePaging } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { EmailsService } from './emails.service';

@Controller('emails')
@UseGuards(SessionAuthGuard)
export class EmailsController {
  constructor(private readonly emails: EmailsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query('folder') folder?: string,
    @Query('read') read?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const paging = parsePaging(page, pageSize);
    const result = await this.emails.list(
      user.id,
      { folder: folder as never, read: read === undefined ? undefined : read === 'true' },
      paging.page,
      paging.pageSize,
    );
    return paginated(result.items, result.page, result.pageSize, result.total);
  }

  @Post(':id/read')
  @UseGuards(CsrfGuard)
  async markRead(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    return { success: true, data: await this.emails.markRead(user.id, id) };
  }
}