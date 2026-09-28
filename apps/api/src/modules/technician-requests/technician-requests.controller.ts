import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { TechnicianRequestsService } from './technician-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@serviceflow/shared';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TECHNICIAN)
@Controller('technician/service-requests')
export class TechnicianRequestsController {
  constructor(private readonly technicianRequestsService: TechnicianRequestsService) {}

  @Get()
  findMyMatches(@CurrentUser('sub') userId: string) {
    return this.technicianRequestsService.getMyMatches(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.technicianRequestsService.getMatchDetail(userId, id);
  }

  @Post(':id/view')
  markAsViewed(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.technicianRequestsService.markAsViewed(userId, id);
  }

  @Post(':id/respond')
  respond(
    @CurrentUser('sub') userId: string, 
    @Param('id') id: string,
    @Body('action') action: 'ACCEPT' | 'REJECT'
  ) {
    return this.technicianRequestsService.respond(userId, id, action);
  }
}
