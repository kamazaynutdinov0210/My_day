import { EventCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { toArray } from '../../common/transforms';
import { IsCuid } from '../../common/validators/is-cuid';

/** Query contract: packages/types CalendarEventFilterParams. Not paginated. */
export class ListEventsQuery {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsCuid() projectId?: string;
  @IsOptional() @Transform(toArray) @IsEnum(EventCategory, { each: true }) category?: EventCategory[];
}
