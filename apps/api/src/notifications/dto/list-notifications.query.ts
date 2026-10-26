import { NotificationType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBooleanString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE } from '../../common/api-response';
import { toArray } from '../../common/transforms';

/** Query contract: packages/types NotificationFilterParams plus pagination. */
export class ListNotificationsQuery {
  @IsOptional() @IsBooleanString() read?: string;
  @IsOptional() @Transform(toArray) @IsEnum(NotificationType, { each: true }) type?: NotificationType[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = DEFAULT_PAGE_SIZE;
}
