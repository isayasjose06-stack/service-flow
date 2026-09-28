import { IsEnum, IsNotEmpty } from 'class-validator';
import { ServiceStatus } from '@prisma/client';

export class UpdateServiceStatusDto {
  @IsNotEmpty()
  @IsEnum(ServiceStatus)
  status: ServiceStatus;
}
