import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EncryptDto {
  @IsString()
  @IsNotEmpty()
  algorithm!: string;

  @IsString()
  @IsNotEmpty()
  plaintext!: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  recipientPublicKey?: string;

  @IsOptional()
  @IsString()
  additionalData?: string;
}

