import { EncryptionCategory, EncryptionOperationType, EncryptionStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHistoryDto {
  @IsEnum(EncryptionOperationType)
  operationType!: EncryptionOperationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  algorithm!: string;

  @IsEnum(EncryptionCategory)
  category!: EncryptionCategory;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  dataType?: string;

  @IsOptional()
  @IsEnum(EncryptionStatus)
  status?: EncryptionStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

