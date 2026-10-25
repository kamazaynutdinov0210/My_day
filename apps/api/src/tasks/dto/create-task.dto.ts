import { RecurrenceFrequency, TaskPriority, TaskStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { IsCuid } from '../../common/validators/is-cuid';

export class CreateTaskDto {
  @IsString() @Length(1, 500) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsInt() @Min(0) estimatedDuration?: number;
  @IsOptional() @IsCuid() projectId?: string;
  @IsOptional() @IsCuid() parentTaskId?: string;
  @IsOptional() @IsEnum(RecurrenceFrequency) recurrenceFreq?: RecurrenceFrequency;
  @IsOptional() @IsString() recurrenceRule?: string;
  @IsOptional() @IsCuid({ each: true }) tagIds?: string[];
  @IsOptional() @IsInt() @Min(1) @Max(100) position?: number;
}
