import { IsOptional, IsString } from 'class-validator';

export class ApproveVerificationDto {
  @IsString()
  @IsOptional()
  note?: string;
}
