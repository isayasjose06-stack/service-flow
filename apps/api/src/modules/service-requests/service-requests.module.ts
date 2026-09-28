import { Module } from '@nestjs/common';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { MatchingModule } from '../matching/matching.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MatchingModule, NotificationsModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService]
})
export class ServiceRequestsModule {}
