import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagsService } from './tags.service';

@Controller('tags')
@UseGuards(SessionAuthGuard)
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedRequest['user']) {
    return { success: true, data: await this.tags.list(user.id) };
  }

  @Post()
  @UseGuards(CsrfGuard)
  async create(@CurrentUser() user: AuthenticatedRequest['user'], @Body() dto: CreateTagDto) {
    return { success: true, data: await this.tags.create(user.id, dto) };
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  async remove(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    await this.tags.remove(user.id, id);
    return { success: true, data: null };
  }
}