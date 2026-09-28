import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminServiceRequestsService } from './admin-service-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@serviceflow/shared';

@Controller('admin/service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminServiceRequestsController {
  constructor(private readonly requestsService: AdminServiceRequestsService) {}

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.requestsService.findAll(Number(page) || 1, Number(limit) || 20, status, categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }
}
