import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DecryptDto {
  @IsString()
  @IsNotEmpty()
  algorithm!: string;

  @IsString()
  @IsNotEmpty()
  ciphertext!: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  privateKey?: string;

  @IsOptional()
  @IsString()
  iv?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  additionalData?: string;
}

