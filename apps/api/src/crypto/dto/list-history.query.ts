import { EncryptionCategory, EncryptionOperationType, EncryptionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE } from '../../common/api-response';

export class ListHistoryQuery {
  @IsOptional()
  @IsEnum(EncryptionOperationType)
  operationType?: EncryptionOperationType;

  @IsOptional()
  @IsEnum(EncryptionCategory)
  category?: EncryptionCategory;

  @IsOptional()
  @IsEnum(EncryptionStatus)
  status?: EncryptionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  algorithm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = DEFAULT_PAGE_SIZE;
}

