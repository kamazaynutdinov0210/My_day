import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { paginated, parsePaging } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { RemindersService } from './reminders.service';

@Controller('reminders')
@UseGuards(SessionAuthGuard)
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query('status') status?: string | string[],
    @Query('taskId') taskId?: string,
    @Query('eventId') eventId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const paging = parsePaging(page, pageSize);
    const statuses = Array.isArray(status) ? status : status ? [status] : undefined;
    const result = await this.reminders.list(user.id, statuses, taskId, eventId, paging.page, paging.pageSize);
    return paginated(result.items, result.page, result.pageSize, result.total);
  }

  @Post()
  @UseGuards(CsrfGuard)
  async create(@CurrentUser() user: AuthenticatedRequest['user'], @Body() dto: CreateReminderDto) {
    return { success: true, data: await this.reminders.create(user.id, dto) };
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  async update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
  ) {
    return { success: true, data: await this.reminders.update(user.id, id, dto) };
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  async remove(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    await this.reminders.remove(user.id, id);
    return { success: true, data: null };
  }
}