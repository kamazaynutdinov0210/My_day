import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BriefingModule } from './briefing/briefing.module';import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { RemindersModule } from './reminders/reminders.module';import { CalendarModule } from './calendar/calendar.module';
import { NotesModule } from './notes/notes.module';
import { SearchModule } from './search/search.module';import { NotificationsModule } from './notifications/notifications.module';
import { ActivityModule } from './activity/activity.module';
import { AiModule } from './ai/ai.module';import { AnalyticsModule } from './analytics/analytics.module';import { CryptoModule } from './crypto/crypto.module';
import { HealthModule } from './health/health.module';
import { IntegrationsModule } from './integrations/integrations.module';import { TagsModule } from './tags/tags.module';
import { EmailsModule } from './emails/emails.module';
import { MessagesModule } from './messages/messages.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    ActivityModule,
    AiModule,
    AnalyticsModule,
    AuthModule,
    BriefingModule,
    CryptoModule,
    EmailsModule,
    HealthModule,
    IntegrationsModule,
    MessagesModule,
    TagsModule,
    TimeEntriesModule,
    UsersModule,
    TasksModule,
    ProjectsModule,
    RemindersModule,
    CalendarModule,
    NotesModule,
    NotificationsModule,
    SearchModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
