import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOneActive(id: string) {
    return this.prisma.category.findFirst({
      where: { id, isActive: true },
    });
  }

  async findActiveSubcategories(categoryId: string) {
    return this.prisma.subcategory.findMany({
      where: { categoryId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
