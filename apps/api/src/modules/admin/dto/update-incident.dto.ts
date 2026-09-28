import { IsOptional, IsString, IsEnum } from 'class-validator';
import { IncidentStatus } from '@serviceflow/shared';

export class UpdateIncidentDto {
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  resolution?: string;
}
