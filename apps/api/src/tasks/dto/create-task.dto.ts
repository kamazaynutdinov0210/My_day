import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

enum TaskStatusInput { BACKLOG = 'BACKLOG', TODO = 'TODO', IN_PROGRESS = 'IN_PROGRESS', WAITING = 'WAITING', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }
enum TaskPriorityInput { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', URGENT = 'URGENT' }

export class CreateTaskDto {
  @IsString() @Length(1, 500) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(TaskStatusInput) status?: TaskStatusInput;
  @IsOptional() @IsEnum(TaskPriorityInput) priority?: TaskPriorityInput;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsInt() @Min(0) estimatedDuration?: number;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() parentTaskId?: string;
  @IsOptional() @IsString() recurrence?: string;
  @IsOptional() @IsUUID('4', { each: true }) tagIds?: string[];
  @IsOptional() @IsInt() @Min(1) @Max(100) position?: number;
}
