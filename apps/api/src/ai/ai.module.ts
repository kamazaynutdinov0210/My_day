import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { CalendarModule } from '../calendar/calendar.module';
import { RemindersModule } from '../reminders/reminders.module';import { AiController } from './ai.controller';
import { AiProviderService } from './ai-provider.service';
import { AiService } from './ai.service';

@Module({
  imports: [AuthModule, PrismaModule, TasksModule, CalendarModule, RemindersModule],
  controllers: [AiController],
  providers: [AiService, AiProviderService],
  exports: [AiService, AiProviderService],
})
export class AiModule {}