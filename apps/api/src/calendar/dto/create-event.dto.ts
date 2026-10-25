import { EventCategory, EventStatus, RecurrenceFrequency, TaskPriority } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { IsCuid } from '../../common/validators/is-cuid';

export class CreateEventDto {
  @IsString() @Length(1, 300) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() startAt!: string;
  @IsDateString() endAt!: string;
  @IsString() @MaxLength(100) timezone!: string;
  @IsOptional() @IsString() @MaxLength(500) location?: string;
  @IsOptional() @IsEnum(EventCategory) category?: EventCategory;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
  @IsOptional() @IsEnum(RecurrenceFrequency) recurrenceFreq?: RecurrenceFrequency;
  @IsOptional() @IsString() recurrenceRule?: string;
  @IsOptional() @IsCuid() projectId?: string;
}
