import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
@Module({
  imports: [PrismaModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard, CsrfGuard],
  exports: [AuthService, SessionAuthGuard, CsrfGuard],
})
export class AuthModule {}
