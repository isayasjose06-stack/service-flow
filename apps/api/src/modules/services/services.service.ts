import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceStatus, NotificationType } from '@prisma/client';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async findAllForTechnician(technicianId: string) {
    return this.prisma.service.findMany({
      where: { technicianId },
      include: {
        serviceRequest: {
          include: { category: true, subcategory: true, client: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllForClient(clientId: string) {
    return this.prisma.service.findMany({
      where: { clientId },
      include: {
        serviceRequest: {
          include: { category: true, subcategory: true }
        },
        technician: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOneForTechnician(technicianId: string, serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        serviceRequest: {
          include: { category: true, subcategory: true, client: true }
        }
      }
    });

    if (!service) throw new NotFoundException('Servicio no encontrado');
    if (service.technicianId !== technicianId) throw new ForbiddenException('No tienes acceso a este servicio');

    return service;
  }

  async updateStatus(technicianId: string, serviceId: string, dto: UpdateServiceStatusDto) {
    const service = await this.findOneForTechnician(technicianId, serviceId);

    const allowedTransitions: Record<string, string[]> = {
      [ServiceStatus.CONFIRMED]: [ServiceStatus.ON_THE_WAY, ServiceStatus.CANCELLED_BY_TECHNICIAN],
      [ServiceStatus.ON_THE_WAY]: [ServiceStatus.ARRIVED, ServiceStatus.CANCELLED_BY_TECHNICIAN],
      [ServiceStatus.ARRIVED]: [ServiceStatus.IN_PROGRESS, ServiceStatus.CANCELLED_BY_TECHNICIAN],
      [ServiceStatus.IN_PROGRESS]: [ServiceStatus.COMPLETED],
    };

    const allowedNext = allowedTransitions[service.status];

    if (!allowedNext || !allowedNext.includes(dto.status)) {
      throw new BadRequestException(`No se puede pasar de ${service.status} a ${dto.status}`);
    }

    const updateData: any = { status: dto.status };
    if (dto.status === ServiceStatus.IN_PROGRESS) updateData.startedAt = new Date();
    if (dto.status === ServiceStatus.COMPLETED) updateData.completedAt = new Date();
    if (dto.status === ServiceStatus.CANCELLED_BY_TECHNICIAN) {
      updateData.cancelledById = technicianId;
      updateData.cancelledAt = new Date();
    }

    return this.prisma.$transaction(async (tx) => {
      // Atomic Compare-And-Swap (CAS) para evitar dobles updates concurrentes
      const updateResult = await tx.service.updateMany({
        where: { id: serviceId, status: service.status },
        data: updateData
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('El estado del servicio cambio concurrentemente');
      }

      const updated = await tx.service.findUniqueOrThrow({ where: { id: serviceId } });

      await tx.serviceStatusHistory.create({
        data: {
          serviceId,
          fromStatus: service.status,
          toStatus: dto.status,
          changedById: technicianId
        }
      });

      // Emitir eventos de dominio a traves de notification.send
      if (dto.status === ServiceStatus.ON_THE_WAY) {
        this.eventEmitter.emit('notification.send', {
          userId: service.clientId,
          type: NotificationType.TECHNICIAN_ON_THE_WAY,
          title: 'El tecnico esta en camino',
          body: 'Tu tecnico se dirige a la ubicacion del servicio.',
          data: { serviceId, technicianId },
          sendPush: true,
          idempotencyKey: `technician_on_the_way_${serviceId}`
        });
      } else if (dto.status === ServiceStatus.ARRIVED) {
        this.eventEmitter.emit('notification.send', {
          userId: service.clientId,
          type: NotificationType.TECHNICIAN_ARRIVED,
          title: 'El tecnico ha llegado',
          body: 'Tu tecnico esta en la ubicacion.',
          data: { serviceId, technicianId },
          sendPush: true,
          idempotencyKey: `technician_arrived_${serviceId}`
        });
      } else if (dto.status === ServiceStatus.IN_PROGRESS) {
        this.eventEmitter.emit('notification.send', {
          userId: service.clientId,
          type: NotificationType.SERVICE_STARTED,
          title: 'Servicio Iniciado',
          body: 'El trabajo ha comenzado.',
          data: { serviceId, technicianId },
          sendPush: true,
          idempotencyKey: `service_started_${serviceId}`
        });
      } else if (dto.status === ServiceStatus.COMPLETED) {
        this.eventEmitter.emit('notification.send', {
          userId: service.clientId,
          type: NotificationType.SERVICE_COMPLETED,
          title: 'Servicio Completado',
          body: 'El servicio ha finalizado. Por favor, procede con el pago.',
          data: { serviceId, technicianId },
          sendPush: true,
          idempotencyKey: `service_completed_${serviceId}`
        });
      } else if (dto.status === ServiceStatus.CANCELLED_BY_TECHNICIAN) {
        this.eventEmitter.emit('notification.send', {
          userId: service.clientId,
          type: NotificationType.SERVICE_CANCELLED,
          title: 'Servicio Cancelado',
          body: 'El tecnico ha cancelado el servicio.',
          data: { serviceId, technicianId },
          sendPush: true,
          idempotencyKey: `service_cancelled_${serviceId}`
        });
      }

      return updated;
    });
  }

  async findOneForParticipant(userId: string, serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        payment: true,
        ratings: true,
        serviceRequest: { include: { client: true } }
      }
    });

    if (!service) throw new NotFoundException('Servicio no encontrado');
    if (service.clientId !== userId && service.technicianId !== userId) {
      throw new ForbiddenException('No tienes acceso a este servicio');
    }

    return service;
  }

  async getPayment(userId: string, serviceId: string) {
    const service = await this.findOneForParticipant(userId, serviceId);
    if (!service.payment) throw new NotFoundException('El pago no ha sido registrado');
    return service.payment;
  }

  async registerPayment(userId: string, serviceId: string, dto: CreatePaymentDto) {
    const service = await this.findOneForParticipant(userId, serviceId);

    if (service.status !== ServiceStatus.COMPLETED) {
      throw new BadRequestException('El pago solo puede registrarse cuando el servicio esta COMPLETED');
    }

    if (service.payment) {
      throw new BadRequestException('El pago de este servicio ya fue registrado');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create payment (Prisma will throw si @unique on serviceId es violada)
      const payment = await tx.payment.create({
        data: {
          serviceId,
          amount: dto.amount,
          currency: 'COP',
          method: dto.method,
          status: 'PAID',
          externalReference: dto.externalReference,
          paidAt: new Date(),
        }
      });

      // Atomic Compare-And-Swap (CAS)
      const updateResult = await tx.service.updateMany({
        where: { id: serviceId, status: ServiceStatus.COMPLETED },
        data: { status: ServiceStatus.PAID, finalAmount: dto.amount }
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('El estado del servicio cambio concurrentemente o ya fue pagado');
      }

      await tx.serviceStatusHistory.create({
        data: {
          serviceId,
          fromStatus: ServiceStatus.COMPLETED,
          toStatus: ServiceStatus.PAID,
          changedById: userId
        }
      });

      const notifyUserId = userId === service.clientId ? service.technicianId : service.clientId;

      this.eventEmitter.emit('notification.send', {
        userId: notifyUserId,
        type: NotificationType.PAYMENT_REGISTERED,
        title: 'Pago Registrado',
        body: `Se ha registrado el pago por ${dto.amount}.`,
        data: { serviceId, paymentId: payment.id },
        sendEmail: true,
        sendPush: true,
        idempotencyKey: `payment_registered_${serviceId}`
      });

      return payment;
    });
  }

  async getRatings(userId: string, serviceId: string) {
    const service = await this.findOneForParticipant(userId, serviceId);
    return service.ratings;
  }

  async submitRating(userId: string, serviceId: string, dto: CreateRatingDto) {
    const service = await this.findOneForParticipant(userId, serviceId);

    if (service.status !== ServiceStatus.PAID && service.status !== ServiceStatus.RATED) {
      throw new BadRequestException('Solo se puede calificar un servicio despues de haber sido PAGADO');
    }

    const toUserId = userId === service.clientId ? service.technicianId : service.clientId;

    if (!dto.comment || dto.comment.trim().length === 0) {
      dto.comment = undefined;
    }

    return this.prisma.$transaction(async (tx) => {
      // Garantizar que no califique doble
      const existing = await tx.rating.findUnique({
        where: { serviceId_fromUserId: { serviceId, fromUserId: userId } }
      });

      if (existing) {
        throw new BadRequestException('Ya enviaste una calificacion para este servicio');
      }

      const rating = await tx.rating.create({
        data: {
          serviceId,
          fromUserId: userId,
          toUserId,
          score: dto.score,
          comment: dto.comment?.trim(),
        }
      });

      if (service.status === ServiceStatus.PAID) {
        const updateResult = await tx.service.updateMany({
          where: { id: serviceId, status: ServiceStatus.PAID },
          data: { status: ServiceStatus.RATED }
        });
        
        if (updateResult.count > 0) {
          await tx.serviceStatusHistory.create({
            data: {
              serviceId,
              fromStatus: ServiceStatus.PAID,
              toStatus: ServiceStatus.RATED,
              changedById: userId
            }
          });
        }
      }

      this.eventEmitter.emit('notification.send', {
        userId: toUserId,
        type: NotificationType.RATING_RECEIVED,
        title: 'Nueva Calificacion',
        body: `Has recibido una calificacion de ${dto.score} estrellas.`,
        data: { serviceId, ratingId: rating.id },
        sendPush: true,
        idempotencyKey: `rating_received_${rating.id}`
      });

      return rating;
    });
  }
}
