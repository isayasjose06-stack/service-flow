import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
          technician: { select: { id: true, firstName: true, lastName: true, email: true } },
        }
      }),
      this.prisma.service.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        technician: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        serviceRequest: { select: { id: true, title: true, categoryId: true } },
        payment: true,
        ratings: true,
        conversation: { select: { id: true, createdAt: true } }, // Do not include messages
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }
}
