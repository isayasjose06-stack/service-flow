import { Controller, Get, Post, Patch, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';

import { UpdateCoverageDto } from './dto/update-coverage.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@serviceflow/shared';
import { FindNearbyTechniciansDto } from './dto/find-nearby-technicians.dto';
import { Query } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.TECHNICIAN)
  @Get('nearby')
  findNearby(
    @CurrentUser('sub') userId: string,
    @Query() dto: FindNearbyTechniciansDto
  ) {
    return this.techniciansService.findNearby(userId, dto);
  }

  // --- SPECIALTIES ---
  @Roles(UserRole.TECHNICIAN)
  @Get('me/specialties')
  getSpecialties(@CurrentUser('sub') userId: string) {
    return this.techniciansService.getSpecialties(userId);
  }

  @Roles(UserRole.TECHNICIAN)
  @Post('me/specialties')
  addSpecialty(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSpecialtyDto
  ) {
    return this.techniciansService.addSpecialty(userId, dto);
  }


  @Roles(UserRole.TECHNICIAN)
  @Delete('me/specialties/:id')
  removeSpecialty(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string
  ) {
    return this.techniciansService.removeSpecialty(userId, id);
  }

  // --- COVERAGE ---
  @Roles(UserRole.TECHNICIAN)
  @Get('me/coverage')
  getCoverage(@CurrentUser('sub') userId: string) {
    return this.techniciansService.getCoverage(userId);
  }

  @Roles(UserRole.TECHNICIAN)
  @Post('me/coverage')
  addCoverage(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateCoverageDto
  ) {
    return this.techniciansService.addCoverage(userId, dto);
  }

  @Roles(UserRole.TECHNICIAN)
  @Put('me/coverage/:id')
  updateCoverage(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCoverageDto
  ) {
    return this.techniciansService.updateCoverage(userId, id, dto);
  }

  @Roles(UserRole.TECHNICIAN)
  @Delete('me/coverage/:id')
  removeCoverage(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string
  ) {
    return this.techniciansService.removeCoverage(userId, id);
  }

  // --- AVAILABILITY ---
  @Roles(UserRole.TECHNICIAN)
  @Get('me/availability')
  getAvailability(@CurrentUser('sub') userId: string) {
    return this.techniciansService.getAvailability(userId);
  }

  @Roles(UserRole.TECHNICIAN)
  @Post('me/availability')
  addAvailability(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateAvailabilityDto
  ) {
    return this.techniciansService.addAvailability(userId, dto);
  }

  // --- DOCUMENTS ---
  @Roles(UserRole.TECHNICIAN)
  @Get('me/documents')
  getDocuments(@CurrentUser('sub') userId: string) {
    return this.techniciansService.getDocuments(userId);
  }
}

