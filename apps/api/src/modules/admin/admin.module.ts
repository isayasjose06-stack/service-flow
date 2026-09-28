import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminAuditService } from './admin-audit.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminTechniciansController } from './admin-technicians.controller';
import { AdminTechniciansService } from './admin-technicians.service';
import { AdminVerificationsController } from './admin-verifications.controller';
import { AdminVerificationsService } from './admin-verifications.service';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminIncidentsController } from './admin-incidents.controller';
import { AdminIncidentsService } from './admin-incidents.service';
import { AdminAuditController } from './admin-audit.controller';
import { AdminServiceRequestsController } from './admin-service-requests.controller';
import { AdminServiceRequestsService } from './admin-service-requests.service';
import { AdminServicesController } from './admin-services.controller';
import { AdminServicesService } from './admin-services.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminTechniciansController,
    AdminVerificationsController,
    AdminCategoriesController,
    AdminIncidentsController,
    AdminAuditController,
    AdminServiceRequestsController,
    AdminServicesController,
  ],
  providers: [
    AdminAuditService,
    AdminDashboardService,
    AdminUsersService,
    AdminTechniciansService,
    AdminVerificationsService,
    AdminCategoriesService,
    AdminIncidentsService,
    AdminServiceRequestsService,
    AdminServicesService,
  ],
  exports: [AdminAuditService],
})
export class AdminModule {}
