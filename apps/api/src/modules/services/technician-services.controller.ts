import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@serviceflow/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('technician/services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TechnicianServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @Roles(UserRole.TECHNICIAN)
  findAll(@CurrentUser('sub') userId: string) {
    return this.servicesService.findAllForTechnician(userId);
  }

  @Get(':id')
  @Roles(UserRole.TECHNICIAN)
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.servicesService.findOneForTechnician(userId, id);
  }

  @Post(':id/status')
  @Roles(UserRole.TECHNICIAN)
  updateStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceStatusDto,
  ) {
    return this.servicesService.updateStatus(userId, id, dto);
  }
}
