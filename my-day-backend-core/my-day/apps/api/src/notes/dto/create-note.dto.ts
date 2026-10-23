import { IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsString() @Length(1, 500) title!: string;
  @IsString() content!: string;
  @IsOptional() @IsString() @MaxLength(50) type?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() taskId?: string;
  @IsOptional() @IsUUID() eventId?: string;
  @IsOptional() @IsUUID('4', { each: true }) tagIds?: string[];
}
