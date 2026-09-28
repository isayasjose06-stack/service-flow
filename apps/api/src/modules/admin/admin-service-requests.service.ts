import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminServiceRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, status?: string, categoryId?: string) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (categoryId) whereClause.categoryId = categoryId;

    const [data, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
          category: { select: { id: true, name: true } },
        }
      }),
      this.prisma.serviceRequest.count({ where: whereClause }),
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
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        category: true,
        subcategory: true,
        address: true,
        matches: {
          include: {
            technician: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        service: {
          select: { id: true, status: true, technician: { select: { id: true, firstName: true, lastName: true } } }
        }
      },
    });

    if (!request) {
      throw new NotFoundException('ServiceRequest not found');
    }

    return request;
  }
}
