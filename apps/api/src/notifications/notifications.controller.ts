import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { paginated } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { ListNotificationsQuery } from './dto/list-notifications.query';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(SessionAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedRequest['user'], @Query() query: ListNotificationsQuery) {
    const result = await this.notifications.list(user.id, query);
    return paginated(result.items, result.page, result.pageSize, result.total);
  }

  @Patch(':id/read')
  @UseGuards(CsrfGuard)
  async read(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string, @Body('read') read = true) {
    return { success: true, data: await this.notifications.markRead(user.id, id, read) };
  }

  @Post('read-all')
  @UseGuards(CsrfGuard)
  async readAll(@CurrentUser() user: AuthenticatedRequest['user']) {
    return { success: true, data: await this.notifications.markAllRead(user.id) };
  }
}
