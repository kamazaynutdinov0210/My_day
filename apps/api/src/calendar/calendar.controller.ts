import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQuery } from './dto/list-events.query';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('calendar/events')
@UseGuards(SessionAuthGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedRequest['user'], @Query() query: ListEventsQuery) {
    return { success: true, data: await this.calendar.list(user.id, query) };
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    return { success: true, data: await this.calendar.get(user.id, id) };
  }

  @Post()
  @UseGuards(CsrfGuard)
  async create(@CurrentUser() user: AuthenticatedRequest['user'], @Body() dto: CreateEventDto) {
    return { success: true, data: await this.calendar.create(user.id, dto) };
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  async update(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string, @Body() dto: UpdateEventDto) {
    return { success: true, data: await this.calendar.update(user.id, id, dto) };
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  async remove(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    return { success: true, data: await this.calendar.remove(user.id, id) };
  }
}
