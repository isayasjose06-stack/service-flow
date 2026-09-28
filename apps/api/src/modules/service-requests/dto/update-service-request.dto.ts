import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceRequestDto } from './create-service-request.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateServiceRequestDto extends PartialType(CreateServiceRequestDto) {
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
