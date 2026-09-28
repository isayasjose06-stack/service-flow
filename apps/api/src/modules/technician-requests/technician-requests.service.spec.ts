import { Test, TestingModule } from '@nestjs/testing';
import { TechnicianRequestsService } from './technician-requests.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceRequestMatchStatus } from '@prisma/client';

describe('TechnicianRequestsService', () => {
  let service: TechnicianRequestsService;
  let prisma: PrismaService;

  const validMatch = {
    id: 'match-1',
    serviceRequestId: 'req-1',
    technicianId: 'tech-1',
    status: ServiceRequestMatchStatus.MATCHED,
    expiresAt: new Date(Date.now() + 100000),
    serviceRequest: {}
  };

  const expiredMatch = {
    ...validMatch,
    id: 'match-2',
    expiresAt: new Date(Date.now() - 100000), // Expirado en el pasado
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicianRequestsService,
        {
          provide: PrismaService,
          useValue: {
            serviceRequestMatch: {
              findMany: jest.fn().mockResolvedValue([validMatch]),
              findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where.serviceRequestId_technicianId.serviceRequestId === 'req-1' && where.serviceRequestId_technicianId.technicianId === 'tech-1') {
                  return { ...validMatch };
                }
                if (where.serviceRequestId_technicianId.serviceRequestId === 'req-expired' && where.serviceRequestId_technicianId.technicianId === 'tech-1') {
                  return { ...expiredMatch };
                }
                return null;
              }),
              update: jest.fn().mockImplementation(({ data }) => ({ ...validMatch, ...data })),
            },
            serviceRequest: {
              findUnique: jest.fn().mockResolvedValue({ id: 'req-1', status: 'MATCHING' }),
              update: jest.fn()
            },
            $transaction: jest.fn().mockImplementation(async (cb) => {
              // inside tx we need to bind `this` or inject the methods
              return cb({
                serviceRequestMatch: {
                  update: jest.fn().mockImplementation(({ data }) => ({ ...validMatch, ...data })),
                },
                serviceRequest: {
                  findUnique: jest.fn().mockResolvedValue({ id: 'req-1', status: 'MATCHING' }),
                  update: jest.fn()
                }
              });
            })
          },
        },
      ],
    }).compile();

    service = module.get<TechnicianRequestsService>(TechnicianRequestsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getMatchDetail', () => {
    it('Caso 12/13: Falla si no hay match (404/403) o el technicianId pertenece a otro', async () => {
      await expect(service.getMatchDetail('tech-other', 'req-1')).rejects.toThrow(NotFoundException);
      await expect(service.getMatchDetail('tech-1', 'req-wrong')).rejects.toThrow(NotFoundException);
    });

    it('Caso 14: Expira automáticamente al leer si el tiempo pasó', async () => {
      const match = await service.getMatchDetail('tech-1', 'req-expired');
      expect(match.status).toBe(ServiceRequestMatchStatus.EXPIRED);
      expect(prisma.serviceRequestMatch.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: ServiceRequestMatchStatus.EXPIRED } })
      );
    });
  });

  describe('markAsViewed', () => {
    it('Debe cambiar de MATCHED a VIEWED', async () => {
      await service.markAsViewed('tech-1', 'req-1');
      expect(prisma.serviceRequestMatch.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: ServiceRequestMatchStatus.VIEWED }) })
      );
    });
  });

  describe('respond', () => {
    it('Caso 14: No permite responder si expiró', async () => {
      await expect(service.respond('tech-1', 'req-expired', 'ACCEPT')).rejects.toThrow(BadRequestException);
    });

    it('Cambia a OFFER_SENT o REJECTED', async () => {
      const res = await service.respond('tech-1', 'req-1', 'ACCEPT');
      expect(res.status).toBe(ServiceRequestMatchStatus.OFFER_SENT);
    });
  });
});
