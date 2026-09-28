import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AdminVerificationsService } from './admin-verifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@serviceflow/shared';
import { ApproveVerificationDto } from './dto/approve-verification.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';

@Controller('admin/verifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminVerificationsController {
  constructor(private readonly adminVerificationsService: AdminVerificationsService) {}

  @Post('documents/:id/approve')
  async approveDocument(
    @CurrentUser('sub') adminId: string,
    @Param('id') id: string,
    @Body() dto: ApproveVerificationDto,
  ) {
    return this.adminVerificationsService.approveDocument(adminId, id, dto.note);
  }

  @Post('documents/:id/reject')
  async rejectDocument(
    @CurrentUser('sub') adminId: string,
    @Param('id') id: string,
    @Body() dto: RejectVerificationDto,
  ) {
    return this.adminVerificationsService.rejectDocument(adminId, id, dto.reason);
  }
}
