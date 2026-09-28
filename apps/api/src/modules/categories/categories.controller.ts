import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAllActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOneActive(id);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada o inactiva');
    }
    return category;
  }

  @Get(':id/subcategories')
  async findSubcategories(@Param('id') id: string) {
    return this.categoriesService.findActiveSubcategories(id);
  }
}
