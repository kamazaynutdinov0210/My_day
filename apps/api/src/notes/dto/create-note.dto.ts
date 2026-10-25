import { NoteType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { IsCuid } from '../../common/validators/is-cuid';

export class CreateNoteDto {
  @IsString() @Length(1, 500) title!: string;
  @IsString() content!: string;
  @IsOptional() @IsEnum(NoteType) type?: NoteType;
  @IsOptional() @IsCuid() projectId?: string;
  @IsOptional() @IsCuid() taskId?: string;
  @IsOptional() @IsCuid() eventId?: string;
  @IsOptional() @IsCuid({ each: true }) tagIds?: string[];
}
