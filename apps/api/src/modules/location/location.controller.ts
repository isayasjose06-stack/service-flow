import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Patch()
  updateLocation(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.updateLocation(userId, dto);
  }

  @Get()
  getMyLocation(@CurrentUser('sub') userId: string) {
    return this.locationService.getMyUrl(userId);
  }

  @Get('shared/:targetId')
  getSharedLocation(
    @CurrentUser('sub') requesterId: string,
    @Param('targetId') targetId: string,
  ) {
    return this.locationService.getSharedLocation(requesterId, targetId);
  }
}
