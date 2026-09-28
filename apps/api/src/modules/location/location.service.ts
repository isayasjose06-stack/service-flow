import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Prisma } from '@prisma/client';
import { calculateHaversineDistance } from '../../common/utils/distance.util';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const userLocation = await this.prisma.userLocation.upsert({
      where: { userId },
      update: {
        latitude: new Prisma.Decimal(dto.latitude),
        longitude: new Prisma.Decimal(dto.longitude),
      },
      create: {
        userId,
        latitude: new Prisma.Decimal(dto.latitude),
        longitude: new Prisma.Decimal(dto.longitude),
      },
    });

    return {
      success: true,
      updatedAt: userLocation.updatedAt,
    };
  }

  async getMyUrl(userId: string) {
    const loc = await this.prisma.userLocation.findUnique({ where: { userId } });
    if (!loc) throw new NotFoundException('Ubicación no encontrada');
    
    return {
      latitude: loc.latitude.toNumber(),
      longitude: loc.longitude.toNumber(),
      updatedAt: loc.updatedAt,
    };
  }

  async getSharedLocation(requesterId: string, targetUserId: string) {
    // Business rule: Can only see target's location if there is an active confirmed/in_progress service between them
    const activeService = await this.prisma.service.findFirst({
      where: {
        OR: [
          { clientId: requesterId, technicianId: targetUserId },
          { clientId: targetUserId, technicianId: requesterId },
        ],
        status: {
          in: ['CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'],
        },
      },
    });

    if (!activeService) {
      throw new ForbiddenException('No tienes permiso para ver la ubicación de este usuario');
    }

    const loc = await this.prisma.userLocation.findUnique({
      where: { userId: targetUserId },
    });

    if (!loc) {
      throw new NotFoundException('El usuario no ha reportado su ubicación');
    }

    return {
      userId: targetUserId,
      latitude: loc.latitude.toNumber(),
      longitude: loc.longitude.toNumber(),
      updatedAt: loc.updatedAt,
    };
  }
}
