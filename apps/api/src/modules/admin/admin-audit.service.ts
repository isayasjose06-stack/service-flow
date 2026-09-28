import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: any,
  ) {
    return this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        metadata: metadata ? metadata : undefined,
      },
    });
  }

  async getAuditLogs(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.adminAuditLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
