import { Module } from '@nestjs/common';
import { TechnicianRequestsController } from './technician-requests.controller';
import { TechnicianRequestsService } from './technician-requests.service';

@Module({
  controllers: [TechnicianRequestsController],
  providers: [TechnicianRequestsService]
})
export class TechnicianRequestsModule {}
