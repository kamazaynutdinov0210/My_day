import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@Controller('notes')
@UseGuards(SessionAuthGuard)
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedRequest['user'], @Query('search') search?: string, @Query('page') page = '1', @Query('pageSize') pageSize = '50') {
    return { success: true, data: await this.notes.list(user.id, search, Math.max(1, Number(page)), Math.min(100, Math.max(1, Number(pageSize)))) };
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    return { success: true, data: await this.notes.get(user.id, id) };
  }

  @Post()
  @UseGuards(CsrfGuard)
  async create(@CurrentUser() user: AuthenticatedRequest['user'], @Body() dto: CreateNoteDto) {
    return { success: true, data: await this.notes.create(user.id, dto) };
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  async update(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return { success: true, data: await this.notes.update(user.id, id, dto) };
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  async remove(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    return { success: true, data: await this.notes.remove(user.id, id) };
  }
}
