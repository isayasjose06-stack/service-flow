import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockCategories = [
  { id: '1', name: 'Cat1', isActive: true },
  { id: '2', name: 'Cat2', isActive: false },
];

const mockSubcategories = [
  { id: '10', categoryId: '1', name: 'Sub1', isActive: true },
  { id: '11', categoryId: '1', name: 'Sub2', isActive: false },
];

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn().mockResolvedValue([mockCategories[0]]),
              findFirst: jest.fn().mockImplementation(({ where }) => {
                if (where.id === '1' && where.isActive) return mockCategories[0];
                return null;
              }),
            },
            subcategory: {
              findMany: jest.fn().mockImplementation(({ where }) => {
                if (where.categoryId === '1' && where.isActive) return [mockSubcategories[0]];
                return [];
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should list only active categories', async () => {
    const res = await service.findAllActive();
    expect(res).toHaveLength(1);
    expect(prisma.category.findMany).toHaveBeenCalledWith({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  });

  it('should list only active subcategories', async () => {
    const res = await service.findActiveSubcategories('1');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('10');
  });

  it('should reject or return null for inactive category', async () => {
    const res = await service.findOneActive('2');
    expect(res).toBeNull();
  });
});
