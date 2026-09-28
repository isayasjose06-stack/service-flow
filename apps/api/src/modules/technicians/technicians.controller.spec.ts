import { Test, TestingModule } from '@nestjs/testing';
import { TechniciansController } from './technicians.controller';
import { TechniciansService } from './technicians.service';
import { FindNearbyTechniciansDto } from './dto/find-nearby-technicians.dto';

describe('TechniciansController', () => {
  let controller: TechniciansController;
  let service: TechniciansService;

  const mockService = {
    findNearby: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TechniciansController],
      providers: [
        { provide: TechniciansService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<TechniciansController>(TechniciansController);
    service = module.get<TechniciansService>(TechniciansService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findNearby', () => {
    it('should securely pass the userId from @CurrentUser into the service', async () => {
      const mockDto: FindNearbyTechniciansDto = {
        latitude: 4.6097,
        longitude: -74.0817,
        radiusInMeters: 5000,
      };

      mockService.findNearby.mockResolvedValue([{ technicianId: 'tech-1' }]);

      const result = await controller.findNearby('jwt-user-id', mockDto);

      expect(service.findNearby).toHaveBeenCalledWith('jwt-user-id', mockDto);
      expect(result).toEqual([{ technicianId: 'tech-1' }]);
    });
  });
});
