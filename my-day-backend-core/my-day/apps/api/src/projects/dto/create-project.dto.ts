import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';

enum ProjectStatusInput { PLANNING = 'PLANNING', ACTIVE = 'ACTIVE', ON_HOLD = 'ON_HOLD', COMPLETED = 'COMPLETED', ARCHIVED = 'ARCHIVED' }
enum ProjectPriorityInput { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', URGENT = 'URGENT' }

export class CreateProjectDto {
  @IsString() @Length(1, 200) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ProjectStatusInput) status?: ProjectStatusInput;
  @IsOptional() @IsEnum(ProjectPriorityInput) priority?: ProjectPriorityInput;
  @IsOptional() @IsDateString() deadline?: string;
}
