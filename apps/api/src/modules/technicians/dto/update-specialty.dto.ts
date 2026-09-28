import { IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateSpecialtyDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
