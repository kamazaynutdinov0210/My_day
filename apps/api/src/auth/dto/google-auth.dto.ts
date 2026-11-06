import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class GoogleAuthDto {
  @IsOptional()
  @IsString()
  credential?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

