import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  async catalog() {
    return { success: true, data: await this.integrations.catalog() };
  }

  @Get('accounts')
  @UseGuards(SessionAuthGuard)
  async accounts(@CurrentUser() user: AuthenticatedRequest['user']) {
    return { success: true, data: await this.integrations.accounts(user.id) };
  }

  @Post(':provider/connect')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async connect(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('provider') provider: string,
    @Body() body: { authCode: string; redirectUri: string },
  ) {
    return { success: true, data: await this.integrations.connect(user.id, provider, body) };
  }

  @Post(':provider/disconnect')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async disconnect(@CurrentUser() user: AuthenticatedRequest['user'], @Param('provider') provider: string) {
    await this.integrations.disconnect(user.id, provider);
    return { success: true, data: null };
  }

  @Post(':provider/webhook')
  async webhook(@Param('provider') provider: string, @Body() body: unknown) {
    void provider;
    void body;
    return { success: true, data: null };
  }
}