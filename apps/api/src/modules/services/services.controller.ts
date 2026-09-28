import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@serviceflow/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('my-services')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  getMyServices(@CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole) {
    if (role === UserRole.CLIENT) {
      return this.servicesService.findAllForClient(userId);
    }
    return this.servicesService.findAllForTechnician(userId);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  getService(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.servicesService.findOneForParticipant(userId, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.TECHNICIAN)
  updateStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceStatusDto
  ) {
    return this.servicesService.updateStatus(userId, id, dto);
  }

  @Get(':id/payment')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  getPayment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.servicesService.getPayment(userId, id);
  }

  @Post(':id/payment')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  registerPayment(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.servicesService.registerPayment(userId, id, dto);
  }

  @Get(':id/rating')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  getRatings(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.servicesService.getRatings(userId, id);
  }

  @Post(':id/rating')
  @Roles(UserRole.CLIENT, UserRole.TECHNICIAN)
  submitRating(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.servicesService.submitRating(userId, id, dto);
  }
}
