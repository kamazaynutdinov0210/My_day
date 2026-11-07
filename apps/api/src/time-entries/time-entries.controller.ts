import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { paginated, parsePaging } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { TimeEntriesService } from './time-entries.service';

@Controller('time-entries')
@UseGuards(SessionAuthGuard)
export class TimeEntriesController {
  constructor(private readonly timeEntries: TimeEntriesService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query('taskId') taskId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const paging = parsePaging(page, pageSize);
    const result = await this.timeEntries.list(user.id, taskId, from, to, paging.page, paging.pageSize);
    return paginated(result.items, result.page, result.pageSize, result.total);
  }

  @Post()
  @UseGuards(CsrfGuard)
  async create(@CurrentUser() user: AuthenticatedRequest['user'], @Body() dto: CreateTimeEntryDto) {
    return { success: true, data: await this.timeEntries.create(user.id, dto) };
  }

  @Post(':id/stop')
  @UseGuards(CsrfGuard)
  async stop(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    return { success: true, data: await this.timeEntries.stop(user.id, id) };
  }
}