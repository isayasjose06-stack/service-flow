import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async getCategories() {
    return this.prisma.category.findMany({
      include: { subcategories: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(adminId: string, dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({ data: dto });
    await this.auditService.logAction(adminId, 'CREATE_CATEGORY', 'Category', category.id, { name: dto.name });
    return category;
  }

  async updateCategory(adminId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    await this.auditService.logAction(adminId, 'UPDATE_CATEGORY', 'Category', id, dto);
    return updated;
  }

  async getSubcategories() {
    return this.prisma.subcategory.findMany({
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createSubcategory(adminId: string, dto: CreateSubcategoryDto) {
    const subcategory = await this.prisma.subcategory.create({ data: dto });
    await this.auditService.logAction(adminId, 'CREATE_SUBCATEGORY', 'Subcategory', subcategory.id, { name: dto.name });
    return subcategory;
  }

  async updateSubcategory(adminId: string, id: string, dto: UpdateSubcategoryDto) {
    const subcategory = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!subcategory) throw new NotFoundException('Subcategory not found');

    const updated = await this.prisma.subcategory.update({
      where: { id },
      data: dto,
    });
    await this.auditService.logAction(adminId, 'UPDATE_SUBCATEGORY', 'Subcategory', id, dto);
    return updated;
  }
}
