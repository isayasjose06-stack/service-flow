import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('LocationService', () => {
  let service: LocationService;
  let prisma: PrismaService;

  const mockPrisma = {
    userLocation: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateLocation', () => {
    it('should upsert the location securely using the provided userId from token', async () => {
      const dto = { latitude: 4.6, longitude: -74.1 };
      const now = new Date();
      mockPrisma.userLocation.upsert.mockResolvedValueOnce({
        userId: 'u1',
        latitude: new Prisma.Decimal(4.6),
        longitude: new Prisma.Decimal(-74.1),
        updatedAt: now,
      });

      const res = await service.updateLocation('u1', dto);

      expect(mockPrisma.userLocation.upsert).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        update: expect.any(Object),
        create: expect.any(Object),
      });
      expect(res.success).toBe(true);
      expect(res.updatedAt).toEqual(now);
    });
  });

  describe('getMyUrl', () => {
    it('should return the users own location', async () => {
      mockPrisma.userLocation.findUnique.mockResolvedValueOnce({
        latitude: new Prisma.Decimal(10),
        longitude: new Prisma.Decimal(20),
        updatedAt: new Date(),
      });

      const res = await service.getMyUrl('u1');
      expect(res.latitude).toBe(10);
      expect(res.longitude).toBe(20);
    });

    it('should throw NotFoundException if location is not set', async () => {
      mockPrisma.userLocation.findUnique.mockResolvedValueOnce(null);
      await expect(service.getMyUrl('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSharedLocation', () => {
    it('should throw ForbiddenException if there is no active service between users', async () => {
      mockPrisma.service.findFirst.mockResolvedValueOnce(null);

      await expect(service.getSharedLocation('requester', 'target')).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.userLocation.findUnique).not.toHaveBeenCalled();
    });

    it('should return location if there is an active service', async () => {
      mockPrisma.service.findFirst.mockResolvedValueOnce({ id: 'service1' });
      mockPrisma.userLocation.findUnique.mockResolvedValueOnce({
        latitude: new Prisma.Decimal(4.0),
        longitude: new Prisma.Decimal(-74.0),
        updatedAt: new Date(),
      });

      const res = await service.getSharedLocation('requester', 'target');
      expect(res.userId).toBe('target');
      expect(res.latitude).toBe(4.0);
    });

    it('should throw NotFoundException if authorized but target has no location', async () => {
      mockPrisma.service.findFirst.mockResolvedValueOnce({ id: 'service1' });
      mockPrisma.userLocation.findUnique.mockResolvedValueOnce(null);

      await expect(service.getSharedLocation('requester', 'target')).rejects.toThrow(NotFoundException);
    });
  });
});
