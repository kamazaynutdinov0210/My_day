import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { paginated, parsePaging } from '../common/api-response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(SessionAuthGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const paging = parsePaging(page, pageSize);
    const result = await this.projects.list(user.id, paging.page, paging.pageSize);
    return paginated(result.items, result.page, result.pageSize, result.total);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    return { success: true, data: await this.projects.get(user.id, id) };
  }

  @Post()
  @UseGuards(CsrfGuard)
  async create(@CurrentUser() user: AuthenticatedRequest['user'], @Body() dto: CreateProjectDto) {
    return { success: true, data: await this.projects.create(user.id, dto) };
  }

  @Patch(':id')
  @UseGuards(CsrfGuard)
  async update(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return { success: true, data: await this.projects.update(user.id, id, dto) };
  }

  @Delete(':id')
  @UseGuards(CsrfGuard)
  async remove(@CurrentUser() user: AuthenticatedRequest['user'], @Param('id') id: string) {
    return { success: true, data: await this.projects.remove(user.id, id) };
  }
}
