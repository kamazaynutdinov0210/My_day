import { TaskPriority, TaskStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Max, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE } from '../../common/api-response';
import { toArray } from '../../common/transforms';
import { IsCuid } from '../../common/validators/is-cuid';

/** Query contract: packages/types TaskFilterParams plus pagination. */
export class ListTasksQuery {
  @IsOptional() @Transform(toArray) @IsEnum(TaskStatus, { each: true }) status?: TaskStatus[];
  @IsOptional() @Transform(toArray) @IsEnum(TaskPriority, { each: true }) priority?: TaskPriority[];
  @IsOptional() @IsCuid() projectId?: string;
  @IsOptional() @Transform(toArray) @IsCuid({ each: true }) tagIds?: string[];
  @IsOptional() @IsDateString() dueBefore?: string;
  @IsOptional() @IsDateString() dueAfter?: string;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsCuid() parentTaskId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = DEFAULT_PAGE_SIZE;
}
