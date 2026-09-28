import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '@serviceflow/shared';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let profile = null;
    if (role === UserRole.CLIENT) {
      profile = await this.prisma.clientProfile.findUnique({
        where: { userId },
      });
    } else if (role === UserRole.TECHNICIAN) {
      profile = await this.prisma.technicianProfile.findUnique({
        where: { userId },
      });
    }

    return { ...user, profile };
  }

  async updateProfile(userId: string, role: string, dto: UpdateProfileDto) {
    const { firstName, lastName, phone, photoUrl, description, experienceYears } = dto;

    // Update base user fields
    if (firstName !== undefined || lastName !== undefined || phone !== undefined || photoUrl !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(photoUrl !== undefined && { avatarUrl: photoUrl }),
        },
      });
    }

    // Update specific profile fields
    if (role === UserRole.CLIENT) {
      if (description !== undefined || experienceYears !== undefined) {
        throw new BadRequestException('Campos no permitidos para clientes');
      }
    } else if (role === UserRole.TECHNICIAN) {
      if (description !== undefined || experienceYears !== undefined) {
        await this.prisma.technicianProfile.update({
          where: { userId },
          data: {
            ...(description !== undefined && { professionalDescription: description }),
            ...(experienceYears !== undefined && { yearsOfExperience: experienceYears }),
          },
        });
      }
    }

    return this.getProfile(userId, role);
  }
}
