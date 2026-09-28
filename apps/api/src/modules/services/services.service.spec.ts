import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceStatus, PaymentMethod } from '@prisma/client';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ServicesService - Phase 16 E2E State Machine', () => {
  let service: ServicesService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrisma: any = {
    service: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    rating: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    serviceStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        ServicesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStatus', () => {
    it('should prevent IDOR (technician modifying another technician service)', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', technicianId: 'tech2', clientId: 'client1' });
      await expect(service.findOneForTechnician('tech1', 's1')).rejects.toThrow(ForbiddenException);
    });

    it('should transition CONFIRMED -> ON_THE_WAY, update CAS, and emit event', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', technicianId: 'tech1', status: ServiceStatus.CONFIRMED });
      mockPrisma.service.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.service.findUniqueOrThrow.mockResolvedValue({ id: 's1', status: ServiceStatus.ON_THE_WAY });
      
      const res = await service.updateStatus('tech1', 's1', { status: ServiceStatus.ON_THE_WAY });
      
      expect(mockPrisma.service.updateMany).toHaveBeenCalledWith({
        where: { id: 's1', status: ServiceStatus.CONFIRMED },
        data: expect.objectContaining({ status: ServiceStatus.ON_THE_WAY })
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.send', expect.objectContaining({ type: 'TECHNICIAN_ON_THE_WAY' }));
      expect(res.status).toBe(ServiceStatus.ON_THE_WAY);
    });

    it('should reject invalid transition COMPLETED -> IN_PROGRESS', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', technicianId: 'tech1', status: ServiceStatus.COMPLETED });
      await expect(service.updateStatus('tech1', 's1', { status: ServiceStatus.IN_PROGRESS }))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject concurrent duplicate transition (CAS returns 0)', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', technicianId: 'tech1', status: ServiceStatus.CONFIRMED });
      mockPrisma.service.updateMany.mockResolvedValue({ count: 0 }); // simulate concurrent change
      
      await expect(service.updateStatus('tech1', 's1', { status: ServiceStatus.ON_THE_WAY }))
        .rejects.toThrow(BadRequestException);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('registerPayment', () => {
    it('should allow CLIENT to register payment and emit PAYMENT_REGISTERED', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', clientId: 'client1', technicianId: 'tech1', status: ServiceStatus.COMPLETED });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay1', amount: 100 });
      mockPrisma.service.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.registerPayment('client1', 's1', { amount: 100, method: PaymentMethod.CASH });
      
      expect(res.id).toBe('pay1');
      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.send', expect.objectContaining({ type: 'PAYMENT_REGISTERED' }));
    });

    it('should reject payment if service is not COMPLETED (e.g. IN_PROGRESS)', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', clientId: 'client1', technicianId: 'tech1', status: ServiceStatus.IN_PROGRESS });
      await expect(service.registerPayment('client1', 's1', { amount: 100, method: PaymentMethod.CASH })).rejects.toThrow(BadRequestException);
    });

    it('should reject double payment submission (Idempotency / Concurrent Update)', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', clientId: 'client1', technicianId: 'tech1', status: ServiceStatus.COMPLETED });
      mockPrisma.service.updateMany.mockResolvedValue({ count: 0 }); // CAS failed
      
      await expect(service.registerPayment('client1', 's1', { amount: 100, method: PaymentMethod.CASH })).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitRating', () => {
    it('should allow rating after payment and emit RATING_RECEIVED', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', clientId: 'client1', technicianId: 'tech1', status: ServiceStatus.PAID });
      mockPrisma.rating.findUnique.mockResolvedValue(null);
      mockPrisma.rating.create.mockResolvedValue({ id: 'rat1', score: 5 });
      mockPrisma.service.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.submitRating('client1', 's1', { score: 5, comment: 'Good' });
      
      expect(res.score).toBe(5);
      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.send', expect.objectContaining({ type: 'RATING_RECEIVED' }));
    });

    it('should reject rating before PAID', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', clientId: 'client1', technicianId: 'tech1', status: ServiceStatus.COMPLETED });
      await expect(service.submitRating('client1', 's1', { score: 5 })).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate rating from same user', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 's1', clientId: 'client1', technicianId: 'tech1', status: ServiceStatus.PAID });
      mockPrisma.rating.findUnique.mockResolvedValue({ id: 'existingRat' }); // Existing found
      
      await expect(service.submitRating('client1', 's1', { score: 5 })).rejects.toThrow(BadRequestException);
    });
  });
});
