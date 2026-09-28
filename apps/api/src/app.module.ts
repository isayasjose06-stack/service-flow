import { EventEmitter2 } from '@nestjs/event-emitter';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { MatchingModule } from './modules/matching/matching.module';
import { TechnicianRequestsModule } from './modules/technician-requests/technician-requests.module';
import { ServicesModule } from './modules/services/services.module';
import { ChatModule } from './modules/chat/chat.module';
import { LocationModule } from './modules/location/location.module';
import { AdminModule } from './modules/admin/admin.module';
import { CommonModule } from './common/common.module';
import { HealthController } from './health/health.controller';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

import { HttpMetricsMiddleware } from './common/middleware/http-metrics.middleware';

import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    CommonModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ServiceRequestsModule,
    UploadsModule,
    MatchingModule,
    TechnicianRequestsModule,
    ServicesModule,
    ChatModule,
    LocationModule,
    AdminModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, HttpMetricsMiddleware).forRoutes('*');
  }
}

