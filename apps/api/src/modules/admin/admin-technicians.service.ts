import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationStatus } from '@serviceflow/shared';

@Injectable()
export class AdminTechniciansService {
  constructor(private readonly prisma: PrismaService) {}

  async getTechnicians(page: number, limit: number, verificationStatus?: VerificationStatus) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (verificationStatus) whereClause.verificationStatus = verificationStatus;

    const [profiles, total] = await Promise.all([
      this.prisma.technicianProfile.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
        },
      }),
      this.prisma.technicianProfile.count({ where: whereClause }),
    ]);

    return {
      data: profiles,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTechnicianById(id: string) {
    const profile = await this.prisma.technicianProfile.findUnique({
      where: { id },
      include: {
        user: true,
        specialties: { include: { category: true, subcategory: true } },
        documents: true,
        coverageZones: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Technician profile not found');
    }

    return profile;
  }
}
