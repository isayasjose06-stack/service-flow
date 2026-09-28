import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@serviceflow/shared';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalClients,
      totalTechnicians,
      requestsByStatus,
      servicesByStatus,
      incidentsByStatus,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.CLIENT } }),
      this.prisma.user.count({ where: { role: UserRole.TECHNICIAN } }),
      this.prisma.serviceRequest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.service.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.incident.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        clients: totalClients,
        technicians: totalTechnicians,
      },
      requestsByStatus: requestsByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>),
      servicesByStatus: servicesByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>),
      incidentsByStatus: incidentsByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
