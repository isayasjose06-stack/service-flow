import { Test, TestingModule } from '@nestjs/testing';
import { TechniciansService } from './technicians.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { getBoundingBox, calculateHaversineDistance } from '../../common/utils/distance.util';

// Mock dependencies
jest.mock('../../common/utils/distance.util', () => ({
  getBoundingBox: jest.fn(),
  calculateHaversineDistance: jest.fn(),
}));

describe('TechniciansService - Phase 15 Proximity', () => {
  let service: TechniciansService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechniciansService,
        {
          provide: PrismaService,
          useValue: {
            user: { findMany: jest.fn() },
            technicianProfile: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<TechniciansService>(TechniciansService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findNearby', () => {
    const defaultDto = {
      latitude: 4.6097,
      longitude: -74.0817,
      radiusInMeters: 5000,
    };

    it('should throw BadRequest if radius is <= 0', async () => {
      await expect(service.findNearby('user-1', { ...defaultDto, radiusInMeters: 0 }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if limit is > 50', async () => {
      await expect(service.findNearby('user-1', { ...defaultDto, limit: 51 }))
        .rejects.toThrow(BadRequestException);
    });

    it('should apply Bounding Box and filter out candidates by exact distance (Haversine)', async () => {
      (getBoundingBox as jest.Mock).mockReturnValue({
        minLat: 4.5, maxLat: 4.7, minLon: -74.1, maxLon: -74.0
      });

      const mockCandidates = [
        {
          id: 'tech-1',
          firstName: 'Juan',
          lastName: 'Perez',
          UserLocation: [{ latitude: 4.61, longitude: -74.08 }],
          technicianProfile: { specialties: [] }
        },
        {
          id: 'tech-2', // Will be filtered out due to distance
          firstName: 'Maria',
          lastName: 'Gomez',
          UserLocation: [{ latitude: 4.69, longitude: -74.01 }],
          technicianProfile: { specialties: [] }
        }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      
      // Mock distance for tech-1 = 1000m, tech-2 = 6000m (radius is 5000m)
      (calculateHaversineDistance as jest.Mock)
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(6000);

      const result = await service.findNearby('client-1', defaultDto);

      // Verify Prisma query structure
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          role: 'TECHNICIAN',
          status: 'ACTIVE',
          technicianProfile: expect.objectContaining({ isAvailable: true, isVerified: true }),
          UserLocation: {
            some: {
              latitude: { gte: 4.5, lte: 4.7 },
              longitude: { gte: -74.1, lte: -74.0 },
            }
          }
        })
      }));

      // Verify strict filtering and sorting
      expect(result).toHaveLength(1);
      expect(result[0].technicianId).toBe('tech-1');
      expect(result[0].distance).toBe(1000);
      
      // Verify Privacy (no exact lat/lng returned)
      expect(result[0]).not.toHaveProperty('latitude');
      expect(result[0]).not.toHaveProperty('longitude');
      expect(result[0]).not.toHaveProperty('UserLocation');
    });

    it('should apply determinist sorting on ties', async () => {
      (getBoundingBox as jest.Mock).mockReturnValue({
        minLat: 4.5, maxLat: 4.7, minLon: -74.1, maxLon: -74.0
      });

      const mockCandidates = [
        {
          id: 'tech-B',
          firstName: 'Bob',
          lastName: 'B',
          UserLocation: [{ latitude: 4.61, longitude: -74.08 }],
          technicianProfile: { specialties: [] }
        },
        {
          id: 'tech-A',
          firstName: 'Alice',
          lastName: 'A',
          UserLocation: [{ latitude: 4.61, longitude: -74.08 }],
          technicianProfile: { specialties: [] }
        }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      (calculateHaversineDistance as jest.Mock).mockReturnValue(1500); // Identical distances

      const result = await service.findNearby('client-1', defaultDto);

      // Should be sorted alphabetically by ID (tech-A then tech-B)
      expect(result[0].technicianId).toBe('tech-A');
      expect(result[1].technicianId).toBe('tech-B');
    });

    it('should correctly map specialties when provided', async () => {
      (getBoundingBox as jest.Mock).mockReturnValue({
        minLat: 4.5, maxLat: 4.7, minLon: -74.1, maxLon: -74.0
      });

      const mockCandidates = [
        {
          id: 'tech-1',
          firstName: 'Juan',
          lastName: 'Perez',
          UserLocation: [{ latitude: 4.61, longitude: -74.08 }],
          technicianProfile: {
            specialties: [
              { categoryId: 'cat-1', category: { name: 'Plomeria' } }
            ]
          }
        }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      (calculateHaversineDistance as jest.Mock).mockReturnValue(2000);

      const result = await service.findNearby('client-1', { ...defaultDto, categoryId: 'cat-1' });

      // Prisma should include category filter
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          technicianProfile: expect.objectContaining({
            specialties: {
              some: { categoryId: 'cat-1' }
            }
          })
        })
      }));

      expect(result[0].specialties[0].categoryId).toBe('cat-1');
      expect(result[0].specialties[0].categoryName).toBe('Plomeria');
    });
  });
});
