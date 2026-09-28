import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminTechniciansService } from './admin-technicians.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, VerificationStatus } from '@serviceflow/shared';

@Controller('admin/technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTechniciansController {
  constructor(private readonly adminTechniciansService: AdminTechniciansService) {}

  @Get()
  async getTechnicians(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('verificationStatus') verificationStatus?: VerificationStatus,
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    return this.adminTechniciansService.getTechnicians(pageNumber, limitNumber, verificationStatus);
  }

  @Get(':id')
  async getTechnicianById(@Param('id') id: string) {
    return this.adminTechniciansService.getTechnicianById(id);
  }
}
