import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users/me')
@UseGuards(SessionAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.usersService.getById(user.id).then((data) => ({ success: true, data }));
  }

  @Patch()
  @UseGuards(CsrfGuard)
  update(@CurrentUser() user: AuthenticatedRequest['user'], @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto).then((data) => ({ success: true, data }));
  }
}
