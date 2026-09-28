import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminIncidentsService } from './admin-incidents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, IncidentStatus } from '@serviceflow/shared';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Controller('admin/incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminIncidentsController {
  constructor(private readonly adminIncidentsService: AdminIncidentsService) {}

  @Get()
  async getIncidents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: IncidentStatus,
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    return this.adminIncidentsService.getIncidents(pageNumber, limitNumber, status);
  }

  @Get(':id')
  async getIncidentById(@Param('id') id: string) {
    return this.adminIncidentsService.getIncidentById(id);
  }

  @Patch(':id')
  async updateIncident(
    @CurrentUser('sub') adminId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
  ) {
    return this.adminIncidentsService.updateIncident(adminId, id, dto);
  }
}
