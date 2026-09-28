import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceRequestMatchStatus } from '@prisma/client';

@Injectable()
export class TechnicianRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyMatches(technicianId: string) {
    return this.prisma.serviceRequestMatch.findMany({
      where: { technicianId },
      include: {
        serviceRequest: {
          include: { category: true, subcategory: true, images: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMatchDetail(technicianId: string, serviceRequestId: string) {
    const match = await this.prisma.serviceRequestMatch.findUnique({
      where: {
        serviceRequestId_technicianId: {
          serviceRequestId,
          technicianId,
        }
      },
      include: {
        serviceRequest: {
          include: { category: true, subcategory: true, images: true }
        }
      }
    });

    if (!match) {
      throw new NotFoundException('Solicitud no encontrada o sin acceso');
    }

    // Verify expiration
    if (match.expiresAt < new Date() && match.status !== ServiceRequestMatchStatus.EXPIRED && match.status !== ServiceRequestMatchStatus.OFFER_SENT && match.status !== ServiceRequestMatchStatus.REJECTED) {
      await this.prisma.serviceRequestMatch.update({
        where: { id: match.id },
        data: { status: ServiceRequestMatchStatus.EXPIRED }
      });
      match.status = ServiceRequestMatchStatus.EXPIRED;
    }

    return match;
  }

  async markAsViewed(technicianId: string, serviceRequestId: string) {
    const match = await this.getMatchDetail(technicianId, serviceRequestId);
    
    if (match.status === ServiceRequestMatchStatus.EXPIRED) {
      throw new BadRequestException('El match ya ha expirado');
    }

    if (match.status === ServiceRequestMatchStatus.MATCHED) {
      return this.prisma.serviceRequestMatch.update({
        where: { id: match.id },
        data: { 
          status: ServiceRequestMatchStatus.VIEWED,
          viewedAt: new Date()
        }
      });
    }

    return match;
  }

  async respond(technicianId: string, serviceRequestId: string, action: 'ACCEPT' | 'REJECT') {
    const match = await this.getMatchDetail(technicianId, serviceRequestId);

    if (match.status === ServiceRequestMatchStatus.EXPIRED) {
      throw new BadRequestException('El tiempo de respuesta ha expirado');
    }

    if (match.status === ServiceRequestMatchStatus.OFFER_SENT || match.status === ServiceRequestMatchStatus.REJECTED) {
      throw new BadRequestException('Ya has respondido a esta solicitud');
    }

    const newStatus = action === 'ACCEPT' ? ServiceRequestMatchStatus.OFFER_SENT : ServiceRequestMatchStatus.REJECTED;

    return this.prisma.$transaction(async (tx) => {
      const updatedMatch = await tx.serviceRequestMatch.update({
        where: { id: match.id },
        data: {
          status: newStatus,
          respondedAt: new Date()
        }
      });

      if (action === 'ACCEPT') {
        const parentRequest = await tx.serviceRequest.findUnique({
          where: { id: serviceRequestId }
        });

        if (parentRequest && parentRequest.status === 'MATCHING') {
          await tx.serviceRequest.update({
            where: { id: serviceRequestId },
            data: { status: 'OFFER_RECEIVED' }
          });
        }
      }

      return updatedMatch;
    });
  }
}
