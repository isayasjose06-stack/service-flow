import { IsString, IsBoolean, Matches, IsOptional } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsString()
  dayOfWeek: string; // e.g. MONDAY, TUESDAY

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
