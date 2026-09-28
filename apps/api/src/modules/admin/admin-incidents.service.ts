import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentStatus } from '@serviceflow/shared';

@Injectable()
export class AdminIncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async getIncidents(page: number, limit: number, status?: IncidentStatus) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.incident.count({ where: whereClause }),
    ]);

    return {
      data: incidents,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getIncidentById(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        targetUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        service: true,
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  async updateIncident(adminId: string, id: string, dto: UpdateIncidentDto) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');

    const updated = await this.prisma.incident.update({
      where: { id },
      data: dto,
    });

    await this.auditService.logAction(adminId, 'UPDATE_INCIDENT', 'Incident', id, dto);

    return updated;
  }
}
