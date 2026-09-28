import { 
  IsUUID, 
  IsString, 
  IsOptional, 
  IsNumber, 
  Min, 
  Max, 
  IsDateString, 
  Matches, 
  IsArray, 
  MinLength, 
  MaxLength 
} from 'class-validator';

export class CreateServiceRequestDto {
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  addressText?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsDateString()
  scheduledDate: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato HH:mm' })
  scheduledTime: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}
