import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { SelectTechnicianDto } from './dto/select-technician.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@serviceflow/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.serviceRequestsService.create(userId, dto);
  }

  @Get('me')
  @Roles(UserRole.CLIENT)
  findMyRequests(@CurrentUser('sub') userId: string) {
    return this.serviceRequestsService.findAllMyRequests(userId);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT)
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.serviceRequestsService.findOneMyRequest(userId, id);
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT)
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceRequestDto,
  ) {
    return this.serviceRequestsService.update(userId, id, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CLIENT)
  cancel(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.serviceRequestsService.cancel(userId, id, reason);
  }

  @Get(':id/offers')
  @Roles(UserRole.CLIENT)
  getOffers(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.serviceRequestsService.getOffers(userId, id);
  }

  @Post(':id/select-technician')
  @Roles(UserRole.CLIENT)
  selectTechnician(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: SelectTechnicianDto,
  ) {
    return this.serviceRequestsService.selectTechnician(userId, id, dto);
  }
}
