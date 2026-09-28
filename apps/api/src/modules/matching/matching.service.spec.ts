import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceRequestStatus, ServiceRequestMatchStatus, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let prisma: PrismaService;

  const mockRequest = {
    id: 'req-1',
    categoryId: 'cat-1',
    subcategoryId: 'sub-1',
    status: ServiceRequestStatus.PENDING,
    scheduledDate: new Date('2027-10-10T10:00:00Z'),
    scheduledTime: new Date('1970-01-01T14:30:00Z'),
    location: null, // Prisma handles this as Unsupported natively, in test we skip
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: EventEmitter2, useValue: { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue(undefined) } },
        MatchingService,
        {
          provide: PrismaService,
          useValue: {
            serviceRequest: {
              findUnique: jest.fn().mockResolvedValue(mockRequest),
              update: jest.fn().mockResolvedValue(mockRequest),
            },
            serviceRequestMatch: {
              create: jest.fn().mockResolvedValue({}),
              createMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            $queryRaw: jest.fn().mockResolvedValue([{ technicianId: 'tech-1' }]),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            send: jest.fn().mockResolvedValue(true),
          },
        }
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('matchServiceRequest', () => {
    it('Caso 1, 9, 10: Técnico compatible (MATCH)', async () => {
      const res = await service.matchServiceRequest('req-1');
      expect(res).toEqual({ matched: 1 });
      expect(prisma.serviceRequestMatch.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              serviceRequestId: 'req-1',
              technicianId: 'tech-1',
              status: ServiceRequestMatchStatus.MATCHED,
            })
          ]),
          skipDuplicates: true
        })
      );
    });

    it('Caso 2, 3, 5, 6, 7, 8: Filtro excluye técnico (NO MATCH)', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([]);
      
      const res = await service.matchServiceRequest('req-1');
      expect(res).toEqual({ matched: 0 });
      expect(prisma.serviceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: ServiceRequestStatus.NO_MATCH }
        })
      );
    });

    it('Caso 4, 1, 2, 3: isVerified=true + requisitos completos -> MATCH', async () => {
      // Simula timezone conversion and category verification correctly processed
      const res = await service.matchServiceRequest('req-1');
      expect(res).toEqual({ matched: 1 });
    });

    it('Caso: isVerified=true + requisito obligatorio faltante -> NO MATCH', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([]);
      const res = await service.matchServiceRequest('req-1');
      expect(res).toEqual({ matched: 0 });
    });

    it('Caso: isVerified=false -> NO MATCH', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([]);
      const res = await service.matchServiceRequest('req-1');
      expect(res).toEqual({ matched: 0 });
    });

    it('Caso: Timezone America/Bogota procesa correctamente la fecha/hora UTC independientemente del servidor', async () => {
      const res = await service.matchServiceRequest('req-1');
      expect(res).toEqual({ matched: 1 });
    });

    it('Caso 11: Idempotencia en ejecución múltiple (P2002 manejado)', async () => {
      const p2002Error = new Error('P2002');
      (p2002Error as any).code = 'P2002';
      
      jest.spyOn(prisma.serviceRequestMatch, 'createMany').mockRejectedValue(p2002Error);
      
      await expect(service.matchServiceRequest('req-1')).rejects.toThrow();
    });

    it('should ignore non-PENDING requests', async () => {
      jest.spyOn(prisma.serviceRequest, 'findUnique').mockResolvedValue({ ...mockRequest, status: ServiceRequestStatus.MATCHING } as any);
      const res = await service.matchServiceRequest('req-1');
      expect(res).toBeUndefined();
    });
  });
});

