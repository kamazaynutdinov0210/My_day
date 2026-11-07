import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(SessionAuthGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  async query(@CurrentUser() user: AuthenticatedRequest['user'], @Query('q') q?: string) {
    return { success: true, data: await this.search.searchQuery(user.id, q ?? '') };
  }
}