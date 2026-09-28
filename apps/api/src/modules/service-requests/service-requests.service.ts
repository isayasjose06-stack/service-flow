import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, OnModuleInit, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { SelectTechnicianDto } from './dto/select-technician.dto';
import { ServiceRequestStatus, ServiceStatus, ServiceRequestMatchStatus } from '@prisma/client';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class ServiceRequestsService implements OnModuleInit {
  onModuleInit() { setInterval(() => this.handleRequestExpirations(), 60000); }
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateServiceRequestDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category || !category.isActive) {
      throw new BadRequestException('CategorÃƒÂ­a invÃƒÂ¡lida o inactiva');
    }

    if (dto.subcategoryId) {
      const sub = await this.prisma.subcategory.findUnique({ where: { id: dto.subcategoryId } });
      if (!sub || sub.categoryId !== dto.categoryId || !sub.isActive) {
        throw new BadRequestException('SubcategorÃƒÂ­a invÃƒÂ¡lida o no pertenece a la categorÃƒÂ­a');
      }
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const request = await this.prisma.$transaction(async (tx) => {
      const req = await tx.serviceRequest.create({
        data: {
          clientId: userId,
          categoryId: dto.categoryId,
          subcategoryId: dto.subcategoryId,
          title: dto.title,
          description: dto.description,
          status: ServiceRequestStatus.PENDING,
          scheduledDate: new Date(dto.scheduledDate),
          scheduledTime: new Date(`1970-01-01T${dto.scheduledTime}:00Z`), // Map to DateTime properly if needed or ignore
          budgetMin: dto.budgetMin,
          budgetMax: dto.budgetMax,
          addressText: dto.addressText,
          city: dto.city,
          images: dto.imageUrls && dto.imageUrls.length > 0 ? {
            create: dto.imageUrls.map(url => ({ imageUrl: url }))
          } : undefined,
          expiresAt,
        }
      });

      if (dto.latitude && dto.longitude) {
        await tx.$executeRaw`
          UPDATE "ServiceRequest"
          SET location = ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)
          WHERE id = ${req.id}
        `;
      }

      return req;
    });

    this.matchingService.matchServiceRequest(request.id).catch(err => {
      this.logger.error(`Error matching request ${request.id}: ${err.message}`);
    });

    return request;
  }

  async findAllMyRequests(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOneMyRequest(userId: string, id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: { category: true, subcategory: true }
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.clientId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta solicitud');
    }

    return request;
  }

  async update(userId: string, id: string, dto: UpdateServiceRequestDto) {
    const request = await this.findOneMyRequest(userId, id);

    if (request.status !== ServiceRequestStatus.PENDING) {
      throw new BadRequestException('Solo se pueden actualizar solicitudes pendientes');
    }

    const { cancellationReason, imageUrls, ...updateData } = dto;
    
    let data: any = { ...updateData };
    if (updateData.scheduledDate) {
      data.scheduledDate = new Date(updateData.scheduledDate);
    }

    return this.prisma.serviceRequest.update({
      where: { id },
      data
    });
  }

  async cancel(userId: string, id: string, reason?: string) {
    const request = await this.findOneMyRequest(userId, id);

    if (request.status !== ServiceRequestStatus.PENDING && request.status !== ServiceRequestStatus.OFFER_RECEIVED) {
      throw new BadRequestException('No se puede cancelar en este estado');
    }

    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: ServiceRequestStatus.CANCELLED_BY_CLIENT,
        cancellationReason: reason,
      }
    });
  }

  async getOffers(userId: string, id: string) {
    await this.findOneMyRequest(userId, id); 

    return this.prisma.serviceRequestMatch.findMany({
      where: {
        serviceRequestId: id,
        status: ServiceRequestMatchStatus.OFFER_SENT
      },
      include: {
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            technicianProfile: {
              select: {
                id: true,
                isVerified: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async selectTechnician(userId: string, id: string, dto: SelectTechnicianDto) {
    const request = await this.findOneMyRequest(userId, id);

    if (request.status !== ServiceRequestStatus.OFFER_RECEIVED && request.status !== ServiceRequestStatus.PENDING) {
      throw new BadRequestException('Estado invÃƒÂ¡lido para seleccionar tÃƒÂ©cnico');
    }

    return this.prisma.$transaction(async (tx) => {
      const match = await tx.serviceRequestMatch.findUnique({
        where: {
          serviceRequestId_technicianId: {
            serviceRequestId: id,
            technicianId: dto.technicianId
          }
        },
        include: { technician: { include: { technicianProfile: true } } }
      });

      if (!match || match.status !== ServiceRequestMatchStatus.OFFER_SENT) {
        throw new BadRequestException('La oferta no existe o ya no es vÃƒÂ¡lida');
      }

      if (match.expiresAt && match.expiresAt < new Date()) {
        throw new BadRequestException('La oferta ha expirado');
      }

      const updateReq = await tx.serviceRequest.updateMany({
        where: { id, status: request.status },
        data: {
          status: ServiceRequestStatus.TECHNICIAN_SELECTED,
        }
      });

      if (updateReq.count === 0) {
        throw new BadRequestException('La solicitud ya fue procesada');
      }

      await tx.serviceRequestMatch.updateMany({
        where: { serviceRequestId: id, technicianId: { not: dto.technicianId } },
        data: { status: ServiceRequestMatchStatus.REJECTED }
      });

      const service = await tx.service.create({
        data: {
          clientId: userId,
          technicianId: dto.technicianId,
          serviceRequestId: id,
          status: ServiceStatus.CONFIRMED,
        }
      });

      /* this.eventEmitter.emit('notification.send', {
        userId: dto.technicianId,
        type: 'SERVICE_CONFIRMED',
        title: 'Servicio Confirmado',
        body: 'El cliente ha aceptado tu oferta.',
        data: { serviceRequestId: id, serviceId: service.id },
        sendPush: true,
        idempotencyKey: `service_confirmed_${service.id}`
      }); */

      return service;
    });
  }

  
  async handleRequestExpirations() {
    const expiredRequests = await this.prisma.serviceRequest.findMany({
      where: {
        status: { in: [ServiceRequestStatus.PENDING, ServiceRequestStatus.OFFER_RECEIVED] },
        expiresAt: { lt: new Date() }
      }
    });

    for (const req of expiredRequests) {
      const updateReq = await this.prisma.serviceRequest.updateMany({
        where: { id: req.id, status: req.status },
        data: { status: ServiceRequestStatus.EXPIRED, cancellationReason: 'Expirada por tiempo lÃƒÂ­mite' }
      });

      if (updateReq.count > 0) {
        /* this.eventEmitter.emit('notification.send', {
          userId: req.clientId,
          type: 'REQUEST_EXPIRED',
          title: 'Solicitud Expirada',
          body: 'Tu solicitud de servicio ha expirado sin ser confirmada.',
          data: { serviceRequestId: req.id },
          sendEmail: true,
          sendPush: true,
          idempotencyKey: `request_expired_${req.id}`
        }); */
      }
    }
  }
}