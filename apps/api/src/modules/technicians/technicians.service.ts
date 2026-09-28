import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateCoverageDto } from './dto/update-coverage.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { FindNearbyTechniciansDto } from './dto/find-nearby-technicians.dto';
import { getBoundingBox, calculateHaversineDistance } from '../../common/utils/distance.util';

@Injectable()
export class TechniciansService {
  constructor(private prisma: PrismaService) {}

  private async getProfileId(userId: string) {
    const profile = await this.prisma.technicianProfile.findUnique({
      where: { userId }
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return profile.id;
  }

  async getSpecialties(userId: string) {
    const technicianProfileId = await this.getProfileId(userId);
    return this.prisma.technicianSpecialty.findMany({
      where: { technicianProfileId },
      include: { category: true, subcategory: true }
    });
  }

  async addSpecialty(userId: string, dto: CreateSpecialtyDto) {
    const technicianProfileId = await this.getProfileId(userId);
    
    const existing = await this.prisma.technicianSpecialty.findMany({
      where: { technicianProfileId, categoryId: dto.categoryId }
    });

    if (!dto.subcategoryId && existing.some(e => e.subcategoryId)) {
      throw new BadRequestException('Inválido');
    }

    if (dto.subcategoryId && existing.some(e => !e.subcategoryId)) {
      throw new BadRequestException('Inválido');
    }

    return this.prisma.technicianSpecialty.create({
      data: { 
        technicianProfileId, 
        categoryId: dto.categoryId, 
        subcategoryId: dto.subcategoryId 
      }
    });
  }

  async removeSpecialty(userId: string, specialtyId: string) {
    const technicianProfileId = await this.getProfileId(userId);
    return this.prisma.technicianSpecialty.deleteMany({
      where: { id: specialtyId, technicianProfileId }
    });
  }

  async getCoverage(userId: string) {
    const technicianProfileId = await this.getProfileId(userId);
    return this.prisma.coverageZone.findMany({
      where: { technicianProfileId }
    });
  }

  async addCoverage(userId: string, dto: UpdateCoverageDto) {
    const technicianProfileId = await this.getProfileId(userId);
    
    const zone = await this.prisma.coverageZone.create({
      data: {
        technicianProfileId,
        city: dto.city || 'Desconocida',
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusKm: dto.radiusKm,
        isActive: true,
      }
    });

    return zone;
  }

  async updateCoverage(userId: string, id: string, dto: UpdateCoverageDto) {
    const technicianProfileId = await this.getProfileId(userId);
    const updated = await this.prisma.coverageZone.updateMany({
      where: { id, technicianProfileId },
      data: {
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusKm: dto.radiusKm,
      }
    });
    return updated;
  }

  async removeCoverage(userId: string, id: string) {
    const technicianProfileId = await this.getProfileId(userId);
    return this.prisma.coverageZone.deleteMany({
      where: { id, technicianProfileId }
    });
  }

  async getAvailability(userId: string) {
    const technicianProfileId = await this.getProfileId(userId);
    return this.prisma.technicianAvailability.findMany({
      where: { technicianProfileId }
    });
  }

  async addAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const technicianProfileId = await this.getProfileId(userId);
    return this.prisma.technicianAvailability.create({
      data: {
        technicianProfileId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
      }
    });
  }

  async getDocuments(userId: string) {
    const technicianProfileId = await this.getProfileId(userId);
    return this.prisma.verificationDocument.findMany({
      where: { technicianProfileId }
    });
  }

  async findNearby(userId: string, dto: FindNearbyTechniciansDto) {
    const { latitude, longitude, radiusInMeters, categoryId, subcategoryId, limit = 20 } = dto;
    
    if (radiusInMeters <= 0) throw new BadRequestException('Radio debe ser mayor a 0');
    if (limit <= 0 || limit > 50) throw new BadRequestException('Límite debe estar entre 1 y 50');

    const box = getBoundingBox(latitude, longitude, radiusInMeters);

    const candidates = await this.prisma.user.findMany({
      where: {
        role: 'TECHNICIAN',
        status: 'ACTIVE',
        technicianProfile: {
          isAvailable: true,
          isVerified: true,
          ...(categoryId && {
            specialties: {
              some: {
                categoryId,
                ...(subcategoryId && { subcategoryId }),
              },
            },
          }),
        },
        UserLocation: {
          some: {
            latitude: { gte: box.minLat, lte: box.maxLat },
            longitude: { gte: box.minLon, lte: box.maxLon },
          }
        },
      },
      include: {
        UserLocation: true,
        technicianProfile: {
          include: { specialties: { include: { category: true, subcategory: true } } },
        },
      },
    });

    const results = candidates
      .filter(c => c.UserLocation && c.UserLocation.length > 0)
      .map(candidate => {
        const loc = candidate.UserLocation[0];
        const cLat = Number(loc.latitude);
        const cLng = Number(loc.longitude);
        const distance = calculateHaversineDistance(latitude, longitude, cLat, cLng);
        return { candidate, distance };
      })
      .filter(item => item.distance <= radiusInMeters)
      .sort((a, b) => {
        if (a.distance === b.distance) {
          return a.candidate.id.localeCompare(b.candidate.id);
        }
        return a.distance - b.distance;
      })
      .slice(0, limit)
      .map(item => ({
        technicianId: item.candidate.id,
        firstName: item.candidate.firstName,
        lastName: item.candidate.lastName,
        distance: Math.round(item.distance),
        specialties: (item.candidate.technicianProfile?.specialties || []).map((s: any) => ({
          categoryId: s.categoryId,
          categoryName: s.category.name,
          subcategoryId: s.subcategoryId,
          subcategoryName: s.subcategory?.name,
        })),
      }));

    return results;
  }
}
