import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTimeEntryDto {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsDateString()
  startedAt!: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}