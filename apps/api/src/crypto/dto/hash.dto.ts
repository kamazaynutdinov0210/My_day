import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class HashDto {
  @IsString()
  @IsNotEmpty()
  algorithm!: string;

  @IsString()
  @IsNotEmpty()
  data!: string;

  @IsOptional()
  @IsString()
  salt?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(1000000)
  iterations?: number;
}

