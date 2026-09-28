import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailProvider, MockEmailProvider } from './providers/email.provider';
import { PushProvider, MockPushProvider } from './providers/push.provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: EmailProvider,
      useClass: MockEmailProvider, // Switch to real provider when available
    },
    {
      provide: PushProvider,
      useClass: MockPushProvider, // Switch to real provider when available
    },
  ],
  exports: [NotificationsService, EmailProvider, PushProvider]
})
export class NotificationsModule {}
