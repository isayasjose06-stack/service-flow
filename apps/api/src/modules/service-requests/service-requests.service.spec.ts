import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceRequestsService } from './service-requests.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ServiceRequestStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;
  let prisma: PrismaService;

  const mockCategory = { id: 'c1', isActive: true };
  const mockSubcategory = { id: 's1', categoryId: 'c1', isActive: true };
  const mockRequest = { 
    id: 'r1', 
    clientId: 'client-123', 
    status: ServiceRequestStatus.PENDING,
    createdAt: new Date(),
  };

  const mockTx: any = {
    serviceRequest: {
      create: jest.fn().mockImplementation(({ data }) => ({ ...data, id: 'r2', createdAt: new Date() })),
      findMany: jest.fn(),
      update: jest.fn().mockImplementation(({ data }) => ({ ...mockRequest, ...data })),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        ServiceRequestsService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findUnique: jest.fn().mockImplementation(async ({ where }) => {
                if (where.id === 'c1') return mockCategory;
                if (where.id === 'inactive-cat') return { id: 'inactive-cat', isActive: false };
                return null;
              }),
            },
            subcategory: {
              findUnique: jest.fn().mockImplementation(async ({ where }) => {
                if (where.id === 's1') return mockSubcategory;
                if (where.id === 'wrong-cat-sub') return { id: 'wrong-cat-sub', categoryId: 'other-cat', isActive: true };
                return null;
              }),
            },
            serviceRequest: {
              findUnique: jest.fn().mockImplementation(async ({ where }) => {
                if (where.id === 'r1') return mockRequest;
                if (where.id === 'expired-req') return { ...mockRequest, id: 'expired-req', status: ServiceRequestStatus.EXPIRED };
                return null;
              }),
              update: jest.fn().mockReturnValue(mockRequest),
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (cb) => {
              return cb(mockTx);
            }),
          },
        },
        {
          provide: MatchingService,
          useValue: {
            matchServiceRequest: jest.fn().mockResolvedValue({ matched: 1 }),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            send: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceRequestsService>(ServiceRequestsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    const validDto = {
      categoryId: 'c1',
      subcategoryId: 's1',
      title: 'Fix issue',
      description: 'Need help',
      latitude: 4.6097,
      longitude: -74.0817,
      scheduledDate: '2027-10-10',
      scheduledTime: '14:30'
    };

    it('should create request successfully and set expiration to 48h', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const res = await service.create('client-123', validDto);
      expect(res.clientId).toBe('client-123');
      expect(res.expiresAt.getTime()).toBe(now + 48 * 60 * 60 * 1000);
      expect(mockTx.$executeRaw).toHaveBeenCalled();
    });

    it('should throw if category is invalid or inactive', async () => {
      await expect(service.create('client-123', { ...validDto, categoryId: 'invalid' })).rejects.toThrow(BadRequestException);
      await expect(service.create('client-123', { ...validDto, categoryId: 'inactive-cat' })).rejects.toThrow(BadRequestException);
    });

    it('should throw if subcategory belongs to another category', async () => {
      await expect(service.create('client-123', { ...validDto, subcategoryId: 'wrong-cat-sub' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOneMyRequest (Ownership)', () => {
    it('should return request if clientId matches', async () => {
      const res = await service.findOneMyRequest('client-123', 'r1');
      expect(res.id).toBe('r1');
    });

    it('should throw Forbidden if clientId does not match (IDOR protection)', async () => {
      await expect(service.findOneMyRequest('other-client', 'r1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update if user is owner and status is PENDING', async () => {
      const res = await service.update('client-123', 'r1', { title: 'New Title' });
      expect(prisma.serviceRequest.update).toHaveBeenCalled();
    });

    it('should throw if request is not PENDING', async () => {
      // Mocking already PENDING, let's test EXPIRED
      await expect(service.update('client-123', 'expired-req', { title: 'Test' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel if owner and valid status', async () => {
      await service.cancel('client-123', 'r1', 'Changed mind');
      expect(prisma.serviceRequest.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: ServiceRequestStatus.CANCELLED_BY_CLIENT, cancellationReason: 'Changed mind' }
      }));
    });

    it('should throw if already cancelled or expired', async () => {
      await expect(service.cancel('client-123', 'expired-req')).rejects.toThrow(BadRequestException);
    });
  });

  describe('Selection', () => {
    it('2. Cliente no propietario recibe Forbidden (IDOR)', async () => {
      await expect(service.selectTechnician('hacker-id', 'r1', { technicianId: 'tech1' })).rejects.toThrow(ForbiddenException);
    });

    it('3. Cliente puede seleccionar tÃ©cnico con OFFER_SENT', async () => {
      jest.spyOn(service, 'findOneMyRequest').mockResolvedValue({ id: 'r1', status: ServiceRequestStatus.OFFER_RECEIVED } as any);
      
      mockTx.serviceRequestMatch = { findUnique: jest.fn(), updateMany: jest.fn() };
      mockTx.service = { findUnique: jest.fn(), create: jest.fn() };

      mockTx.serviceRequestMatch.findUnique.mockResolvedValue({
        status: 'OFFER_SENT',
        expiresAt: new Date(Date.now() + 10000),
        technician: { technicianProfile: { isAvailable: true, isVerified: true } }
      });

      mockTx.service.findUnique.mockResolvedValue(null);
      mockTx.service.create.mockResolvedValue({ id: 'service1' });

      const res = await service.selectTechnician('client-123', 'r1', { technicianId: 'tech1' });
      expect(res.id).toBe('service1');
      expect(mockTx.serviceRequestMatch.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ technicianId: { not: 'tech1' } }),
        data: { status: 'REJECTED' }
      }));
    });

    it('7. No puede seleccionar si ya hay un servicio (concurrencia / ya procesado)', async () => {
      jest.spyOn(service, 'findOneMyRequest').mockResolvedValue({ id: 'r1', status: ServiceRequestStatus.OFFER_RECEIVED } as any);
      
      mockTx.serviceRequestMatch = { findUnique: jest.fn(), updateMany: jest.fn() };
      mockTx.service = { findUnique: jest.fn(), create: jest.fn() };

      mockTx.serviceRequestMatch.findUnique.mockResolvedValue({
        status: 'OFFER_SENT',
        expiresAt: new Date(Date.now() + 10000),
        technician: { technicianProfile: { isAvailable: true, isVerified: true } }
      });

      // Simula el bloqueo atÃ³mico (Count: 0 = ya procesado por otra transacciÃ³n)
      mockTx.serviceRequest.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(service.selectTechnician('client-123', 'r1', { technicianId: 'tech1' })).rejects.toThrow(BadRequestException);
  });
});

  describe('handleRequestExpirations', () => {
    it('should find expired requests and expire them', async () => {
      const mockExpiredReq = { id: 'req-1', clientId: 'client-1', status: 'PENDING' };
      jest.spyOn(prisma.serviceRequest, 'findMany').mockResolvedValue([mockExpiredReq] as any);
      jest.spyOn(prisma.serviceRequest, 'updateMany').mockResolvedValue({ count: 1 });

      await service.handleRequestExpirations();

      expect(prisma.serviceRequest.updateMany).toHaveBeenCalledWith({
        where: { id: 'req-1', status: 'PENDING' },
        data: { status: 'EXPIRED', cancellationReason: 'Expirada por tiempo límite' }
      });
      expect((service as any).eventEmitter.emit).toHaveBeenCalledWith('notification.send', expect.objectContaining({
        type: 'REQUEST_EXPIRED',
      }));
    });

    it('should not emit if no records updated', async () => {
      const mockExpiredReq = { id: 'req-1', clientId: 'client-1', status: 'PENDING' };
      jest.spyOn(prisma.serviceRequest, 'findMany').mockResolvedValue([mockExpiredReq] as any);
      jest.spyOn(prisma.serviceRequest, 'updateMany').mockResolvedValue({ count: 0 });

      const emitSpy = jest.spyOn((service as any).eventEmitter, 'emit');
      emitSpy.mockClear();

      await service.handleRequestExpirations();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});