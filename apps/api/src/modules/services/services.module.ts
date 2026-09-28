import { Module } from '@nestjs/common';
import { TechnicianServicesController } from './technician-services.controller';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  controllers: [TechnicianServicesController, ServicesController],
  providers: [ServicesService],
  exports: [ServicesService]
})
export class ServicesModule {}
