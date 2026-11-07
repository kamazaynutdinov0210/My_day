import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}