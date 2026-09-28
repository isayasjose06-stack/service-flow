import { IsString, IsUUID, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class CreateSpecialtyDto {
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
