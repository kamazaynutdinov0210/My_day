import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';import { BriefingController } from './briefing.controller';
import { BriefingService } from './briefing.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BriefingController],
  providers: [BriefingService],
  exports: [BriefingService],
})
export class BriefingModule {}