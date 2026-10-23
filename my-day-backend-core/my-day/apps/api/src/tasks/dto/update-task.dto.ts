import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional() @IsDateString() completedAt?: string | null;
  @IsOptional() @IsInt() @Min(0) actualDuration?: number;
}
