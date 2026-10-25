import { IsBooleanString, IsOptional, IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListNotificationsQuery {
  @IsOptional() @IsBooleanString() read?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 50;
}
