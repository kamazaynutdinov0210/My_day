import { IsDateString, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString() @Length(1, 300) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() startAt!: string;
  @IsDateString() endAt!: string;
  @IsString() @MaxLength(100) timezone!: string;
  @IsOptional() @IsString() @MaxLength(500) location?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() @MaxLength(50) priority?: string;
  @IsOptional() @IsString() @MaxLength(50) status?: string;
  @IsOptional() @IsString() recurrence?: string;
  @IsOptional() @IsUUID() projectId?: string;
}
